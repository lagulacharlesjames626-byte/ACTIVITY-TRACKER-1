import React, { useState, useEffect } from 'react';
import {
  X,
  BookOpen,
  Globe,
  GraduationCap,
  HardDrive,
  FolderOpen,
  Check,
  Copy,
  Plus,
  Trash2,
  Layers,
  FileText,
  Calendar,
} from 'lucide-react';
import { ModuleItem, OutputLocation, PortalLinks, LocationLinks, SubModuleItem } from '../types';
import { toInputDateTime } from '../utils/dateUtils';
import { OFFICIAL_SUBJECTS, getSubjectTheme } from '../utils/subjectThemes';

interface ModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (moduleData: Partial<ModuleItem>) => void;
  initialData?: ModuleItem | null;
  isCopy?: boolean;
  existingSubjects: string[];
  portalLinks: PortalLinks;
}

export const ModuleModal: React.FC<ModuleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  isCopy = false,
  existingSubjects,
  portalLinks,
}) => {
  const [moduleNumber, setModuleNumber] = useState<string>('1');
  const [subject, setSubject] = useState<string>('');
  const [isCustomSubject, setIsCustomSubject] = useState<boolean>(false);
  const [activity, setActivity] = useState<string>('');

  // Multi-selection for locations
  const [selectedLocations, setSelectedLocations] = useState<OutputLocation[]>(['Gclass']);
  const [customLocation, setCustomLocation] = useState<string>('');

  // Separated links for each selected location
  const [links, setLinks] = useState<LocationLinks>({
    gclass: '',
    emabini: '',
    gdrive: '',
    other: '',
  });

  const [deadline, setDeadline] = useState<string>('');
  const [status, setStatus] = useState<ModuleItem['status']>('pending');
  const [notes, setNotes] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // MULTI-MODULE BUNDLE STATE (User Request: Module 1, 2, 3, 4 under 1 PDF with same due date)
  const [isBundle, setIsBundle] = useState<boolean>(false);
  const [subModules, setSubModules] = useState<SubModuleItem[]>([]);

  useEffect(() => {
    if (initialData) {
      if (isCopy) {
        const numVal = Number(initialData.moduleNumber);
        if (!isNaN(numVal)) {
          setModuleNumber(String(numVal + 1));
        } else {
          setModuleNumber(String(initialData.moduleNumber));
        }
        setStatus('pending');
      } else {
        setModuleNumber(String(initialData.moduleNumber));
        setStatus(initialData.status);
      }

      // Match official subject if possible
      const matchedOfficial = OFFICIAL_SUBJECTS.find(
        (s) =>
          s.toLowerCase() === initialData.subject.toLowerCase() ||
          s.toUpperCase().startsWith(initialData.subject.toUpperCase()) ||
          initialData.subject.toUpperCase().startsWith(s.toUpperCase())
      );
      if (matchedOfficial) {
        setSubject(matchedOfficial);
        setIsCustomSubject(false);
      } else if (OFFICIAL_SUBJECTS.includes(initialData.subject as any)) {
        setSubject(initialData.subject);
        setIsCustomSubject(false);
      } else {
        setSubject(initialData.subject);
        setIsCustomSubject(true);
      }

      setActivity(initialData.activity);

      // Handle legacy or multi-locations
      const locs: OutputLocation[] =
        initialData.locations && initialData.locations.length > 0
          ? initialData.locations
          : (initialData as any).location
          ? [(initialData as any).location]
          : ['Gclass'];

      setSelectedLocations(locs);
      setCustomLocation(initialData.customLocation || '');

      const legacyLink = (initialData as any).link;
      const initialLinks: LocationLinks = initialData.links ? { ...initialData.links } : {};

      if (locs.includes('Gclass') && !initialLinks.gclass) {
        initialLinks.gclass =
          legacyLink && (initialData as any).location === 'Gclass' ? legacyLink : portalLinks.gclass;
      }
      if (locs.includes('Emabini') && !initialLinks.emabini) {
        initialLinks.emabini =
          legacyLink && (initialData as any).location === 'Emabini' ? legacyLink : portalLinks.emabini;
      }
      if (locs.includes('Gdrive') && !initialLinks.gdrive) {
        initialLinks.gdrive =
          legacyLink && (initialData as any).location === 'Gdrive' ? legacyLink : portalLinks.gdrive;
      }

      setLinks(initialLinks);
      setDeadline(toInputDateTime(initialData.deadline));
      setStatus(initialData.status);
      setNotes(initialData.notes || '');

      // Load sub-modules if present
      if (Array.isArray(initialData.subModules) && initialData.subModules.length > 0) {
        setIsBundle(true);
        setSubModules(
          initialData.subModules.map((s, idx) => ({
            ...s,
            id: s.id || `sub-${Date.now()}-${idx}`,
            subNumber: s.subNumber || idx + 1,
            completedBy: isCopy ? [] : s.completedBy || [],
            completedAt: isCopy ? {} : s.completedAt || {},
          }))
        );
      } else {
        setIsBundle(false);
        setSubModules([]);
      }
    } else {
      // Defaults for new module
      setModuleNumber('1');
      setSubject(OFFICIAL_SUBJECTS[0]);
      setIsCustomSubject(false);
      setActivity('');
      setSelectedLocations(['Gclass']);
      setCustomLocation('');
      setLinks({
        gclass: portalLinks.gclass,
        emabini: portalLinks.emabini,
        gdrive: portalLinks.gdrive,
        other: '',
      });

      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 3);
      nextDate.setHours(8, 0, 0, 0);
      setDeadline(toInputDateTime(nextDate.toISOString()));
      setStatus('pending');
      setNotes('');
      setIsBundle(false);
      setSubModules([]);
    }
    setErrors({});
  }, [initialData, isOpen, existingSubjects, portalLinks, isCopy]);

  const toggleLocation = (loc: OutputLocation) => {
    setSelectedLocations((prev) => {
      let updated: OutputLocation[];
      if (prev.includes(loc)) {
        if (prev.length === 1) return prev;
        updated = prev.filter((item) => item !== loc);
      } else {
        updated = [...prev, loc];
        if (loc === 'Gclass' && !links.gclass) {
          setLinks((l) => ({ ...l, gclass: portalLinks.gclass }));
        } else if (loc === 'Emabini' && !links.emabini) {
          setLinks((l) => ({ ...l, emabini: portalLinks.emabini }));
        } else if (loc === 'Gdrive' && !links.gdrive) {
          setLinks((l) => ({ ...l, gdrive: portalLinks.gdrive }));
        }
      }
      return updated;
    });
  };

  const updateLink = (key: keyof LocationLinks, value: string) => {
    setLinks((prev) => ({ ...prev, [key]: value }));
  };

  // Sub-module management
  const addSubModule = () => {
    const nextNum = subModules.length + 1;
    const newSub: SubModuleItem = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      subNumber: nextNum,
      title: `Module ${nextNum}: `,
      instructions: '',
      locations: ['Gclass'],
      links: {
        gclass: links.gclass || portalLinks.gclass,
        emabini: links.emabini || portalLinks.emabini,
        gdrive: links.gdrive || portalLinks.gdrive,
      },
      completedBy: [],
      completedAt: {},
    };
    setSubModules([...subModules, newSub]);
  };

  const removeSubModule = (id: string) => {
    setSubModules(subModules.filter((s) => s.id !== id));
  };

  const updateSubModule = (id: string, field: keyof SubModuleItem, val: any) => {
    setSubModules(
      subModules.map((s) => (s.id === id ? { ...s, [field]: val } : s))
    );
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!moduleNumber.trim()) newErrors.moduleNumber = 'Module number is required';
    if (!subject.trim()) newErrors.subject = 'Subject is required';
    if (!activity.trim()) newErrors.activity = 'Activity / Title name is required';
    if (!deadline) newErrors.deadline = 'Deadline is required';

    if (isBundle && subModules.length === 0) {
      newErrors.subModules = 'Please add at least one sub-module or toggle off bundle mode';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const moduleData: Partial<ModuleItem> = {
      moduleNumber: isNaN(Number(moduleNumber)) ? moduleNumber.trim() : Number(moduleNumber),
      subject: subject.trim(),
      activity: activity.trim(),
      locations: selectedLocations,
      customLocation: selectedLocations.includes('Other') ? customLocation.trim() : undefined,
      links,
      deadline: new Date(deadline).toISOString(),
      status,
      notes: notes.trim() || undefined,
      subModules: isBundle && subModules.length > 0 ? subModules : undefined,
    };

    onSave(moduleData);
  };

  if (!isOpen) return null;

  return (
    <div
      id="module-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto"
    >
      <div
        id="module-modal-container"
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[95vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              {isBundle ? <Layers className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight">
                {isCopy
                  ? 'Duplicate & Edit Module'
                  : initialData
                  ? 'Edit Module Details'
                  : 'Add New Module / Bundle'}
              </h3>
              <p className="text-xs text-slate-400">
                {isBundle
                  ? 'Multi-Module Package (Modules 1, 2, 3, 4 with same PDF & due date)'
                  : 'BSBA-HRM Class 1-A Activity Checklist'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Module # and Subject selection */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Module / Bundle # *
              </label>
              <input
                type="text"
                value={moduleNumber}
                onChange={(e) => setModuleNumber(e.target.value)}
                placeholder="e.g. 1 or 1-4"
                className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 ${
                  errors.moduleNumber ? 'border-rose-500' : 'border-slate-300'
                }`}
              />
              {errors.moduleNumber && (
                <p className="text-[11px] text-rose-600 mt-1 font-semibold">{errors.moduleNumber}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Subject *
              </label>
              <select
                value={isCustomSubject ? '__custom__' : subject}
                onChange={(e) => {
                  if (e.target.value === '__custom__') {
                    setIsCustomSubject(true);
                    setSubject('');
                  } else {
                    setIsCustomSubject(false);
                    setSubject(e.target.value);
                  }
                }}
                className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 ${
                  errors.subject ? 'border-rose-500' : 'border-slate-300'
                }`}
              >
                {OFFICIAL_SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
                <option value="__custom__">+ Custom Subject...</option>
              </select>

              {isCustomSubject && (
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter custom subject name..."
                  className="mt-2 w-full px-3 py-2 bg-white border border-indigo-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              )}
            </div>
          </div>

          {/* Activity Title */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Activity Name / PDF Title *
            </label>
            <input
              type="text"
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              placeholder="e.g. Preliminary Activities or Human Resource Development Framework"
              className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 ${
                errors.activity ? 'border-rose-500' : 'border-slate-300'
              }`}
            />
            {errors.activity && (
              <p className="text-[11px] text-rose-600 mt-1 font-semibold">{errors.activity}</p>
            )}
          </div>

          {/* MULTI-MODULE BUNDLE TOGGLE (User Request) */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-700 shrink-0" />
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-indigo-950">
                    Bundle Multi-Modules Inside (1 PDF with Same Due Date)
                  </h4>
                  <p className="text-[11px] text-indigo-700">
                    Group Modules 1, 2, 3, 4 together with individual links and instructions
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isBundle && subModules.length === 0) {
                    // Prepopulate 2 sub-modules
                    setSubModules([
                      {
                        id: `sub-1`,
                        subNumber: 1,
                        title: 'Module 1: ',
                        instructions: '',
                        locations: ['Gclass'],
                        links: { gclass: links.gclass || portalLinks.gclass },
                        completedBy: [],
                      },
                      {
                        id: `sub-2`,
                        subNumber: 2,
                        title: 'Module 2: ',
                        instructions: '',
                        locations: ['Gclass'],
                        links: { gclass: links.gclass || portalLinks.gclass },
                        completedBy: [],
                      },
                    ]);
                  }
                  setIsBundle(!isBundle);
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  isBundle ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    isBundle ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Sub-modules Editor */}
            {isBundle && (
              <div className="mt-3.5 space-y-3 pt-3 border-t border-indigo-150">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                    Sub-Modules List ({subModules.length})
                  </span>
                  <button
                    type="button"
                    onClick={addSubModule}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Another Sub-Module</span>
                  </button>
                </div>

                {errors.subModules && (
                  <p className="text-xs text-rose-600 font-bold">{errors.subModules}</p>
                )}

                <div className="space-y-2.5">
                  {subModules.map((sub, sIdx) => (
                    <div
                      key={sub.id}
                      className="p-3 bg-white rounded-xl border border-indigo-200 shadow-2xs space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-indigo-100 text-indigo-800">
                          Sub-Module #{sub.subNumber || sIdx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeSubModule(sub.id)}
                          className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 cursor-pointer"
                          title="Remove this sub-module"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <input
                        type="text"
                        value={sub.title}
                        onChange={(e) => updateSubModule(sub.id, 'title', e.target.value)}
                        placeholder={`e.g. Module ${sIdx + 1}: Activity Name`}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:bg-white"
                      />

                      <textarea
                        rows={2}
                        value={sub.instructions || ''}
                        onChange={(e) => updateSubModule(sub.id, 'instructions', e.target.value)}
                        placeholder="Specific instructions for this sub-module..."
                        className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:bg-white"
                      />

                      {/* Sub-module specific links */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        <input
                          type="url"
                          value={sub.links?.gclass || ''}
                          onChange={(e) =>
                            updateSubModule(sub.id, 'links', { ...sub.links, gclass: e.target.value })
                          }
                          placeholder="Sub-module Google Classroom link"
                          className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-[11px] font-mono text-slate-800"
                        />
                        <input
                          type="url"
                          value={sub.links?.gdrive || ''}
                          onChange={(e) =>
                            updateSubModule(sub.id, 'links', { ...sub.links, gdrive: e.target.value })
                          }
                          placeholder="Sub-module Google Drive link"
                          className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-[11px] font-mono text-slate-800"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submission Locations Multi-Select */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
              Submission Platforms (Select one or more)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'Gclass', label: 'Google Classroom', icon: GraduationCap },
                { id: 'Emabini', label: 'E-mabini LMS', icon: Globe },
                { id: 'Gdrive', label: 'Google Drive', icon: HardDrive },
                { id: 'Other', label: 'Other Link', icon: FolderOpen },
              ].map((item) => {
                const isSelected = selectedLocations.includes(item.id as OutputLocation);
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleLocation(item.id as OutputLocation)}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-900 ring-1 ring-indigo-400'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Location Links */}
          <div className="space-y-2 pt-1">
            {selectedLocations.includes('Gclass') && (
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-0.5">
                  Google Classroom Link
                </label>
                <input
                  type="url"
                  value={links.gclass || ''}
                  onChange={(e) => updateLink('gclass', e.target.value)}
                  placeholder="https://classroom.google.com/..."
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900"
                />
              </div>
            )}

            {selectedLocations.includes('Emabini') && (
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-0.5">
                  E-mabini Link
                </label>
                <input
                  type="url"
                  value={links.emabini || ''}
                  onChange={(e) => updateLink('emabini', e.target.value)}
                  placeholder="https://e-mabini.mabini.edu.ph/..."
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900"
                />
              </div>
            )}

            {selectedLocations.includes('Gdrive') && (
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-0.5">
                  Google Drive Folder Link
                </label>
                <input
                  type="url"
                  value={links.gdrive || ''}
                  onChange={(e) => updateLink('gdrive', e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900"
                />
              </div>
            )}

            {selectedLocations.includes('Other') && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  placeholder="Platform name (e.g. Email)"
                  className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900"
                />
                <input
                  type="url"
                  value={links.other || ''}
                  onChange={(e) => updateLink('other', e.target.value)}
                  placeholder="Platform link URL"
                  className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900"
                />
              </div>
            )}
          </div>

          {/* Deadline & Shared Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Due Date & Time *
              </label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-bold text-slate-900 ${
                  errors.deadline ? 'border-rose-500' : 'border-slate-300'
                }`}
              />
              {errors.deadline && (
                <p className="text-[11px] text-rose-600 mt-1 font-semibold">{errors.deadline}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                General Instructions / PDF Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Shared instructions or notes for this module..."
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white"
              />
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-black rounded-xl shadow-md cursor-pointer active:scale-98 transition-all"
            >
              {initialData && !isCopy ? 'Save Changes' : 'Create Module / Bundle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
