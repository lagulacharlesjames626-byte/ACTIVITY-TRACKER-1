import React, { useState, useRef, useEffect } from 'react';
import { Radio, Users, Edit3, ChevronDown, CheckCircle, Eye, Wifi, UserCheck, UserX, Shield } from 'lucide-react';
import { ActiveUser, ModuleItem } from '../types';
import { getSubjectTheme } from '../utils/subjectThemes';
import { ADMIN_SURNAMES } from '../utils/rosterData';

interface OnlineUsersDropdownProps {
  activeUsers: ActiveUser[];
  currentStudent?: string;
  modules: ModuleItem[];
  isLiveConnected?: boolean;
  roster?: string[];
}

export const OnlineUsersDropdown: React.FC<OnlineUsersDropdownProps> = ({
  activeUsers,
  currentStudent,
  modules,
  isLiveConnected = true,
  roster = [],
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentSurnameUpper = currentStudent ? currentStudent.trim().toUpperCase() : '';

  // Close dropdown on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Combine server activeUsers with currentStudent if not present
  const allUsers = React.useMemo(() => {
    const list = [...activeUsers];
    if (currentSurnameUpper && !list.some((u) => u.name.toUpperCase() === currentSurnameUpper)) {
      list.unshift({
        id: 'me',
        name: currentSurnameUpper,
        editingModuleId: null,
        lastSeen: Date.now(),
      });
    }
    return list;
  }, [activeUsers, currentSurnameUpper]);

  // Split into editors and viewers
  const editors = allUsers.filter((u) => !!u.editingModuleId);
  const viewers = allUsers.filter((u) => !u.editingModuleId);
  const totalOnline = Math.max(1, allUsers.length);

  // Roster offline members
  const offlineRoster = React.useMemo(() => {
    const onlineNames = allUsers.map((u) => u.name.toUpperCase());
    return roster.filter((r) => {
      const upper = r.toUpperCase();
      // Check if online either as exact match or surname match
      return !onlineNames.some((o) => o === upper || upper.includes(o) || o.includes(upper));
    });
  }, [roster, allUsers]);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Interactive Trigger Button */}
      <button
        id="online-users-dropdown-btn"
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-xs active:scale-98 ${
          isOpen
            ? 'bg-slate-900 text-white border-slate-900 ring-2 ring-slate-400/40'
            : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300'
        }`}
        title="View live active classmates online"
      >
        <span className="relative flex h-2.5 w-2.5">
          {isLiveConnected ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </>
          ) : (
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-400"></span>
          )}
        </span>

        <span className="font-bold">
          {totalOnline} Online
        </span>

        {/* Amber badge if anyone is editing */}
        {editors.length > 0 && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-black bg-amber-200 text-amber-900 border border-amber-300 animate-pulse">
            <Edit3 className="w-2.5 h-2.5" />
            <span>{editors.length} editing</span>
          </span>
        )}

        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-white' : 'text-slate-400'
          }`}
        />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          id="online-users-dropdown-menu"
          className="absolute left-0 sm:left-auto sm:right-0 mt-1.5 w-80 sm:w-88 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {/* Header */}
          <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between gap-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <div>
                <h4 className="text-xs font-black tracking-wide uppercase">
                  Classmates Online ({totalOnline})
                </h4>
                <p className="text-[11px] text-slate-300">
                  Real-time BSBA-HRM 1-A Presence
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>Live Monitor</span>
            </div>
          </div>

          <div className="max-h-88 overflow-y-auto p-3 space-y-3">
            {/* Section 1: People Currently Editing */}
            {editors.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                  <span className="flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                    <span>Actively Editing ({editors.length})</span>
                  </span>
                  <span className="text-[10px] font-black text-amber-600 bg-white px-1.5 py-0.2 rounded border border-amber-300">
                    Live
                  </span>
                </div>

                <div className="space-y-1.5">
                  {editors.map((user) => {
                    const mod = modules.find((m) => m.id === user.editingModuleId);
                    const isMe = currentSurnameUpper && user.name.toUpperCase() === currentSurnameUpper;
                    const theme = mod ? getSubjectTheme(mod.subject) : null;

                    return (
                      <div
                        key={user.id}
                        className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs"
                      >
                        <div className="flex items-center justify-between gap-1.5 mb-1">
                          <span className="font-black text-slate-900 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                            {user.name.toUpperCase()}
                            {ADMIN_SURNAMES.includes(user.name.toUpperCase()) && (
                              <span className="text-[9px] font-black text-amber-800 bg-amber-200/80 px-1.5 py-0.2 rounded border border-amber-300">
                                ADMIN
                              </span>
                            )}
                            {isMe && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                                You
                              </span>
                            )}
                          </span>
                          <span className="text-[10px] font-bold text-amber-700 uppercase">
                            Editing
                          </span>
                        </div>

                        {mod ? (
                          <div className="text-[11px] text-slate-700 flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-900">
                              Mod {mod.moduleNumber}:
                            </span>
                            <span className="truncate max-w-[170px]">{mod.activity}</span>
                            {theme && (
                              <span
                                className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${theme.badgeBg} ${theme.badgeText} border ${theme.badgeBorder}`}
                              >
                                {theme.code}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-500">
                            Updating module details...
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Section 2: People Online & Active */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-600 px-1 mb-1">
                <span className="flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Online Now ({viewers.length})</span>
                </span>
                <span className="text-[10px] text-emerald-600 font-bold">🟢 Active</span>
              </div>

              {viewers.map((user) => {
                const isMe = currentSurnameUpper && user.name.toUpperCase() === currentSurnameUpper;

                return (
                  <div
                    key={user.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl text-xs transition-colors ${
                      isMe
                        ? 'bg-emerald-50 border border-emerald-300'
                        : 'bg-slate-50 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="relative flex h-2.5 w-2.5 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                      <span className="font-bold text-slate-900 truncate uppercase">
                        {user.name}
                      </span>
                      {ADMIN_SURNAMES.includes(user.name.toUpperCase()) && (
                        <span className="text-[9px] font-black text-amber-800 bg-amber-100 border border-amber-300 px-1 py-0.2 rounded">
                          ADMIN
                        </span>
                      )}
                      {isMe && (
                        <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded">
                          You
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] font-medium text-emerald-700 shrink-0">
                      Online
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Section 3: Offline Classmates from Roster */}
            {offlineRoster.length > 0 && (
              <div className="pt-2 border-t border-slate-100 space-y-1">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                  <span>Offline Classmates ({offlineRoster.length})</span>
                  <span>⚪ Offline</span>
                </div>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {offlineRoster.map((name, idx) => {
                    const isOffAdmin = ADMIN_SURNAMES.includes(name.toUpperCase());
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-1.5 rounded-lg text-xs text-slate-500 hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0"></span>
                          <span className="truncate uppercase font-medium">{name}</span>
                          {isOffAdmin && (
                            <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                              Admin
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">Offline</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
            <span className="flex items-center gap-1 text-slate-500">
              <Wifi className="w-3 h-3 text-emerald-600" />
              <span>Real-time presence active</span>
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[11px] font-bold text-slate-700 hover:text-slate-900 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
