import { useEffect, useState, useRef, useMemo } from 'react';
import { useCompany } from '../contexts/CompanyContext';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';
import { Sidebar } from '../components/layout/Sidebar';
import { ChatPanel, ResultsPanel } from '../components/generate';
import type { Phase, Version } from '../components/generate';
import type { Campaign, ChatMessage, AdVariant } from '../types';
import { useFilterState } from '../hooks/useFilterState';
import { useResizablePanel } from '../hooks/useResizablePanel';
import { useCampaigns } from '../hooks/useCampaigns';
import { useChatMessages, useSendChatMessage, useChatCompletion } from '../hooks/useChatMessages';
import { useCampaignAdVariants, useGeneratePreview, useUpdateCampaign } from '../hooks/useAdGeneration';

// ─── Constants ──────────────────────────────────────────────────

const WELCOME_NEW: ChatMessage = {
  id: 0,
  campaign_id: 0,
  business_client_id: 0,
  role: 'assistant',
  message_type: 'message',
  content: "Hey! Tell me what product or service you want to advertise, and I'll generate persona-targeted ad variants for you.",
  version_ref: null,
  timestamp: new Date().toISOString(),
};

function buildWelcomeBack(campaign: Campaign | undefined, versions: Version[]): ChatMessage {
  if (!campaign || versions.length === 0) return WELCOME_NEW;
  const latest = versions[0]; // already sorted newest first
  const completedCount = latest.variantCount;
  return {
    id: 0,
    campaign_id: campaign.id,
    business_client_id: 0,
    role: 'assistant',
    message_type: 'message',
    content: `Welcome back! You're viewing **${campaign.name}** — ${versions.length} version${versions.length > 1 ? 's' : ''} with ${completedCount} variant${completedCount > 1 ? 's' : ''} in the latest (${latest.label}). Your ad variants are shown on the right.\n\nTell me what you'd like to change, or start a new version.`,
    version_ref: null,
    timestamp: new Date().toISOString(),
  };
}

// ─── Helpers ────────────────────────────────────────────────────

/** Build a Version list from real ad variants, grouped by version_number. */
function buildVersionsFromVariants(variants: AdVariant[]): Version[] {
  const map = new Map<number, { count: number; latest: string }>();
  for (const v of variants) {
    const existing = map.get(v.version_number);
    if (!existing) {
      map.set(v.version_number, { count: 1, latest: v.created_at });
    } else {
      existing.count += 1;
      if (v.created_at > existing.latest) existing.latest = v.created_at;
    }
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => b - a) // newest version first
    .map(([vNum, { count, latest }]) => ({
      id: `v${vNum}`,
      label: `v${vNum}`,
      timestamp: new Date(latest).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }),
      variantCount: count,
    }));
}

// ─── Main Component ──────────────────────────────────────────────

