import React, { useState } from 'react';
import {
  Trash2,
  RotateCcw,
  Clock,
  AlertCircle,
  X,
  User,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { DeletedModuleItem } from '../types';
import { formatRelativeTime } from '../utils/dateUtils';

interface TrashBinModalProps {
  isOpen: boolean;
  onClose: () => void;
  deletedModules: DeletedModuleItem[];
  onRestore: (moduleId: string) => void;
  onPermanentDelete: (moduleId: string) => void;
  onEmptyTrash: () => void;
}

export const TrashBinModal: React.FC<TrashBinModalProps> = ({
  isOpen,
  onClose,
  deletedModules,
  onRestore,
  onPermanentDelete,
  onEmptyTrash,
}) => {
  const [confirmEmpty, setConfirmEmpty] = useState(false);

  if (!isOpen) return null;

  const getRemainingDaysText = (expiresAt: string) => {
    const now = Date.now();
    const exp = new Date(expiresAt).getTime();
    const diffMs = exp - now;

    if (isNaN(exp) || diffMs <= 0) {
      return { text: 'Purging soon', isUrgent: true };
    }

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days >= 2) {
      return { text: `Auto-deletes in ${days} days`, isUrgent: false };
    } else if (days === 1) {
      return { text: `Auto-deletes in 1 day, ${hours}h`, isUrgent: true };
    } else {
      return { text: `Auto-deletes in ${Math.max(1, hours)}h`, isUrgent: true };
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between gap-3 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200 shadow-2xs">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Trash Bin
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-rose-600 text-white">
                  {deletedModules.length}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                Visible to all members • Automatically &amp; permanently deleted after 30 days
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {deletedModules.length > 0 && (
              <>
                {confirmEmpty ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        onEmptyTrash();
                        setConfirmEmpty(false);
                      }}
                      className="px-2.5 py-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer"
                    >
                      Confirm Empty
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmEmpty(false)}
                      className="px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmEmpty(true)}
                    className="px-2.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                    title="Permanently remove all deleted modules"
                  >
                    Empty Trash
                  </button>
                )}
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 30-Day Policy Notice */}
        <div className="bg-amber-50 px-4 py-2 border-b border-amber-200 text-amber-900 text-xs flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          <span>
            <strong>30-Day Auto-Purge Policy:</strong> Any module deleted by any student is safely stored here for 30 days. All classmates can see what was deleted and restore it anytime.
          </span>
        </div>

        {/* List of Deleted Items */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3">
          {deletedModules.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <Trash2 className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                Trash Bin is empty
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No deleted modules found. If someone deletes a module, it will appear here for 30 days so any member can view or restore it.
              </p>
            </div>
          ) : (
            deletedModules.map((item) => {
              const countdown = getRemainingDaysText(item.expiresAt);
              return (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-3 sm:p-4 transition-all shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    {/* Badges line */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-slate-800 text-white uppercase">
                        Module {item.moduleNumber}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-indigo-600 text-white uppercase">
                        {item.subject}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                          countdown.isUrgent
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        <Clock className="w-2.5 h-2.5" />
                        <span>{countdown.text}</span>
                      </span>
                    </div>

                    {/* Activity name */}
                    <h4 className="text-sm font-bold text-slate-900 mt-1.5 tracking-tight">
                      {item.activity}
                    </h4>

                    {/* Deletion details: who deleted and when */}
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                        <User className="w-3 h-3 text-rose-500" />
                        <span>
                          Deleted by <strong className="text-rose-700 uppercase font-black">{item.deletedBy || 'A Classmate'}</strong>
                        </span>
                      </span>
                      <span className="text-slate-300">•</span>
                      <span>
                        {formatRelativeTime(item.deletedAt)} ({new Date(item.deletedAt).toLocaleDateString()})
                      </span>
                      {item.notes && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="italic text-slate-400 line-clamp-1 max-w-xs">
                            "{item.notes}"
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions: Restore & Permanent Delete */}
                  <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      id={`restore-module-${item.id}`}
                      onClick={() => onRestore(item.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-2xs transition-colors cursor-pointer"
                      title="Restore back to tracker for all members"
                    >
                      <RotateCcw className="w-3 h-3 stroke-[2.5]" />
                      <span>Restore</span>
                    </button>

                    <button
                      type="button"
                      id={`perm-delete-module-${item.id}`}
                      onClick={() => onPermanentDelete(item.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                      title="Delete permanently right now"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete Forever</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Real-time sync keeps the Trash Bin synchronized for everyone.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
