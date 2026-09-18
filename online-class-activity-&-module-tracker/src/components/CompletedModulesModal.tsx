import React, { useState, useMemo } from 'react';
import {
  X,
  CheckCircle2,
  BookOpen,
  Search,
  ExternalLink,
  Copy,
  Check,
  Calendar,
  Clock,
  RotateCcw,
  GraduationCap,
  Globe,
  HardDrive,
  FolderOpen,
  ChevronDown,
  ChevronUp,
  FileText,
  Users,
  Trophy,
} from 'lucide-react';
import { ModuleItem, OutputLocation } from '../types';
import { formatDeadline } from '../utils/dateUtils';
import { getSubjectTheme } from '../utils/subjectThemes';

interface CompletedModulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  modules: ModuleItem[];
  currentStudent: string;
  onToggleStudentFinish: (moduleId: string) => void;
  onDuplicate?: (module: ModuleItem) => void;
}

export const CompletedModulesModal: React.FC<CompletedModulesModalProps> = ({
  isOpen,
  onClose,
  modules,
  currentStudent,
  onToggleStudentFinish,
  onDuplicate,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [expandedNotesId, setExpandedNotesId] = useState<string | null>(null);

  const currentSurnameUpper = currentStudent ? currentStudent.trim().toUpperCase() : '';

  // Filter modules that this student has completed
  const completedModules = useMemo(() => {
    if (!currentSurnameUpper) return [];
    return modules.filter((m) => {
      const list = Array.isArray(m.completedBy) ? m.completedBy : [];
      return list.includes(currentSurnameUpper);
    });
  }, [modules, currentSurnameUpper]);

  // Aggregate subjects with completed counts
  const subjectStats = useMemo(() => {
    const map: Record<string, number> = {};
    completedModules.forEach((m) => {
      const subj = m.subject || 'General';
      map[subj] = (map[subj] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({ name, count }));
  }, [completedModules]);

  // Filtered list based on selected subject and search query
  const displayedModules = useMemo(() => {
    return completedModules.filter((m) => {
      const matchSubject = selectedSubject === 'all' || m.subject === selectedSubject;
      const matchSearch =
        !searchQuery.trim() ||
        m.activity.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(m.moduleNumber).includes(searchQuery) ||
        (m.notes && m.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchSubject && matchSearch;
    });
  }, [completedModules, selectedSubject, searchQuery]);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const formatCompletionTime = (isoString?: string) => {
    if (!isoString) return 'Completed';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return 'Completed';
    }
  };

  return (
    <div
      id="completed-modules-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="completed-modules-modal"
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-600 via-emerald-700 to-indigo-700 text-white flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-200" />
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight">
                Modules Completed
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-400 text-slate-950 shadow-xs">
                {completedModules.length} Done
              </span>
            </div>
            <p className="text-xs text-emerald-100 mt-1 max-w-xl">
              All activities finished by <strong className="text-white underline">{currentSurnameUpper || 'You'}</strong>.
              Completed modules automatically disappear from the main board after 1 hour to keep your workspace clear.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search and Subject Locator Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search completed activities or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
            />
          </div>

          {/* Subject Filter Grid / Locator (User Request: "if i click one subject i will locate all of the modules that i already completed") */}
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>Select Subject to Locate Completed Modules:</span>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              <button
                type="button"
                onClick={() => setSelectedSubject('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedSubject === 'all'
                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300'
                    : 'bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200'
                }`}
              >
                All Subjects ({completedModules.length})
              </button>

              {subjectStats.map(({ name, count }) => {
                const isSelected = selectedSubject === name;
                const theme = getSubjectTheme(name);
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setSelectedSubject(name)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? `${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder} border shadow-xs ring-2 ring-indigo-400`
                        : 'bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${theme.dotColor}`}></span>
                    <span>{name}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                        isSelected ? 'bg-white/80 text-slate-900' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content Area: Completed Modules List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {displayedModules.length > 0 ? (
            displayedModules.map((module) => {
              const finishedTimeIso = module.completedAt?.[currentSurnameUpper];
              const isNotesExpanded = expandedNotesId === module.id;
              const notesText = (module.notes || '').trim();
              const isNotesLong = notesText.length > 120 || notesText.split('\n').length > 2;

              // Locations
              const locations: OutputLocation[] =
                module.locations && module.locations.length > 0
                  ? module.locations
                  : (module as any).location
                  ? [(module as any).location]
                  : ['Gclass'];

              const links = module.links || {};
              const legacyLink = (module as any).link;

              const getLocationUrl = (loc: OutputLocation): string | undefined => {
                if (loc === 'Gclass') return links.gclass || (locations.length === 1 ? legacyLink : undefined);
                if (loc === 'Emabini') return links.emabini || (locations.length === 1 ? legacyLink : undefined);
                if (loc === 'Gdrive') return links.gdrive || (locations.length === 1 ? legacyLink : undefined);
                if (loc === 'Other') return links.other || (locations.length === 1 ? legacyLink : undefined);
                return undefined;
              };

              return (
                <div
                  key={module.id}
                  className="bg-white rounded-xl border border-slate-200 hover:border-emerald-300 p-3.5 sm:p-4 shadow-xs transition-all"
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="px-2 py-0.5 rounded text-xs font-black uppercase bg-emerald-100 text-emerald-900 border border-emerald-300">
                          Module {module.moduleNumber}
                        </span>
                        {(() => {
                          const theme = getSubjectTheme(module.subject);
                          return (
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-bold border ${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${theme.dotColor}`}></span>
                              <span>{module.subject}</span>
                            </span>
                          );
                        })()}
                        <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3 text-emerald-600" />
                          <span>Finished {formatCompletionTime(finishedTimeIso)}</span>
                        </span>
                      </div>

                      <h4 className="text-sm sm:text-base font-bold text-slate-900">
                        {module.activity}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                      {onDuplicate && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onDuplicate(module);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 hover:border-indigo-300 transition-colors cursor-pointer active:scale-95 shadow-2xs"
                          title="Copy this completed module to easily create and edit the next module"
                        >
                          <Copy className="w-3 h-3 text-indigo-600" />
                          <span>Copy to Next</span>
                        </button>
                      )}

                      {/* Action to Move back to Main Board (Uncheck) */}
                      <button
                        type="button"
                        onClick={() => onToggleStudentFinish(module.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 hover:text-rose-700 bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer"
                        title="Uncheck and move back to main board"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Move back to Main Board</span>
                      </button>
                    </div>
                  </div>

                  {/* Submission Portal Links */}
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {locations.map((loc) => {
                      const url = getLocationUrl(loc);
                      const isCopied = copiedKey === `${module.id}-${loc}`;

                      const label =
                        loc === 'Gclass'
                          ? 'Google Classroom'
                          : loc === 'Emabini'
                          ? 'E-mabini Portal'
                          : loc === 'Gdrive'
                          ? 'Google Drive'
                          : module.customLocation || 'Class Portal';

                      const colorClasses =
                        loc === 'Gclass'
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : loc === 'Emabini'
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          : loc === 'Gdrive'
                          ? 'bg-amber-600 hover:bg-amber-700 text-white'
                          : 'bg-purple-600 hover:bg-purple-700 text-white';

                      return (
                        <div
                          key={loc}
                          className="inline-flex items-center rounded-lg shadow-2xs overflow-hidden text-xs"
                        >
                          {url ? (
                            <>
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`inline-flex items-center gap-1 px-2.5 py-1 font-bold ${colorClasses}`}
                              >
                                <span>{label}</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                              <button
                                type="button"
                                onClick={(e) => handleCopy(url, `${module.id}-${loc}`, e)}
                                className={`px-2 py-1 border-l border-white/25 cursor-pointer ${colorClasses}`}
                                title="Copy portal link"
                              >
                                {isCopied ? (
                                  <Check className="w-3 h-3 text-white" />
                                ) : (
                                  <Copy className="w-3 h-3 text-white/80" />
                                )}
                              </button>
                            </>
                          ) : (
                            <span className="px-2 py-1 text-slate-400 bg-slate-100 border border-slate-200 text-[11px]">
                              {label}: No link
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Instructions / Notes */}
                  {notesText && (
                    <div className="mt-2.5 p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <FileText className="w-3 h-3 text-indigo-500" />
                          <span>Notes</span>
                        </span>
                        {isNotesLong && (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedNotesId(isNotesExpanded ? null : module.id)
                            }
                            className="text-[11px] font-bold text-indigo-600 hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                          >
                            <span>{isNotesExpanded ? 'See less' : 'See more'}</span>
                            {isNotesExpanded ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>

                      <div className="text-slate-700 leading-relaxed break-words whitespace-pre-line">
                        {isNotesLong && !isNotesExpanded
                          ? `${notesText.slice(0, 110).trim()}...`
                          : notesText}
                      </div>
                    </div>
                  )}

                  {/* Who finished info */}
                  {module.completedBy && module.completedBy.length > 0 && (
                    <div className="mt-2 text-[10px] text-slate-500 flex items-center gap-1.5">
                      <Users className="w-3 h-3 text-indigo-500 shrink-0" />
                      <span>
                        Total finishers: <strong>{module.completedBy.length}</strong> (
                        {module.completedBy.slice(0, 5).join(', ')}
                        {module.completedBy.length > 5 ? ` +${module.completedBy.length - 5} more` : ''})
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 text-slate-500">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">
                {selectedSubject === 'all'
                  ? 'No completed modules found'
                  : `No completed modules in "${selectedSubject}"`}
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {completedModules.length === 0
                  ? 'Check off modules on the main board when you finish them. They will be archived here.'
                  : 'Try selecting "All Subjects" or clearing your search query.'}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing <strong>{displayedModules.length}</strong> of{' '}
            <strong>{completedModules.length}</strong> completed activities
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
