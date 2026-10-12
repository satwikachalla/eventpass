import React from 'react';
import { Search, Download, Filter, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface FilterBarProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  searchPlaceholder?: string;
  filters?: {
    label: string;
    value: string;
    onChange: (val: string) => void;
    options: { label: string; value: string }[];
  }[];
  onResetFilters?: () => void;
  onExportCsv?: () => void;
  onExportXlsx?: () => void;
  totalCount?: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchTerm,
  onSearchChange,
  searchPlaceholder = 'Search records...',
  filters = [],
  onResetFilters,
  onExportCsv,
  onExportXlsx,
  totalCount,
}) => {
  return (
    <div className="bg-white dark:bg-navy-850 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-subtle mb-6 space-y-3">
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
          />
        </div>

        {/* Action Buttons: Export CSV / XLSX */}
        <div className="flex items-center gap-2 flex-wrap">
          {totalCount !== undefined && (
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-2">
              Showing <span className="font-bold text-slate-800 dark:text-slate-200">{totalCount}</span> records
            </span>
          )}
          {onExportCsv && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExportCsv}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              CSV
            </Button>
          )}
          {onExportXlsx && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExportXlsx}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Excel
            </Button>
          )}
          {onResetFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              title="Reset all filters"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Select Dropdowns */}
      {filters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs font-semibold text-slate-400 flex items-center mr-1">
            <Filter className="w-3 h-3 mr-1" /> Filters:
          </span>
          {filters.map((f, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <select
                value={f.value}
                onChange={(e) => f.onChange(e.target.value)}
                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                {f.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
