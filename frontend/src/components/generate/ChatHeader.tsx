import { SparklesIcon, SlidersHorizontalIcon } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { CampaignSelector } from './CampaignSelector';
import { VersionPopover } from './VersionPopover';
import type { Campaign } from '../../types';
import type { Phase, Version } from './types';
import { countActiveFilters } from '../../hooks/useFilterState';
import type { FilterState } from '../../hooks/useFilterState';

interface ChatHeaderProps {
  phase: Phase;
  campaigns: Campaign[];
  activeCampaignId: number | undefined;
  onCampaignSelect: (campaign: Campaign) => void;
  isCampaignsLoading?: boolean;
  activeVersion: Version;
  versions: Version[];
  onVersionSelect: (version: Version) => void;
  filterState: FilterState;
  showFilterPanel: boolean;
  onToggleFilterPanel: () => void;
  variantCount: number;
}

export function ChatHeader({
  phase,
  campaigns,
  activeCampaignId,
  onCampaignSelect,
  isCampaignsLoading,
  activeVersion,
  versions,
  onVersionSelect,
  filterState,
  showFilterPanel,
  onToggleFilterPanel,
  variantCount,
}: ChatHeaderProps) {
  const activeFilterCount = countActiveFilters(filterState);
  const totalVariants = variantCount;

  return (
    <header className="border-b border-slate-100 px-4 py-2.5 flex-shrink-0">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
            <SparklesIcon className="w-3.5 h-3.5 text-white" />
          </div>
          <h2 className={`font-semibold text-slate-900 truncate ${phase !== 'idle' ? 'text-sm' : ''}`}>
            Ad Studio
          </h2>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Filter button — only in idle phase (results panel owns filters after generation) */}
          {phase === 'idle' && (
            <button
              data-filter-trigger
              onClick={(e) => {
                e.stopPropagation();
                onToggleFilterPanel();
              }}
              className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                showFilterPanel
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : activeFilterCount > 0
                    ? 'border-blue-300 bg-blue-50/50 text-blue-600'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
              }`}
              aria-label="Customize generation preferences"
            >
              <SlidersHorizontalIcon className="w-3.5 h-3.5" />
              <span>{activeFilterCount > 0 ? 'Preferences' : 'Set Preferences'}</span>
              {activeFilterCount > 0 && (
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
          )}

          {/* Version indicator — always visible */}
          {phase === 'idle' ? (
            <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 text-xs font-medium text-slate-400 cursor-default" title="No versions yet — generate ads to create your first version">
              v0
            </span>
          ) : phase === 'generating' ? (
            <>
              <Badge variant="success" className="text-[10px]">
                {totalVariants} variants
              </Badge>
              <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 text-xs font-semibold text-slate-500">
                {activeVersion.label} (generating...)
              </span>
            </>
          ) : (
            <>
              <Badge variant="success" className="text-[10px]">
                {totalVariants} variants
              </Badge>
              <VersionPopover
                activeVersion={activeVersion}
                versions={versions}
                onSelect={onVersionSelect}
              />
            </>
          )}
        </div>
      </div>

      {/* Campaign selector */}
      <div className="mt-2">
        <CampaignSelector
          campaigns={campaigns}
          activeCampaignId={activeCampaignId}
          onSelect={onCampaignSelect}
          isLoading={isCampaignsLoading}
        />
      </div>
    </header>
  );
}
