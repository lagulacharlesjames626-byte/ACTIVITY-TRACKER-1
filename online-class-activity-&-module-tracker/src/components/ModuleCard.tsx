import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  ExternalLink,
  Edit2,
  Trash2,
  Copy,
  Check,
  CheckSquare,
  Square,
  Users,
  FileText,
  Globe,
  GraduationCap,
  HardDrive,
  FolderOpen,
  ChevronDown,
  ChevronUp,
  Layers,
  UserCheck,
} from 'lucide-react';
import { ModuleItem, OutputLocation, SubModuleItem } from '../types';
import { formatDeadline, getDeadlineInfo, formatRelativeTime } from '../utils/dateUtils';
import { getSubjectTheme } from '../utils/subjectThemes';

interface ModuleCardProps {
  module: ModuleItem;
  currentStudent?: string;
  editingBy?: string;
  isAdminMode?: boolean;
  onEdit: (module: ModuleItem) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: ModuleItem['status']) => void;
  onToggleStudentFinish: (moduleId: string) => void;
  onToggleSubModuleFinish?: (moduleId: string, subModuleId: string) => void;
  onDuplicate?: (module: ModuleItem) => void;
}

const getOrdinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

export const ModuleCard: React.FC<ModuleCardProps> = ({
  module,
  currentStudent,
  editingBy,
  onEdit,
  onDelete,
  onToggleStudentFinish,
  onToggleSubModuleFinish,
  onDuplicate,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isNotesExpanded, setIsNotesExpanded] = useState(false);
  const [expandedSubModules, setExpandedSubModules] = useState<Record<string, boolean>>({});

  const notesText = (module.notes || '').trim();
  const isNotesLong = notesText.length > 120 || notesText.split('\n').length > 2;

  const isSubmitted = module.status === 'submitted';
  const deadlineInfo = getDeadlineInfo(module.deadline, isSubmitted);

  // Student surname and completion check state
  const completedByList: string[] = Array.isArray(module.completedBy) ? module.completedBy : [];
  const currentSurnameUpper = currentStudent ? currentStudent.trim().toUpperCase() : '';
  const isFinishedByMe = currentSurnameUpper ? completedByList.includes(currentSurnameUpper) : false;

  // 1-hour auto-disappearance tracking
  const finishedTimeIso = currentSurnameUpper && module.completedAt ? module.completedAt[currentSurnameUpper] : undefined;
  const finishedTime = finishedTimeIso ? new Date(finishedTimeIso).getTime() : 0;
  const ONE_HOUR = 60 * 60 * 1000;
  const elapsedMs = finishedTime ? Date.now() - finishedTime : 0;
  const minutesLeftToArchive = finishedTime ? Math.max(1, Math.ceil((ONE_HOUR - elapsedMs) / 60000)) : 60;

  // Locations & links helper
  const locations: OutputLocation[] =
    module.locations && module.locations.length > 0
      ? module.locations
      : (module as any).location
      ? [(module as any).location]
      : ['Gclass'];

  const links = module.links || {};
  const legacyLink = (module as any).link;

  const getLocationLink = (loc: OutputLocation): string | undefined => {
    if (loc === 'Gclass') return links.gclass || (locations.length === 1 ? legacyLink : undefined);
    if (loc === 'Emabini') return links.emabini || (locations.length === 1 ? legacyLink : undefined);
    if (loc === 'Gdrive') return links.gdrive || (locations.length === 1 ? legacyLink : undefined);
    if (loc === 'Other') return links.other || (locations.length === 1 ? legacyLink : undefined);
    return undefined;
  };

  const handleCopyLink = (url: string, key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getHighlightPortalMeta = (loc: OutputLocation) => {
    switch (loc) {
      case 'Gclass':
        return {
          shortName: 'GClass',
          displayName: 'Google Classroom',
          icon: GraduationCap,
          activeBadge: 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 shadow-xs ring-1 ring-emerald-400/40',
          copyHover: 'hover:bg-emerald-800 text-emerald-100',
        };
      case 'Emabini':
        return {
          shortName: 'E-mabini',
          displayName: 'E-mabini Portal',
          icon: Globe,
          activeBadge: 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-500 shadow-xs ring-1 ring-indigo-400/40',
          copyHover: 'hover:bg-indigo-800 text-indigo-100',
        };
      case 'Gdrive':
        return {
          shortName: 'GDrive',
          displayName: 'Google Drive',
          icon: HardDrive,
          activeBadge: 'bg-amber-600 hover:bg-amber-700 text-white border-amber-500 shadow-xs ring-1 ring-amber-400/40',
          copyHover: 'hover:bg-amber-800 text-amber-100',
        };
      case 'Other':
      default:
        return {
          shortName: module.customLocation || 'Portal',
          displayName: module.customLocation || 'Custom Portal',
          icon: FolderOpen,
          activeBadge: 'bg-purple-600 hover:bg-purple-700 text-white border-purple-500 shadow-xs ring-1 ring-purple-400/40',
          copyHover: 'hover:bg-purple-800 text-purple-100',
        };
    }
  };

  const subjectTheme = getSubjectTheme(module.subject);
  const hasSubModules = Array.isArray(module.subModules) && module.subModules.length > 0;

  // Sub-modules progress for current student
  const completedSubModulesCount = hasSubModules && currentSurnameUpper
    ? module.subModules!.filter((s) => (s.completedBy || []).map((n) => n.toUpperCase()).includes(currentSurnameUpper)).length
    : 0;

  return (
    <div
      id={`module-card-${module.id}`}
      className={`rounded-2xl border-2 transition-all duration-150 shadow-xs hover:shadow-md ${subjectTheme.cardBg} ${
        editingBy
          ? 'ring-3 ring-amber-400 border-amber-400'
          : isFinishedByMe
          ? 'border-emerald-500 ring-2 ring-emerald-300'
          : deadlineInfo.isOverdue
          ? 'border-rose-400'
          : deadlineInfo.isDueSoon
          ? 'border-amber-400'
          : subjectTheme.cardBorder
      }`}
    >
      <div className="p-3.5 sm:p-5 flex flex-col justify-between h-full">
        <div>
          {/* Live Editing Alert Banner */}
          {editingBy && (
            <div className="mb-3 px-3 py-1.5 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold flex items-center justify-between gap-2 animate-pulse">
              <div className="flex items-center gap-2">
                <Edit2 className="w-3.5 h-3.5 text-amber-700" />
                <span><strong>{editingBy}</strong> is editing this module right now...</span>
              </div>
              <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-amber-200 text-amber-800">
                Live Editing
              </span>
            </div>
          )}

          {/* TOP HEADER: BADGES & EDIT/DELETE BUTTONS */}
          <div className="flex items-start justify-between gap-2.5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-black bg-slate-900 text-white tracking-wider uppercase shadow-xs">
                  {hasSubModules ? `Bundle Mod ${module.moduleNumber}` : `Module ${module.moduleNumber}`}
                </span>

                {/* Subject with visible color coding */}
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-black uppercase tracking-wide border shadow-2xs ${subjectTheme.badgeBg} ${subjectTheme.badgeText} ${subjectTheme.badgeBorder}`}
                  title={subjectTheme.fullName}
                >
                  <span className={`w-2 h-2 rounded-full ${subjectTheme.dotColor}`}></span>
                  <span className="truncate max-w-[190px] sm:max-w-none">{module.subject}</span>
                </span>

                {/* Deadline Badge */}
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold border ${deadlineInfo.badgeColor}`}
                >
                  <Clock className="w-2.5 h-2.5 mr-1" />
                  {deadlineInfo.statusText}
                </span>

                {/* Multi-Module Bundle Indicator */}
                {hasSubModules && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-900 border border-indigo-300">
                    <Layers className="w-3 h-3 text-indigo-600" />
                    <span>{module.subModules!.length} Sub-Modules Inside (1 PDF)</span>
                  </span>
                )}
              </div>

              {/* Activity Name */}
              <h3 className="mt-2 text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug">
                {module.activity}
              </h3>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-1 shrink-0">
              {onDuplicate && (
                <button
                  id={`copy-module-${module.id}`}
                  type="button"
                  onClick={() => onDuplicate(module)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-indigo-700 bg-white hover:bg-indigo-50 rounded-lg border border-indigo-200 transition-colors shadow-2xs cursor-pointer active:scale-95"
                  title="Copy module to duplicate"
                >
                  <Copy className="w-3 h-3 text-indigo-600" />
                  <span className="hidden sm:inline">Copy</span>
                </button>
              )}

              <button
                id={`edit-module-${module.id}`}
                type="button"
                onClick={() => onEdit(module)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors shadow-2xs cursor-pointer"
                title="Edit module"
              >
                <Edit2 className="w-3 h-3" />
                <span className="hidden sm:inline">Edit</span>
              </button>

              <button
                id={`delete-module-${module.id}`}
                type="button"
                onClick={() => onDelete(module.id)}
                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                title="Move to Trash Bin"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* SHARED DEADLINE & MAIN PORTAL BAR */}
          <div className="mt-3 p-2.5 rounded-xl bg-white/90 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
            <div className="flex items-center gap-2 text-slate-700 shrink-0">
              <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shadow-2xs">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block leading-none">
                  Due Date (All Sub-Modules)
                </span>
                <span className="font-black text-slate-900 text-xs sm:text-sm leading-tight">
                  {formatDeadline(module.deadline)}
                </span>
              </div>
            </div>

            {/* Main Portal Links */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {locations.map((loc) => {
                const meta = getHighlightPortalMeta(loc);
                const Icon = meta.icon;
                const linkUrl = getLocationLink(loc);
                const isCopied = copiedKey === `${module.id}-${loc}`;

                return (
                  <div
                    key={loc}
                    className="inline-flex items-center rounded-lg shadow-xs overflow-hidden transition-all active:scale-98"
                  >
                    {linkUrl ? (
                      <div className={`inline-flex items-center border ${meta.activeBadge}`}>
                        <a
                          href={linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold transition-opacity hover:opacity-95"
                          title={`Open ${meta.displayName}`}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span>Open {meta.shortName}</span>
                          <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
                        </a>

                        <button
                          type="button"
                          onClick={(e) => handleCopyLink(linkUrl, `${module.id}-${loc}`, e)}
                          className={`px-2 py-1 border-l border-white/25 transition-colors cursor-pointer ${meta.copyHover}`}
                          title="Copy URL"
                        >
                          {isCopied ? (
                            <Check className="w-3 h-3 text-white" />
                          ) : (
                            <Copy className="w-3 h-3 text-white/80" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-slate-400 bg-white border border-dashed border-slate-300">
                        <Icon className="w-3 h-3 text-slate-400" />
                        <span>{meta.shortName}: No link</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* MAIN NOTES / INSTRUCTIONS (IF ANY) */}
          {notesText && (
            <div className="mt-3 p-3 rounded-xl bg-white/80 border border-slate-200/80 text-xs shadow-2xs">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>General Instructions / PDF Notes</span>
                </div>
                {isNotesLong && (
                  <button
                    type="button"
                    onClick={() => setIsNotesExpanded(!isNotesExpanded)}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>{isNotesExpanded ? 'See less' : 'See more'}</span>
                    {isNotesExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                )}
              </div>

              <div className="text-slate-800 leading-relaxed break-words whitespace-pre-line">
                {isNotesLong && !isNotesExpanded ? (
                  <span>
                    {notesText.slice(0, 120).trim()}...{' '}
                    <button
                      type="button"
                      onClick={() => setIsNotesExpanded(true)}
                      className="font-bold text-indigo-600 hover:underline inline-flex items-center gap-0.5 ml-1"
                    >
                      See more
                    </button>
                  </span>
                ) : (
                  notesText
                )}
              </div>
            </div>
          )}

          {/* SUB-MODULES LIST (IF THIS IS A MULTI-MODULE BUNDLE) */}
          {hasSubModules && (
            <div className="mt-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5 uppercase text-[10px] font-black tracking-wider text-slate-500">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Sub-Modules in this PDF ({module.subModules!.length})</span>
                </span>
                {currentSurnameUpper && (
                  <span className="text-[11px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300 font-bold">
                    {completedSubModulesCount}/{module.subModules!.length} Done by You
                  </span>
                )}
              </div>

              {module.subModules!.map((sub, sIdx) => {
                const subCompletedList = sub.completedBy || [];
                const isSubFinishedByMe = currentSurnameUpper
                  ? subCompletedList.some((s) => s.toUpperCase() === currentSurnameUpper)
                  : false;
                const isExpanded = expandedSubModules[sub.id];

                return (
                  <div
                    key={sub.id || sIdx}
                    className={`p-3 rounded-xl border transition-all ${
                      isSubFinishedByMe
                        ? 'bg-emerald-50/90 border-emerald-300 shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-indigo-50 text-indigo-800 border border-indigo-200">
                            Sub-Mod {sub.subNumber || sIdx + 1}
                          </span>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                            {sub.title}
                          </h4>
                        </div>

                        {/* Sub-module Instructions */}
                        {sub.instructions && (
                          <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                            {sub.instructions}
                          </p>
                        )}

                        {/* Sub-module portal links if different */}
                        {sub.links && (sub.links.gclass || sub.links.gdrive || sub.links.emabini) && (
                          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                            {sub.links.gclass && (
                              <a
                                href={sub.links.gclass}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white hover:bg-emerald-700"
                              >
                                <GraduationCap className="w-3 h-3" />
                                <span>GClass Link</span>
                              </a>
                            )}
                            {sub.links.emabini && (
                              <a
                                href={sub.links.emabini}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-600 text-white hover:bg-indigo-700"
                              >
                                <Globe className="w-3 h-3" />
                                <span>E-mabini Link</span>
                              </a>
                            )}
                            {sub.links.gdrive && (
                              <a
                                href={sub.links.gdrive}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-600 text-white hover:bg-amber-700"
                              >
                                <HardDrive className="w-3 h-3" />
                                <span>GDrive Link</span>
                              </a>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Sub-Module "Check if Finished" button placed at the right */}
                      {onToggleSubModuleFinish && (
                        <button
                          type="button"
                          onClick={() => onToggleSubModuleFinish(module.id, sub.id)}
                          className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold uppercase transition-all shadow-2xs cursor-pointer ${
                            isSubFinishedByMe
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700 ring-1 ring-emerald-300'
                              : 'bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-400'
                          }`}
                        >
                          {isSubFinishedByMe ? (
                            <>
                              <CheckSquare className="w-3.5 h-3.5 text-white" />
                              <span>Done</span>
                            </>
                          ) : (
                            <>
                              <Square className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Check Finished</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Sub-Module Who finished line */}
                    {subCompletedList.length > 0 && (
                      <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center gap-1 flex-wrap text-[10px] text-slate-500">
                        <span className="font-bold">Finished ({subCompletedList.length}):</span>
                        {subCompletedList.map((sn, idx) => (
                          <span
                            key={idx}
                            className={`px-1.5 py-0.5 rounded font-bold uppercase border ${
                              sn.toUpperCase() === currentSurnameUpper
                                ? 'bg-emerald-600 text-white border-emerald-700'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {sn}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* "WHO FINISHED" LIST FOR THE MAIN MODULE */}
          <div className="mt-3.5 pt-2.5 border-t border-slate-200/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Who finished ({completedByList.length})</span>
                </span>
                <span className="text-[9px] text-slate-400 font-normal">
                  • In submission order:
                </span>
              </div>

              {completedByList.length > 0 ? (
                <div className="flex flex-wrap items-center gap-1">
                  {completedByList.map((surname, idx) => {
                    const upperSurname = surname.toUpperCase();
                    const rank = idx + 1;
                    const isFirst = idx === 0;
                    const isMe = currentSurnameUpper && upperSurname === currentSurnameUpper;
                    const timeRecorded = module.completedAt?.[upperSurname];

                    return (
                      <span
                        key={`${upperSurname}-${idx}`}
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight border transition-all ${
                          isMe
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs ring-1 ring-emerald-400'
                            : isFirst
                            ? 'bg-amber-100 text-amber-950 border-amber-300 font-black'
                            : 'bg-white text-slate-800 border-slate-300 shadow-2xs'
                        }`}
                        title={
                          `${upperSurname} submitted ${getOrdinal(rank)}` +
                          (timeRecorded
                            ? ` (${new Date(timeRecorded).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })})`
                            : '')
                        }
                      >
                        <span
                          className={`text-[8px] px-1 rounded font-black ${
                            isMe
                              ? 'bg-emerald-800 text-emerald-100'
                              : isFirst
                              ? 'bg-amber-300 text-amber-900 font-black'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          #{rank}
                        </span>
                        <span>{upperSurname}</span>
                        {isFirst && (
                          <span className="text-[8px] bg-amber-500 text-white px-0.5 rounded font-bold lowercase">
                            1st
                          </span>
                        )}
                        {isMe && (
                          <span className="text-[8px] bg-emerald-900 text-emerald-100 px-0.5 rounded font-bold">
                            YOU
                          </span>
                        )}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <div className="text-[10px] text-slate-400 italic">
                  None yet. Click check below to be 1st!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: USER MANDATE: "Check if finished" BUTTON AT BOTTOM RIGHT CORNER */}
        <div className="mt-4 pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* USER MANDATE: Small info below the modules: who created separated from who recently edited */}
          <div className="text-[10px] text-slate-500 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Created by:</span>
              <strong className="text-slate-800 uppercase font-bold">
                {module.createdBy || 'BSBA-HRM 1-A'}
              </strong>
              <span className="text-slate-400">• {formatRelativeTime(module.createdAt)}</span>
            </div>

            {module.lastUpdatedBy && (
              <div className="flex items-center gap-1.5 pl-0 sm:pl-2 sm:border-l sm:border-slate-300">
                <span className="text-slate-400 font-medium">Recently edited by:</span>
                <strong className="text-indigo-700 uppercase font-bold">
                  {module.lastUpdatedBy}
                </strong>
                <span className="text-slate-400">
                  • {formatRelativeTime(module.updatedAt || module.createdAt)}
                </span>
              </div>
            )}
          </div>

          {/* USER MANDATE: "Check if Finished" Button STRICTLY AT BOTTOM RIGHT CORNER */}
          <div className="flex items-center justify-end shrink-0">
            <button
              id={`check-finished-btn-${module.id}`}
              type="button"
              onClick={() => onToggleStudentFinish(module.id)}
              className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all shadow-md cursor-pointer active:scale-95 ${
                isFinishedByMe
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-emerald-700 ring-2 ring-emerald-300'
                  : 'bg-white hover:bg-emerald-50 text-emerald-800 border-2 border-emerald-500 hover:border-emerald-600'
              }`}
              title={
                isFinishedByMe
                  ? `Click to uncheck (remove ${currentSurnameUpper} from finished)`
                  : `Click to check: mark ${currentSurnameUpper || 'your surname'} as finished`
              }
            >
              {isFinishedByMe ? (
                <>
                  <CheckSquare className="w-4 h-4 text-white stroke-[2.5]" />
                  <span>✓ Finished by {currentSurnameUpper || 'You'}</span>
                </>
              ) : (
                <>
                  <Square className="w-4 h-4 text-emerald-600 stroke-[2.2]" />
                  <span>Check if Finished</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
