import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import {
  BarChart3Icon,
  UsersIcon,
  GlobeIcon,
  PackageIcon,
  Loader2Icon,
  AlertCircleIcon,
} from 'lucide-react';

import { AdVariantsGrid } from '../components/campaigns/AdVariantsGrid';
import { CampaignAnalytics } from '../components/campaigns/CampaignAnalytics';
import { CampaignSettings } from '../components/campaigns/CampaignSettings';
import { EditCampaignModal } from '../components/campaigns/EditCampaignModal';
import { DeleteCampaignModal } from '../components/campaigns/DeleteCampaignModal';

import type { EditFormData } from '../components/campaigns/EditCampaignModal';
import type { SettingsFormData } from '../components/campaigns/CampaignSettings';

import { useCampaign, useUpdateCampaign, useDeleteCampaign } from '../hooks/useCampaigns';
import { useCampaignAdVariants, useApproveVariant, useUnapproveVariant, useRunCampaign } from '../hooks/useAdGeneration';
import { useCampaignMetrics } from '../hooks/useCampaignMetrics';
import { useUser } from '../contexts/UserContext';
import { useProducts } from '../hooks/useProducts';
import type { CampaignStatus, Product, CampaignAnalyticsSummary } from '../types';
import { HERO_ICON_STYLES, normalizeCampaignHeroIcon } from '../lib/campaignHeroIcon';


function MousePointerClickIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 9 5 12 1.8-5.2L21 14Z" />
      <path d="M7.2 2.2 8 5.1" />
      <path d="m5.1 8-2.9-.8" />
      <path d="M14 4.1 12 6" />
      <path d="m6 12-1.9 2" />
    </svg>
  );
}

function SpinnerSvg() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      width={16} height={16} style={{ animation: 'as-spin 0.8s linear infinite' }}>
      <circle cx="8" cy="8" r="6" strokeDasharray="18 8" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"
      width={11} height={11}>
      <path d="M8 2L4 6l4 4" />
    </svg>
  );
}

function renderHeroIcon(icon: unknown) {
  const resolved = normalizeCampaignHeroIcon(icon);
  const sz = { width: 16, height: 16 };
  switch (resolved) {
    case 'users':   return <UsersIcon {...sz} />;
    case 'pointer': return <MousePointerClickIcon />;
    case 'chart':   return <BarChart3Icon {...sz} />;
    case 'globe':   return <GlobeIcon {...sz} />;
  }
}

