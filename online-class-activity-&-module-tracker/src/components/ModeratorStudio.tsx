import React, { useState } from 'react';
import {
  Shield,
  Sliders,
  Type,
  Palette,
  Users,
  Lock,
  Download,
  Upload,
  CheckCircle2,
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  Globe,
  Bell,
  HardDrive,
  FileCheck,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { SiteSettings, ModuleItem } from '../types';
import { OFFICIAL_SUBJECTS, SUBJECT_THEMES } from '../utils/subjectThemes';
import { ADMIN_SURNAMES } from '../utils/rosterData';

interface ModeratorStudioProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SiteSettings;
  onSaveSettings: (newSettings: Partial<SiteSettings>, adminPassword?: string) => Promise<boolean>;
  roster: string[];
  admins?: string[];
  onAddStudent: (name: string) => Promise<boolean>;
  onBulkImportStudents?: (names: string[]) => Promise<boolean>;
  onBulkImportRoster?: (names: string[]) => Promise<boolean>;
  onEditStudent: (oldName: string, newName: string) => Promise<boolean>;
  onDeleteStudent: (name: string) => Promise<boolean>;
  onAppointAdmin?: (surname: string) => Promise<boolean>;
  onRevokeAdmin?: (surname: string) => Promise<boolean>;
  modules?: ModuleItem[];
  onExportBackup?: () => void;
  onImportBackup?: (file: File) => void;
  showToast?: (msg: string) => void;
  onShowToast?: (msg: string) => void;
}

type StudioTab = 'branding' | 'styling' | 'roster' | 'portals' | 'security' | 'storage';

