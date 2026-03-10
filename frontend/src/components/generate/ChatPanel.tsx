import { useState } from 'react';
import { ChatHeader } from './ChatHeader';
import { FilterPanel } from './FilterPanel';
import { ChatMessageList } from './ChatMessageList';
import { ChatInput } from './ChatInput';
import type { Campaign, ChatMessage } from '../../types';
import type { Phase, Version } from './types';
import type { FilterState, FilterAction } from '../../hooks/useFilterState';

interface ChatPanelProps {
  phase: Phase;
  // Campaign
  campaigns: Campaign[];
  activeCampaignId: number | undefined;
  onCampaignSelect: (campaign: Campaign) => void;
  isCampaignsLoading?: boolean;
  // Version
  activeVersion: Version;
  versions: Version[];
  onVersionSelect: (version: Version) => void;
  // Filter
  filterState: FilterState;
  filterDispatch: React.Dispatch<FilterAction>;
  // Chat
  messages: ChatMessage[];
  userName: string;
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  // Plan actions
  onApprovePlan?: (message: ChatMessage) => void;
  onDeclinePlan?: (message: ChatMessage) => void;
  // Selection
  selectedVariantCount: number;
  onClearSelection: () => void;
  // AI state
  isAiLoading?: boolean;
  // Layout
  variantCount: number;
  style?: React.CSSProperties;
  className?: string;
}

export function ChatPanel({
  phase,
  campaigns,
  activeCampaignId,
  onCampaignSelect,
  isCampaignsLoading,
  activeVersion,
  versions,
  onVersionSelect,
  filterState,
  filterDispatch,
  messages,
  userName,
  input,
  onInputChange,
  onSend,
  onApprovePlan,
  onDeclinePlan,
  selectedVariantCount,
  onClearSelection,
  isAiLoading,
  variantCount,
  style,
  className,
}: ChatPanelProps) {
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  return (
    <div
      className={`flex flex-col h-full bg-white border-r border-slate-200 relative ${className ?? ''}`}
      style={style}
    >
      <ChatHeader
        phase={phase}
        campaigns={campaigns}
        activeCampaignId={activeCampaignId}
        onCampaignSelect={onCampaignSelect}
        isCampaignsLoading={isCampaignsLoading}
        activeVersion={activeVersion}
        versions={versions}
        onVersionSelect={onVersionSelect}
        filterState={filterState}
        showFilterPanel={showFilterPanel}
        onToggleFilterPanel={() => setShowFilterPanel((v) => !v)}
        variantCount={variantCount}
      />

      {/* Filter panel only in idle phase — results panel owns filters after generation */}
      {phase === 'idle' && (
        <FilterPanel
          filterState={filterState}
          filterDispatch={filterDispatch}
          isOpen={showFilterPanel}
          onClose={() => setShowFilterPanel(false)}
          phase={phase}
          onEditClick={() => setShowFilterPanel(true)}
        />
      )}

      <ChatMessageList
        messages={messages}
        isGenerating={phase === 'generating' || !!isAiLoading}
        userName={userName}
        onApprovePlan={onApprovePlan}
        onDeclinePlan={onDeclinePlan}
      />

      <ChatInput
        value={input}
        onChange={onInputChange}
        onSend={onSend}
        phase={phase}
        disabled={isAiLoading}
        selectedVariantCount={selectedVariantCount}
        onClearSelection={onClearSelection}
      />
    </div>
  );
}