function HeroKpiGrid({ hero }: { hero: CampaignAnalyticsSummary['hero'] }) {
  return (
    <div className="cdp-kpi-strip">
      {hero.map((kpi, index) => {
        const resolved = normalizeCampaignHeroIcon(kpi?.icon);
        void HERO_ICON_STYLES[resolved];
        return (
          <div key={`${kpi.label}-${index}`} className="cdp-kpi-cell">
            <div className="cdp-kpi-icon-wrap">{renderHeroIcon(kpi.icon)}</div>
            <div className="cdp-kpi-value">{kpi.value}</div>
            <div className="cdp-kpi-label">{kpi.label}</div>
            {kpi.badge != null && (
              <div className={`cdp-kpi-badge${kpi.badgeStyle === 'positive' ? '' : ' muted'}`}>
                {kpi.badge}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function AnalyticsEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="cdp-empty-panel">
      <div className="cdp-empty-icon">
        <BarChart3Icon width={18} height={18} />
      </div>
      <div>
        <div className="cdp-empty-h">{title}</div>
        <div className="cdp-empty-desc">{description}</div>
      </div>
    </div>
  );
}

function AttachedProducts({ products }: { products: Product[] }) {
  return (
    <div className="cdp-products-grid">
      {products.map((product) => (
        <div key={product.id} className="cdp-product-cell">
          {product.image_urls[0] ? (
            <img src={product.image_urls[0]} alt={product.name} className="cdp-product-thumb" />
          ) : (
            <div className="cdp-product-thumb-empty">
              <PackageIcon width={16} height={16} />
            </div>
          )}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="cdp-product-name">{product.name}</div>
            {product.description && (
              <div className="cdp-product-desc">{product.description}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}


function parseProductIds(raw: string | null): number[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((v) => Number(v)).filter((n) => Number.isFinite(n));
  } catch {
    return [];
  }
}

function parsePlatforms(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((p): p is string => typeof p === 'string' && p.trim().length > 0);
  } catch {
    return [];
  }
}

function parseProductContext(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed.text ?? parsed.name ?? null;
    }
    if (typeof parsed === 'string') return parsed;
    return null;
  } catch {
    return raw;
  }
}

function resolveAnalyticsSummary(campaign: { analytics_summary?: CampaignAnalyticsSummary | null }): CampaignAnalyticsSummary | null {
  const s = campaign.analytics_summary;
  if (!s) return null;
  if (!Array.isArray(s.hero) || s.hero.length === 0) return null;
  if (!Array.isArray(s.metrics) || s.metrics.length === 0) return null;
  if (!Array.isArray(s.personas) || s.personas.length === 0) return null;
  return {
    ...s,
    hero: s.hero.map((kpi) => ({
      ...kpi,
      icon: normalizeCampaignHeroIcon(kpi?.icon),
    })),
  };
}


export function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useUser();

  const campaignId = Number(id);
  const { data: campaign, isLoading, isError, error } = useCampaign(campaignId);
  const businessClientId = user?.client_id;
  const { data: products = [], isLoading: isProductsLoading } = useProducts(businessClientId);
  const {
    data: campaignVariants = [],
    isLoading: isVariantsLoading,
    isError: isVariantsError,
    error: variantsError,
  } = useCampaignAdVariants(campaignId, { enabled: !!campaign });

  const { data: metricsData, isLoading: isMetricsLoading } = useCampaignMetrics(
    campaignId,
    !!campaign?.meta_campaign_id,
  );

  const editMutation = useUpdateCampaign();
  const settingsMutation = useUpdateCampaign();
  const deleteMutation = useDeleteCampaign();
  const approveVariantMutation = useApproveVariant();
  const unapproveVariantMutation = useUnapproveVariant();
  const runCampaignMutation = useRunCampaign();

  const [activeTab, setActiveTab] = useState<'variants' | 'analytics' | 'settings'>('variants');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (campaign?.name) {
      document.title = `${campaign.name} — Ad-gentic AI`;
    }
    return () => {
      document.title = 'Ad-gentic AI';
    };
  }, [campaign?.name]);

  const tabs = [
    { key: 'variants' as const, label: 'Ad Variants' },
    { key: 'analytics' as const, label: 'Analytics' },
    { key: 'settings' as const, label: 'Settings' },
  ];

  const handleEditSave = (data: EditFormData) => {
    editMutation.mutate(
      {
        campaignId,
        data: {
          name: data.name,
          goal: data.goal === 'other' ? (data.customGoal || 'other') : (data.goal || null),
          target_audience: data.targetAudience || null,
        },
      },
      { onSuccess: () => setShowEditModal(false) },
    );
  };

  const handleSettingsSave = (data: SettingsFormData) => {
    settingsMutation.mutate({
      campaignId,
      data: {
        name: data.name,
        status: data.status as CampaignStatus,
        budget_total: data.budget || null,
        start_date: data.startDate || null,
        end_date: data.endDate || null,
        platforms: JSON.stringify(data.platforms),
      },
    });
  };

  const closeDeleteModal = () => {
    if (deleteMutation.isPending) return;
    setShowDeleteModal(false);
    setDeleteError(null);
    deleteMutation.reset();
  };

  const handleDelete = () => {
    setDeleteError(null);
    deleteMutation.mutate(campaignId, {
      onSuccess: () => navigate('/campaigns'),
      onError: (err) => {
        setDeleteError(err instanceof Error ? err.message : 'Failed to delete campaign.');
      },
    });
  };

  if (isLoading) {
    return (
      <AppShell>
        <div style={{ display: 'flex', minHeight: '60vh', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: 'var(--as-ink-3)' }}>
            <Loader2Icon width={28} height={28} style={{ animation: 'as-spin 0.8s linear infinite' }} />
            <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Loading campaign…
            </span>
          </div>
        </div>
      </AppShell>
    );
  }

  if (isError || !campaign) {
    return (
      <AppShell>
        <div style={{ display: 'flex', minHeight: '60vh', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
            <div style={{ width: 40, height: 40, background: 'rgba(200,60,60,0.08)', border: '1px solid rgba(200,60,60,0.2)', display: 'grid', placeItems: 'center' }}>
              <AlertCircleIcon width={20} height={20} style={{ color: '#c44' }} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--as-ink)' }}>Campaign not found</div>
            <div style={{ fontSize: 13, color: 'var(--as-ink-2)' }}>{(error as Error)?.message}</div>
            <Link to="/campaigns" className="cdp-back" style={{ marginBottom: 0, marginTop: 4 }}>
              ← Back to campaigns
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const editInitial: EditFormData = {
    name: campaign.name,
    status: campaign.status,
    goal: campaign.goal ?? '',
    customGoal: '',
    targetAudience: campaign.target_audience ?? '',
  };

  const settingsInitial: SettingsFormData = {
    name: campaign.name,
    status: campaign.status,
    platforms: parsePlatforms(campaign.platforms),
    budget: campaign.budget_total?.toString() ?? '',
    startDate: campaign.start_date ?? '',
    endDate: campaign.end_date ?? '',
  };

  const attachedProductIds = parseProductIds(campaign.product_ids);
  const attachedProducts = attachedProductIds
    .map((productId) => products.find((p) => p.id === productId))
    .filter((p): p is Product => !!p);
  const productContextText = parseProductContext(campaign.product_context);
  const completedVariants = campaignVariants.filter((v) => v.status === 'completed');
  const approvedVariants = completedVariants.filter((v) => v.is_approved);
  const approvableVariants = completedVariants.filter((v) => !v.is_approved);

  const handleApproveAll = () => {
    approvableVariants.forEach((v) => approveVariantMutation.mutate(v.id));
  };

  const handleRunCampaign = () => {
    runCampaignMutation.mutate(campaignId);
  };

  const analyticsSummary = resolveAnalyticsSummary(campaign);

  return (
    <AppShell>
      <div className="as-canvas">

        {/* Back nav */}
        <Link to="/campaigns" className="cdp-back">
          <ChevronLeftIcon />
          Back to Campaigns
        </Link>

        {/* Page header */}
        <div className="as-page-head">
          <div>
            <span className="as-eyebrow">— CAMPAIGN</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <h1 style={{ marginBottom: 0 }}>{campaign.name}</h1>
              <span className={`cmp-status ${campaign.status}`}>
                <span className="d" />
                {campaign.status}
              </span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--as-ink-2)', marginTop: 8 }}>
              Created{' '}
              {new Date(campaign.created_at).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {campaign.status === 'draft' && (
              <>
                {approvableVariants.length > 0 && (
                  <button
                    className="as-btn-ghost"
                    onClick={handleApproveAll}
                    disabled={approveVariantMutation.isPending}
                    style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px' }}
                  >
                    Approve All
                  </button>
                )}
                <button
                  className="as-btn-solid"
                  onClick={handleRunCampaign}
                  disabled={runCampaignMutation.isPending || approvedVariants.length === 0}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px' }}
                >
                  {runCampaignMutation.isPending
                    ? <><SpinnerSvg /> Starting…</>
                    : 'Run Campaign'}
                </button>
              </>
            )}
            <button
              className="as-btn-ghost"
              onClick={() => setShowEditModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px' }}
            >
              Edit
            </button>
            <button
              onClick={() => { setDeleteError(null); deleteMutation.reset(); setShowDeleteModal(true); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '9px 16px',
                background: 'none',
                border: '1px solid rgba(200,60,60,0.4)',
                color: '#c44',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 13,
                transition: 'border-color 0.15s, background 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(200,60,60,0.06)'; e.currentTarget.style.borderColor = '#c44'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'rgba(200,60,60,0.4)'; }}
            >
              Delete
            </button>
          </div>
        </div>

        {/* KPI strip or empty analytics */}
        {analyticsSummary ? (
          <HeroKpiGrid hero={analyticsSummary.hero} />
        ) : (
          <AnalyticsEmptyState
            title="Performance metrics aren't available yet"
            description="Reach, CTR, spend, and regional breakdown will show here once live analytics are connected for this campaign."
          />
        )}

        {/* Tabs */}
        <div className="cdp-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`cdp-tab${activeTab === tab.key ? ' on' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab: Ad Variants */}
        {activeTab === 'variants' && (
          <>
            {isVariantsLoading && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '56px 0', color: 'var(--as-ink-3)' }}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                  width={18} height={18} style={{ animation: 'as-spin 0.8s linear infinite', marginRight: 10 }}>
                  <circle cx="8" cy="8" r="6" strokeDasharray="18 8" />
                </svg>
                <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Loading ad variants…
                </span>
              </div>
            )}

            {!isVariantsLoading && isVariantsError && (
              <div className="cdp-error-bar">
                Failed to load ad variants: {(variantsError as Error)?.message}
              </div>
            )}

            {!isVariantsLoading && !isVariantsError && completedVariants.length === 0 && (
              <div className="cdp-variants-empty">
                <div className="cdp-variants-empty-top">
                  <div className="cdp-empty-icon">
                    <PackageIcon width={18} height={18} />
                  </div>
                  <div>
                    <div className="cdp-empty-h">No approved ad variants yet</div>
                    <div className="cdp-empty-desc">
                      Approve a plan in the Generate flow to create variants for this campaign.
                      Once created and approved, they will appear here.
                    </div>
                  </div>
                </div>

                <div className="cdp-section-h">Attached Products</div>

                {isProductsLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--as-ink-3)' }}>
                    <SpinnerSvg /> Loading products…
                  </div>
                ) : attachedProducts.length > 0 ? (
                  <AttachedProducts products={attachedProducts} />
                ) : (
                  <div className="cdp-context-note">
                    {productContextText
                      ? `Attached product context: ${productContextText}`
                      : 'No attached products were found for this campaign.'}
                  </div>
                )}
              </div>
            )}

            {!isVariantsLoading && !isVariantsError && completedVariants.length > 0 && (
              <AdVariantsGrid
                variants={completedVariants}
                onApprove={(id) => approveVariantMutation.mutate(id)}
                onUnapprove={(id) => unapproveVariantMutation.mutate(id)}
              />
            )}
          </>
        )}

        {/* Tab: Analytics */}
        {activeTab === 'analytics' && (
          <CampaignAnalytics
            data={metricsData ?? null}
            isLoading={isMetricsLoading}
          />
        )}

        {/* Tab: Settings */}
        {activeTab === 'settings' && (
          <CampaignSettings
            key={campaign.updated_at}
            initial={settingsInitial}
            onSave={handleSettingsSave}
            isSaving={settingsMutation.isPending}
            error={
              settingsMutation.isError
                ? (settingsMutation.error as Error).message
                : null
            }
          />
        )}

      </div>

      {/* Modals */}
      {showEditModal && (
        <EditCampaignModal
          initial={editInitial}
          onClose={() => setShowEditModal(false)}
          onSave={handleEditSave}
          isSaving={editMutation.isPending}
          error={editMutation.isError ? (editMutation.error as Error).message : null}
        />
      )}

      {showDeleteModal && campaign && (
        <DeleteCampaignModal
          campaignNames={[campaign.name]}
          isLoading={deleteMutation.isPending}
          error={deleteError}
          onClose={closeDeleteModal}
          onConfirm={handleDelete}
        />
      )}
    </AppShell>
  );
}
