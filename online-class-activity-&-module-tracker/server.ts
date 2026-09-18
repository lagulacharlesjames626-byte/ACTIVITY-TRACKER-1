import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

interface LocationLinks {
  gclass?: string;
  emabini?: string;
  gdrive?: string;
  other?: string;
  [key: string]: string | undefined;
}

interface SubModuleItem {
  id: string;
  subNumber: string | number;
  title: string;
  instructions?: string;
  locations: string[];
  links: LocationLinks;
  customLocation?: string;
  completedBy?: string[];
  completedAt?: Record<string, string>;
}

interface ModuleItem {
  id: string;
  moduleNumber: number | string;
  subject: string;
  activity: string;
  locations: string[];
  links: LocationLinks;
  customLocation?: string;
  deadline: string;
  status: 'pending' | 'in_progress' | 'submitted';
  completedBy?: string[];
  completedAt?: Record<string, string>;
  notes?: string;
  subModules?: SubModuleItem[];
  submittedAt?: string;
  createdAt: string;
  createdBy?: string;
  updatedAt?: string;
  lastUpdatedBy?: string;
}

interface DeletedModuleItem extends ModuleItem {
  deletedAt: string;
  deletedBy?: string;
  expiresAt: string;
}

interface ActiveUser {
  id: string;
  name: string;
  editingModuleId?: string | null;
  lastSeen: number;
}

interface SiteSettings {
  courseName: string;
  courseSubtitle: string;
  announcement?: string;
  fontFamily: 'default' | 'sans' | 'poppins' | 'outfit' | 'serif' | 'mono';
  buttonPlacement: 'bottom-right' | 'bottom-left' | 'top-right';
  cardTheme: 'vibrant' | 'soft' | 'bordered';
  adminPassword?: string;
  portalLinks: {
    gclass: string;
    emabini: string;
    gdrive: string;
  };
}

interface StoredData {
  modules: ModuleItem[];
  deletedModules: DeletedModuleItem[];
  roster: string[];
  admins?: string[];
  settings: SiteSettings;
  version: number;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'tracker_data.json');

// Default initial settings for BSBA-HRM Class 1-A
const DEFAULT_SETTINGS: SiteSettings = {
  courseName: 'BSBA-HRM Class 1-A',
  courseSubtitle: 'Activity Checklist, Modules & Progress Monitor',
  announcement: '',
  fontFamily: 'default',
  buttonPlacement: 'bottom-right',
  cardTheme: 'vibrant',
  adminPassword: 'admin123',
  portalLinks: {
    gclass: 'https://classroom.google.com',
    emabini: 'https://e-mabini.mabini.edu.ph',
    gdrive: 'https://drive.google.com',
  },
};

// 48 Students in BSBA-HRM Class 1-A
const DEFAULT_ROSTER: string[] = [
  'JAMORAWON',
  'RAMOS',
  'RASTRULLO',
  'RUSTIA',
  'SEVERINO',
  'TUOZO',
  'GODOY',
  'HERNANDEZ',
  'LAGULA',
  'ABANTO',
  'ALBANIEL',
  'AMOROSO',
  'BANATAO',
  'BLANCADA',
  'CAANDE',
  'CAGANG',
  'CAYETANO',
  'CONDES',
  'CRISOSTOMO',
  'DEMILLO',
  'DOMINO',
  'EQUIBAL',
  'FAMODULAN',
  'GONZALES',
  'GONZALEZ',
  'HAYAHAY',
  'IMPORTANTE',
  'INTANO',
  'JARA',
  'JIMENEZ',
  'LEORAG',
  'LORICA',
  'MADRIA',
  'MANGANTI',
  'MERANO',
  'MISSION',
  'NOGUERAS',
  'PASCUAL',
  'PEÑA',
  'POSTRERO',
  'SANTOS',
  'SEGARRA',
  'TALANQUINES',
  'TROPICALES',
  'VENTURA',
  'YAUDER',
  'NATOR',
  'GASINGAN',
];

