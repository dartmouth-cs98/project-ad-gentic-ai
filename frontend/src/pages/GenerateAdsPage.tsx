import { useEffect, useState, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCompany } from '../contexts/CompanyContext';
import { useUser } from '../contexts/UserContext';
import { AppShell } from '../components/layout/AppShell';
import { CreateCampaignModal } from '../components/campaigns/CreateCampaignModal';
import { ChatPanel, ResultsPanel } from '../components/generate';
import { CampaignSetupStepper } from '../components/generate/CampaignSetupStepper';
import type { Phase, Version } from '../components/generate';
import type { Campaign, ChatMessage, AdVariant } from '../types';
import { useFilterState } from '../hooks/useFilterState';
import { buildGenerationPreferencesSnapshot } from '../types/generationPreferences';
import { usePersistedCampaignPreferences } from '../hooks/usePersistedCampaignPreferences';
import { useResizablePanel } from '../hooks/useResizablePanel';
import { useCampaigns } from '../hooks/useCampaigns';
import { useChatMessages, useSendChatMessage, useChatCompletion } from '../hooks/useChatMessages';
import { useCampaignAdVariants, useGeneratePreview, useUpdateCampaign, useApproveVariant } from '../hooks/useAdGeneration';

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

export function GenerateAdsPage() {
  const { profile } = useCompany();
  const { user } = useUser();
  const businessClientId = user?.client_id;
  const campaignStorageKey = `${SELECTED_CAMPAIGN_KEY_PREFIX}${businessClientId ?? 'anonymous'}`;
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: campaigns = [], isLoading: isCampaignsLoading } = useCampaigns(businessClientId);
  const [filterState, filterDispatch] = useFilterState();
  const generatePreview = useGeneratePreview();
  const updateCampaign = useUpdateCampaign();
  const approveVariant = useApproveVariant();

  const [phase, setPhase] = useState<Phase>('idle');
  const [showCreateCampaignModal, setShowCreateCampaignModal] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);
  const [showStepper, setShowStepper] = useState(false);
  const [stepperProductId, setStepperProductId] = useState<number | undefined>(undefined);
  const [stepperExpressMode, setStepperExpressMode] = useState(false);
  const [expressMode, setExpressMode] = useState(false);
  const [pendingAutoKickoff, setPendingAutoKickoff] = useState<Campaign | null>(null);
  const [input, setInput] = useState('');
  const [progressIdx, setProgressIdx] = useState(0);
  const [activeCampaignId, setActiveCampaignId] = useState<number | undefined>(undefined);
  const [activeVersionNumber, setActiveVersionNumber] = useState<number | null>(null);
  const [versionCounter, setVersionCounter] = useState(1);
  const [generatingVersionNumber, setGeneratingVersionNumber] = useState<number | null>(null);
  const [selectedVariants, setSelectedVariants] = useState<Set<string>>(new Set());

  const { data: allVariants = [] } = useCampaignAdVariants(activeCampaignId, {
    enabled: !!activeCampaignId,
    refetchInterval: phase === 'generating' ? 5000 : false,
  });

  const versions = useMemo(() => buildVersionsFromVariants(allVariants), [allVariants]);
  const hasVariants = allVariants.length > 0;

  useEffect(() => {
    if (versions.length > 0 && activeVersionNumber === null) {
      const maxVer = Math.max(...allVariants.map((v) => v.version_number));
      setActiveVersionNumber(maxVer);
      setVersionCounter(maxVer + 1);
    }
  }, [versions, activeVersionNumber, allVariants]);

  useEffect(() => {
    setActiveVersionNumber(null);
  }, [activeCampaignId]);

  const activeVersionVariants = useMemo(() => {
    if (activeVersionNumber === null) return allVariants;
    return allVariants.filter((v) => v.version_number === activeVersionNumber);
  }, [allVariants, activeVersionNumber]);

  const activeVersion: Version = useMemo(() => {
    const found = versions.find((v) => v.id === `v${activeVersionNumber}`);
    return found ?? { id: 'v0', label: 'v0', timestamp: '', variantCount: 0 };
  }, [versions, activeVersionNumber]);

  const { data: serverMessages = [] } = useChatMessages(activeCampaignId);
  const sendMessage = useSendChatMessage();
  const chatCompletion = useChatCompletion();

  const activeCampaign = campaigns.find((c) => c.id === activeCampaignId);
  const { saveStatus: preferencesSaveStatus } = usePersistedCampaignPreferences(
    activeCampaignId,
    activeCampaign,
    filterState,
    filterDispatch,
  );

  const messages: ChatMessage[] = useMemo(
    () => (serverMessages.length === 0
      ? [buildWelcomeBack(activeCampaign, versions)]
      : serverMessages),
    [serverMessages, activeCampaign, versions],
  );

  const sendAssistantMessage = (content: string, messageType: ChatMessage['message_type'] = 'message') => {
    if (!activeCampaignId) return;
    sendMessage.mutate({
      campaign_id: activeCampaignId,
      role: 'assistant',
      message_type: messageType,
      content,
    });
  };

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

  const splitContainerRef = useRef<HTMLDivElement>(null);
  const { panelWidth: chatPanelWidth, handleDragStart } = useResizablePanel({
    containerRef: splitContainerRef,
  });

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

  useEffect(() => {
    const pid = searchParams.get('productId');
    if (!pid) return;
    const id = Number(pid);
    if (!Number.isFinite(id)) return;
    setStepperProductId(id);
    setStepperExpressMode(searchParams.get('express') === '1');
    setShowStepper(true);
    setSearchParams({}, { replace: true });
  }, []);

  const handleStartChat = (campaign: Campaign) => {
    setActiveCampaignId(campaign.id);
    setChatStarted(true);
    setExpressMode(false);
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
    const prefsSnapshot = buildGenerationPreferencesSnapshot(filterState);
    const existingBrief = activeCampaign.brief ? JSON.parse(activeCampaign.brief) : {};
    existingBrief[String(newVersion)] = {
      plan_message: briefContent,
      generation_preferences: prefsSnapshot,
    };

    sendAssistantMessage('Plan approved! Starting ad generation — this may take a few minutes...');
    setPhase('generating');
    setGeneratingVersionNumber(newVersion);

    updateCampaign.mutate(
      {
        campaignId: activeCampaignId,
        data: {
          brief: JSON.stringify(existingBrief),
          draft_generation_preferences: prefsSnapshot,
        },
      },
      {
        onSuccess: () => {
          generatePreview.mutate(
            { campaignId: activeCampaignId, productId, versionNumber: newVersion },
            {
              onSuccess: (data) => {
                if (!data.ad_variant_ids?.length) {
                  setPhase('idle');
                  setGeneratingVersionNumber(null);
                  sendAssistantMessage(
                    'Preview returned no variants. Check that persona names in the plan match your Personas catalog and that this business has consumers for those personas.',
                  );
                }
              },
              onError: (err) => {
                setPhase('idle');
                setGeneratingVersionNumber(null);
                sendAssistantMessage(`Generation failed: ${(err as Error).message}. Please try again.`);
              },
            },
          );
        },
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

    sendAssistantMessage("No problem — tell me what you'd like to change and I'll revise the plan.");
  };

  const handleCampaignSelect = (campaign: Campaign) => {
    setActiveCampaignId(campaign.id);
    setChatStarted(true);
    setExpressMode(false);
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

  // When idle but has variants, show them in "results" mode
  const resultsPanelPhase: Phase = phase !== 'idle' ? phase : (hasVariants ? 'results' : 'idle');

  return (
    <AppShell fullHeight>
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0, position: 'relative' }}>

        {showStepper && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 50,
            background: 'var(--as-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 32px',
          }}>
            <CampaignSetupStepper
              businessClientId={businessClientId ?? 0}
              initialProductId={stepperProductId}
              initialExpressMode={stepperExpressMode}
              onComplete={handleStepperComplete}
              onCancel={() => { setShowStepper(false); setStepperProductId(undefined); setStepperExpressMode(false); }}
            />
          </div>
        )}

        <div
          ref={splitContainerRef}
          style={{ display: 'flex', flex: 1, overflow: 'hidden' }}
        >
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
            disabled={!chatStarted}
            style={{ width: chatPanelWidth, flexShrink: 0 }}
          />

          <div
            className="gen-resize-handle"
            onMouseDown={handleDragStart}
            style={{ flexShrink: 0 }}
          />

          <ResultsPanel
            phase={resultsPanelPhase}
            filterState={filterState}
            filterDispatch={filterDispatch}
            preferencesSaveStatus={preferencesSaveStatus}
            adVariants={activeVersionVariants}
            progressIdx={progressIdx}
            selectedVariants={selectedVariants}
            onVariantToggle={toggleVariant}
            onClearSelection={() => setSelectedVariants(new Set())}
            onApproveSelected={handleApproveSelected}
            onReviseSelected={handleReviseSelected}
            onDeleteSelected={handleDeleteSelected}
            chatStarted={chatStarted}
            campaigns={campaigns}
            isCampaignsLoading={isCampaignsLoading}
            onCampaignSelect={handleStartChat}
            onNewCampaign={() => { setStepperProductId(undefined); setShowStepper(true); }}
            onSendExample={(text) => { setInput(text); }}
          />
        </div>

        {showCreateCampaignModal && (
          <CreateCampaignModal
            businessClientId={user?.client_id ?? 0}
            onClose={() => setShowCreateCampaignModal(false)}
          />
        )}
      </div>
    </AppShell>
  );
}
