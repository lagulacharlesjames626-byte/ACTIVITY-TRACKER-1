import React, { useState, useMemo } from 'react';
import { ModuleItem, PortalLinks, FilterState } from './types';
import { OFFICIAL_SUBJECTS } from './utils/subjectThemes';
import { Header } from './components/Header';
import { PortalBar } from './components/PortalBar';
import { FilterBar } from './components/FilterBar';
import { ModuleCard } from './components/ModuleCard';
import { ModuleModal } from './components/ModuleModal';
import { PortalEditModal } from './components/PortalEditModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { BackupModal } from './components/BackupModal';
import { TrashBinModal } from './components/TrashBinModal';
import { CompletionBoosterPopup } from './components/CompletionBoosterPopup';
import { CompletedModulesModal } from './components/CompletedModulesModal';
import { LoginScreen } from './components/LoginScreen';
import { ModeratorStudio } from './components/ModeratorStudio';
import { ToastNotification } from './components/ToastNotification';
import { useLiveSync } from './hooks/useLiveSync';
import { useDeviceDetect } from './hooks/useDeviceDetect';
import {
  Plus,
  BookOpen,
  CheckCircle2,
  Trash2,
  Bell,
  Sliders,
  ExternalLink,
  Smartphone,
  Laptop,
} from 'lucide-react';

const STORAGE_KEY_ROLE = 'bsba_user_role';

