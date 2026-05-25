// ResultsPanel — full spec implementation:
//   idle + !chatStarted → PickCampaignState
//   idle + chatStarted + no variants → EmptyBriefState
//   generating → GeneratingView (progress meter)
//   results → variant grid with selection bar + filter drawer
import { useState } from 'react';
import { FilterPanel } from './FilterPanel';
import { AdVariantCard } from './AdVariantCard';
import { GeneratingView } from './GeneratingView';
import { VariantGroupSection } from '../shared/VariantGroupSection';
import type { Phase, Version } from './types';
import type { AdVariant } from '../../types';
import type { Campaign } from '../../types';
import type { FilterState, FilterAction } from '../../hooks/useFilterState';
import { countActiveFilters } from '../../hooks/useFilterState';
import { useGroupedVariants } from '../../hooks/useGroupedVariants';

interface ResultsPanelProps {
  phase: Phase;
  filterState: FilterState;
  filterDispatch: React.Dispatch<FilterAction>;
  adVariants: AdVariant[];
  progressIdx: number;
  // Version (optional)
  versions?: Version[];
  activeVersion?: Version;
  onVersionSelect?: (v: Version) => void;
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
  // Pick-campaign / empty-brief state props
  chatStarted: boolean;
  campaigns: Campaign[];
  isCampaignsLoading?: boolean;
  onCampaignSelect: (c: Campaign) => void;
  onNewCampaign: () => void;
  onSendExample?: (text: string) => void;
}

// ── Icons ─────────────────────────────────────────────────────────

function SlidersIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width={13} height={13}>
      <path d="M1 3h12M1 7h12M1 11h12" />
      <circle cx="4" cy="3" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="9" cy="7" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="5" cy="11" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" width={13} height={13}>
      <path d="M2 2l10 10M12 2L2 12" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width={14} height={14}>
      <path d="M2 7h10M8 3l4 4-4 4" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" width={18} height={18}>
      <path d="M9 3v12M3 9h12" />
    </svg>
  );
}

// ── Pick Campaign State ────────────────────────────────────────────

function PickCampaignState({
  campaigns,
  isLoading,
  onPick,
  onNew,
}: {
  campaigns: Campaign[];
  isLoading?: boolean;
  onPick: (c: Campaign) => void;
  onNew: () => void;
}) {
  return (
    <div className="gen-pick-state">
      <div className="gen-pick-inner">
        <span className="gen-pick-eyebrow">— GENERATE · NEW SESSION</span>
        <h2 className="gen-pick-h">Pick a campaign to begin.</h2>
        <p className="gen-pick-deck">
          The strategist needs a campaign context — product, audience, goals — before it can
          draft a plan. Continue an existing one or start fresh.
        </p>

        <div className="gen-pick-list">
          <div className="gen-pick-list-h">
            {isLoading ? 'LOADING…' : `RECENT · ${Math.min(campaigns.length, 5)}`}
          </div>
          {isLoading ? (
            [1,2,3].map((i) => (
              <div key={i} style={{
                height: 56,
                borderTop: '1px solid var(--as-rule)',
                background: 'var(--as-paper)',
                opacity: 0.5,
                animation: 'as-pulse 1.4s ease-in-out infinite',
              }} />
            ))
          ) : campaigns.slice(0, 5).map((c, i) => (
            <button
              key={c.id}
              className="gen-pick-row"
              onClick={() => onPick(c)}
            >
              <span className="gen-pick-idx">
                CMP · {String(i + 1).padStart(2, '0')}
              </span>
              <div className="gen-pick-name-block">
                <span className="gen-pick-name">{c.name}</span>
                <div className="gen-pick-row-meta">
                  <span>{c.goal ?? 'NO GOAL SET'}</span>
                  <span className="sep">·</span>
                  <span>{c.status?.toUpperCase()}</span>
                </div>
              </div>
              <span className={`gen-pick-status status-${c.status ?? 'draft'}`}>
                <span className="d" />
                {c.status}
              </span>
              <span className="gen-pick-arr"><ArrowIcon /></span>
            </button>
          ))}
        </div>

        <div className="gen-pick-divider">
          <span>— OR —</span>
        </div>

        <button className="gen-pick-new" onClick={onNew}>
          <span className="gen-pick-new-icon"><PlusIcon /></span>
          <div className="gen-pick-new-text">
            <span className="gen-pick-new-title">Start a new campaign</span>
            <span className="gen-pick-new-sub">CMP · {String(campaigns.length + 1).padStart(2, '0')} · DRAFT</span>
          </div>
          <span className="gen-pick-arr"><ArrowIcon /></span>
        </button>
      </div>
    </div>
  );
}

// ── Empty Brief State (campaign set, no variants yet) ───────────────

const EXAMPLES = [
  { idx: 'EX.01', text: 'Generate 6 ads for our product — use the late-night persona, urban commute angle.' },
  { idx: 'EX.02', text: 'Same audience, focus on the rain-ready hook this time, drop the price mentions.' },
  { idx: 'EX.03', text: 'Try a more confident tone for the Skeptic persona; everything else stays the same.' },
];

