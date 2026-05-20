import { CampaignSelector } from './CampaignSelector';
import { VersionPopover } from './VersionPopover';
import type { Campaign } from '../../types';
import type { Phase, Version } from './types';
import { PRESETS } from '../../hooks/useFilterState';
import type { FilterState, FilterAction, PresetKey } from '../../hooks/useFilterState';

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


export function ChatHeader({
  phase,
  campaigns,
  activeCampaignId,
  onCampaignSelect,
  onCreateCampaign,
  isCampaignsLoading,
  activeVersion,
  versions,
  onVersionSelect,
  filterState,
  filterDispatch,
  variantCount,
}: ChatHeaderProps) {
  return (
    <header className="border-b border-border px-4 pt-3 pb-2.5 flex-shrink-0">
      {/* Row 1: wordmark + version info */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span
          className="font-serif italic font-bold tracking-tight text-base whitespace-nowrap select-none"
          style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #818CF8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', padding: '0 3px', margin: '0 -3px' }}
        >
          Ad Studio
        </span>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {phase === 'idle' ? (
            <span
              className="px-2 py-1 rounded-md bg-muted text-xs font-medium text-muted-foreground cursor-default"
              title="No versions yet — generate ads to create your first version"
            >
              v0
            </span>
          ) : phase === 'generating' ? (
            <>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold">
                {variantCount} variants
              </span>
              <span className="px-2 py-1 rounded-md bg-muted text-xs font-semibold text-muted-foreground">
                {activeVersion.label} (generating...)
              </span>
            </>
          ) : (
            <>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold">
                {variantCount} variants
              </span>
              <VersionPopover
                activeVersion={activeVersion}
                versions={versions}
                onSelect={onVersionSelect}
              />
            </>
          )}
        </div>
      </div>

      {/* Row 2: campaign selector */}
      <div className="mb-2">
        <CampaignSelector
          campaigns={campaigns}
          activeCampaignId={activeCampaignId}
          onSelect={onCampaignSelect}
          onCreateCampaign={onCreateCampaign}
          isLoading={isCampaignsLoading}
        />
      </div>

      {/* Row 3: preset pills + active description (idle phase only) */}
      {phase === 'idle' && (
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            {(Object.keys(PRESETS) as PresetKey[]).map((key) => {
              const isActive = filterState.activePreset === key;
              return (
                <button
                  key={key}
                  onClick={() => filterDispatch({ type: 'SET_PRESET', payload: key })}
                  className={`px-2.5 py-1 rounded border text-[11px] font-medium transition-all ${
                    isActive
                      ? 'bg-foreground text-background border-foreground'
                      : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                  }`}
                >
                  {PRESETS[key].label}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground leading-none">
            {filterState.activePreset
              ? PRESETS[filterState.activePreset].description
              : 'Custom settings active'}
          </p>
        </div>
      )}
    </header>
  );
}