// Default Admin Surnames (BSBA-HRM 1-A)
const DEFAULT_ADMIN_SURNAMES: string[] = [
  'LAGULA',
  'CAANDE',
  'CAGANG',
  'MANGANTI',
  'TROPICALES',
  'YAUDER',
  'DEMILLO',
  'ABANTO',
];

let modules: ModuleItem[] = [];
let deletedModules: DeletedModuleItem[] = [];
let roster: string[] = [...DEFAULT_ROSTER];
let adminSurnames: string[] = [...DEFAULT_ADMIN_SURNAMES];
let settings: SiteSettings = { ...DEFAULT_SETTINGS };
let version = 1;

let activeUsers: Map<string, ActiveUser> = new Map();
let sseClients: express.Response[] = [];

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// Disk persistence functions
function ensureDataFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      if (content.trim()) {
        const parsed = JSON.parse(content) as StoredData;
        modules = Array.isArray(parsed.modules) ? parsed.modules : [];
        deletedModules = Array.isArray(parsed.deletedModules) ? parsed.deletedModules : [];
        
        // Merge with DEFAULT_ROSTER to ensure all 48 students are always present
        const loadedRoster = Array.isArray(parsed.roster) ? parsed.roster : [];
        const rosterSet = new Set([...DEFAULT_ROSTER, ...loadedRoster.map((s) => s.trim().toUpperCase())]);
        roster = Array.from(rosterSet);

        // Load admins from disk and merge with default admins
        const loadedAdmins = Array.isArray(parsed.admins) ? parsed.admins : [];
        const adminSet = new Set([
          ...DEFAULT_ADMIN_SURNAMES,
          ...loadedAdmins.map((s) => s.trim().toUpperCase()),
        ]);
        adminSurnames = Array.from(adminSet);

        settings = { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) };
        version = parsed.version || 1;
        saveToDisk();
        console.log(`[Storage] Loaded permanent data: ${modules.length} modules, ${roster.length} students, ${adminSurnames.length} admins, version ${version}`);
        return;
      }
    }

    // Fresh initialization: NO fake modules! Clean empty list
    modules = [];
    deletedModules = [];
    roster = [...DEFAULT_ROSTER];
    adminSurnames = [...DEFAULT_ADMIN_SURNAMES];
    settings = { ...DEFAULT_SETTINGS };
    version = 1;
    saveToDisk();
    console.log('[Storage] Initialized clean tracker storage file (zero demo modules).');
  } catch (err) {
    console.error('[Storage] Error ensuring data file:', err);
  }
}

function saveToDisk() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const dataToSave: StoredData = {
      modules,
      deletedModules,
      roster,
      admins: adminSurnames,
      settings,
      version,
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Storage] Error writing data to disk:', err);
  }
}

function purgeExpiredDeletedModules(): boolean {
  const nowMs = Date.now();
  const initialCount = deletedModules.length;
  deletedModules = deletedModules.filter((item) => {
    const expireTime = new Date(item.expiresAt).getTime();
    return !isNaN(expireTime) && expireTime > nowMs;
  });
  return deletedModules.length !== initialCount;
}

function broadcastSSE(data: any) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach((res) => {
    try {
      res.write(message);
    } catch {
      // client dropped
    }
  });
}

// Clean up stale users (> 15 seconds without heartbeat) & auto-purge trash (> 30 days)
setInterval(() => {
  const now = Date.now();
  let changed = false;
  for (const [id, user] of activeUsers.entries()) {
    if (now - user.lastSeen > 15000) {
      activeUsers.delete(id);
      changed = true;
    }
  }

  const trashPurged = purgeExpiredDeletedModules();
  if (trashPurged) {
    version++;
    saveToDisk();
    broadcastSSE({
      type: 'MODULES_UPDATED',
      modules,
      deletedModules,
      version,
      updatedBy: 'System (Auto-purge 30 days)',
      updatedAt: new Date().toISOString(),
      action: 'auto_purge',
    });
  }

  if (changed) {
    broadcastSSE({
      type: 'PRESENCE_UPDATE',
      activeUsers: Array.from(activeUsers.values()),
    });
  }
}, 5000);

