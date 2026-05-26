// ChatHeader — campaign chip + new-chat icon button
import { CampaignSelector } from './CampaignSelector';
import type { Campaign } from '../../types';
import type { Phase, Version } from './types';
import type { FilterState, FilterAction } from '../../hooks/useFilterState';

interface ChatHeaderProps {
  phase: Phase;
  campaigns: Campaign[];
  activeCampaignId: number | undefined;
  onCampaignSelect: (campaign: Campaign) => void;
  onCreateCampaign?: () => void;
  isCampaignsLoading?: boolean;
  activeVersion: Version;
  versions: Version[];
  onVersionSelect: (version: Version) => void;
  filterState: FilterState;
  filterDispatch: React.Dispatch<FilterAction>;
  variantCount: number;
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" width={14} height={14}>
      <path d="M7 2v10M2 7h10" />
    </svg>
  );
}

export function ChatHeader({
  phase,
  campaigns,
  activeCampaignId,
  onCampaignSelect,
  onCreateCampaign,
  isCampaignsLoading,
  activeVersion,
  variantCount,
}: ChatHeaderProps) {
  const activeCampaign = campaigns.find((c) => c.id === activeCampaignId);

  return (
    <header className="gen-chat-head">
      {/* Campaign chip / no-campaign label */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {activeCampaign ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <span className="gen-chip-mark" aria-hidden="true" />
            <div className="gen-chip-stack" style={{ flex: 1, minWidth: 0 }}>
              <span className="gen-chip-idx">
                CAMP · {String(campaigns.indexOf(activeCampaign) + 1).padStart(2, '0')}
              </span>
              <span className="gen-chip-name">{activeCampaign.name}</span>
            </div>
            {phase !== 'idle' && (
              <span style={{
                fontFamily: "'Geist Mono', monospace",
                fontSize: 10,
                letterSpacing: '0.04em',
                color: 'var(--as-ink-3)',
                flexShrink: 0,
              }}>
                {activeVersion.label}{variantCount > 0 ? ` · ${variantCount}V` : ''}
              </span>
            )}
          </div>
        ) : (
          <span style={{
            fontFamily: "'Geist Mono', monospace",
            fontSize: 11,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--as-ink-3)',
          }}>
            — NO CAMPAIGN · PICK ONE TO BEGIN
          </span>
        )}
      </div>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        {activeCampaign && (
          <CampaignSelector
            campaigns={campaigns}
            activeCampaignId={activeCampaignId}
            onSelect={onCampaignSelect}
            onCreateCampaign={onCreateCampaign}
            isLoading={isCampaignsLoading}
          />
        )}
        <button
          className="as-icon-btn"
          title="New campaign"
          aria-label="New campaign"
          disabled={phase === 'generating'}
          onClick={onCreateCampaign}
          style={{ width: 32, height: 32 }}
        >
          <PlusIcon />
        </button>
      </div>
    </header>
  );
}
