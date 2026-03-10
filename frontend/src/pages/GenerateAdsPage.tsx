import { useEffect, useState, useRef, useMemo } from 'react';
import { useCompany } from '../contexts/CompanyContext';
import { useUser } from '../contexts/UserContext';
import { useSidebar } from '../contexts/SidebarContext';
import { Sidebar } from '../components/layout/Sidebar';
import { ChatPanel, ResultsPanel } from '../components/generate';
import type { Phase, Version } from '../components/generate';
import type { Campaign, ChatMessage } from '../types';
import { useFilterState } from '../hooks/useFilterState';
import { useResizablePanel } from '../hooks/useResizablePanel';
import { useCampaigns } from '../hooks/useCampaigns';
import { useChatMessages, useSendChatMessage, useChatCompletion } from '../hooks/useChatMessages';
import { useGeneratePreview, usePreviewVariants, useUpdateCampaign } from '../hooks/useAdGeneration';
import { mockVersionHistory } from '../components/generate/mockData';

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

// ─── Main Component ──────────────────────────────────────────────

export function GenerateAdsPage() {
  const { profile } = useCompany();
  const { user } = useUser();
  const businessClientId = user?.client_id;

  // ─── Data hooks ──────────────────────────────────────────────
  const { data: campaigns = [], isLoading: isCampaignsLoading } = useCampaigns(businessClientId);
  const [filterState, filterDispatch] = useFilterState();
  const generatePreview = useGeneratePreview();
  const updateCampaign = useUpdateCampaign();

  // ─── Core state ──────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>('idle');
  const [sidebarManualExpand, setSidebarManualExpand] = useState(false);
  const [input, setInput] = useState('');
  const [progressIdx, setProgressIdx] = useState(0);

  // Campaign & version state
  const [activeCampaignId, setActiveCampaignId] = useState<number | undefined>(undefined);
  const [activeVersion, setActiveVersion] = useState<Version>(mockVersionHistory[0]);
  const [versionCounter, setVersionCounter] = useState(1);

  // ─── Preview variants (poll while generating) ──────────────
  const { data: previewVariants = [] } = usePreviewVariants(
    activeCampaignId,
    phase === 'generating' || phase === 'results',
    phase === 'generating' ? 5000 : undefined, // poll every 5s while generating
  );

  // ─── Chat messages (persisted via API) ────────────────────────
  const { data: serverMessages = [] } = useChatMessages(activeCampaignId);
  const sendMessage = useSendChatMessage();
  const chatCompletion = useChatCompletion();

  // Show welcome message when no persisted messages exist
  const messages: ChatMessage[] = useMemo(
    () => (serverMessages.length === 0 ? [WELCOME_MESSAGE] : serverMessages),
    [serverMessages],
  );

  /** Persist an assistant message to the current campaign (for system-generated messages, not AI). */
  const sendAssistantMessage = (content: string, messageType: ChatMessage['message_type'] = 'message') => {
    if (!activeCampaignId) return;
    sendMessage.mutate({
      campaign_id: activeCampaignId,
      role: 'assistant',
      message_type: messageType,
      content,
    });
  };

  /** Build filter context for the AI from current filter state. */
  const buildFilterContext = () => ({
    personalizationRange: filterState.personalizationRange,
    variantsPerGroup: filterState.variantsPerGroup,
    adFormats: Array.from(filterState.adFormats),
    tone: filterState.tone,
    budgetTier: filterState.budgetTier,
    ctaStyle: filterState.ctaStyle,
    language: filterState.language,
    platforms: Array.from(filterState.selectedPlatforms),
    colorMode: filterState.colorMode,
  });

  // Variants state
  const [selectedVariants, setSelectedVariants] = useState<Set<string>>(new Set());

  // ─── Resizable panel ────────────────────────────────────────
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const { panelWidth: chatPanelWidth, isDragging, handleDragStart } = useResizablePanel({
    containerRef: splitContainerRef,
  });

  // ─── Theme ──────────────────────────────────────────────────
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' || 'dark';
    setTheme(saved);
    document.documentElement.classList.toggle('dark', saved === 'dark');
  }, []);
  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  // ─── Sidebar collapse ───────────────────────────────────────
  const { collapsed: ctxCollapsed, setCollapsed: ctxSetCollapsed } = useSidebar();
  // In idle phase the sidebar is uncontrolled (uses context, so chevron works).
  // In active phases it auto-collapses unless manually expanded.
  const sidebarCollapsed = phase !== 'idle' ? !sidebarManualExpand : ctxCollapsed;

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

  // ─── Auto-transition: generating → results when preview completes ─
  useEffect(() => {
    if (phase !== 'generating') return;
    // Transition once we have at least one completed preview variant
    const completedCount = previewVariants.filter((v) => v.status === 'completed').length;
    if (completedCount === 0) return;

    setPhase('results');
    const newVersion: Version = {
      id: `v${versionCounter}`,
      label: `v${versionCounter}`,
      timestamp: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
      variantCount: completedCount,
    };
    setActiveVersion(newVersion);
    setVersionCounter((v) => v + 1);
    sendAssistantMessage(
      `Done! I've generated ${completedCount} preview ad variant${completedCount > 1 ? 's' : ''} (${newVersion.label}). Review them on the right, or tell me what to change.`,
    );
  }, [phase, previewVariants]);

  // ─── Handlers ───────────────────────────────────────────────

  const handleSend = () => {
    if (!input.trim() || !activeCampaignId) return;

    const messageText = input;
    setInput('');

    // Find the most recent plan for context (if revising from an existing version)
    const lastPlan = [...messages].reverse().find((m) => m.message_type === 'plan');
    const activeCampaign = campaigns.find((c) => c.id === activeCampaignId);

    // Send to AI — persists both user message and AI response server-side
    chatCompletion.mutate({
      campaign_id: activeCampaignId,
      message: messageText,
      filter_context: buildFilterContext(),
      campaign_context: activeCampaign
        ? { name: activeCampaign.name, brief: activeCampaign.brief }
        : undefined,
      previous_plan: lastPlan?.content ?? undefined,
    });
  };

  const handleApprovePlan = (planMessage: ChatMessage) => {
    if (!activeCampaignId) return;

    const activeCampaign = campaigns.find((c) => c.id === activeCampaignId);
    if (!activeCampaign) return;

    // Extract product_id from campaign's product_ids JSON
    let productId: number | null = null;
    try {
      const ids = JSON.parse(activeCampaign.product_ids || '[]');
      if (Array.isArray(ids) && ids.length > 0) productId = ids[0];
    } catch { /* no product_ids */ }

    if (!productId) {
      sendAssistantMessage('This campaign has no product linked. Please add a product in the Campaigns page first.');
      return;
    }

    // Persist approval message
    sendMessage.mutate({
      campaign_id: activeCampaignId,
      role: 'user',
      message_type: 'plan_response',
      content: 'Approved',
    });

    // Save the plan as the campaign brief for this version
    const newVersion = versionCounter;
    const briefContent = planMessage.content;
    const existingBrief = activeCampaign.brief ? JSON.parse(activeCampaign.brief) : {};
    existingBrief[String(newVersion)] = briefContent;

    updateCampaign.mutate({
      campaignId: activeCampaignId,
      data: { brief: JSON.stringify(existingBrief) },
    });

    // Confirm in chat and start generating
    sendAssistantMessage(
      'Plan approved! Starting ad generation — this may take a few minutes...',
    );
    setPhase('generating');

    // Trigger preview generation
    generatePreview.mutate(
      { campaignId: activeCampaignId, productId, versionNumber: newVersion },
      {
        onError: (err) => {
          setPhase('idle');
          sendAssistantMessage(`Generation failed: ${(err as Error).message}. Please try again.`);
        },
      },
    );
  };

  const handleDeclinePlan = (_planMessage: ChatMessage) => {
    if (!activeCampaignId) return;

    // Persist a plan_response message indicating decline
    sendMessage.mutate({
      campaign_id: activeCampaignId,
      role: 'user',
      message_type: 'plan_response',
      content: 'Declined',
    });

    sendAssistantMessage(
      "No problem — tell me what you'd like to change and I'll revise the plan.",
    );
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
    const count = selectedVariants.size;
    setInput(`Revise ${count} selected variant${count > 1 ? 's' : ''}: `);
  };

  const handleDeleteSelected = () => {
    sendAssistantMessage(`Removed ${selectedVariants.size} variant${selectedVariants.size > 1 ? 's' : ''} from this version.`);
    setSelectedVariants(new Set());
  };

  const toggleVariant = (variantId: string) => {
    setSelectedVariants((prev) => {
      const n = new Set(prev);
      n.has(variantId) ? n.delete(variantId) : n.add(variantId);
      return n;
    });
  };

  // ─── Render ─────────────────────────────────────────────────

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar
        {...(phase !== 'idle'
          ? {
              collapsed: sidebarCollapsed,
              onCollapsedChange: (val) => setSidebarManualExpand(!val),
            }
          : {
              collapsed: ctxCollapsed,
              onCollapsedChange: (val) => ctxSetCollapsed(val),
            })}
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
          onApprovePlan={handleApprovePlan}
          onDeclinePlan={handleDeclinePlan}
          selectedVariantCount={selectedVariants.size}
          onClearSelection={() => { setSelectedVariants(new Set()); setInput(''); }}
          isAiLoading={chatCompletion.isPending}
          variantCount={previewVariants.length}
          className={phase === 'idle' ? 'flex-1' : 'flex-shrink-0'}
          style={phase !== 'idle' ? { width: chatPanelWidth } : undefined}
          theme={theme}
          onToggleTheme={toggleTheme}
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
                isDragging ? 'bg-blue-500/20' : 'hover:bg-border/40'
              }`}
            >
              <div
                className={`w-1 h-8 rounded-full transition-colors ${
                  isDragging ? 'bg-blue-500' : 'bg-border group-hover/handle:bg-muted-foreground'
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
            adVariants={previewVariants}
            progressIdx={progressIdx}
            selectedVariants={selectedVariants}
            onVariantToggle={toggleVariant}
            onClearSelection={() => setSelectedVariants(new Set())}
            onReviseSelected={handleReviseSelected}
            onDeleteSelected={handleDeleteSelected}
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