export const ModeratorStudio: React.FC<ModeratorStudioProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  roster,
  admins = ADMIN_SURNAMES,
  onAddStudent,
  onBulkImportStudents,
  onBulkImportRoster,
  onEditStudent,
  onDeleteStudent,
  onAppointAdmin,
  onRevokeAdmin,
  modules = [],
  onExportBackup,
  onImportBackup,
  showToast,
  onShowToast,
}) => {
  const triggerToast = onShowToast || showToast || ((msg: string) => console.log(msg));
  const bulkImporter = onBulkImportRoster || onBulkImportStudents || (async () => false);
  const [activeTab, setActiveTab] = useState<StudioTab>('branding');
  const [isSaving, setIsSaving] = useState(false);

  // Form states for settings
  const [courseName, setCourseName] = useState(settings.courseName || 'BSBA-HRM Class 1-A');
  const [courseSubtitle, setCourseSubtitle] = useState(settings.courseSubtitle || '');
  const [announcement, setAnnouncement] = useState(settings.announcement || '');
  const [fontFamily, setFontFamily] = useState(settings.fontFamily || 'default');
  const [buttonPlacement, setButtonPlacement] = useState(settings.buttonPlacement || 'bottom-right');
  const [cardTheme, setCardTheme] = useState(settings.cardTheme || 'vibrant');

  // Portal links
  const [gclassLink, setGclassLink] = useState(settings.portalLinks?.gclass || '');
  const [emabiniLink, setEmabiniLink] = useState(settings.portalLinks?.emabini || '');
  const [gdriveLink, setGdriveLink] = useState(settings.portalLinks?.gdrive || '');

  // Security password
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('');

  // Roster inputs
  const [newStudentName, setNewStudentName] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [editingStudentOld, setEditingStudentOld] = useState<string | null>(null);
  const [editingStudentNew, setEditingStudentNew] = useState('');
  const [rosterSearch, setRosterSearch] = useState('');
  const [appointCandidate, setAppointCandidate] = useState('');
  const [isAppointing, setIsAppointing] = useState(false);

  // Active Admins list
  const activeAdmins = (admins && admins.length > 0 ? admins : ADMIN_SURNAMES).map((a) =>
    a.trim().toUpperCase()
  );

  const getSurname = (fullName: string) => {
    const parts = fullName.trim().split(/[\s,]+/);
    return (parts[0] || fullName).trim().toUpperCase();
  };

  const handleAppointAdmin = async (surnameInput: string) => {
    const cleanSurname = getSurname(surnameInput);
    if (!cleanSurname) return;
    if (activeAdmins.includes(cleanSurname)) {
      triggerToast(`${cleanSurname} is already an Admin`);
      return;
    }
    setIsAppointing(true);
    if (onAppointAdmin) {
      await onAppointAdmin(cleanSurname);
      setAppointCandidate('');
    }
    setIsAppointing(false);
  };

  const handleRevokeAdmin = async (surnameInput: string) => {
    const cleanSurname = getSurname(surnameInput);
    if (!cleanSurname) return;
    if (activeAdmins.length <= 1) {
      triggerToast('Cannot remove the last remaining Administrator');
      return;
    }
    if (onRevokeAdmin) {
      await onRevokeAdmin(cleanSurname);
    }
  };

  if (!isOpen) return null;

  const handleSaveAllSettings = async () => {
    setIsSaving(true);
    const newSettingsPayload: Partial<SiteSettings> = {
      courseName: courseName.trim(),
      courseSubtitle: courseSubtitle.trim(),
      announcement: announcement.trim(),
      fontFamily,
      buttonPlacement,
      cardTheme,
      portalLinks: {
        gclass: gclassLink.trim(),
        emabini: emabiniLink.trim(),
        gdrive: gdriveLink.trim(),
      },
    };

    if (newAdminPassword) {
      if (newAdminPassword !== confirmAdminPassword) {
        triggerToast('Password confirmation does not match');
        setIsSaving(false);
        return;
      }
      newSettingsPayload.adminPassword = newAdminPassword;
    }

    const success = await onSaveSettings(newSettingsPayload);
    setIsSaving(false);
    if (success) {
      triggerToast('All Moderator settings saved permanently to disk!');
      setNewAdminPassword('');
      setConfirmAdminPassword('');
    }
  };

  const handleAddSingleStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newStudentName.trim();
    if (!clean) return;
    const success = await onAddStudent(clean);
    if (success) {
      setNewStudentName('');
      triggerToast(`Added ${clean} to BSBA-HRM 1-A roster`);
    }
  };

  const handleBulkImport = async () => {
    const lines = bulkText
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 1);

    if (lines.length === 0) {
      triggerToast('Please paste at least one name');
      return;
    }

    const success = await bulkImporter(lines);
    if (success) {
      setBulkText('');
      triggerToast(`Successfully imported ${lines.length} classmates to roster!`);
    }
  };

  const handleSaveEditStudent = async () => {
    if (!editingStudentOld || !editingStudentNew.trim()) return;
    const success = await onEditStudent(editingStudentOld, editingStudentNew.trim());
    if (success) {
      setEditingStudentOld(null);
      setEditingStudentNew('');
      triggerToast('Student name updated');
    }
  };

  const filteredRoster = roster.filter((name) =>
    name.toLowerCase().includes(rosterSearch.toLowerCase())
  );

  return (
    <div
      id="moderator-studio-overlay"
      className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex flex-col justify-start overflow-hidden text-slate-800"
    >
      {/* Top Navbar */}
      <header className="bg-slate-900 text-white px-4 sm:px-6 py-3.5 border-b border-slate-800 flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Back to Tracker Board"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Moderator & Design Studio
                </h2>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Master Control
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Customize fonts, colors, button positions, roster, and school branding in real time
              </p>
            </div>
          </div>
        </div>

        {/* Global Save Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSaveAllSettings}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-900/20 transition-all cursor-pointer disabled:opacity-50 active:scale-98"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save All Changes'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded-xl text-xs sm:text-sm font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
          >
            Exit Studio
          </button>
        </div>
      </header>

      {/* Main Studio Body: Sidebar Navigation + Settings Canvas */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-50">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 bg-white border-r border-slate-200 p-2 sm:p-3 shrink-0 flex md:flex-col overflow-x-auto md:overflow-y-auto gap-1 border-b md:border-b-0">
          <button
            type="button"
            onClick={() => setActiveTab('branding')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-left whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'branding'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Globe className="w-4 h-4 shrink-0" />
            <span>Course & Branding</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('styling')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-left whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'styling'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Palette className="w-4 h-4 shrink-0" />
            <span>Fonts, Colors & Buttons</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('roster')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-left whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'roster'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>Classmates Roster ({roster.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('portals')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-left whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'portals'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Globe className="w-4 h-4 shrink-0" />
            <span>Master Portal Links</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-left whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'security'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Lock className="w-4 h-4 shrink-0" />
            <span>Admin Password</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('storage')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-left whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'storage'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <HardDrive className="w-4 h-4 shrink-0" />
            <span>Disk Storage & Backup</span>
          </button>

          {/* Quick Stats Pill */}
          <div className="mt-auto hidden md:block pt-4 border-t border-slate-100 text-[11px] text-slate-500 space-y-1 p-2 bg-slate-50 rounded-xl">
            <div className="font-bold text-slate-700">Permanent Storage</div>
            <div>Active Modules: <strong>{modules.length}</strong></div>
            <div>Classmates: <strong>{roster.length}</strong></div>
            <div className="text-emerald-600 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Saved on Server Disk</span>
            </div>
          </div>
        </aside>

        {/* Studio Content Panel */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          <div className="max-w-3xl mx-auto">
            {/* TAB 1: Course & Branding */}
            {activeTab === 'branding' && (
              <div className="space-y-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-indigo-600" />
                    <span>Class Course & Header Branding</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Change the course name displayed at the top of the tracker and on the student login screen.
                  </p>

                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                        Course & Section Name *
                      </label>
                      <input
                        type="text"
                        value={courseName}
                        onChange={(e) => setCourseName(e.target.value)}
                        placeholder="e.g. BSBA-HRM Class 1-A"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                        Subtitle / Department Description
                      </label>
                      <input
                        type="text"
                        value={courseSubtitle}
                        onChange={(e) => setCourseSubtitle(e.target.value)}
                        placeholder="e.g. Activity Checklist, Modules & Progress Monitor"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-700 mb-1 flex items-center gap-1.5">
                        <Bell className="w-3.5 h-3.5 text-amber-600" />
                        <span>Announcement Banner (Optional)</span>
                      </label>
                      <textarea
                        rows={2}
                        value={announcement}
                        onChange={(e) => setAnnouncement(e.target.value)}
                        placeholder="Type an announcement to display across the top of the tracker (leave empty to hide)..."
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Live Preview of Header Branding */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-2">
                    Live Header Preview
                  </span>
                  <div className="p-3 rounded-xl bg-slate-900 text-white flex items-center justify-between">
                    <div>
                      <h4 className="font-black text-sm tracking-tight">{courseName || 'Course Title'}</h4>
                      <p className="text-[11px] text-slate-400">{courseSubtitle || 'Subtitle'}</p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                      Live Preview
                    </span>
                  </div>
                  {announcement && (
                    <div className="mt-2 p-2 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-xs font-medium flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>{announcement}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: Fonts, Colors & Button Placements */}
            {activeTab === 'styling' && (
              <div className="space-y-6">
                {/* Font Customizer */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Type className="w-4 h-4 text-indigo-600" />
                    <span>Website Typography & Font Family</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Select the font style for the entire website: headers, module cards, and badges.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                    {[
                      { id: 'default', label: 'Modern Sans', sample: 'Clean & Neutral' },
                      { id: 'sans', label: 'Plus Jakarta', sample: 'Modern Geometric' },
                      { id: 'poppins', label: 'Poppins', sample: 'Friendly & Rounded' },
                      { id: 'outfit', label: 'Outfit', sample: 'Contemporary Display' },
                      { id: 'serif', label: 'Classic Serif', sample: 'Editorial & Academic' },
                      { id: 'mono', label: 'Clean Tech Mono', sample: 'Developer Code Style' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFontFamily(f.id as any)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          fontFamily === f.id
                            ? 'bg-indigo-50 border-indigo-600 ring-2 ring-indigo-300 shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="font-black text-xs text-slate-900">{f.label}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{f.sample}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Button Placement Customizer */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-indigo-600" />
                    <span>"Check if Finished" Button Placement</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Control the placement of the check finish button on every module card.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      {
                        id: 'bottom-right',
                        label: 'Bottom-Right Corner (Requested)',
                        desc: 'Cleanly situated at the bottom right corner for easy thumb reach',
                      },
                      {
                        id: 'bottom-left',
                        label: 'Bottom-Left Corner',
                        desc: 'Placed on the bottom left next to instructions',
                      },
                      {
                        id: 'top-right',
                        label: 'Top-Right Corner',
                        desc: 'Placed near the edit and copy buttons',
                      },
                    ].map((bp) => (
                      <button
                        key={bp.id}
                        type="button"
                        onClick={() => setButtonPlacement(bp.id as any)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          buttonPlacement === bp.id
                            ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-300 shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="font-black text-xs text-slate-900">{bp.label}</div>
                        <div className="text-[10px] text-slate-500 mt-1">{bp.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Module Background Tint Theme */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-indigo-600" />
                    <span>Module Card Color Tint (White Website Background)</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    The background of the website stays clean white, while modules have high-visibility color-coding so your class can easily recognize each subject!
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      {
                        id: 'vibrant',
                        label: 'Vibrant Color Tint (Active)',
                        desc: 'Full colored background tint per subject matching user request',
                      },
                      {
                        id: 'soft',
                        label: 'Soft Pastel',
                        desc: 'Very subtle gentle tint with matching color borders',
                      },
                      {
                        id: 'bordered',
                        label: 'White with Accent Border',
                        desc: 'White card with strong left colored accent strip',
                      },
                    ].map((ct) => (
                      <button
                        key={ct.id}
                        type="button"
                        onClick={() => setCardTheme(ct.id as any)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          cardTheme === ct.id
                            ? 'bg-indigo-50 border-indigo-600 ring-2 ring-indigo-300 shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="font-black text-xs text-slate-900">{ct.label}</div>
                        <div className="text-[10px] text-slate-500 mt-1">{ct.desc}</div>
                      </button>
                    ))}
                  </div>

                  {/* Subject Color Palettes Reference */}
                  <div className="pt-3 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-2">
                      7 Official BSBA-HRM Subjects & Their Distinct Color Schemes:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.entries(SUBJECT_THEMES).filter(([k]) => k !== 'DEFAULT').map(([key, theme]) => (
                        <div
                          key={key}
                          className={`p-2.5 rounded-xl border ${theme.cardBorder} ${theme.cardBg} flex items-center justify-between shadow-2xs`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`w-3 h-3 rounded-full ${theme.dotColor} shrink-0`}></span>
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {theme.code} • {theme.shortName}
                            </span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wide border ${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder}`}
                          >
                            Color Code
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Classmates Roster & Accounts */}
            {activeTab === 'roster' && (
              <div className="space-y-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-600" />
                        <span>BSBA-HRM Class 1-A Student Roster</span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Manage all student accounts. Classmates can select or enter their Surname to log in and track completions.
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {roster.length} Registered
                    </span>
                  </div>

                  {/* Add Single Student Form */}
                  <form onSubmit={handleAddSingleStudent} className="pt-2 flex gap-2">
                    <input
                      type="text"
                      value={newStudentName}
                      onChange={(e) => setNewStudentName(e.target.value.toUpperCase())}
                      placeholder="Add student (e.g. SANTOS, Juan)"
                      className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Student</span>
                    </button>
                  </form>

                  {/* Appoint Admin from Class Section */}
                  <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-amber-950 text-xs">
                        <Shield className="w-4 h-4 text-amber-600" />
                        <span>Appoint Class Administrator</span>
                      </div>
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                        {activeAdmins.length} Active Admins
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-900/80">
                      Admins can appoint other classmates as administrators. Select any student from the class roster:
                    </p>
                    <div className="flex gap-2">
                      <select
                        value={appointCandidate}
                        onChange={(e) => setAppointCandidate(e.target.value)}
                        className="flex-1 px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 cursor-pointer"
                      >
                        <option value="">-- Choose a student to make Admin --</option>
                        {roster
                          .filter((s) => !activeAdmins.includes(getSurname(s)))
                          .map((s) => (
                            <option key={s} value={getSurname(s)}>
                              {s} ({getSurname(s)})
                            </option>
                          ))}
                      </select>
                      <button
                        type="button"
                        disabled={!appointCandidate || isAppointing}
                        onClick={() => handleAppointAdmin(appointCandidate)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        <span>{isAppointing ? 'Appointing...' : 'Appoint Admin'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Bulk Import from Text / GC list */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      Paste Full Class Roster (Bulk Add)
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Paste your entire classmates list (one name per line, or comma separated).
                    </p>
                    <textarea
                      rows={3}
                      value={bulkText}
                      onChange={(e) => setBulkText(e.target.value)}
                      placeholder={`LAGULA, Charles James\nDELA CRUZ, Juan\nGARCIA, Maria\nSANTOS, Pedro...`}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 font-mono focus:ring-2 focus:ring-indigo-500"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleBulkImport}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Import Roster List</span>
                      </button>
                    </div>
                  </div>

                  {/* Search Roster */}
                  <div className="pt-2">
                    <input
                      type="text"
                      value={rosterSearch}
                      onChange={(e) => setRosterSearch(e.target.value)}
                      placeholder="Search registered classmates..."
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white"
                    />
                  </div>

                  {/* Student List */}
                  <div className="max-h-72 overflow-y-auto space-y-1.5 divide-y divide-slate-100">
                    {filteredRoster.map((name, idx) => (
                      <div
                        key={`${name}-${idx}`}
                        className="pt-1.5 flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-slate-50 text-xs"
                      >
                        {editingStudentOld === name ? (
                          <div className="flex-1 flex items-center gap-2">
                            <input
                              type="text"
                              value={editingStudentNew}
                              onChange={(e) => setEditingStudentNew(e.target.value)}
                              className="flex-1 px-2.5 py-1 bg-white border border-indigo-400 rounded-lg text-xs font-bold text-slate-900"
                            />
                            <button
                              type="button"
                              onClick={handleSaveEditStudent}
                              className="px-2 py-1 text-xs font-bold bg-emerald-600 text-white rounded-md cursor-pointer"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingStudentOld(null)}
                              className="px-2 py-1 text-xs bg-slate-200 text-slate-700 rounded-md cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                                {idx + 1}
                              </span>
                              <span className="font-bold text-slate-900 truncate uppercase">
                                {name}
                              </span>
                              {activeAdmins.includes(getSurname(name)) && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
                                  <Shield className="w-3 h-3 text-amber-600 fill-amber-500" />
                                  <span>Admin</span>
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {activeAdmins.includes(getSurname(name)) ? (
                                <button
                                  type="button"
                                  onClick={() => handleRevokeAdmin(getSurname(name))}
                                  className="px-2 py-1 text-[10px] font-bold text-amber-900 hover:text-rose-700 bg-amber-50 hover:bg-rose-50 border border-amber-200 rounded-md transition-colors cursor-pointer"
                                  title="Revoke Admin privileges"
                                >
                                  Revoke Admin
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleAppointAdmin(getSurname(name))}
                                  className="px-2 py-1 text-[10px] font-bold text-indigo-700 hover:text-white bg-indigo-50 hover:bg-indigo-600 border border-indigo-200 rounded-md transition-colors cursor-pointer inline-flex items-center gap-1"
                                  title="Appoint as Admin"
                                >
                                  <Shield className="w-3 h-3" />
                                  <span>Make Admin</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingStudentOld(name);
                                  setEditingStudentNew(name);
                                }}
                                className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-indigo-50 cursor-pointer"
                                title="Edit Name"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteStudent(name)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer"
                                title="Remove Student from Roster"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: Master Portal Links */}
            {activeTab === 'portals' && (
              <div className="space-y-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-indigo-600" />
                    <span>Master School Submission Portals</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Default URLs for quick links displayed in the top portal bar and prefilled in new modules.
                  </p>

                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                        Google Classroom URL
                      </label>
                      <input
                        type="url"
                        value={gclassLink}
                        onChange={(e) => setGclassLink(e.target.value)}
                        placeholder="https://classroom.google.com"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                        E-mabini LMS Portal URL
                      </label>
                      <input
                        type="url"
                        value={emabiniLink}
                        onChange={(e) => setEmabiniLink(e.target.value)}
                        placeholder="https://e-mabini.mabini.edu.ph"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                        Google Drive Class Folder URL
                      </label>
                      <input
                        type="url"
                        value={gdriveLink}
                        onChange={(e) => setGdriveLink(e.target.value)}
                        placeholder="https://drive.google.com"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: Security & Password */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                {/* Class Administrators List */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-amber-600" />
                        <span>Class Administrators ({activeAdmins.length})</span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Admins have moderator access to edit modules, class settings, and manage student rosters.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                    {activeAdmins.map((admSurname) => (
                      <div
                        key={admSurname}
                        className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="font-black text-xs text-amber-950 truncate">
                            {admSurname}
                          </div>
                          <div className="text-[10px] text-amber-800/80 font-mono">
                            {admSurname.toLowerCase()}hrm1-a
                          </div>
                        </div>
                        {activeAdmins.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRevokeAdmin(admSurname)}
                            className="text-[10px] font-bold text-amber-800 hover:text-rose-600 px-2 py-1 rounded bg-white/80 hover:bg-rose-50 border border-amber-200 cursor-pointer"
                            title="Revoke Admin Access"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-indigo-600" />
                    <span>Change Moderator / Admin Password</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Set a custom master password for Moderator Studio access.
                  </p>

                  <div className="space-y-3 pt-2 max-w-md">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                        New Admin Password
                      </label>
                      <input
                        type="password"
                        value={newAdminPassword}
                        onChange={(e) => setNewAdminPassword(e.target.value)}
                        placeholder="Enter new admin password"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={confirmAdminPassword}
                        onChange={(e) => setConfirmAdminPassword(e.target.value)}
                        placeholder="Confirm new admin password"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white"
                      />
                    </div>

                    <p className="text-[11px] text-slate-400">
                      Default fallback password is <strong>admin123</strong>. After changing, make sure to remember your new password.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: Disk Storage & Backup */}
            {activeTab === 'storage' && (
              <div className="space-y-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-emerald-600" />
                    <span>Permanent Disk Storage Status</span>
                  </h3>
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      <strong>Permanent Storage Active:</strong> All modules, checklists, and student names are saved directly to <code className="font-mono bg-emerald-100 px-1 rounded">data/tracker_data.json</code> on the server and survive restarts, sleep cycles, and reboots.
                    </span>
                  </div>

                  <div className="pt-2 space-y-3">
                    <h4 className="text-xs font-black uppercase text-slate-600 tracking-wider">
                      Instant 1-Click Backup Export & Restore
                    </h4>
                    <p className="text-xs text-slate-500">
                      Download a full standalone JSON backup to your computer or phone anytime, or restore from an existing backup file.
                    </p>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={onExportBackup}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Full Backup (JSON)</span>
                      </button>

                      <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition-colors cursor-pointer">
                        <Upload className="w-4 h-4 text-slate-600" />
                        <span>Upload / Restore Backup</span>
                        <input
                          type="file"
                          accept=".json"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) onImportBackup(file);
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
