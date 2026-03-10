import { useEffect, useRef, useState } from 'react';
import {
  MessageSquareIcon,
  Trash2Icon,
  XIcon,
  SlidersHorizontalIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from 'lucide-react';
import { Button } from '../ui/Button';
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
          <div className="flex-shrink-0 bg-white border-b border-slate-200">
            {/* Toggle header */}
            <div className="px-5 py-2.5 flex items-center justify-between">
              <button
                onClick={() => setShowFilters((v) => !v)}
                className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
              >
                <SlidersHorizontalIcon className="w-4 h-4 text-slate-400" />
                {showFilters ? 'Hide Preferences' : 'Show Preferences'}
                {!showFilters && activeFilterCount > 0 && (
                  <span className="flex items-center justify-center w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-bold">
                    {activeFilterCount}
                  </span>
                )}
                {showFilters ? (
                  <ChevronUpIcon className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronDownIcon className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>
              {showFilters && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => filterDispatch({ type: 'RESET' })}
                    className="text-xs text-slate-500 hover:text-slate-700 font-medium transition-colors"
                  >
                    Reset
                  </button>
                  <Button size="sm" onClick={onApplyFilters}>
                    Apply
                  </Button>
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
            <div className="flex-shrink-0 bg-blue-50 border-b border-blue-100 px-5 py-2.5 flex items-center justify-between flex-wrap gap-2">
              <span className="text-sm font-medium text-blue-700">
                {selectedVariants.size} variant{selectedVariants.size > 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Button
                  size="sm"
                  variant="primary"
                  leftIcon={<MessageSquareIcon className="w-3.5 h-3.5" />}
                  onClick={onReviseSelected}
                >
                  Revise Selected
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  leftIcon={<Trash2Icon className="w-3.5 h-3.5" />}
                  onClick={onDeleteSelected}
                >
                  Delete
                </Button>
                <div className="w-px h-5 bg-blue-200 mx-0.5" />
                <button
                  onClick={onClearSelection}
                  className="p-1 rounded hover:bg-blue-100 transition-colors"
                  aria-label="Clear selection"
                >
                  <XIcon className="w-4 h-4 text-blue-400" />
                </button>
              </div>
            </div>
          )}

          {/* Variant grid */}
          <div className="flex-1 overflow-y-auto p-5">
            {adVariants.length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm text-slate-400">
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
