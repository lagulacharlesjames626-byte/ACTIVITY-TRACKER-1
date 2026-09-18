import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ModuleItem,
  DeletedModuleItem,
  ActiveUser,
  SyncMessage,
  CompletionBoosterEvent,
  SiteSettings,
} from '../types';
import { generateCompletionBooster } from '../utils/boosterMessages';
import { DEFAULT_STUDENTS_ROSTER, ADMIN_SURNAMES } from '../utils/rosterData';

const STORAGE_KEY_NAME = 'module_tracker_student_name';
const STORAGE_KEY_ID = 'module_tracker_student_id';
const STORAGE_KEY_RECENTS = 'module_tracker_recent_names';
const STORAGE_KEY_TRASH = 'module_tracker_deleted_modules';
const BROADCAST_CHANNEL_NAME = 'module_tracker_sync_channel';

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

export function useLiveSync(
  modules: ModuleItem[],
  setModules: React.Dispatch<React.SetStateAction<ModuleItem[]>>,
  onShowToast: (msg: string) => void
) {
  // Current logged in student surname/name
  const [currentStudent, setCurrentStudent] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('bsba_student_session') || localStorage.getItem(STORAGE_KEY_NAME);
      return stored ? stored.trim() : '';
    } catch {
      return '';
    }
  });

  const [studentId] = useState<string>(() => {
    try {
      let id = localStorage.getItem(STORAGE_KEY_ID);
      if (!id) {
        id = 'student-' + Math.random().toString(36).substring(2, 9);
        localStorage.setItem(STORAGE_KEY_ID, id);
      }
      return id;
    } catch {
      return 'student-' + Math.random().toString(36).substring(2, 9);
    }
  });

  const [recentNames, setRecentNames] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RECENTS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Deleted modules (Trash Bin)
  const [deletedModules, setDeletedModules] = useState<DeletedModuleItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TRASH);
      if (!saved) return [];
      const parsed: DeletedModuleItem[] = JSON.parse(saved);
      const now = Date.now();
      return parsed.filter((item) => {
        const exp = new Date(item.expiresAt).getTime();
        return !isNaN(exp) && exp > now;
      });
    } catch {
      return [];
    }
  });

  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [currentlyEditingModuleId, setCurrentlyEditingModuleId] = useState<string | null>(null);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(true);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [boosterEvent, setBoosterEvent] = useState<CompletionBoosterEvent | null>(null);

  // Roster, Admins, and Settings states synced with permanent server storage
  const [roster, setRoster] = useState<string[]>(DEFAULT_STUDENTS_ROSTER);
  const [admins, setAdmins] = useState<string[]>(ADMIN_SURNAMES);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);

  const channelRef = useRef<BroadcastChannel | null>(null);
  const sseRef = useRef<EventSource | null>(null);
  const currentStudentRef = useRef(currentStudent);
  currentStudentRef.current = currentStudent;

  // Map of moduleId -> studentName who is currently editing
  const editingMap: Record<string, string> = {};
  activeUsers.forEach((user) => {
    if (user.editingModuleId && user.name.toUpperCase() !== currentStudent.toUpperCase()) {
      editingMap[user.editingModuleId] = user.name;
    }
  });

  // Login action
  const login = useCallback(
    (name: string) => {
      const cleanName = name.trim();
      if (!cleanName) return;
      try {
        localStorage.setItem('bsba_student_session', cleanName);
        localStorage.setItem(STORAGE_KEY_NAME, cleanName);
        setRecentNames((prev) => {
          const next = [cleanName, ...prev.filter((n) => n.toUpperCase() !== cleanName.toUpperCase())].slice(0, 5);
          localStorage.setItem(STORAGE_KEY_RECENTS, JSON.stringify(next));
          return next;
        });
      } catch (e) {
        console.error(e);
      }
      setCurrentStudent(cleanName);
      onShowToast(`Logged in as ${cleanName}`);
    },
    [onShowToast]
  );

  // Logout
  const logout = useCallback(() => {
    try {
      localStorage.removeItem('bsba_student_session');
      localStorage.removeItem(STORAGE_KEY_NAME);
    } catch (e) {
      console.error(e);
    }
    setCurrentStudent('');
    setCurrentlyEditingModuleId(null);
  }, []);

  const updateDeletedModules = useCallback((items: DeletedModuleItem[]) => {
    const now = Date.now();
    const clean = items.filter((item) => {
      const exp = new Date(item.expiresAt).getTime();
      return !isNaN(exp) && exp > now;
    });
    setDeletedModules(clean);
    try {
      localStorage.setItem(STORAGE_KEY_TRASH, JSON.stringify(clean));
    } catch (e) {
      console.warn('Failed to save trash to localStorage', e);
    }
  }, []);

  // Initial fetch from /api/sync on mount
  useEffect(() => {
    fetch('/api/sync')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        if (Array.isArray(data.modules)) {
          setModules(data.modules);
        }
        if (Array.isArray(data.deletedModules)) {
          updateDeletedModules(data.deletedModules);
        }
        if (Array.isArray(data.activeUsers)) {
          setActiveUsers(data.activeUsers);
        }
        if (Array.isArray(data.roster)) {
          const merged = Array.from(new Set([...DEFAULT_STUDENTS_ROSTER, ...data.roster]));
          setRoster(merged);
        }
        if (Array.isArray(data.admins)) {
          setAdmins(data.admins);
        }
        if (data.settings) {
          setSettings((prev) => ({ ...prev, ...data.settings }));
        }
      })
      .catch(() => {});
  }, [setModules, updateDeletedModules]);

  // Broadcast Channel setup for zero-delay cross-tab syncing
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        channelRef.current = bc;

        bc.onmessage = (event) => {
          const msg: SyncMessage = event.data;
          if (!msg || msg.senderId === studentId) return;

          if (msg.type === 'MODULES_UPDATED') {
            if (msg.modules) {
              setModules(msg.modules);
            }
            if (msg.deletedModules) {
              updateDeletedModules(msg.deletedModules);
            }
            setLastSyncTime(new Date());
            if (msg.senderName) {
              onShowToast(`${msg.senderName} updated the tracker in real-time`);
            }
          } else if (msg.type === 'SETTINGS_UPDATED' && msg.settings) {
            setSettings(msg.settings);
          } else if (msg.type === 'ROSTER_UPDATED' && msg.roster) {
            setRoster(msg.roster);
          } else if (msg.type === 'ADMINS_UPDATED' && Array.isArray(msg.admins)) {
            setAdmins(msg.admins);
          } else if (msg.type === 'EDITING_START' && msg.moduleId) {
            setActiveUsers((prev) => {
              const others = prev.filter((u) => u.id !== msg.senderId);
              return [
                ...others,
                { id: msg.senderId, name: msg.senderName, editingModuleId: msg.moduleId, lastSeen: Date.now() },
              ];
            });
          } else if (msg.type === 'EDITING_END') {
            setActiveUsers((prev) =>
              prev.map((u) => (u.id === msg.senderId ? { ...u, editingModuleId: null } : u))
            );
          }
        };

        return () => {
          bc.close();
        };
      }
    } catch (err) {
      console.warn('BroadcastChannel not supported', err);
    }
  }, [studentId, setModules, updateDeletedModules, onShowToast]);

  // Server-Sent Events (SSE) stream
  useEffect(() => {
    let es: EventSource | null = null;
    try {
      es = new EventSource('/api/events');
      sseRef.current = es;

      es.onopen = () => {
        setIsLiveConnected(true);
      };

      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'CONNECTED') {
            if (Array.isArray(data.modules)) setModules(data.modules);
            if (Array.isArray(data.deletedModules)) updateDeletedModules(data.deletedModules);
            if (Array.isArray(data.activeUsers)) setActiveUsers(data.activeUsers);
            if (Array.isArray(data.roster)) setRoster(data.roster);
            if (Array.isArray(data.admins)) setAdmins(data.admins);
            if (data.settings) setSettings((prev) => ({ ...prev, ...data.settings }));
          } else if (data.type === 'MODULES_UPDATED') {
            if (Array.isArray(data.modules)) {
              setModules(data.modules);
            }
            if (Array.isArray(data.deletedModules)) {
              updateDeletedModules(data.deletedModules);
            }
            setLastSyncTime(new Date());
            if (data.updatedBy && data.updatedBy !== currentStudentRef.current) {
              onShowToast(`Latest update by ${data.updatedBy} synced!`);
            }
          } else if (data.type === 'SETTINGS_UPDATED' && data.settings) {
            setSettings(data.settings);
          } else if (data.type === 'ROSTER_UPDATED' && Array.isArray(data.roster)) {
            setRoster(data.roster);
          } else if (data.type === 'ADMINS_UPDATED' && Array.isArray(data.admins)) {
            setAdmins(data.admins);
          } else if (data.type === 'PRESENCE_UPDATE' && Array.isArray(data.activeUsers)) {
            setActiveUsers(data.activeUsers);
          } else if (data.type === 'EDITING_STATUS') {
            if (Array.isArray(data.activeUsers)) {
              setActiveUsers(data.activeUsers);
            }
          }
        } catch (err) {
          console.error('Failed to parse SSE', err);
        }
      };

      es.onerror = () => {
        setIsLiveConnected(false);
      };
    } catch (err) {
      console.warn('SSE error', err);
    }

    return () => {
      if (es) es.close();
    };
  }, [setModules, updateDeletedModules, onShowToast]);

  // Heartbeat polling & presence ping every 5 seconds
  useEffect(() => {
    if (!currentStudent) return;

    const ping = async () => {
      try {
        const res = await fetch('/api/presence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: studentId,
            name: currentStudent,
            editingModuleId: currentlyEditingModuleId,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.activeUsers)) {
            setActiveUsers(data.activeUsers);
          }
          setIsLiveConnected(true);
        }
      } catch {
        // network offline
      }
    };

    ping();
    const interval = setInterval(ping, 5000);
    return () => clearInterval(interval);
  }, [currentStudent, studentId, currentlyEditingModuleId]);

  // Broadcast editing start
  const startEditing = useCallback(
    (moduleId: string) => {
      setCurrentlyEditingModuleId(moduleId);
      if (channelRef.current) {
        channelRef.current.postMessage({
          type: 'EDITING_START',
          senderId: studentId,
          senderName: currentStudent,
          moduleId,
          timestamp: Date.now(),
        });
      }
      fetch('/api/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: studentId,
          name: currentStudent,
          editingModuleId: moduleId,
        }),
      }).catch(() => {});
    },
    [studentId, currentStudent]
  );

  // Broadcast editing end
  const stopEditing = useCallback(() => {
    setCurrentlyEditingModuleId(null);
    if (channelRef.current) {
      channelRef.current.postMessage({
        type: 'EDITING_END',
        senderId: studentId,
        senderName: currentStudent,
        timestamp: Date.now(),
      });
    }
    fetch('/api/presence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: studentId,
        name: currentStudent,
        editingModuleId: null,
      }),
    }).catch(() => {});
  }, [studentId, currentStudent]);

  // Save / Sync modules to backend
  const syncModuleChange = useCallback(
    async (
      action:
        | 'save'
        | 'delete'
        | 'toggle'
        | 'toggle_student_finish'
        | 'toggle_submodule_finish'
        | 'restore'
        | 'permanent_delete'
        | 'empty_trash',
      payload: any
    ) => {
      try {
        const res = await fetch('/api/modules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action,
            studentName: currentStudent,
            ...payload,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.modules)) {
            setModules(data.modules);
          }
          if (Array.isArray(data.deletedModules)) {
            updateDeletedModules(data.deletedModules);
          }
          setLastSyncTime(new Date());

          if (channelRef.current) {
            channelRef.current.postMessage({
              type: 'MODULES_UPDATED',
              senderId: studentId,
              senderName: currentStudent,
              modules: data.modules,
              deletedModules: data.deletedModules,
              timestamp: Date.now(),
            });
          }
        }
      } catch (e) {
        console.warn('Backend sync error', e);
      }
    },
    [currentStudent, studentId, setModules, updateDeletedModules]
  );

  // Restore module from Trash
  const restoreFromTrash = useCallback(
    async (moduleId: string) => {
      const item = deletedModules.find((d) => d.id === moduleId);
      if (!item) return;

      updateDeletedModules(deletedModules.filter((d) => d.id !== moduleId));
      const restored: ModuleItem = {
        id: item.id,
        moduleNumber: item.moduleNumber,
        subject: item.subject,
        activity: item.activity,
        locations: item.locations,
        links: item.links,
        customLocation: item.customLocation,
        deadline: item.deadline,
        status: item.status,
        completedBy: item.completedBy,
        completedAt: item.completedAt,
        notes: item.notes,
        subModules: item.subModules,
        submittedAt: item.submittedAt,
        createdAt: item.createdAt,
        createdBy: item.createdBy,
        updatedAt: new Date().toISOString(),
        lastUpdatedBy: currentStudent,
      };
      setModules((prev) => [restored, ...prev.filter((m) => m.id !== moduleId)]);
      onShowToast(`Restored Module ${item.moduleNumber}: ${item.activity}`);

      await syncModuleChange('restore', { moduleId });
    },
    [deletedModules, currentStudent, updateDeletedModules, setModules, onShowToast, syncModuleChange]
  );

  // Permanently delete from trash
  const permanentlyDeleteFromTrash = useCallback(
    async (moduleId: string) => {
      const item = deletedModules.find((d) => d.id === moduleId);
      updateDeletedModules(deletedModules.filter((d) => d.id !== moduleId));
      onShowToast(`Permanently deleted Module ${item?.moduleNumber || ''}`);
      await syncModuleChange('permanent_delete', { moduleId });
    },
    [deletedModules, updateDeletedModules, onShowToast, syncModuleChange]
  );

  // Empty all items in trash
  const emptyTrash = useCallback(async () => {
    updateDeletedModules([]);
    onShowToast('Emptied all items in Trash Bin');
    await syncModuleChange('empty_trash', {});
  }, [updateDeletedModules, onShowToast, syncModuleChange]);

  // Main module completion check
  const toggleStudentCompletion = useCallback(
    (moduleId: string) => {
      if (!currentStudent) {
        onShowToast('Please log in with your name first.');
        return;
      }
      const studentClean = currentStudent.trim();
      const upperName = studentClean.toUpperCase();

      let markedAsFinished = false;
      setModules((prev) =>
        prev.map((mod) => {
          if (mod.id === moduleId) {
            const prevList = Array.isArray(mod.completedBy) ? mod.completedBy : [];
            const hasSurname = prevList.some((s) => s.toUpperCase() === upperName);
            markedAsFinished = !hasSurname;
            const nextList = hasSurname
              ? prevList.filter((s) => s.toUpperCase() !== upperName)
              : [...prevList, studentClean];
            const nextCompletedAt = { ...(mod.completedAt || {}) };
            const nowIso = new Date().toISOString();
            if (hasSurname) {
              delete nextCompletedAt[studentClean];
            } else {
              nextCompletedAt[studentClean] = nowIso;
            }

            return {
              ...mod,
              completedBy: nextList,
              completedAt: nextCompletedAt,
              updatedAt: nowIso,
              lastUpdatedBy: studentClean,
            };
          }
          return mod;
        })
      );

      if (markedAsFinished) {
        const targetMod = modules.find((m) => m.id === moduleId);
        if (targetMod) {
          const booster = generateCompletionBooster(targetMod, studentClean);
          setBoosterEvent(booster);
        }
      } else {
        onShowToast(`Unchecked finished status for ${studentClean}`);
      }

      syncModuleChange('toggle_student_finish', { moduleId });
    },
    [currentStudent, modules, setModules, onShowToast, syncModuleChange]
  );

  // Sub-module completion check
  const toggleSubModuleCompletion = useCallback(
    (moduleId: string, subModuleId: string) => {
      if (!currentStudent) {
        onShowToast('Please log in with your name first.');
        return;
      }
      const studentClean = currentStudent.trim();
      const upperName = studentClean.toUpperCase();

      setModules((prev) =>
        prev.map((mod) => {
          if (mod.id === moduleId && mod.subModules) {
            const updatedSubs = mod.subModules.map((sub) => {
              if (sub.id === subModuleId) {
                const prevCompleted = sub.completedBy || [];
                const hasMe = prevCompleted.some((s) => s.toUpperCase() === upperName);
                const nextCompleted = hasMe
                  ? prevCompleted.filter((s) => s.toUpperCase() !== upperName)
                  : [...prevCompleted, studentClean];
                const nextCompletedAt = { ...(sub.completedAt || {}) };
                if (hasMe) {
                  delete nextCompletedAt[studentClean];
                } else {
                  nextCompletedAt[studentClean] = new Date().toISOString();
                }
                return {
                  ...sub,
                  completedBy: nextCompleted,
                  completedAt: nextCompletedAt,
                };
              }
              return sub;
            });

            return {
              ...mod,
              subModules: updatedSubs,
              updatedAt: new Date().toISOString(),
              lastUpdatedBy: studentClean,
            };
          }
          return mod;
        })
      );

      syncModuleChange('toggle_submodule_finish', { moduleId, subModuleId });
    },
    [currentStudent, setModules, onShowToast, syncModuleChange]
  );

  // Settings save handler
  const saveSettings = useCallback(
    async (newSettings: Partial<SiteSettings>, adminPassword?: string) => {
      try {
        const res = await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newSettings, adminPassword }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            setSettings(data.settings);
            return true;
          }
        }
      } catch (err) {
        console.error('Failed to save settings to server', err);
      }
      return false;
    },
    []
  );

  // Roster handlers
  const addStudentToRoster = useCallback(async (studentName: string) => {
    try {
      const res = await fetch('/api/roster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', studentName }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.roster)) {
          setRoster(data.roster);
          return true;
        }
      }
    } catch {}
    return false;
  }, []);

  const bulkImportRoster = useCallback(async (names: string[]) => {
    try {
      const res = await fetch('/api/roster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bulk_import', names }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.roster)) {
          setRoster(data.roster);
          return true;
        }
      }
    } catch {}
    return false;
  }, []);

  const editStudentInRoster = useCallback(async (oldName: string, newName: string) => {
    try {
      const res = await fetch('/api/roster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'edit', oldName, newName }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.roster)) {
          setRoster(data.roster);
          return true;
        }
      }
    } catch {}
    return false;
  }, []);

  const deleteStudentFromRoster = useCallback(async (studentName: string) => {
    try {
      const res = await fetch('/api/roster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', studentName }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.roster)) {
          setRoster(data.roster);
          return true;
        }
      }
    } catch {}
    return false;
  }, []);

  // Admin appointment and revocation handlers
  const appointAdmin = useCallback(
    async (surname: string) => {
      const cleanSurname = surname.trim().toUpperCase();
      if (!cleanSurname) return false;
      try {
        const res = await fetch('/api/admins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'appoint', surname: cleanSurname }),
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.admins)) {
            setAdmins(data.admins);
            onShowToast(`Appointed ${cleanSurname} as Class Administrator!`);
            return true;
          }
        }
      } catch (err) {
        console.error('Failed to appoint admin', err);
      }
      return false;
    },
    [onShowToast]
  );

  const revokeAdmin = useCallback(
    async (surname: string) => {
      const cleanSurname = surname.trim().toUpperCase();
      if (!cleanSurname) return false;
      try {
        const res = await fetch('/api/admins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'revoke', surname: cleanSurname }),
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.admins)) {
            setAdmins(data.admins);
            onShowToast(`Revoked admin privileges from ${cleanSurname}`);
            return true;
          }
        } else {
          const errData = await res.json().catch(() => null);
          if (errData?.error) onShowToast(errData.error);
        }
      } catch (err) {
        console.error('Failed to revoke admin', err);
      }
      return false;
    },
    [onShowToast]
  );

  // Admin password verify
  const verifyAdminPassword = useCallback(async (password: string) => {
    try {
      const res = await fetch('/api/auth/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        const data = await res.json();
        return !!data.authorized;
      }
    } catch {}
    return false;
  }, []);

  return {
    currentStudent,
    studentId,
    recentNames,
    deletedModules,
    roster,
    admins,
    settings,
    login,
    logout,
    activeUsers,
    editingMap,
    currentlyEditingModuleId,
    startEditing,
    stopEditing,
    syncModuleChange,
    restoreFromTrash,
    permanentlyDeleteFromTrash,
    emptyTrash,
    toggleStudentCompletion,
    toggleSubModuleCompletion,
    saveSettings,
    addStudentToRoster,
    bulkImportRoster,
    editStudentInRoster,
    deleteStudentFromRoster,
    appointAdmin,
    revokeAdmin,
    verifyAdminPassword,
    boosterEvent,
    dismissBooster: () => setBoosterEvent(null),
    isLiveConnected,
    lastSyncTime,
  };
}
