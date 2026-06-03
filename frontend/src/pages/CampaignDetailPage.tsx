import { useState, useEffect, type ReactNode } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { PackageIcon, Loader2Icon, AlertCircleIcon, CheckCircle2Icon, PlayIcon, EditIcon, TrashIcon } from 'lucide-react';

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
import { normalizeCampaignHeroIcon } from '../lib/campaignHeroIcon';

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

function HeroKpiGrid({ hero }: { hero: CampaignAnalyticsSummary['hero'] }) {
  return (
    <div className="cmp-detail-kpi-grid">
      {hero.map((kpi, index) => (
        <div key={`${kpi.label}-${index}`} className="cmp-detail-kpi">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <span className="cmp-detail-kpi-label">{kpi.label}</span>
            {kpi.badge != null ? (
              <span className="cmp-detail-kpi-badge">{kpi.badge}</span>
            ) : null}
          </div>
          <span className="cmp-detail-kpi-val">{kpi.value}</span>
        </div>
      ))}
    </div>
  );
}

function AnalyticsEmptyState({
  title,
  description,
}: {
  title: string;
  description: ReactNode;
}) {
  return (
    <div className="cmp-detail-empty">
      <h2>{title}</h2>
      <div>{description}</div>
    </div>
  );
}

function parseProductIds(raw: string | null): number[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((v) => Number(v))
      .filter((n) => Number.isFinite(n));
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

function AttachedProducts({ products }: { products: Product[] }) {
  return (
    <div className="cmp-detail-product-grid">
      {products.map((product) => (
        <div key={product.id} className="cmp-detail-product">
          {product.image_urls[0] ? (
            <img src={product.image_urls[0]} alt={product.name} />
          ) : (
            <div className="cmp-detail-product-thumb">
              <PackageIcon size={18} />
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <div className="cmp-detail-product-name">{product.name}</div>
            {product.description && (
              <div className="cmp-detail-product-desc">{product.description}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function BackArrowIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width={12} height={12}>
      <path d="M8 2L4 7l4 5" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width={16} height={16} style={{ animation: 'as-spin 0.8s linear infinite' }}>
      <circle cx="8" cy="8" r="6" strokeDasharray="18 8" />
    </svg>
  );
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
        setDeleteError(
          err instanceof Error ? err.message : 'Failed to delete campaign.',
        );
      },
    });
  };

  if (isLoading) {
    return (
      <AppShell pageLabel="CAMPAIGN">
        <div className="as-canvas">
          <div className="prd-state">
            <SpinnerIcon />
            <p>Loading campaign…</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (isError || !campaign) {
    return (
      <AppShell pageLabel="CAMPAIGN">
        <div className="as-canvas">
          <div className="prd-state">
            <AlertCircleIcon size={28} style={{ color: 'var(--as-danger)' }} />
            <h2>Campaign not found</h2>
            <p>{(error as Error)?.message}</p>
            <Link to="/campaigns" className="as-btn-ghost" style={{ padding: '8px 16px' }}>
              Back to campaigns
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
    <AppShell pageLabel={campaign.name.toUpperCase()}>
      <div className="as-canvas">
        <Link to="/campaigns" className="cmp-detail-back">
          <BackArrowIcon />
          Back to Campaigns
        </Link>

        <div className="as-page-head">
          <div>
            <span className="as-eyebrow">— CAMPAIGN</span>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              {campaign.name}
              <span className={`cmp-status ${campaign.status}`}>
                <span className="d" />
                {campaign.status}
              </span>
            </h1>
            <p className="cmp-detail-meta">
              Created{' '}
              {new Date(campaign.created_at).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>

          <div className="cmp-detail-actions">
            {campaign.status === 'draft' && (
              <>
                {approvableVariants.length > 0 && (
                  <button
                    type="button"
                    className="as-btn-ghost"
                    onClick={handleApproveAll}
                    disabled={approveVariantMutation.isPending}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}
                  >
                    <CheckCircle2Icon size={14} />
                    Approve All
                  </button>
                )}
                <button
                  type="button"
                  className="as-btn-solid"
                  onClick={handleRunCampaign}
                  disabled={runCampaignMutation.isPending || approvedVariants.length === 0}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px' }}
                >
                  <PlayIcon size={14} />
                  {runCampaignMutation.isPending ? 'Starting…' : 'Run Campaign'}
                </button>
              </>
            )}
            <button
              type="button"
              className="as-btn-ghost"
              onClick={() => setShowEditModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}
            >
              <EditIcon size={14} />
              Edit
            </button>
            <button
              type="button"
              onClick={() => {
                setDeleteError(null);
                deleteMutation.reset();
                setShowDeleteModal(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                background: 'transparent',
                border: '1px solid rgba(185,28,28,0.35)',
                color: 'var(--as-danger)',
                fontFamily: 'inherit',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              <TrashIcon size={14} />
              Delete
            </button>
          </div>
        </div>

        {analyticsSummary ? (
          <HeroKpiGrid hero={analyticsSummary.hero} />
        ) : (
          <AnalyticsEmptyState
            title="Performance metrics aren't available yet"
            description={
              <p>
                Reach, CTR, spend, and regional breakdown will show here once live analytics are connected for this
                campaign.
              </p>
            }
          />
        )}

        <div className="stg-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`stg-tab${activeTab === tab.key ? ' on' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'variants' && (
          <>
            {isVariantsLoading && (
              <div className="prd-state" style={{ padding: '48px 0' }}>
                <Loader2Icon size={20} style={{ animation: 'as-spin 0.8s linear infinite' }} />
                <p>Loading ad variants…</p>
              </div>
            )}

            {!isVariantsLoading && isVariantsError && (
              <div className="cmp-detail-error">
                Failed to load ad variants: {(variantsError as Error)?.message}
              </div>
            )}

            {!isVariantsLoading && !isVariantsError && completedVariants.length === 0 && (
              <div className="cmp-detail-empty">
                <h2>No approved ad variants yet</h2>
                <p>
                  Approve a plan in the Generate flow to create variants for this campaign.
                  Once created and approved, they will appear here.
                </p>

                <div style={{ marginTop: 20 }}>
                  <div className="stg-section-head">Attached products</div>
                  {isProductsLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--as-ink-2)', marginTop: 12 }}>
                      <Loader2Icon size={14} style={{ animation: 'as-spin 0.8s linear infinite' }} />
                      Loading products…
                    </div>
                  ) : attachedProducts.length > 0 ? (
                    <AttachedProducts products={attachedProducts} />
                  ) : (
                    <p style={{ marginTop: 12 }}>
                      {productContextText
                        ? `Attached product context: ${productContextText}`
                        : 'No attached products were found for this campaign.'}
                    </p>
                  )}
                </div>
              </div>
            )}

            {!isVariantsLoading && !isVariantsError && completedVariants.length > 0 && (
              <AdVariantsGrid
                variants={completedVariants}
                onApprove={(variantId) => approveVariantMutation.mutate(variantId)}
                onUnapprove={(variantId) => unapproveVariantMutation.mutate(variantId)}
              />
            )}
          </>
        )}

        {activeTab === 'analytics' && (
          <CampaignAnalytics
            data={metricsData ?? null}
            isLoading={isMetricsLoading}
          />
        )}

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

      {showEditModal && (
        <EditCampaignModal
          initial={editInitial}
          onClose={() => setShowEditModal(false)}
          onSave={handleEditSave}
          isSaving={editMutation.isPending}
          error={
            editMutation.isError
              ? (editMutation.error as Error).message
              : null
          }
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