export default function App() {
  // Modules State - initially empty to avoid fake/demo data
  const [modules, setModules] = useState<ModuleItem[]>([]);

  // Automatic Device Detection (detects mobile vs tablet vs desktop without any manual button)
  const { isMobile, isTouch, isDesktop } = useDeviceDetect();

  // User Role: 'student' or 'admin'
  const [userRole, setUserRole] = useState<'student' | 'admin'>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ROLE);
      return stored === 'admin' ? 'admin' : 'student';
    } catch {
      return 'student';
    }
  });

  // Filter & Search State
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    subject: 'all',
    location: 'all',
    status: 'all',
    sortOrder: 'asc',
  });

  // Modals state
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<ModuleItem | null>(null);
  const [isCopyMode, setIsCopyMode] = useState(false);
  const [isPortalModalOpen, setIsPortalModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [isCompletedModalOpen, setIsCompletedModalOpen] = useState(false);
  const [isModeratorOpen, setIsModeratorOpen] = useState(false);
  const [deleteTargetModule, setDeleteTargetModule] = useState<ModuleItem | null>(null);

  // Notification Toast (User mandate: strictly lasts 10 seconds and automatically disappears)
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  // Real-time Live Sync & User Presence with Disk-Persisted Server State
  const {
    currentStudent,
    deletedModules,
    roster,
    admins,
    settings,
    login,
    logout,
    activeUsers,
    editingMap,
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
    dismissBooster,
    isLiveConnected,
  } = useLiveSync(modules, setModules, showToast);

  const portalLinks: PortalLinks = settings.portalLinks || {
    gclass: 'https://classroom.google.com',
    emabini: 'https://e-mabini.mabini.edu.ph',
    gdrive: 'https://drive.google.com',
  };

  // Login handler
  const handleLogin = (name: string, role: 'student' | 'admin' = 'student') => {
    setUserRole(role);
    try {
      localStorage.setItem(STORAGE_KEY_ROLE, role);
    } catch {}
    login(name);
  };

  // Admin login verify
  const handleAdminLogin = async (password: string) => {
    const ok = await verifyAdminPassword(password);
    if (ok) {
      setUserRole('admin');
      try {
        localStorage.setItem(STORAGE_KEY_ROLE, 'admin');
      } catch {}
      login('Admin / Moderator');
      setIsModeratorOpen(true);
      return true;
    }
    return false;
  };

  // Unique Subjects List
  const subjectsList = useMemo(() => {
    const set = new Set<string>(OFFICIAL_SUBJECTS);
    modules.forEach((m) => {
      if (m.subject) set.add(m.subject);
    });
    return Array.from(set);
  }, [modules]);

  // AUTOMATIC DUE DATE SORTING & FILTERING
  const filteredAndSortedModules = useMemo(() => {
    const currentNameClean = currentStudent ? currentStudent.trim() : '';
    const currentUpper = currentNameClean.toUpperCase();

    const result = modules.filter((m) => {
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const matchTitle = m.activity.toLowerCase().includes(query);
        const matchSubject = m.subject.toLowerCase().includes(query);
        const matchNotes = (m.notes || '').toLowerCase().includes(query);
        const matchModNum = String(m.moduleNumber).toLowerCase().includes(query);
        const matchStudent = (m.completedBy || []).some((s) => s.toLowerCase().includes(query));
        const matchSub = (m.subModules || []).some((sub) =>
          sub.title.toLowerCase().includes(query) || (sub.instructions || '').toLowerCase().includes(query)
        );
        if (!matchTitle && !matchSubject && !matchNotes && !matchModNum && !matchStudent && !matchSub) {
          return false;
        }
      }

      if (filters.subject !== 'all' && m.subject !== filters.subject) {
        return false;
      }

      if (filters.location !== 'all') {
        const locs = m.locations || ((m as any).location ? [(m as any).location] : []);
        if (!locs.includes(filters.location as any)) {
          return false;
        }
      }

      const studentCompletedList = m.completedBy || [];
      const hasMeFinished = currentUpper
        ? studentCompletedList.some((s) => s.toUpperCase() === currentUpper)
        : false;

      // Auto-hide modules completed over 1 hour ago from active board unless filtered
      const ONE_HOUR = 60 * 60 * 1000;
      const finishedAtIso = currentUpper && m.completedAt ? m.completedAt[currentStudent] : undefined;
      const finishedAtTime = finishedAtIso ? new Date(finishedAtIso).getTime() : 0;
      const isFinishedOver1HourAgo =
        hasMeFinished && (finishedAtTime > 0 ? Date.now() - finishedAtTime >= ONE_HOUR : false);

      if (filters.status !== 'my_finished' && isFinishedOver1HourAgo) {
        return false;
      }

      if (filters.status === 'my_finished' && !hasMeFinished) return false;
      if (filters.status === 'my_pending' && hasMeFinished) return false;
      if (filters.status === 'pending' && m.status !== 'pending') return false;
      if (filters.status === 'in_progress' && m.status !== 'in_progress') return false;
      if (filters.status === 'submitted' && m.status !== 'submitted') return false;
      if (filters.status === 'overdue') {
        if (m.status === 'submitted') return false;
        const deadline = m.deadline ? new Date(m.deadline).getTime() : 0;
        if (deadline >= Date.now()) return false;
      }

      return true;
    });

    return result.sort((a, b) => {
      const timeA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const timeB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      return filters.sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });
  }, [modules, filters, currentStudent]);

  // Active editors list for top live ticker
  const activeEditors = useMemo(() => {
    return Object.entries(editingMap).map(([modId, name]) => {
      const mod = modules.find((m) => m.id === modId);
      return {
        name,
        moduleId: modId,
        moduleNumber: mod?.moduleNumber,
        activity: mod?.activity || 'a module',
      };
    });
  }, [editingMap, modules]);

  const currentSurnameUpper = currentStudent ? currentStudent.trim().toUpperCase() : '';

  const myCompletedCount = useMemo(() => {
    if (!currentSurnameUpper) return 0;
    return modules.filter((m) =>
      (m.completedBy || []).some((s) => s.toUpperCase() === currentSurnameUpper)
    ).length;
  }, [modules, currentSurnameUpper]);

  const archivedCompletedCount = useMemo(() => {
    if (!currentSurnameUpper) return 0;
    const ONE_HOUR = 60 * 60 * 1000;
    return modules.filter((m) => {
      const isFinished = (m.completedBy || []).some((s) => s.toUpperCase() === currentSurnameUpper);
      if (!isFinished) return false;
      const finishedAtIso = m.completedAt ? m.completedAt[currentStudent] : undefined;
      const finishedAtTime = finishedAtIso ? new Date(finishedAtIso).getTime() : 0;
      return finishedAtTime > 0 && Date.now() - finishedAtTime >= ONE_HOUR;
    }).length;
  }, [modules, currentSurnameUpper, currentStudent]);

  // If student is not logged in, render dual login screen
  if (!currentStudent) {
    return (
      <LoginScreen
        onLogin={handleLogin}
        onAdminLogin={handleAdminLogin}
        roster={roster}
        admins={admins}
        onRegisterStudent={addStudentToRoster}
        courseName={settings.courseName || 'BSBA-HRM Class 1-A'}
      />
    );
  }

  const handleOpenAddModule = () => {
    setEditingModule(null);
    setIsCopyMode(false);
    setIsModuleModalOpen(true);
  };

  const handleOpenEditModule = (module: ModuleItem) => {
    setEditingModule(module);
    setIsCopyMode(false);
    startEditing(module.id);
    setIsModuleModalOpen(true);
  };

  const handleOpenCopyModule = (module: ModuleItem) => {
    const numVal = Number(module.moduleNumber);
    const nextModNum = !isNaN(numVal) ? numVal + 1 : `${module.moduleNumber} (Copy)`;

    const copyTemplate: ModuleItem = {
      ...module,
      id: '',
      moduleNumber: nextModNum,
      activity: module.activity,
      status: 'pending',
      completedBy: [],
      completedAt: {},
      submittedAt: undefined,
    };

    setEditingModule(copyTemplate);
    setIsCopyMode(true);
    setIsModuleModalOpen(true);
  };

  const handleCloseModuleModal = () => {
    setIsModuleModalOpen(false);
    setEditingModule(null);
    setIsCopyMode(false);
    stopEditing();
  };

  const sortByDeadline = (list: ModuleItem[]) => {
    return [...list].sort((a, b) => {
      const timeA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const timeB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      return timeA - timeB;
    });
  };

  const handleSaveModule = (data: Partial<ModuleItem>) => {
    const now = new Date().toISOString();
    if (editingModule && !isCopyMode) {
      const updatedItem: ModuleItem = {
        ...editingModule,
        ...data,
        updatedAt: now,
        lastUpdatedBy: currentStudent,
      };

      setModules((prev) =>
        sortByDeadline(prev.map((item) => (item.id === editingModule.id ? updatedItem : item)))
      );
      syncModuleChange('save', { module: updatedItem });
      showToast(
        `Updated Module ${data.moduleNumber || editingModule.moduleNumber}: ${
          data.activity || editingModule.activity
        }`
      );
    } else {
      const newModule: ModuleItem = {
        id: `mod-${Date.now()}`,
        moduleNumber: data.moduleNumber || 1,
        subject: data.subject || OFFICIAL_SUBJECTS[0],
        activity: data.activity || 'Activity',
        locations: data.locations && data.locations.length > 0 ? data.locations : ['Gclass'],
        links: data.links || { gclass: portalLinks.gclass },
        customLocation: data.customLocation,
        deadline: data.deadline || new Date().toISOString(),
        status: data.status || 'pending',
        notes: data.notes,
        subModules: data.subModules,
        createdAt: now,
        createdBy: currentStudent,
        updatedAt: now,
        lastUpdatedBy: currentStudent,
      };
      setModules((prev) => sortByDeadline([newModule, ...prev]));
      syncModuleChange('save', { module: newModule });
      showToast(
        isCopyMode
          ? `Added copied Module ${newModule.moduleNumber}: ${newModule.activity}!`
          : `Added Module ${newModule.moduleNumber}: ${newModule.activity} to your tracker!`
      );
    }

    setIsCopyMode(false);
    stopEditing();
    setIsModuleModalOpen(false);
    setEditingModule(null);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTargetModule) return;
    const mod = deleteTargetModule;
    setModules((prev) => prev.filter((m) => m.id !== mod.id));
    syncModuleChange('delete', { moduleId: mod.id });
    showToast(`Moved Module ${mod.moduleNumber} to Trash Bin`);
    setDeleteTargetModule(null);
  };

  const handleStatusChange = (id: string, status: ModuleItem['status']) => {
    const now = new Date().toISOString();
    setModules((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            status,
            submittedAt: status === 'submitted' ? now : undefined,
            updatedAt: now,
            lastUpdatedBy: currentStudent,
          };
        }
        return item;
      })
    );
    syncModuleChange('toggle', { moduleId: id });
  };

  const handleSavePortals = (newPortals: PortalLinks) => {
    saveSettings({ portalLinks: newPortals });
    showToast('School & Class portal links updated successfully!');
  };

  const handleImport = (importedModules: ModuleItem[], importedPortals: PortalLinks) => {
    setModules(importedModules);
    saveSettings({ portalLinks: importedPortals });
    showToast(`Successfully imported ${importedModules.length} module activities!`);
  };

  // Custom Font Class based on Settings
  const fontClass =
    settings.fontFamily === 'serif'
      ? 'font-serif'
      : settings.fontFamily === 'mono'
      ? 'font-mono'
      : settings.fontFamily === 'rounded'
      ? 'font-sans tracking-wide'
      : 'font-sans';

  return (
    <div
      className={`min-h-screen bg-white text-slate-800 flex flex-col ${fontClass} selection:bg-indigo-500 selection:text-white transition-all`}
    >
      <div className="w-full flex-1 flex flex-col pb-20 sm:pb-8">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs sm:text-sm font-medium flex items-center gap-2 border border-slate-700 animate-in slide-in-from-bottom-5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Announcement Banner if configured by Moderator */}
        {settings.announcement && (
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white text-xs font-bold py-2 px-4 shadow-xs">
            <div className="max-w-5xl mx-auto flex items-center justify-center gap-2">
              <Bell className="w-3.5 h-3.5 animate-bounce shrink-0" />
              <span className="truncate">{settings.announcement}</span>
            </div>
          </div>
        )}

        {/* Main Top Header with Student Profile, Live Sync Status & Moderator Studio Button */}
        <Header
          modules={modules}
          currentStudent={currentStudent}
          userRole={userRole}
          activeUsers={activeUsers}
          activeCount={Math.max(1, activeUsers.length)}
          isLiveConnected={isLiveConnected}
          trashCount={deletedModules.length}
          roster={roster}
          courseName={settings.courseName || 'BSBA-HRM 1-A'}
          onOpenTrash={() => setIsTrashOpen(true)}
          onOpenCompleted={() => setIsCompletedModalOpen(true)}
          onOpenModerator={() => setIsModeratorOpen(true)}
          onLogout={logout}
          onAddNewModule={handleOpenAddModule}
        />

        {/* Portal Quick Access Bar (GClass, E-mabini, GDrive) */}
        <PortalBar
          portals={portalLinks}
          isAdminMode={userRole === 'admin'}
          onOpenPortalSettings={() => setIsPortalModalOpen(true)}
        />

        {/* Live Collaboration Banner: Shows who is currently editing in real-time */}
        {activeEditors.length > 0 && (
          <div className="bg-amber-50 border-y border-amber-200 px-3 sm:px-4 py-2">
            <div className="max-w-5xl mx-auto flex items-center justify-between gap-3 text-xs text-amber-900">
              <div className="flex items-center gap-2 font-medium min-w-0">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </span>
                <span className="truncate">
                  <strong>{activeEditors.map((e) => e.name).join(', ')}</strong>{' '}
                  {activeEditors.length === 1 ? 'is' : 'are'} currently editing:
                  {activeEditors.map((e, idx) => (
                    <span key={e.moduleId} className="ml-1 font-semibold underline">
                      {e.moduleNumber ? `Module ${e.moduleNumber}` : e.activity}
                      {idx < activeEditors.length - 1 ? ',' : ''}
                    </span>
                  ))}
                </span>
              </div>
              <span className="text-[10px] font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0">
                Live
              </span>
            </div>
          </div>
        )}

        {/* Main Content Area - Fluidly auto-sizes with optimal padding for mobile screens vs desktop screens */}
        <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-6 py-3 sm:py-5">
          {/* Filter and Automatic Sorting Bar */}
          <FilterBar
            filters={filters}
            onFilterChange={(newFilters) => setFilters((prev) => ({ ...prev, ...newFilters }))}
            subjects={subjectsList}
            totalResults={filteredAndSortedModules.length}
            currentStudent={currentStudent}
            completedCount={myCompletedCount}
            onOpenCompleted={() => setIsCompletedModalOpen(true)}
          />

          {/* 1-Hour Auto-Archive Notification Banner */}
          {archivedCompletedCount > 0 && (
            <div className="mb-3 p-3 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 text-emerald-950 text-xs flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>
                    {archivedCompletedCount} completed {archivedCompletedCount === 1 ? 'module' : 'modules'}
                  </strong>{' '}
                  moved to your Completed Archive (1 hour after finishing).
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsCompletedModalOpen(true)}
                className="px-3 py-1 rounded-lg text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-2xs cursor-pointer shrink-0 min-h-[36px]"
              >
                View Completed
              </button>
            </div>
          )}

          {/* Modules List View with Live Editing Badges and Latest Update Timestamps */}
          {filteredAndSortedModules.length > 0 ? (
            <div className="space-y-3">
              {filteredAndSortedModules.map((module) => (
                <ModuleCard
                  key={module.id}
                  module={module}
                  currentStudent={currentStudent}
                  editingBy={editingMap[module.id]}
                  isAdminMode={true}
                  buttonPlacement={settings.buttonPlacement || 'bottom-right'}
                  onEdit={handleOpenEditModule}
                  onDelete={(id) => {
                    const target = modules.find((m) => m.id === id);
                    if (target) setDeleteTargetModule(target);
                  }}
                  onStatusChange={handleStatusChange}
                  onToggleStudentFinish={toggleStudentCompletion}
                  onToggleSubModuleFinish={toggleSubModuleCompletion}
                  onDuplicate={handleOpenCopyModule}
                />
              ))}
            </div>
          ) : (
            /* Empty State - Clear and honest, no demo clutter */
            <div className="bg-slate-50/70 rounded-3xl border border-dashed border-slate-300 p-6 sm:p-12 text-center max-w-lg mx-auto my-4 sm:my-6 shadow-2xs">
              <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-xs">
                <BookOpen className="w-6 sm:w-7 h-6 sm:h-7" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">No Modules Added Yet</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                {filters.search || filters.subject !== 'all' || filters.status !== 'all'
                  ? 'No activities match your current search or filter criteria. Try clearing filters.'
                  : 'Start tracking for BSBA-HRM Class 1-A by adding your first module or bundle! Every save is permanently stored.'}
              </p>
              <div className="mt-4 sm:mt-5 flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
                <button
                  onClick={handleOpenAddModule}
                  className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all active:scale-98 cursor-pointer min-h-[44px]"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Add First Module / Bundle</span>
                </button>
                {(filters.search || filters.subject !== 'all' || filters.status !== 'all') && (
                  <button
                    onClick={() =>
                      setFilters({
                        search: '',
                        subject: 'all',
                        location: 'all',
                        status: 'all',
                        sortOrder: 'asc',
                      })
                    }
                    className="px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-200 border border-slate-300 cursor-pointer min-h-[44px]"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          )}
        </main>

        {/* Footer for Desktop and Tablet */}
        <footer className="mt-auto border-t border-slate-200 bg-white py-4 px-4 text-center text-xs text-slate-500">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse shrink-0" />
              <span className="truncate">
                {settings.courseName || 'BSBA-HRM Class 1-A'} • Logged in as{' '}
                <strong className="text-slate-700 uppercase">{currentStudent}</strong> (
                {userRole === 'admin' ? 'Admin' : 'Student'})
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsTrashOpen(true)}
                className="text-slate-600 hover:text-rose-600 hover:underline font-medium cursor-pointer inline-flex items-center gap-1"
                title="View deleted modules in Trash Bin (auto-deleted in 30 days)"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Trash ({deletedModules.length})</span>
              </button>
              <span>•</span>
              <button
                onClick={() => setIsBackupModalOpen(true)}
                className="text-indigo-600 hover:underline font-medium cursor-pointer"
              >
                Backup
              </button>
              <span>•</span>
              <button
                onClick={() => setIsModeratorOpen(true)}
                className="text-amber-700 hover:underline font-bold cursor-pointer inline-flex items-center gap-1"
              >
                <Sliders className="w-3 h-3" />
                <span>Moderator Studio</span>
              </button>
            </div>
          </div>
        </footer>

        {/* AUTOMATIC MOBILE BOTTOM APP BAR (Shown automatically on mobile phone viewports for native touch comfort) */}
        {isMobile && (
          <nav
            aria-label="Mobile Navigation"
            className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg"
          >
            {/* Quick Add Module Floating Action */}
            <button
              onClick={handleOpenAddModule}
              className="flex flex-col items-center justify-center p-1 text-indigo-600 font-bold min-w-[60px] min-h-[48px] active:scale-95 transition-transform"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="text-[10px] mt-0.5">Add</span>
            </button>

            {/* Quick View Completed Archive */}
            <button
              onClick={() => setIsCompletedModalOpen(true)}
              className="flex flex-col items-center justify-center p-1 text-slate-700 font-bold min-w-[60px] min-h-[48px] active:scale-95 transition-transform"
            >
              <div className="relative">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                {myCompletedCount > 0 && (
                  <span className="absolute -top-1 -right-2 px-1 rounded-full text-[9px] bg-emerald-600 text-white font-black">
                    {myCompletedCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5">Completed</span>
            </button>

            {/* Quick Portal Links */}
            <button
              onClick={() => setIsPortalModalOpen(true)}
              className="flex flex-col items-center justify-center p-1 text-slate-700 font-bold min-w-[60px] min-h-[48px] active:scale-95 transition-transform"
            >
              <ExternalLink className="w-5 h-5 text-slate-600" />
              <span className="text-[10px] mt-0.5">Portals</span>
            </button>

            {/* Quick Moderator Access */}
            <button
              onClick={() => setIsModeratorOpen(true)}
              className="flex flex-col items-center justify-center p-1 text-amber-700 font-bold min-w-[60px] min-h-[48px] active:scale-95 transition-transform"
            >
              <Sliders className="w-5 h-5 text-amber-600" />
              <span className="text-[10px] mt-0.5">Studio</span>
            </button>
          </nav>
        )}
      </div>

      {/* Add / Edit / Copy Module Modal (with multi-module bundle support!) */}
      <ModuleModal
        isOpen={isModuleModalOpen}
        onClose={handleCloseModuleModal}
        onSave={handleSaveModule}
        initialData={editingModule}
        isCopy={isCopyMode}
        existingSubjects={subjectsList}
        portalLinks={portalLinks}
      />

      {/* Moderator Studio Modal (Customize colors, placements, fonts, roster, passwords) */}
      <ModeratorStudio
        isOpen={isModeratorOpen}
        onClose={() => setIsModeratorOpen(false)}
        settings={settings}
        onSaveSettings={saveSettings}
        roster={roster}
        admins={admins}
        onAddStudent={addStudentToRoster}
        onBulkImportRoster={bulkImportRoster}
        onEditStudent={editStudentInRoster}
        onDeleteStudent={deleteStudentFromRoster}
        onAppointAdmin={appointAdmin}
        onRevokeAdmin={revokeAdmin}
        onShowToast={showToast}
      />

      {/* Edit School Portals Modal */}
      <PortalEditModal
        isOpen={isPortalModalOpen}
        onClose={() => setIsPortalModalOpen(false)}
        portalLinks={portalLinks}
        onSave={handleSavePortals}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTargetModule}
        onClose={() => setDeleteTargetModule(null)}
        onConfirm={handleDeleteConfirm}
        module={deleteTargetModule}
      />

      {/* Trash Bin Modal (30-day auto-purge & view all deleted modules) */}
      <TrashBinModal
        isOpen={isTrashOpen}
        onClose={() => setIsTrashOpen(false)}
        deletedModules={deletedModules}
        onRestore={(id) => restoreFromTrash(id)}
        onPermanentDelete={(id) => permanentlyDeleteFromTrash(id)}
        onEmptyTrash={() => emptyTrash()}
      />

      {/* Completion Speed & Cheer Booster Popup (10-second auto-close) */}
      <CompletionBoosterPopup event={boosterEvent} onDismiss={dismissBooster} />

      {/* Completed Modules Archive Modal (Grouped & Filterable by Subject) */}
      <CompletedModulesModal
        isOpen={isCompletedModalOpen}
        onClose={() => setIsCompletedModalOpen(false)}
        modules={modules}
        currentStudent={currentStudent}
        onToggleStudentFinish={toggleStudentCompletion}
        onDuplicate={handleOpenCopyModule}
      />

      {/* Backup & Import Modal */}
      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        modules={modules}
        portalLinks={portalLinks}
        onImport={handleImport}
        onResetToDemo={() => {
          setModules([]);
          showToast('Tracker cleared');
        }}
      />

      {/* Floating Notification Toast (Strictly 10 seconds auto-dismiss with animated progress bar) */}
      <ToastNotification
        message={toastMessage}
        onClose={() => setToastMessage(null)}
        duration={10000}
      />
    </div>
  );
}