async function startServer() {
  // Load persistent data from disk on startup
  ensureDataFile();

  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API 1: Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString(), modulesCount: modules.length });
  });

  // API 2: Full sync snapshot (modules, trash, online users, roster, admins, settings)
  app.get('/api/sync', (req, res) => {
    purgeExpiredDeletedModules();
    const now = Date.now();
    const cleanUsers = Array.from(activeUsers.values()).filter(
      (u) => now - u.lastSeen <= 15000
    );
    res.json({
      modules,
      deletedModules,
      activeUsers: cleanUsers,
      roster,
      admins: adminSurnames,
      settings,
      version,
      serverTime: now,
    });
  });

  // API 3: Verify Admin / Moderator Password
  app.post('/api/auth/admin', (req, res) => {
    const { password } = req.body;
    const currentAdminPass = (settings.adminPassword || 'admin123').trim().toLowerCase();
    const cleanPass = String(password || '').trim().toLowerCase();

    // Check default / configured admin password
    if (cleanPass === currentAdminPass) {
      return res.json({ success: true, authorized: true });
    }

    // Check if password matches any admin's password: <surname>hrm1-a
    const matchedAdmin = adminSurnames.some((s) => {
      const sLower = s.toLowerCase();
      const sNoAccent = sLower.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return cleanPass === `${sLower}hrm1-a` || cleanPass === `${sNoAccent}hrm1-a`;
    });

    if (matchedAdmin) {
      return res.json({ success: true, authorized: true });
    }

    return res.status(401).json({ success: false, authorized: false, error: 'Incorrect Moderator Password' });
  });

  // API 3.5: Unified Surname & Password Authentication
  app.post('/api/auth/login', (req, res) => {
    const { surname, password } = req.body;
    if (!surname || !password) {
      return res.status(400).json({ success: false, error: 'Surname and Password are required.' });
    }

    const cleanSurname = String(surname).trim().toUpperCase();
    const cleanPass = String(password).trim().toLowerCase();

    const sLower = cleanSurname.toLowerCase();
    const sNoAccent = sLower.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const isAdmin = adminSurnames.includes(cleanSurname);
    const expectedAdminPass1 = `${sLower}hrm1-a`;
    const expectedAdminPass2 = `${sNoAccent}hrm1-a`;

    // Admin login match: [SURNAME] in ALL CAPS and [surname]hrm1-a in all small letters
    if (isAdmin && (cleanPass === expectedAdminPass1 || cleanPass === expectedAdminPass2)) {
      return res.json({
        success: true,
        role: 'admin',
        surname: cleanSurname,
        name: cleanSurname,
      });
    }

    // Student login match: [SURNAME] in ALL CAPS and [surname]hrm1a in all small letters
    const expectedStudentPass1 = `${sLower}hrm1a`;
    const expectedStudentPass2 = `${sNoAccent}hrm1a`;

    const matchesStudentPass = cleanPass === expectedStudentPass1 || cleanPass === expectedStudentPass2;

    const inRoster = roster.some((r) => {
      const rUpper = r.trim().toUpperCase();
      return rUpper === cleanSurname || rUpper.startsWith(cleanSurname);
    });

    if (matchesStudentPass) {
      return res.json({
        success: true,
        role: 'student',
        surname: cleanSurname,
        name: cleanSurname,
      });
    }

    // Generic fallback for configured admin password (e.g. admin123)
    if (cleanPass === (settings.adminPassword || 'admin123').toLowerCase()) {
      return res.json({
        success: true,
        role: isAdmin ? 'admin' : 'student',
        surname: cleanSurname,
        name: cleanSurname,
      });
    }

    return res.status(401).json({
      success: false,
      error: `Incorrect credentials. Student password format is ${expectedStudentPass1} (all small letters). Admin format is ${expectedAdminPass1}.`,
    });
  });

  // API 4: Update Settings (Course title, styling, colors, password, announcement, etc.)
  app.post('/api/settings', (req, res) => {
    const { newSettings, adminPassword } = req.body;
    const currentAdminPass = settings.adminPassword || 'admin123';

    // Verify password if changing admin password or sensitive fields
    if (adminPassword && adminPassword !== currentAdminPass) {
      return res.status(403).json({ error: 'Unauthorized to change settings' });
    }

    if (newSettings && typeof newSettings === 'object') {
      settings = {
        ...settings,
        ...newSettings,
      };
      version++;
      saveToDisk();

      broadcastSSE({
        type: 'SETTINGS_UPDATED',
        settings,
        version,
        updatedAt: new Date().toISOString(),
      });

      return res.json({ success: true, settings, version });
    }

    res.status(400).json({ error: 'Invalid settings payload' });
  });

  // API 5: Manage Student Roster (Add, edit, bulk import, remove students)
  app.post('/api/roster', (req, res) => {
    const { action, studentName, names, oldName, newName } = req.body;
    let changed = false;

    if (action === 'add' && studentName) {
      const clean = String(studentName).trim();
      if (clean && !roster.includes(clean)) {
        roster.push(clean);
        roster.sort((a, b) => a.localeCompare(b));
        changed = true;
      }
    } else if (action === 'bulk_import' && Array.isArray(names)) {
      const set = new Set(roster);
      names.forEach((n) => {
        const clean = String(n).trim();
        if (clean) set.add(clean);
      });
      roster = Array.from(set).sort((a, b) => a.localeCompare(b));
      changed = true;
    } else if (action === 'edit' && oldName && newName) {
      const cleanOld = String(oldName).trim();
      const cleanNew = String(newName).trim();
      const idx = roster.indexOf(cleanOld);
      if (idx >= 0 && cleanNew) {
        roster[idx] = cleanNew;
        roster.sort((a, b) => a.localeCompare(b));
        changed = true;
      }
    } else if (action === 'delete' && studentName) {
      const clean = String(studentName).trim();
      roster = roster.filter((n) => n !== clean);
      changed = true;
    }

    if (changed) {
      version++;
      saveToDisk();
      broadcastSSE({
        type: 'ROSTER_UPDATED',
        roster,
        version,
        updatedAt: new Date().toISOString(),
      });
    }

    res.json({ success: true, roster, version });
  });

  // API 5.5: Appoint or Revoke Class Administrators
  app.get('/api/admins', (req, res) => {
    res.json({ success: true, admins: adminSurnames });
  });

  app.post('/api/admins', (req, res) => {
    const { action, surname } = req.body;
    const cleanSurname = String(surname || '').trim().toUpperCase();

    if (!cleanSurname) {
      return res.status(400).json({ error: 'Surname is required' });
    }

    let changed = false;

    if (action === 'appoint') {
      if (!adminSurnames.includes(cleanSurname)) {
        adminSurnames.push(cleanSurname);
        adminSurnames.sort((a, b) => a.localeCompare(b));
        changed = true;
      }
    } else if (action === 'revoke') {
      if (adminSurnames.includes(cleanSurname)) {
        if (adminSurnames.length > 1) {
          adminSurnames = adminSurnames.filter((s) => s !== cleanSurname);
          changed = true;
        } else {
          return res.status(400).json({ error: 'Cannot revoke privileges: At least one Administrator must remain.' });
        }
      }
    }

    if (changed) {
      version++;
      saveToDisk();
      broadcastSSE({
        type: 'ADMINS_UPDATED',
        admins: adminSurnames,
        version,
        updatedAt: new Date().toISOString(),
      });
      console.log(`[Admins] ${action === 'appoint' ? 'Appointed' : 'Revoked'} admin ${cleanSurname}. Total admins: ${adminSurnames.length}`);
    }

    res.json({ success: true, admins: adminSurnames, version });
  });

  // API 6: Update modules (add, edit, toggle, sub-module finish, delete to trash, restore, permanent delete)
  app.post('/api/modules', (req, res) => {
    const { action, module, modules: newModulesList, studentName, moduleId, subModuleId } = req.body;
    const now = new Date().toISOString();
    purgeExpiredDeletedModules();
    version++;

    if (newModulesList && Array.isArray(newModulesList)) {
      modules = newModulesList;
    } else if (action === 'delete' && moduleId) {
      const target = modules.find((m) => m.id === moduleId);
      if (target) {
        modules = modules.filter((m) => m.id !== moduleId);
        const expiresAt = new Date(Date.now() + THIRTY_DAYS_MS).toISOString();
        const deletedItem: DeletedModuleItem = {
          ...target,
          deletedAt: now,
          deletedBy: studentName ? String(studentName).trim() : 'Classmate',
          expiresAt,
        };
        deletedModules = [deletedItem, ...deletedModules.filter((d) => d.id !== moduleId)];
      } else {
        modules = modules.filter((m) => m.id !== moduleId);
      }
    } else if (action === 'restore' && moduleId) {
      const target = deletedModules.find((d) => d.id === moduleId);
      if (target) {
        deletedModules = deletedModules.filter((d) => d.id !== moduleId);
        const restoredModule: ModuleItem = {
          ...target,
          updatedAt: now,
          lastUpdatedBy: studentName ? String(studentName).trim() : 'Classmate',
        };
        modules = [restoredModule, ...modules.filter((m) => m.id !== moduleId)];
      }
    } else if (action === 'permanent_delete' && moduleId) {
      deletedModules = deletedModules.filter((d) => d.id !== moduleId);
    } else if (action === 'empty_trash') {
      deletedModules = [];
    } else if (action === 'save' && module) {
      const idx = modules.findIndex((m) => m.id === module.id);
      const updatedModule: ModuleItem = {
        ...module,
        updatedAt: now,
        lastUpdatedBy: studentName || 'Classmate',
        createdBy: module.createdBy || (idx >= 0 ? modules[idx].createdBy : studentName) || 'Classmate',
      };
      if (idx >= 0) {
        modules[idx] = updatedModule;
      } else {
        modules.unshift(updatedModule);
      }
    } else if (action === 'toggle' && moduleId) {
      const idx = modules.findIndex((m) => m.id === moduleId);
      if (idx >= 0) {
        const nextStatus = modules[idx].status === 'submitted' ? 'pending' : 'submitted';
        modules[idx] = {
          ...modules[idx],
          status: nextStatus,
          submittedAt: nextStatus === 'submitted' ? now : undefined,
          updatedAt: now,
          lastUpdatedBy: studentName || 'Classmate',
        };
      }
    } else if (action === 'toggle_student_finish' && moduleId && studentName) {
      const idx = modules.findIndex((m) => m.id === moduleId);
      if (idx >= 0) {
        const studentClean = String(studentName).trim();
        const prevList: string[] = Array.isArray(modules[idx].completedBy) ? [...modules[idx].completedBy!] : [];
        const exists = prevList.some((s) => s.toUpperCase() === studentClean.toUpperCase());
        const nextList = exists
          ? prevList.filter((s) => s.toUpperCase() !== studentClean.toUpperCase())
          : [...prevList, studentClean];
        const nextCompletedAt = { ...(modules[idx].completedAt || {}) };
        if (exists) {
          delete nextCompletedAt[studentClean];
        } else {
          nextCompletedAt[studentClean] = now;
        }

        modules[idx] = {
          ...modules[idx],
          completedBy: nextList,
          completedAt: nextCompletedAt,
          updatedAt: now,
          lastUpdatedBy: studentClean,
        };
      }
    } else if (action === 'toggle_submodule_finish' && moduleId && subModuleId && studentName) {
      const idx = modules.findIndex((m) => m.id === moduleId);
      if (idx >= 0 && modules[idx].subModules) {
        const studentClean = String(studentName).trim();
        const subList = [...modules[idx].subModules!];
        const subIdx = subList.findIndex((s) => s.id === subModuleId);
        if (subIdx >= 0) {
          const prevCompleted: string[] = Array.isArray(subList[subIdx].completedBy)
            ? [...subList[subIdx].completedBy!]
            : [];
          const exists = prevCompleted.some((s) => s.toUpperCase() === studentClean.toUpperCase());
          const nextCompleted = exists
            ? prevCompleted.filter((s) => s.toUpperCase() !== studentClean.toUpperCase())
            : [...prevCompleted, studentClean];
          const nextCompletedAt = { ...(subList[subIdx].completedAt || {}) };
          if (exists) {
            delete nextCompletedAt[studentClean];
          } else {
            nextCompletedAt[studentClean] = now;
          }

          subList[subIdx] = {
            ...subList[subIdx],
            completedBy: nextCompleted,
            completedAt: nextCompletedAt,
          };

          modules[idx] = {
            ...modules[idx],
            subModules: subList,
            updatedAt: now,
            lastUpdatedBy: studentClean,
          };
        }
      }
    }

    // Sort chronologically by deadline
    modules.sort((a, b) => {
      const timeA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const timeB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      return timeA - timeB;
    });

    // Save to disk immediately!
    saveToDisk();

    // Broadcast SSE to all live clients
    broadcastSSE({
      type: 'MODULES_UPDATED',
      modules,
      deletedModules,
      version,
      updatedBy: studentName || 'A classmate',
      updatedAt: now,
      action,
    });

    res.json({ success: true, modules, deletedModules, version });
  });

  // API 7: Student presence and live editing notification
  app.post('/api/presence', (req, res) => {
    const { id, name, editingModuleId } = req.body;
    if (!id || !name) {
      return res.status(400).json({ error: 'Missing student id or name' });
    }

    const previousUser = activeUsers.get(id);
    const wasEditing = previousUser?.editingModuleId !== editingModuleId;

    activeUsers.set(id, {
      id,
      name,
      editingModuleId: editingModuleId || null,
      lastSeen: Date.now(),
    });

    const activeList = Array.from(activeUsers.values());

    if (wasEditing) {
      broadcastSSE({
        type: 'EDITING_STATUS',
        studentName: name,
        studentId: id,
        editingModuleId: editingModuleId || null,
        activeUsers: activeList,
      });
    }

    res.json({ success: true, activeUsers: activeList });
  });

  // API 8: Full Data Export and Import
  app.get('/api/backup/export', (req, res) => {
    res.setHeader('Content-Disposition', `attachment; filename=BSBA_HRM_Tracker_Backup_${Date.now()}.json`);
    res.setHeader('Content-Type', 'application/json');
    res.json({
      modules,
      deletedModules,
      roster,
      admins: adminSurnames,
      settings,
      version,
      exportedAt: new Date().toISOString(),
    });
  });

  app.post('/api/backup/import', (req, res) => {
    const { data } = req.body;
    if (!data || !Array.isArray(data.modules)) {
      return res.status(400).json({ error: 'Invalid backup file structure' });
    }

    modules = data.modules;
    deletedModules = Array.isArray(data.deletedModules) ? data.deletedModules : [];
    if (Array.isArray(data.roster)) roster = data.roster;
    if (Array.isArray(data.admins)) adminSurnames = data.admins;
    if (data.settings) settings = { ...DEFAULT_SETTINGS, ...data.settings };
    version++;
    saveToDisk();

    broadcastSSE({
      type: 'MODULES_UPDATED',
      modules,
      deletedModules,
      version,
      updatedBy: 'Moderator (Backup Restore)',
      updatedAt: new Date().toISOString(),
      action: 'backup_restore',
    });

    res.json({ success: true, modules, deletedModules, roster, admins: adminSurnames, settings, version });
  });

  // API 9: Server-Sent Events stream for zero-latency live sync
  app.get('/api/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // Send initial snapshot
    res.write(`data: ${JSON.stringify({
      type: 'CONNECTED',
      modules,
      deletedModules,
      activeUsers: Array.from(activeUsers.values()),
      roster,
      admins: adminSurnames,
      settings,
      version,
    })}\n\n`);

    sseClients.push(res);

    req.on('close', () => {
      sseClients = sseClients.filter((client) => client !== res);
    });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Live sync & storage server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
