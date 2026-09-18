import React, { useState } from 'react';
import { X, Download, Upload, RotateCcw, Check, FileJson } from 'lucide-react';
import { ModuleItem, PortalLinks } from '../types';
import { INITIAL_MODULES, DEFAULT_PORTAL_LINKS } from '../data/initialData';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  modules: ModuleItem[];
  portalLinks: PortalLinks;
  onImport: (modules: ModuleItem[], portals: PortalLinks) => void;
  onResetToDemo: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  modules,
  portalLinks,
  onImport,
  onResetToDemo,
}) => {
  const [importText, setImportText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleExportJSON = () => {
    const data = JSON.stringify({ modules, portalLinks, exportedAt: new Date().toISOString() }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `class-module-tracker-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyJSON = () => {
    const data = JSON.stringify({ modules, portalLinks }, null, 2);
    navigator.clipboard.writeText(data);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleProcessImport = () => {
    try {
      setError(null);
      const parsed = JSON.parse(importText);
      if (!parsed.modules || !Array.isArray(parsed.modules)) {
        throw new Error('Invalid format: "modules" array is required');
      }
      onImport(parsed.modules, parsed.portalLinks || DEFAULT_PORTAL_LINKS);
      onClose();
    } catch (e: any) {
      setError(e.message || 'Failed to parse JSON');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <FileJson className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">
              Backup, Share & Restore Modules
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {/* Export Section */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Export Checklist Data
            </div>
            <p className="text-xs text-slate-500 mb-2.5">
              Download your module checklist or copy JSON to share with fellow classmates.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportJSON}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download JSON File</span>
              </button>
              <button
                onClick={handleCopyJSON}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <FileJson className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
              </button>
            </div>
          </div>

          {/* Import Section */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Import Module Data
            </div>
            <p className="text-xs text-slate-500 mb-2">
              Paste JSON code shared by another student or from your previous backup:
            </p>
            <textarea
              rows={3}
              placeholder='Paste JSON here (e.g. {"modules": [...]})'
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              className="w-full text-xs font-mono p-2 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
            {error && (
              <span className="text-[11px] text-rose-600 block mt-1">{error}</span>
            )}
            <button
              onClick={handleProcessImport}
              disabled={!importText.trim()}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-white hover:bg-slate-900 disabled:opacity-40"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import Data</span>
            </button>
          </div>

          {/* Reset Section */}
          <div className="pt-2 flex items-center justify-between">
            <button
              onClick={() => {
                if (window.confirm('Reset all modules to original template sample data?')) {
                  onResetToDemo();
                  onClose();
                }
              }}
              className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Sample Data</span>
            </button>
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
