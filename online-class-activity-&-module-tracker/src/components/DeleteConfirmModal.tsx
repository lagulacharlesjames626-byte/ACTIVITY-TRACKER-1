import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { ModuleItem } from '../types';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  module: ModuleItem | null;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  module,
}) => {
  if (!isOpen || !module) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-6">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Move Module to Trash Bin?
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Are you sure you want to remove <strong className="text-slate-900">Module {module.moduleNumber}: {module.activity}</strong> ({module.subject})?
            </p>
            <div className="mt-2.5 p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-900">
              <strong>Trash Bin &amp; 30-Day Auto-Purge:</strong> All classmates will be able to see this deleted module in the Trash Bin and restore it anytime. It will be automatically and permanently deleted after 30 days.
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-200 cursor-pointer"
          >
            Cancel
          </button>
          <button
            id="confirm-delete-btn"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-xs cursor-pointer transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Move to Trash</span>
          </button>
        </div>
      </div>
    </div>
  );
};
