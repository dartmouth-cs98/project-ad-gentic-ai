import { useEffect, useState, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCompany } from '../contexts/CompanyContext';
import { useUser } from '../contexts/UserContext';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { CreateCampaignModal } from '../components/campaigns/CreateCampaignModal';
import { ChatPanel, ResultsPanel } from '../components/generate';
import { CampaignSetupStepper } from '../components/generate/CampaignSetupStepper';
import type { Phase, Version } from '../components/generate';
import type { Campaign, ChatMessage, AdVariant } from '../types';
import { useFilterState } from '../hooks/useFilterState';
import { useResizablePanel } from '../hooks/useResizablePanel';
import { useCampaigns } from '../hooks/useCampaigns';
import { useChatMessages, useSendChatMessage, useChatCompletion } from '../hooks/useChatMessages';
import { useCampaignAdVariants, useGeneratePreview, useUpdateCampaign, useApproveVariant } from '../hooks/useAdGeneration';
import {
  SparklesIcon,
  PlusIcon,
  ArrowRightIcon,
  ZapIcon,
} from 'lucide-react';

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
const SELECTED_CAMPAIGN_KEY_PREFIX = 'adgentic_generate_campaign_';

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
  const businessClientId = user?.client_id;
  const campaignStorageKey = `${SELECTED_CAMPAIGN_KEY_PREFIX}${businessClientId ?? 'anonymous'}`;
  const [searchParams, setSearchParams] = useSearchParams();

  // ─── Data hooks ──────────────────────────────────────────────
  const { data: campaigns = [], isLoading: isCampaignsLoading } = useCampaigns(businessClientId);
  const [filterState, filterDispatch] = useFilterState();
  const generatePreview = useGeneratePreview();
  const updateCampaign = useUpdateCampaign();
  const approveVariant = useApproveVariant();

  // ─── Core state ──────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>('idle');
  const [showCreateCampaignModal, setShowCreateCampaignModal] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);
  const [showStepper, setShowStepper] = useState(false);
  const [stepperProductId, setStepperProductId] = useState<number | undefined>(undefined);
  const [expressMode, setExpressMode] = useState(false);
  const [pendingAutoKickoff, setPendingAutoKickoff] = useState<Campaign | null>(null);
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

  useEffect(() => {
    if (!campaigns.length) return;
    const stored = localStorage.getItem(campaignStorageKey);
    if (!stored) return;
    const storedId = Number(stored);
    if (!Number.isFinite(storedId)) return;
    const exists = campaigns.some((campaign) => campaign.id === storedId);
    if (!exists) {
      localStorage.removeItem(campaignStorageKey);
      return;
    }
    setActiveCampaignId(storedId);
    setChatStarted(true);
  }, [campaigns, campaignStorageKey]);

  // ─── URL param: ?productId=X → open stepper with product pre-selected ───
  useEffect(() => {
    const pid = searchParams.get('productId');
    if (!pid) return;
    const id = Number(pid);
    if (!Number.isFinite(id)) return;
    setStepperProductId(id);
    setShowStepper(true);
    setSearchParams({}, { replace: true });
  }, []);

  // ─── Campaign selection from empty state ─────────────────────
  const handleStartChat = (campaign: Campaign) => {
    setActiveCampaignId(campaign.id);
    setChatStarted(true);
    localStorage.setItem(campaignStorageKey, String(campaign.id));
  };

  const handleStepperComplete = (campaign: Campaign, withExpressMode: boolean) => {
    setExpressMode(withExpressMode);
    if (withExpressMode) setPendingAutoKickoff(campaign);
    setActiveCampaignId(campaign.id);
    setShowStepper(false);
    setChatStarted(true);
    localStorage.setItem(campaignStorageKey, String(campaign.id));
  };

  // ─── Express mode auto-approve ───────────────────────────────
  useEffect(() => {
    if (!expressMode) return;
    if (phase === 'generating' || phase === 'results') return;
    const latestPlan = [...messages].reverse().find((m) => m.message_type === 'plan');
    if (!latestPlan) return;
    const planIdx = messages.indexOf(latestPlan);
    const alreadyResolved = messages.slice(planIdx + 1).some((m) => m.message_type === 'plan_response');
    if (alreadyResolved) return;
    const timer = setTimeout(() => handleApprovePlan(latestPlan), 600);
    return () => clearTimeout(timer);
  }, [messages, expressMode, phase]);

  // ─── Express mode auto-kickoff ────────────────────────────────
  useEffect(() => {
    if (!pendingAutoKickoff || !chatStarted || !activeCampaignId) return;
    const campaign = pendingAutoKickoff;
    setPendingAutoKickoff(null);
    const parts = [`Generate ads for "${campaign.name}"`];
    if (campaign.target_audience) parts.push(`targeting ${campaign.target_audience}`);
    if (campaign.goal) parts.push(`with a ${campaign.goal} goal`);
    if (campaign.product_context) parts.push(`for ${campaign.product_context}`);
    chatCompletion.mutate({
      campaign_id: activeCampaignId,
      message: parts.join(', ') + '.',
      filter_context: buildFilterContext(),
      campaign_context: { name: campaign.name, brief: campaign.brief },
      previous_plan: undefined,
    });
  }, [chatStarted, activeCampaignId, pendingAutoKickoff]);

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
    if (!input.trim()) return;
    if (!activeCampaignId) {
      setShowCreateCampaignModal(true);
      return;
    }

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
    setChatStarted(true);
    localStorage.setItem(campaignStorageKey, String(campaign.id));
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

  const handleApproveSelected = () => {
    const ids = Array.from(selectedVariants).map(Number);
    ids.forEach((id) => approveVariant.mutate(id));
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

  const statusStyles: Record<string, string> = {
    active: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    draft: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    paused: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    completed: 'bg-muted text-muted-foreground border-border',
  };

  return (
    <DashboardLayout contentClassName="p-0 overflow-hidden">
      <div className="flex h-[calc(100vh-4rem)] bg-background overflow-hidden">

      {/* ── Empty State: pick a campaign before entering chat ── */}
      {!chatStarted && !showStepper && (
        <div className="flex flex-1 flex-col items-center justify-center px-8">
          <div className="w-full max-w-2xl">

            {/* Hero */}
            <div className="flex flex-col items-center text-center mb-12">
              <div className="mb-6">
                <div className="w-20 h-20 rounded bg-muted border border-border flex items-center justify-center">
                  <SparklesIcon className="w-9 h-9 text-muted-foreground" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Generate your next ad</h1>
              <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                Select a campaign first to start generating persona-targeted ad variants.
              </p>
            </div>

            {/* Campaign list */}
            <div className="mb-6">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {isCampaignsLoading ? 'Loading campaigns...' : campaigns.length > 0 ? 'Continue a campaign' : 'No campaigns yet'}
              </p>

              {isCampaignsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-card border border-border rounded animate-pulse" />
                  ))}
                </div>
              ) : campaigns.length > 0 ? (
                <div className="space-y-2">
                  {campaigns.slice(0, 5).map((campaign) => (
                    <button
                      key={campaign.id}
                      onClick={() => handleStartChat(campaign)}
                      className="w-full flex items-center gap-4 px-5 py-4 bg-card border border-border rounded hover:border-foreground/20 hover:bg-muted/30 transition-all group text-left"
                    >
                      <div className="w-9 h-9 rounded bg-muted border border-border flex items-center justify-center flex-shrink-0 group-hover:bg-muted transition-colors">
                        <ZapIcon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{campaign.name}</p>
                        {campaign.goal && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{campaign.goal}</p>
                        )}
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border flex-shrink-0 ${statusStyles[campaign.status] ?? statusStyles.completed}`}>
                        {campaign.status}
                      </span>
                      <ArrowRightIcon className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* New campaign CTA */}
            <div className="flex gap-3">
              <button
                onClick={() => { setStepperProductId(undefined); setShowStepper(true); }}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-primary hover:bg-primary/90 active:scale-[0.99] text-primary-foreground rounded text-sm font-medium transition-all"
              >
                <PlusIcon className="w-4 h-4" />
                New Campaign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Stepper: guided campaign creation ── */}
      {showStepper && !chatStarted && (
        <div className="flex flex-1 flex-col items-center justify-center px-8">
          <CampaignSetupStepper
            businessClientId={businessClientId ?? 0}
            initialProductId={stepperProductId}
            onComplete={handleStepperComplete}
            onCancel={() => { setShowStepper(false); setStepperProductId(undefined); }}
          />
        </div>
      )}

      {chatStarted && <div
        ref={splitContainerRef}
        className="flex flex-1 h-full transition-all duration-500"
      >
        {/* Chat Panel */}
        <ChatPanel
          phase={phase}
          campaigns={campaigns}
          activeCampaignId={activeCampaignId}
          onCampaignSelect={handleCampaignSelect}
          onCreateCampaign={() => setShowCreateCampaignModal(true)}
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
                isDragging ? 'bg-foreground/10' : 'hover:bg-border/40'
              }`}
            >
              <div
                className={`w-1 h-8 rounded-full transition-colors ${
                  isDragging ? 'bg-foreground/40' : 'bg-border group-hover/handle:bg-muted-foreground'
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
            onApproveSelected={handleApproveSelected}
            onReviseSelected={handleReviseSelected}
            onDeleteSelected={handleDeleteSelected}
            onApplyFilters={() => {
              sendAssistantMessage('Preferences updated! Regenerating variants with your new settings...');
              setPhase('generating');
            }}
          />
        )}
      </div>}

      {showCreateCampaignModal && (
        <CreateCampaignModal
          businessClientId={user?.client_id ?? 0}
          onClose={() => setShowCreateCampaignModal(false)}
        />
      )}
      </div>
    </DashboardLayout>
  );
}
