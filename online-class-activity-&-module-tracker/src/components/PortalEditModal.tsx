import React, { useState, useEffect } from 'react';
import { X, Globe, GraduationCap, HardDrive, Check, RotateCcw } from 'lucide-react';
import { PortalLinks } from '../types';
import { DEFAULT_PORTAL_LINKS } from '../data/initialData';

interface PortalEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  portalLinks: PortalLinks;
  onSave: (links: PortalLinks) => void;
}

export const PortalEditModal: React.FC<PortalEditModalProps> = ({
  isOpen,
  onClose,
  portalLinks,
  onSave,
}) => {
  const [gclass, setGclass] = useState(portalLinks.gclass);
  const [emabini, setEmabini] = useState(portalLinks.emabini);
  const [gdrive, setGdrive] = useState(portalLinks.gdrive);

  useEffect(() => {
    setGclass(portalLinks.gclass);
    setEmabini(portalLinks.emabini);
    setGdrive(portalLinks.gdrive);
  }, [portalLinks, isOpen]);

  const handleResetDefaults = () => {
    setGclass(DEFAULT_PORTAL_LINKS.gclass);
    setEmabini(DEFAULT_PORTAL_LINKS.emabini);
    setGdrive(DEFAULT_PORTAL_LINKS.gdrive);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      gclass: gclass.trim() || DEFAULT_PORTAL_LINKS.gclass,
      emabini: emabini.trim() || DEFAULT_PORTAL_LINKS.emabini,
      gdrive: gdrive.trim() || DEFAULT_PORTAL_LINKS.gdrive,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Configure School & Class Portal Links
            </h2>
            <p className="text-xs text-slate-500">
              Set your actual Google Classroom and E-mabini LMS URLs
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Google Classroom */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-emerald-600" />
              <span>Google Classroom (GClass) URL</span>
            </label>
            <input
              id="portal-edit-gclass"
              type="url"
              placeholder="https://classroom.google.com/..."
              value={gclass}
              onChange={(e) => setGclass(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Used for quick access and autofill on GClass module submissions
            </p>
          </div>

          {/* E-mabini School Web Portal */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-indigo-600" />
              <span>E-mabini School Web Portal URL</span>
            </label>
            <input
              id="portal-edit-emabini"
              type="url"
              placeholder="https://e-mabini.mabini.edu.ph or your school portal link"
              value={emabini}
              onChange={(e) => setEmabini(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Your school's E-mabini LMS learning portal link
            </p>
          </div>

          {/* Google Drive */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-sky-600" />
              <span>Google Drive Submissions Folder URL</span>
            </label>
            <input
              id="portal-edit-gdrive"
              type="url"
              placeholder="https://drive.google.com/..."
              value={gdrive}
              onChange={(e) => setGdrive(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Folder for project files, raw recordings, or drive submissions
            </p>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Defaults</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="save-portal-links-btn"
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors"
              >
                Save Portal Links
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
