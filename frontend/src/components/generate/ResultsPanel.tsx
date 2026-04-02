import { useEffect, useRef, useState } from 'react';
import {
  MessageSquareIcon,
  Trash2Icon,
  XIcon,
  SlidersHorizontalIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from 'lucide-react';
import { FilterControls } from './FilterControls';
import { AdVariantCard } from './AdVariantCard';
import { GeneratingView } from './GeneratingView';
import type { Phase } from './types';
import type { AdVariant } from '../../types';
import type { FilterState, FilterAction } from '../../hooks/useFilterState';
import { countActiveFilters } from '../../hooks/useFilterState';

interface ResultsPanelProps {
  phase: Phase;
  filterState: FilterState;
  filterDispatch: React.Dispatch<FilterAction>;
  adVariants: AdVariant[];
  progressIdx: number;
  // Selection
  selectedVariants: Set<string>;
  onVariantToggle: (variantId: string) => void;
  onClearSelection: () => void;
  // Actions
  onReviseSelected: () => void;
  onDeleteSelected: () => void;
  // Filters
  onApplyFilters?: () => void;
}

export function ResultsPanel({
  phase,
  filterState,
  filterDispatch,
  adVariants,
  progressIdx,
  selectedVariants,
  onVariantToggle,
  onClearSelection,
  onReviseSelected,
  onDeleteSelected,
  onApplyFilters,
}: ResultsPanelProps) {
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const [variantCols, setVariantCols] = useState(2);
  const [showFilters, setShowFilters] = useState(true);
  const activeFilterCount = countActiveFilters(filterState);

  // Responsive variant grid columns
  useEffect(() => {
    if (!rightPanelRef.current || phase !== 'results') return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w < 500) setVariantCols(1);
        else if (w < 800) setVariantCols(2);
        else if (w < 1100) setVariantCols(3);
        else setVariantCols(4);
      }
    });
    observer.observe(rightPanelRef.current);
    return () => observer.disconnect();
  }, [phase]);

  return (
    <div ref={rightPanelRef} className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
      {/* GENERATING */}
      {phase === 'generating' && (
        <GeneratingView progressIdx={progressIdx} variantCount={6} />
      )}

      {/* RESULTS */}
      {phase === 'results' && (
        <>
          {/* Preferences Toolbar */}
          <div className="flex-shrink-0 bg-card border-b border-border">
            {/* Toggle header */}
            <div className="px-5 py-2.5 flex items-center justify-between">
              <button
                onClick={() => setShowFilters((v) => !v)}
                className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-foreground/80 transition-colors"
              >
                <SlidersHorizontalIcon className="w-4 h-4 text-muted-foreground" />
                {showFilters ? 'Hide Preferences' : 'Show Preferences'}
                {!showFilters && activeFilterCount > 0 && (
                  <span className="flex items-center justify-center w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-bold">
                    {activeFilterCount}
                  </span>
                )}
                {showFilters ? (
                  <ChevronUpIcon className="w-3.5 h-3.5 text-muted-foreground" />
                ) : (
                  <ChevronDownIcon className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </button>
              {showFilters && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => filterDispatch({ type: 'RESET' })}
                    className="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
                  >
                    Reset
                  </button>
                  <button
                    onClick={onApplyFilters}
                    className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>
            {/* Collapsible filter controls */}
            {showFilters && (
              <div className="px-5 pb-3">
                <FilterControls filterState={filterState} filterDispatch={filterDispatch} compact />
              </div>
            )}
          </div>

          {/* Selection Action Bar */}
          {selectedVariants.size > 0 && (
            <div className="flex-shrink-0 bg-blue-600/10 border-b border-blue-600/20 px-5 py-2.5 flex items-center justify-between flex-wrap gap-2">
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                {selectedVariants.size} variant{selectedVariants.size > 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={onReviseSelected}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <MessageSquareIcon className="w-3.5 h-3.5" />
                  Revise Selected
                </button>
                <button
                  onClick={onDeleteSelected}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-red-500/20 text-red-500 text-xs font-medium rounded-lg hover:bg-red-500/10 transition-colors"
                >
                  <Trash2Icon className="w-3.5 h-3.5" />
                  Delete
                </button>
                <div className="w-px h-5 bg-blue-600/20 mx-0.5" />
                <button
                  onClick={onClearSelection}
                  className="p-1 rounded hover:bg-blue-600/10 transition-colors"
                  aria-label="Clear selection"
                >
                  <XIcon className="w-4 h-4 text-blue-600/60 dark:text-blue-400/60" />
                </button>
              </div>
            </div>
          )}

          {/* Variant grid */}
          <div className="flex-1 overflow-y-auto p-5">
            {adVariants.length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                No ad variants found for this campaign.
              </div>
            ) : (
              <div
                className="grid gap-4"
                style={{ gridTemplateColumns: `repeat(${variantCols}, minmax(0, 1fr))` }}
              >
                {adVariants.map((variant) => (
                  <AdVariantCard
                    key={variant.id}
                    variant={variant}
                    isSelected={selectedVariants.has(String(variant.id))}
                    onToggle={onVariantToggle}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
