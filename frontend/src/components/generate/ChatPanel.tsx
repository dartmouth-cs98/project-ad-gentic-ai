// ChatPanel — gen-chat-panel wrapper
import { ChatHeader } from './ChatHeader';
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
  onCreateCampaign?: () => void;
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
  expressMode?: boolean;
  // Selection
  selectedVariantCount: number;
  onClearSelection: () => void;
  // AI state
  isAiLoading?: boolean;
  // Layout
  variantCount: number;
  style?: React.CSSProperties;
  className?: string;
  // Disabled (no campaign selected yet)
  disabled?: boolean;
}

export function ChatPanel({
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
  messages,
  userName,
  input,
  onInputChange,
  onSend,
  onApprovePlan,
  onDeclinePlan,
  expressMode,
  selectedVariantCount,
  onClearSelection,
  isAiLoading,
  variantCount,
  style,
  className,
  disabled,
}: ChatPanelProps) {
  return (
    <div
      className={`gen-chat-panel${disabled ? ' gen-chat-disabled' : ''}${className ? ` ${className}` : ''}`}
      style={style}
    >
      <ChatHeader
        phase={phase}
        campaigns={campaigns}
        activeCampaignId={activeCampaignId}
        onCampaignSelect={onCampaignSelect}
        onCreateCampaign={onCreateCampaign}
        isCampaignsLoading={isCampaignsLoading}
        activeVersion={activeVersion}
        versions={versions}
        onVersionSelect={onVersionSelect}
        filterState={filterState}
        filterDispatch={filterDispatch}
        variantCount={variantCount}
      />

      <ChatMessageList
        messages={messages}
        isGenerating={phase === 'generating' || !!isAiLoading}
        userName={userName}
        onApprovePlan={onApprovePlan}
        onDeclinePlan={onDeclinePlan}
        expressMode={expressMode}
        disabled={disabled}
      />

      <ChatInput
        value={input}
        onChange={onInputChange}
        onSend={onSend}
        phase={phase}
        disabled={disabled || isAiLoading}
        selectedVariantCount={selectedVariantCount}
        onClearSelection={onClearSelection}
      />
    </div>
  );
}
