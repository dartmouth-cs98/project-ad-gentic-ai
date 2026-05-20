import { SlidersHorizontalIcon, XIcon } from 'lucide-react';
import { FilterControls } from './FilterControls';
import type { FilterState, FilterAction } from '../../hooks/useFilterState';
import { countActiveFilters } from '../../hooks/useFilterState';
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
}: FilterPanelProps) {
  const activeFilterCount = countActiveFilters(filterState);

  if (!isOpen) return null;

  return (
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
            <span className="text-[10px] text-muted-foreground font-medium">
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
            className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded hover:bg-primary/90 transition-colors"
          >
            Apply
          </button>
          <button
            onClick={onClose}
            className="ml-1 p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
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
  );
}
