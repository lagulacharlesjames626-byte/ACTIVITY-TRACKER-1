import React from 'react';
import { Search, X, UserCheck, CheckCircle2 } from 'lucide-react';
import { FilterState } from '../types';
import { OFFICIAL_SUBJECTS, getSubjectTheme } from '../utils/subjectThemes';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  subjects: string[];
  totalResults: number;
  currentStudent?: string;
  completedCount?: number;
  onOpenCompleted?: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  subjects,
  totalResults,
  currentStudent,
  completedCount = 0,
  onOpenCompleted,
}) => {
  const currentSurnameUpper = currentStudent ? currentStudent.trim().toUpperCase() : '';
  const selectedTheme = filters.subject !== 'all' ? getSubjectTheme(filters.subject) : null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 mb-4 space-y-2.5">
      {/* Search & Subject Filters */}
      <div className="flex flex-col sm:flex-row gap-2 items-center">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="filter-search-input"
            type="text"
            placeholder="Search activities, subjects, or surnames (e.g. LAGULA)..."
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange({ search: '' })}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Subject Filter */}
        <div className="w-full sm:w-60">
          <select
            id="filter-subject-select"
            value={filters.subject}
            onChange={(e) => onFilterChange({ subject: e.target.value })}
            className={`w-full py-1.5 px-2.5 bg-slate-50 border rounded-lg text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${
              selectedTheme
                ? `${selectedTheme.badgeBg} ${selectedTheme.badgeText} border-indigo-300 font-bold`
                : 'border-slate-200 text-slate-700'
            }`}
          >
            <option value="all">All Subjects (7 Official)</option>
            <optgroup label="Official 7 Subjects">
              {OFFICIAL_SUBJECTS.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </optgroup>
            {subjects.filter((s) => !OFFICIAL_SUBJECTS.includes(s)).length > 0 && (
              <optgroup label="Other Subjects">
                {subjects
                  .filter((s) => !OFFICIAL_SUBJECTS.includes(s))
                  .map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
              </optgroup>
            )}
          </select>
        </div>

        {/* Location Filter */}
        <div className="w-full sm:w-40">
          <select
            id="filter-location-select"
            value={filters.location}
            onChange={(e) => onFilterChange({ location: e.target.value })}
            className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Portals</option>
            <option value="Gclass">Google Classroom</option>
            <option value="Emabini">E-mabini</option>
            <option value="Gdrive">Google Drive</option>
          </select>
        </div>
      </div>

      {/* Filter Status Chips */}
      <div className="flex flex-wrap items-center justify-between text-xs pt-1.5 border-t border-slate-100 gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => onFilterChange({ status: 'all' })}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              filters.status === 'all'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All
          </button>

          {currentSurnameUpper && (
            <>
              <button
                onClick={() => onFilterChange({ status: 'my_finished' })}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  filters.status === 'my_finished'
                    ? 'bg-emerald-600 text-white'
                    : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Finished by {currentSurnameUpper}</span>
              </button>

              <button
                onClick={() => onFilterChange({ status: 'my_pending' })}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  filters.status === 'my_pending'
                    ? 'bg-amber-600 text-white'
                    : 'text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                <span>To-Do for {currentSurnameUpper}</span>
              </button>
            </>
          )}

          <button
            onClick={() => onFilterChange({ status: 'pending' })}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              filters.status === 'pending'
                ? 'bg-slate-700 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            General Pending
          </button>

          {/* User Requested: Highlighted Modules Completed Button */}
          {onOpenCompleted && (
            <button
              id="filterbar-completed-modules-btn"
              type="button"
              onClick={onOpenCompleted}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs ring-1 ring-emerald-400 transition-all active:scale-95 cursor-pointer ml-1"
              title="Open Completed Modules archive to locate by subject"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Modules Completed</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-white text-emerald-800 leading-none">
                {completedCount}
              </span>
            </button>
          )}
        </div>

        <div className="text-[11px] text-slate-400">
          {totalResults} {totalResults === 1 ? 'module' : 'modules'} • Ordered by due date
        </div>
      </div>
    </div>
  );
};
