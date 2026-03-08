import { useEffect, useState, useRef, useMemo } from 'react';
import { useCompany } from '../contexts/CompanyContext';
import { useUser } from '../contexts/UserContext';
import { Sidebar } from '../components/layout/Sidebar';
import { ChatPanel, ResultsPanel } from '../components/generate';
import type { Phase, Version, PersonaGroup } from '../components/generate';
import type { Campaign, ChatMessage } from '../types';
import { useFilterState } from '../hooks/useFilterState';
import { useResizablePanel } from '../hooks/useResizablePanel';
import { useCampaigns } from '../hooks/useCampaigns';
import { useChatMessages, useSendChatMessage } from '../hooks/useChatMessages';
import {
  personaGroups as mockPersonaGroups,
  mockVersionHistory,
} from '../components/generate/mockData';

// ─── Constants ──────────────────────────────────────────────────

const WELCOME_MESSAGE: ChatMessage = {
  id: 0,
  campaign_id: 0,
  business_client_id: 0,
  role: 'assistant',
  message_type: 'message',
  content: "Hey! Tell me what product or service you want to advertise, and I'll generate persona-targeted ad variants for you.",
  version_ref: null,
  timestamp: new Date().toISOString(),
};

// ─── Helpers ─────────────────────────────────────────────────────

function getSelectedGroupNames(selectedIds: Set<string>, groups: PersonaGroup[]): string[] {
  const names: string[] = [];
  for (const g of groups) {
    if (g.variants.some((v) => selectedIds.has(v.id))) names.push(g.name);
  }
  return names;
}

// ─── Main Component ──────────────────────────────────────────────

