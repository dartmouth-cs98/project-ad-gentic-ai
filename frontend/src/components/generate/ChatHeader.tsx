import { SlidersHorizontalIcon, Sun, Moon } from 'lucide-react';
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
  onCreateCampaign?: () => void;
  isCampaignsLoading?: boolean;
  activeVersion: Version;
  versions: Version[];
  onVersionSelect: (version: Version) => void;
  filterState: FilterState;
  showFilterPanel: boolean;
  onToggleFilterPanel: () => void;
  variantCount: number;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
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
  showFilterPanel,
  onToggleFilterPanel,
  variantCount,
  theme,
  onToggleTheme,
}: ChatHeaderProps) {
  const activeFilterCount = countActiveFilters(filterState);
  const totalVariants = variantCount;

  return (
    <header className="border-b border-border px-4 py-2.5 flex-shrink-0">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" />
          <h2 className={`font-semibold text-foreground truncate ${phase !== 'idle' ? 'text-sm' : ''}`}>
            Ad Studio
          </h2>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Filter button — only in idle phase */}
          {phase === 'idle' && (
            <button
              data-filter-trigger
              onClick={(e) => {
                e.stopPropagation();
                onToggleFilterPanel();
              }}
              className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                showFilterPanel
                  ? 'border-blue-600 bg-blue-600/10 text-blue-600 dark:text-blue-400'
                  : activeFilterCount > 0
                    ? 'border-blue-600/30 bg-blue-600/5 text-blue-600 dark:text-blue-400'
                    : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
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

          {/* Version indicator */}
          {phase === 'idle' ? (
            <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-xs font-medium text-muted-foreground cursor-default" title="No versions yet — generate ads to create your first version">
              v0
            </span>
          ) : phase === 'generating' ? (
            <>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold">
                {totalVariants} variants
              </span>
              <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-xs font-semibold text-muted-foreground">
                {activeVersion.label} (generating...)
              </span>
            </>
          ) : (
            <>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold">
                {totalVariants} variants
              </span>
              <VersionPopover
                activeVersion={activeVersion}
                versions={versions}
                onSelect={onVersionSelect}
              />
            </>
          )}

          {/* Theme toggle */}
          <button
            onClick={onToggleTheme}
            className="p-1.5 border border-border rounded-lg hover:bg-muted transition-colors text-muted-foreground"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Campaign selector */}
      <div className="mt-2">
        <CampaignSelector
          campaigns={campaigns}
          activeCampaignId={activeCampaignId}
          onSelect={onCampaignSelect}
          onCreateCampaign={onCreateCampaign}
          isLoading={isCampaignsLoading}
        />
      </div>
    </header>
  );
}