export function GenerateAdsPage() {
  const { profile } = useCompany();
  const { user } = useUser();
  const { theme, toggleTheme } = useTheme();
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
  const [activeVersionNumber, setActiveVersionNumber] = useState<number | null>(null);
  const [versionCounter, setVersionCounter] = useState(1);

  // ─── All variants for active campaign (always fetched) ───────
  const { data: allVariants = [] } = useCampaignAdVariants(activeCampaignId, {
    enabled: !!activeCampaignId,
    refetchInterval: phase === 'generating' ? 5000 : false,
  });

  // ─── Derive versions & filtered variants ─────────────────────
  const versions = useMemo(() => buildVersionsFromVariants(allVariants), [allVariants]);
  const hasVariants = allVariants.length > 0;

  // Auto-select latest version when variants first load or campaign changes
  useEffect(() => {
    if (versions.length > 0 && activeVersionNumber === null) {
      // Latest version = highest version_number
      const maxVer = Math.max(...allVariants.map((v) => v.version_number));
      setActiveVersionNumber(maxVer);
      setVersionCounter(maxVer + 1);
    }
  }, [versions, activeVersionNumber, allVariants]);

  // Reset version selection on campaign switch
  useEffect(() => {
    setActiveVersionNumber(null);
  }, [activeCampaignId]);

  // Variants filtered to the active version
  const activeVersionVariants = useMemo(() => {
    if (activeVersionNumber === null) return allVariants;
    return allVariants.filter((v) => v.version_number === activeVersionNumber);
  }, [allVariants, activeVersionNumber]);

  // Active version object for the header
  const activeVersion: Version = useMemo(() => {
    const found = versions.find((v) => v.id === `v${activeVersionNumber}`);
    return found ?? { id: 'v0', label: 'v0', timestamp: '', variantCount: 0 };
  }, [versions, activeVersionNumber]);

  // ─── Chat messages (persisted via API) ────────────────────────
  const { data: serverMessages = [] } = useChatMessages(activeCampaignId);
  const sendMessage = useSendChatMessage();
  const chatCompletion = useChatCompletion();

  // Show welcome message when no persisted messages exist
  const activeCampaign = campaigns.find((c) => c.id === activeCampaignId);
  const messages: ChatMessage[] = useMemo(
    () => (serverMessages.length === 0
      ? [buildWelcomeBack(activeCampaign, versions)]
      : serverMessages),
    [serverMessages, activeCampaign, versions],
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

  // Variants selection state
  const [selectedVariants, setSelectedVariants] = useState<Set<string>>(new Set());

  // ─── Resizable panel ────────────────────────────────────────
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const { panelWidth: chatPanelWidth, isDragging, handleDragStart } = useResizablePanel({
    containerRef: splitContainerRef,
  });


// ─── Layout state ─────────────────────────────────────────────
  // Show split layout when generating, viewing results, OR when variants exist
  const showSplit = phase !== 'idle' || hasVariants;
  const sidebarCollapsed = showSplit && !sidebarManualExpand;

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

  // ─── Auto-transition: generating → results when variant completes ─
  const [generatingVersionNumber, setGeneratingVersionNumber] = useState<number | null>(null);

  useEffect(() => {
    if (phase !== 'generating' || generatingVersionNumber === null) return;
    const completedCount = allVariants.filter(
      (v) => v.version_number === generatingVersionNumber && v.status === 'completed',
    ).length;
    if (completedCount === 0) return;

    setPhase('results');
    setActiveVersionNumber(generatingVersionNumber);
    setVersionCounter(generatingVersionNumber + 1);
    setGeneratingVersionNumber(null);
    sendAssistantMessage(
      `Done! I've generated ${completedCount} preview ad variant${completedCount > 1 ? 's' : ''} (v${generatingVersionNumber}). Review them on the right, or tell me what to change.`,
    );
  }, [phase, allVariants, generatingVersionNumber]);

  // ─── Handlers ───────────────────────────────────────────────

  const handleSend = () => {
    if (!input.trim() || !activeCampaignId) return;

    const messageText = input;
    setInput('');

    const lastPlan = [...messages].reverse().find((m) => m.message_type === 'plan');
    const activeCampaign = campaigns.find((c) => c.id === activeCampaignId);

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

    let productId: number | null = null;
    try {
      const ids = JSON.parse(activeCampaign.product_ids || '[]');
      if (Array.isArray(ids) && ids.length > 0) productId = ids[0];
    } catch { /* no product_ids */ }

    if (!productId) {
      sendAssistantMessage('This campaign has no product linked. Please add a product in the Campaigns page first.');
      return;
    }

    sendMessage.mutate({
      campaign_id: activeCampaignId,
      role: 'user',
      message_type: 'plan_response',
      content: 'Approved',
    });

    const newVersion = versionCounter;
    const briefContent = planMessage.content;
    const existingBrief = activeCampaign.brief ? JSON.parse(activeCampaign.brief) : {};
    existingBrief[String(newVersion)] = briefContent;

    updateCampaign.mutate({
      campaignId: activeCampaignId,
      data: { brief: JSON.stringify(existingBrief) },
    });

    sendAssistantMessage(
      'Plan approved! Starting ad generation — this may take a few minutes...',
    );
    setPhase('generating');
    setGeneratingVersionNumber(newVersion);

    generatePreview.mutate(
      { campaignId: activeCampaignId, productId, versionNumber: newVersion },
      {
        onError: (err) => {
          setPhase('idle');
          setGeneratingVersionNumber(null);
          sendAssistantMessage(`Generation failed: ${(err as Error).message}. Please try again.`);
        },
      },
    );
  };

  const handleDeclinePlan = (_planMessage: ChatMessage) => {
    if (!activeCampaignId) return;

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
    setSelectedVariants(new Set());
    if (phase === 'generating') {
      setPhase('idle');
      setGeneratingVersionNumber(null);
    }
  };

  const handleVersionSelect = (version: Version) => {
    const vNum = parseInt(version.id.replace('v', ''), 10);
    setActiveVersionNumber(vNum);
    setSelectedVariants(new Set());
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

  // Determine the effective phase for the results panel
  // When idle but has variants, show them in "results" mode
  const resultsPanelPhase: Phase = phase !== 'idle' ? phase : (hasVariants ? 'results' : 'idle');

  return (
    <div className="flex h-screen bg-background overflow-hidden">
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
          versions={versions}
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
          variantCount={activeVersionVariants.length}
          className={showSplit ? 'flex-shrink-0' : 'flex-1'}
          style={showSplit ? { width: chatPanelWidth } : undefined}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        {/* Resize Handle */}
        {showSplit && (
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
        {showSplit && (
          <ResultsPanel
            phase={resultsPanelPhase}
            filterState={filterState}
            filterDispatch={filterDispatch}
            adVariants={activeVersionVariants}
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
