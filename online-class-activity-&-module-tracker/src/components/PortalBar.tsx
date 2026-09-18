import React from 'react';
import { ExternalLink, Settings, Globe, HardDrive, GraduationCap } from 'lucide-react';
import { PortalLinks } from '../types';

interface PortalBarProps {
  portals: PortalLinks;
  isAdminMode: boolean;
  onOpenPortalSettings: () => void;
}

export const PortalBar: React.FC<PortalBarProps> = ({
  portals,
  isAdminMode,
  onOpenPortalSettings,
}) => {
  return (
    <div className="bg-slate-50 border-b border-slate-200 py-2 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 overflow-x-auto py-0.5 scrollbar-none text-xs">
          <span className="text-slate-400 font-medium text-[11px] uppercase tracking-wider mr-0.5">
            Portals:
          </span>

          {/* Google Classroom */}
          <a
            id="quick-link-gclass"
            href={portals.gclass}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-white text-emerald-800 border border-slate-200 hover:border-emerald-300 transition-colors shrink-0"
          >
            <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
            <span>Google Classroom</span>
            <ExternalLink className="w-3 h-3 text-slate-400 ml-0.5" />
          </a>

          {/* E-mabini School Portal */}
          <a
            id="quick-link-emabini"
            href={portals.emabini}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-white text-indigo-800 border border-slate-200 hover:border-indigo-300 transition-colors shrink-0"
          >
            <Globe className="w-3.5 h-3.5 text-indigo-600" />
            <span>E-mabini</span>
            <ExternalLink className="w-3 h-3 text-slate-400 ml-0.5" />
          </a>

          {/* Google Drive */}
          <a
            id="quick-link-gdrive"
            href={portals.gdrive}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-white text-sky-800 border border-slate-200 hover:border-sky-300 transition-colors shrink-0"
          >
            <HardDrive className="w-3.5 h-3.5 text-sky-600" />
            <span>GDrive</span>
            <ExternalLink className="w-3 h-3 text-slate-400 ml-0.5" />
          </a>
        </div>

        {/* Edit Portal Settings Button */}
        {isAdminMode && (
          <button
            id="edit-portal-links-btn"
            onClick={onOpenPortalSettings}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors shrink-0"
            title="Edit portal links"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Edit Links</span>
          </button>
        )}
      </div>
    </div>
  );
};