function EmptyBriefState({ onTry }: { onTry: (text: string) => void }) {
  return (
    <div className="gen-empty-brief">
      <div className="gen-empty-brief-inner">
        <div className="gen-corner-marks">
          <div className="gen-corner-plus">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" width={20} height={20}>
              <path d="M10 3v14M3 10h14" />
            </svg>
          </div>
        </div>

        <h2 className="gen-empty-h">Brief the strategist.</h2>
        <p className="gen-empty-deck">
          Tell us what you want to advertise. We'll draft a plan, score it against your
          personas, and ship six variants you can approve.
        </p>

        <div className="gen-hints">
          {EXAMPLES.map((e) => (
            <button key={e.idx} className="gen-hint" onClick={() => onTry(e.text)}>
              <span className="h-idx">{e.idx}</span>
              <span className="h-text">{e.text}</span>
              <span className="h-enter">↵</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────

export function ResultsPanel({
  phase,
  filterState,
  filterDispatch,
  adVariants,
  progressIdx,
  versions,
  activeVersion,
  onVersionSelect,
  selectedVariants,
  onVariantToggle,
  onClearSelection,
  onReviseSelected,
  onDeleteSelected,
  onApproveSelected,
  onApplyFilters,
  chatStarted,
  campaigns,
  isCampaignsLoading,
  onCampaignSelect,
  onNewCampaign,
  onSendExample,
}: ResultsPanelProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const activeFilterCount = countActiveFilters(filterState);
  const groups = useGroupedVariants(adVariants);
  const selectedCount = selectedVariants.size;
  const versionList = versions ?? [];
  const activeVer = activeVersion ?? { id: 'v0', label: 'v0', timestamp: '', variantCount: 0 };

  return (
    <div className="gen-results-panel">

      {/* ── Pick campaign (no chat started) ── */}
      {!chatStarted && (
        <PickCampaignState
          campaigns={campaigns}
          isLoading={isCampaignsLoading}
          onPick={onCampaignSelect}
          onNew={onNewCampaign}
        />
      )}

      {/* ── Empty brief (campaign set, idle, no variants) ── */}
      {chatStarted && phase === 'idle' && adVariants.length === 0 && (
        <EmptyBriefState onTry={(text) => onSendExample?.(text)} />
      )}

      {/* ── Generating ── */}
      {phase === 'generating' && (
        <GeneratingView progressIdx={progressIdx} variantCount={6} />
      )}

      {/* ── Results ── */}
      {phase === 'results' && (
        <>
          {/* Head bar */}
          <div className="gen-results-head">
            <span className="gen-results-context">
              — RESULTS · {adVariants.length} VARIANTS
            </span>

            {versionList.length > 0 && (
              <div className="gen-version-row">
                <span className="gen-version-label">VERSIONS</span>
                {versionList.map((v) => (
                  <button
                    key={v.id}
                    className={`gen-version-chip${v.id === activeVer.id ? ' on' : ''}`}
                    onClick={() => onVersionSelect?.(v)}
                  >
                    <span>{v.label}</span>
                    <span className="vcount">· {v.variantCount}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="gen-head-actions">
              <button
                className="as-btn-ghost"
                onClick={() => setDrawerOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', fontSize: 12 }}
              >
                <SlidersIcon />
                Filters
                {activeFilterCount > 0 && (
                  <span style={{
                    fontFamily: "'Geist Mono', monospace",
                    fontSize: 10,
                    background: 'var(--as-accent)',
                    color: 'white',
                    padding: '1px 5px',
                    letterSpacing: '0.02em',
                  }}>
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* Selection bar overlays head */}
            {selectedCount > 0 && (
              <div className="gen-selection-bar">
                <span className="gen-selection-count">{selectedCount} SELECTED</span>
                <div className="gen-selection-actions">
                  <button className="gen-sb-btn" onClick={onReviseSelected}>Revise</button>
                  <button className="gen-sb-btn" onClick={onDeleteSelected}>Delete</button>
                  <button className="gen-sb-btn primary" onClick={onApproveSelected}>
                    Approve {selectedCount}
                  </button>
                </div>
                <button className="gen-sb-clear" onClick={onClearSelection} aria-label="Clear selection">
                  <XIcon />
                </button>
              </div>
            )}
          </div>

          {/* Variant grid */}
          <div className="gen-results-body">
            {adVariants.length === 0 ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                fontFamily: "'Geist Mono', monospace",
                fontSize: 11,
                letterSpacing: '0.08em',
                color: 'var(--as-ink-3)',
                textTransform: 'uppercase',
              }}>
                NO AD VARIANTS FOUND FOR THIS CAMPAIGN
              </div>
            ) : (
              <>
                {groups.map((group) => {
                  const approvedCount = group.variants.filter((v) => v.is_approved).length;
                  return (
                    <div key={group.key} className="gen-persona-group">
                      <VariantGroupSection
                        name={group.name}
                        isGeneral={group.isGeneral}
                        approvedCount={approvedCount}
                        totalCount={group.variants.length}
                      >
                        <div className="gen-variants-grid">
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
                    </div>
                  );
                })}
              </>
            )}
          </div>

          <FilterPanel
            filterState={filterState}
            filterDispatch={filterDispatch}
            isOpen={drawerOpen}
            onClose={() => { setDrawerOpen(false); onApplyFilters?.(); }}
            phase={phase}
            onEditClick={() => setDrawerOpen(true)}
          />
        </>
      )}
    </div>
  );
}
