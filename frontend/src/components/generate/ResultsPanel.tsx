import { useEffect, useRef, useState } from 'react';
import {
  MessageSquareIcon,
  Trash2Icon,
  XIcon,
  SlidersHorizontalIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  CheckCircle2Icon,
} from 'lucide-react';
import { FilterControls } from './FilterControls';
import { AdVariantCard } from './AdVariantCard';
import { GeneratingView } from './GeneratingView';
import { VariantGroupSection } from '../shared/VariantGroupSection';
import type { Phase } from './types';
import type { AdVariant } from '../../types';
import type { FilterState, FilterAction } from '../../hooks/useFilterState';
import { countActiveFilters } from '../../hooks/useFilterState';
import { useGroupedVariants } from '../../hooks/useGroupedVariants';

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
  onApproveSelected: () => void;
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
  onApproveSelected,
  onApplyFilters,
}: ResultsPanelProps) {
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const [variantCols, setVariantCols] = useState(2);
  const [showFilters, setShowFilters] = useState(true);
  const activeFilterCount = countActiveFilters(filterState);
  const groups = useGroupedVariants(adVariants);

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

          {/* Selection Action Bar — always visible once variants exist */}
          {adVariants.length > 0 && (
            <div className="flex-shrink-0 bg-card border-b border-border px-5 py-2.5 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedVariants.size === adVariants.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        adVariants
                          .filter((v) => !selectedVariants.has(String(v.id)))
                          .forEach((v) => onVariantToggle(String(v.id)));
                      } else {
                        onClearSelection();
                      }
                    }}
                    className="w-3.5 h-3.5 rounded accent-blue-600"
                  />
                </label>
                <span className="text-sm font-medium text-muted-foreground">
                  {selectedVariants.size > 0
                    ? `${selectedVariants.size} variant${selectedVariants.size > 1 ? 's' : ''} selected`
                    : 'Select variants to take action'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={onApproveSelected}
                  disabled={selectedVariants.size === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed enabled:hover:bg-emerald-700"
                >
                  <CheckCircle2Icon className="w-3.5 h-3.5" />
                  {selectedVariants.size === adVariants.length ? 'Approve All' : 'Approve Selected'}
                </button>
                <button
                  onClick={onReviseSelected}
                  disabled={selectedVariants.size === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed enabled:hover:bg-blue-700"
                >
                  <MessageSquareIcon className="w-3.5 h-3.5" />
                  Revise Selected
                </button>
                <button
                  onClick={onDeleteSelected}
                  disabled={selectedVariants.size === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-red-500/20 text-red-500 text-xs font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed enabled:hover:bg-red-500/10"
                >
                  <Trash2Icon className="w-3.5 h-3.5" />
                  Delete
                </button>
                {selectedVariants.size > 0 && (
                  <>
                    <div className="w-px h-5 bg-border mx-0.5" />
                    <button
                      onClick={onClearSelection}
                      className="p-1 rounded hover:bg-muted transition-colors"
                      aria-label="Clear selection"
                    >
                      <XIcon className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Variant grid — grouped by persona */}
          <div className="flex-1 overflow-y-auto p-5">
            {adVariants.length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                No ad variants found for this campaign.
              </div>
            ) : (
              <div className="space-y-6">
                {groups.map((group) => {
                  const approvedCount = group.variants.filter((v) => v.is_approved).length;
                  return (
                    <VariantGroupSection
                      key={group.key}
                      name={group.name}
                      isGeneral={group.isGeneral}
                      approvedCount={approvedCount}
                      totalCount={group.variants.length}
                    >
                      <div
                        className="grid gap-4"
                        style={{ gridTemplateColumns: `repeat(${variantCols}, minmax(0, 1fr))` }}
                      >
                        {group.variants.map((variant) => (
                          <AdVariantCard
                            key={variant.id}
                            variant={variant}
                            isSelected={selectedVariants.has(String(variant.id))}
                            onToggle={onVariantToggle}
                          />
                        ))}
                      </div>
                    </VariantGroupSection>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