export function GenerateAdsPage() {
  const { profile } = useCompany();
  const { user } = useUser();
  const businessClientId = user?.client_id;

  // ─── Data hooks ──────────────────────────────────────────────
  const { data: campaigns = [], isLoading: isCampaignsLoading } = useCampaigns(businessClientId);
  const [filterState, filterDispatch] = useFilterState();

  // ─── Core state ──────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>('idle');
  const [sidebarManualExpand, setSidebarManualExpand] = useState(false);
  const [input, setInput] = useState('');
  const [progressIdx, setProgressIdx] = useState(0);

  // Campaign & version state
  const [activeCampaignId, setActiveCampaignId] = useState<number | undefined>(undefined);
  const [activeVersion, setActiveVersion] = useState<Version>(mockVersionHistory[0]);
  const [versionCounter, setVersionCounter] = useState(3);

  // ─── Chat messages (persisted via API) ────────────────────────
  const { data: serverMessages = [] } = useChatMessages(activeCampaignId);
  const sendMessage = useSendChatMessage();

  // Show welcome message when no persisted messages exist
  const messages: ChatMessage[] = useMemo(
    () => (serverMessages.length === 0 ? [WELCOME_MESSAGE] : serverMessages),
    [serverMessages],
  );

  /** Persist an assistant message to the current campaign. */
  const sendAssistantMessage = (content: string, messageType: ChatMessage['message_type'] = 'message') => {
    if (!activeCampaignId) return;
    sendMessage.mutate({
      campaign_id: activeCampaignId,
      role: 'assistant',
      message_type: messageType,
      content,
    });
  };

  // Variants state
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['young-pros']));
  const [selectedVariants, setSelectedVariants] = useState<Set<string>>(new Set());

  // ─── Resizable panel ────────────────────────────────────────
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const { panelWidth: chatPanelWidth, isDragging, handleDragStart } = useResizablePanel({
    containerRef: splitContainerRef,
  });

  // ─── Sidebar collapse ───────────────────────────────────────
  const sidebarCollapsed = phase !== 'idle' && !sidebarManualExpand;

  // ─── Set first campaign as active when campaigns load ───────
  useEffect(() => {
    if (campaigns.length > 0 && activeCampaignId === undefined) {
      setActiveCampaignId(campaigns[0].id);
    }
  }, [campaigns, activeCampaignId]);

  // ─── Progress animation during generating ───────────────────
  useEffect(() => {
    if (phase !== 'generating') return;
    setProgressIdx(0);
    const interval = setInterval(() => {
      setProgressIdx((prev) => {
        if (prev >= 2) { clearInterval(interval); return prev; }
        return prev + 1;
      });
    }, 1200);
    return () => clearInterval(interval);
  }, [phase]);

  // ─── Auto-transition from generating to results ─────────────
  useEffect(() => {
    if (phase !== 'generating') return;
    const timer = setTimeout(() => {
      setPhase('results');
      const newV = versionCounter + 1;
      setVersionCounter(newV);
      const newVersion: Version = {
        id: `v${newV}`,
        label: `v${newV}`,
        timestamp: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
        variantCount: mockPersonaGroups.reduce((s, g) => s + g.variants.length, 0),
      };
      setActiveVersion(newVersion);
      sendAssistantMessage(
        `Done! I've generated 10 ad variants across 3 persona groups (${newVersion.label}). Use the controls to refine, or tell me what to change.`,
      );
    }, 4000);
    return () => clearTimeout(timer);
  }, [phase, versionCounter, activeCampaignId]);

  // ─── Handlers ───────────────────────────────────────────────

  const handleSend = () => {
    if (!input.trim() || !activeCampaignId) return;

    // Persist user message
    sendMessage.mutate({
      campaign_id: activeCampaignId,
      role: 'user',
      content: input,
    });
    setInput('');

    if (phase === 'idle') {
      setTimeout(() => {
        sendAssistantMessage('Got it! Generating persona-targeted variants now...');
        setPhase('generating');
      }, 600);
    } else if (phase === 'results') {
      setPhase('generating');
      setTimeout(() => {
        sendAssistantMessage("Updated! I've refined the variants based on your feedback.");
      }, 600);
    }
  };

  const handleCampaignSelect = (campaign: Campaign) => {
    setActiveCampaignId(campaign.id);
    // Messages auto-load via useChatMessages(campaign.id) — no manual reset needed
    if (phase === 'results') setSelectedVariants(new Set());
  };

  const handleVersionSelect = (version: Version) => {
    setActiveVersion(version);
    sendAssistantMessage(
      `Loaded ${version.label} (${version.timestamp}) with ${version.variantCount} variants.`,
    );
  };

  const handleReviseSelected = () => {
    const groupNames = getSelectedGroupNames(selectedVariants, mockPersonaGroups);
    const count = selectedVariants.size;
    const groupLabel = groupNames.length === 1 ? `in ${groupNames[0]}` : `across ${groupNames.join(', ')}`;
    setInput(`Revise ${count} selected variant${count > 1 ? 's' : ''} ${groupLabel}: `);
  };

  const handleDuplicateSelected = () => {
    sendAssistantMessage(`Duplicated ${selectedVariants.size} variant${selectedVariants.size > 1 ? 's' : ''}. You can find the copies in each persona group.`);
    setSelectedVariants(new Set());
  };

  const handleExcludeSelected = () => {
    sendAssistantMessage(`Marked ${selectedVariants.size} variant${selectedVariants.size > 1 ? 's' : ''} as excluded from export.`);
    setSelectedVariants(new Set());
  };

  const handleDeleteSelected = () => {
    sendAssistantMessage(`Removed ${selectedVariants.size} variant${selectedVariants.size > 1 ? 's' : ''} from this version.`);
    setSelectedVariants(new Set());
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const n = new Set(prev);
      n.has(groupId) ? n.delete(groupId) : n.add(groupId);
      return n;
    });
  };

  const toggleVariant = (variantId: string) => {
    setSelectedVariants((prev) => {
      const n = new Set(prev);
      n.has(variantId) ? n.delete(variantId) : n.add(variantId);
      return n;
    });
  };

  const toggleGroupSelect = (group: PersonaGroup) => {
    const allSelected = group.variants.every((v) => selectedVariants.has(v.id));
    setSelectedVariants((prev) => {
      const n = new Set(prev);
      group.variants.forEach((v) => { allSelected ? n.delete(v.id) : n.add(v.id); });
      return n;
    });
  };

  // ─── Render ─────────────────────────────────────────────────

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar
        collapsed={sidebarCollapsed}
        onCollapsedChange={(val) => setSidebarManualExpand(!val)}
      />

      <div
        ref={splitContainerRef}
        className={`flex flex-1 h-full transition-all duration-500 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}
      >
        {/* Chat Panel */}
        <ChatPanel
          phase={phase}
          campaigns={campaigns}
          activeCampaignId={activeCampaignId}
          onCampaignSelect={handleCampaignSelect}
          isCampaignsLoading={isCampaignsLoading}
          activeVersion={activeVersion}
          versions={mockVersionHistory}
          onVersionSelect={handleVersionSelect}
          filterState={filterState}
          filterDispatch={filterDispatch}
          messages={messages}
          userName={profile.userName}
          input={input}
          onInputChange={setInput}
          onSend={handleSend}
          selectedVariantCount={selectedVariants.size}
          onClearSelection={() => { setSelectedVariants(new Set()); setInput(''); }}
          personaGroups={mockPersonaGroups}
          className={phase === 'idle' ? 'flex-1' : 'flex-shrink-0'}
          style={phase !== 'idle' ? { width: chatPanelWidth } : undefined}
        />

        {/* Resize Handle */}
        {phase !== 'idle' && (
          <div
            className="relative flex-shrink-0 z-10 group/handle"
            style={{ width: '6px', marginLeft: '-3px', marginRight: '-3px' }}
          >
            <div
              onMouseDown={handleDragStart}
              className={`absolute inset-0 flex items-center justify-center cursor-col-resize transition-colors ${
                isDragging ? 'bg-blue-500/20' : 'hover:bg-slate-300/40'
              }`}
            >
              <div
                className={`w-1 h-8 rounded-full transition-colors ${
                  isDragging ? 'bg-blue-500' : 'bg-slate-300 group-hover/handle:bg-slate-400'
                }`}
              />
            </div>
          </div>
        )}

        {/* Results Panel */}
        {phase !== 'idle' && (
          <ResultsPanel
            phase={phase}
            filterState={filterState}
            filterDispatch={filterDispatch}
            personaGroups={mockPersonaGroups}
            progressIdx={progressIdx}
            selectedVariants={selectedVariants}
            onVariantToggle={toggleVariant}
            onGroupSelect={toggleGroupSelect}
            onClearSelection={() => setSelectedVariants(new Set())}
            onReviseSelected={handleReviseSelected}
            onDuplicateSelected={handleDuplicateSelected}
            onExcludeSelected={handleExcludeSelected}
            onDeleteSelected={handleDeleteSelected}
            expandedGroups={expandedGroups}
            onToggleGroup={toggleGroup}
            onApplyFilters={() => {
              sendAssistantMessage('Preferences updated! Regenerating variants with your new settings...');
              setPhase('generating');
            }}
          />
        )}
      </div>
    </div>
  );
}
