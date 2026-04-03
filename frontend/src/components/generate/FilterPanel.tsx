import { SlidersHorizontalIcon, XIcon } from 'lucide-react';
import { FilterControls } from './FilterControls';
import type { FilterState, FilterAction } from '../../hooks/useFilterState';
import { countActiveFilters, DEFAULT_FILTERS } from '../../hooks/useFilterState';
import type { Phase } from './types';

interface FilterPanelProps {
  filterState: FilterState;
  filterDispatch: React.Dispatch<FilterAction>;
  isOpen: boolean;
  onClose: () => void;
  phase: Phase;
  onEditClick: () => void;
}

export function FilterPanel({
  filterState,
  filterDispatch,
  isOpen,
  onClose,
  phase,
  onEditClick,
}: FilterPanelProps) {
  const activeFilterCount = countActiveFilters(filterState);

  return (
    <>
      {/* Expanded filter panel */}
      {isOpen && (
        <div
          data-filter-panel
          className="bg-card border-b border-border shadow-lg relative z-20"
        >
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontalIcon className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">
                Generation Preferences
              </h3>
              {activeFilterCount > 0 && (
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                  {activeFilterCount} customized
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => filterDispatch({ type: 'RESET' })}
                className="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
              >
                Reset
              </button>
              <button
                onClick={onClose}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Apply
              </button>
              <button
                onClick={onClose}
                className="ml-1 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Close filters"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="px-4 py-3 max-h-[50vh] overflow-y-auto">
            <FilterControls filterState={filterState} filterDispatch={filterDispatch} compact={false} />
          </div>
        </div>
      )}

      {/* Active filter chips (idle state, when filters are set but panel is closed) */}
      {phase === 'idle' && activeFilterCount > 0 && !isOpen && (
        <div className="px-4 py-2 border-b border-border flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Active:
          </span>
          {filterState.personalizationRange !== DEFAULT_FILTERS.personalizationRange && (
            <span className="px-2 py-0.5 rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-400 text-[10px] font-medium border border-blue-600/20 capitalize">
              {filterState.personalizationRange}
            </span>
          )}
          {filterState.tone !== DEFAULT_FILTERS.tone && (
            <span className="px-2 py-0.5 rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-400 text-[10px] font-medium border border-blue-600/20 capitalize">
              {filterState.tone}
            </span>
          )}
          {filterState.budgetTier !== DEFAULT_FILTERS.budgetTier && (
            <span className="px-2 py-0.5 rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-400 text-[10px] font-medium border border-blue-600/20 capitalize">
              {filterState.budgetTier} budget
            </span>
          )}
          {filterState.ctaStyle !== DEFAULT_FILTERS.ctaStyle && (
            <span className="px-2 py-0.5 rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-400 text-[10px] font-medium border border-blue-600/20 capitalize">
              {filterState.ctaStyle} CTA
            </span>
          )}
          {filterState.language !== DEFAULT_FILTERS.language && (
            <span className="px-2 py-0.5 rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-400 text-[10px] font-medium border border-blue-600/20">
              {filterState.language}
            </span>
          )}
          {filterState.variantsPerGroup !== DEFAULT_FILTERS.variantsPerGroup && (
            <span className="px-2 py-0.5 rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-400 text-[10px] font-medium border border-blue-600/20">
              {filterState.variantsPerGroup}/group
            </span>
          )}
          <button
            onClick={onEditClick}
            className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            Edit
          </button>
        </div>
      )}
    </>
  );
}
