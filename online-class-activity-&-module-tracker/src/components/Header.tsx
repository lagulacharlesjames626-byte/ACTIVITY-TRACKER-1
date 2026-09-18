import React from 'react';
import {
  Plus,
  CheckCircle2,
  User,
  LogOut,
  UserCheck,
  Trash2,
  Sliders,
} from 'lucide-react';
import { ModuleItem, ActiveUser } from '../types';
import { OnlineUsersDropdown } from './OnlineUsersDropdown';

interface HeaderProps {
  modules: ModuleItem[];
  currentStudent?: string;
  userRole?: 'student' | 'admin';
  activeUsers?: ActiveUser[];
  activeCount?: number;
  isLiveConnected?: boolean;
  trashCount?: number;
  roster?: string[];
  courseName?: string;
  onOpenTrash?: () => void;
  onOpenCompleted?: () => void;
  onOpenModerator?: () => void;
  onLogout?: () => void;
  onAddNewModule: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  modules,
  currentStudent,
  userRole = 'student',
  activeUsers = [],
  activeCount = 1,
  isLiveConnected = true,
  trashCount = 0,
  roster = [],
  courseName = 'BSBA-HRM 1-A',
  onOpenTrash,
  onOpenCompleted,
  onOpenModerator,
  onLogout,
  onAddNewModule,
}) => {
  const total = modules.length;
  const currentSurnameUpper = currentStudent ? currentStudent.trim().toUpperCase() : '';

  // How many modules has THIS student personally checked off?
  const myCompletedCount = modules.filter((m) => {
    const list = Array.isArray(m.completedBy) ? m.completedBy : [];
    return currentSurnameUpper && list.some((s) => s.toUpperCase() === currentSurnameUpper);
  }).length;

  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-2xs">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-3">
        {/* Brand & Progress */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="min-w-0">
            <span className="text-[9px] sm:text-[10px] font-black uppercase text-indigo-600 tracking-wider block leading-none truncate">
              {courseName}
            </span>
            <h1 className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-tight truncate">
              Module Tracker
            </h1>
          </div>

          {/* Personal Student Finished Counter */}
          <span
            className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0"
            title={`You (${currentStudent}) have finished ${myCompletedCount} out of ${total} modules`}
          >
            <UserCheck className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-emerald-600" />
            <span className="hidden xs:inline">You: </span>
            <span>{myCompletedCount}/{total}</span>
          </span>

          {/* Real-time Online Users Dropdown */}
          <OnlineUsersDropdown
            activeUsers={activeUsers}
            currentStudent={currentStudent}
            modules={modules}
            isLiveConnected={isLiveConnected}
            roster={roster}
          />
        </div>

        {/* Right Section: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Moderator Studio Button */}
          {onOpenModerator && (
            <button
              id="open-moderator-header-btn"
              type="button"
              onClick={onOpenModerator}
              className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border min-h-[38px] ${
                userRole === 'admin'
                  ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300 ring-2 ring-amber-400/40'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
              title="Open Moderator Studio (Customize colors, roster, portals & settings)"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-700" />
              <span className="hidden md:inline">Moderator Studio</span>
              <span className="md:hidden text-[11px]">Mod</span>
            </button>
          )}

          {/* Highlighted "Modules Completed" button */}
          {onOpenCompleted && (
            <button
              id="open-completed-header-btn"
              type="button"
              onClick={onOpenCompleted}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all active:scale-95 cursor-pointer min-h-[38px]"
              title="View all completed modules grouped by subject"
            >
              <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Completed</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-white text-emerald-800 leading-none">
                {myCompletedCount}
              </span>
            </button>
          )}

          {/* Trash Bin Button */}
          {onOpenTrash && (
            <button
              id="open-trash-btn"
              type="button"
              onClick={onOpenTrash}
              className={`inline-flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer border min-h-[38px] ${
                trashCount > 0
                  ? 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
              title="Trash Bin"
            >
              <Trash2 className={`w-3.5 h-3.5 ${trashCount > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
              {trashCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-600 text-white leading-none">
                  {trashCount}
                </span>
              )}
            </button>
          )}

          {/* Logged in Student Name Badge */}
          {currentStudent && (
            <div
              className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2 sm:px-2.5 py-1 text-xs shadow-2xs min-h-[38px]"
              title={`Logged in as: ${currentStudent}`}
            >
              <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-[10px] shrink-0">
                {currentSurnameUpper.charAt(0)}
              </div>
              <span className="font-bold text-slate-900 max-w-[70px] sm:max-w-[120px] truncate uppercase hidden xs:inline">
                {currentStudent}
              </span>
              {onLogout && (
                <button
                  onClick={onLogout}
                  title="Switch name / Log out"
                  className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Add Module Button */}
          <button
            id="add-module-header-btn"
            onClick={onAddNewModule}
            className="inline-flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-xs active:scale-98 cursor-pointer min-h-[38px]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Add Module</span>
          </button>
        </div>
      </div>
    </header>
  );
};
