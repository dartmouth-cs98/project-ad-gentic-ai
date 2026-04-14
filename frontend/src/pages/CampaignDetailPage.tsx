import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { useSidebar } from '../contexts/SidebarContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import {
  ArrowLeftIcon,
  BarChart3Icon,
  UsersIcon,
  GlobeIcon,
  PackageIcon,
  EditIcon,
  TrashIcon,
  Loader2Icon,
  AlertCircleIcon,
} from 'lucide-react';

import { AdVariantsGrid } from '../components/campaigns/AdVariantsGrid';
import { CampaignAnalytics } from '../components/campaigns/CampaignAnalytics';
import { CampaignSettings } from '../components/campaigns/CampaignSettings';
import { EditCampaignModal } from '../components/campaigns/EditCampaignModal';
import { DeleteCampaignModal } from '../components/campaigns/DeleteCampaignModal';
import { statusColors } from '../components/campaigns/CampaignGridCard';

import type { AnalyticsMetric, PersonaPerf } from '../components/campaigns/CampaignAnalytics';
import type { EditFormData } from '../components/campaigns/EditCampaignModal';
import type { SettingsFormData } from '../components/campaigns/CampaignSettings';

import { useCampaign, useUpdateCampaign, useDeleteCampaign } from '../hooks/useCampaigns';
import { useCampaignAdVariants } from '../hooks/useAdGeneration';
import { useUser } from '../contexts/UserContext';
import { useProducts } from '../hooks/useProducts';
import type { CampaignStatus, Product } from '../types';

// ---------- Static placeholder data (analytics not yet in API) ----------

const analyticsMetrics: AnalyticsMetric[] = [
  { label: 'Impressions', value: '342,180', change: '+14%', positive: true },
  { label: 'Clicks', value: '14,371', change: '+22%', positive: true },
  { label: 'CTR', value: '4.2%', change: '+0.8%', positive: true },
  { label: 'CPC', value: '$0.86', change: '-12%', positive: true },
  { label: 'Conversions', value: '1,240', change: '+18%', positive: true },
  { label: 'ROAS', value: '3.4x', change: '+0.6x', positive: true },
];

const personaPerformance: PersonaPerf[] = [
  { name: 'The Skeptic', convRate: '4.3%', impressions: '142K', color: 'teal' },
  { name: 'The Impulse Buyer', convRate: '5.9%', impressions: '118K', color: 'orange' },
  { name: 'The Researcher', convRate: '3.0%', impressions: '82K', color: 'blue' },
];

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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {products.map((product) => (
        <Card key={product.id} padding="md">
          <div className="flex items-start gap-3">
            {product.image_urls[0] ? (
              <img
                src={product.image_urls[0]}
                alt={product.name}
                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <PackageIcon className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground truncate">
                {product.name}
              </h3>
              {product.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {product.description}
                </p>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ---------- Component ----------

export function CampaignDetailPage() {
  const { collapsed } = useSidebar();
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

  // Two separate mutation instances — one for the edit modal, one for the settings tab
  const editMutation = useUpdateCampaign();
  const settingsMutation = useUpdateCampaign();
  const deleteMutation = useDeleteCampaign();

  const [activeTab, setActiveTab] = useState<'variants' | 'analytics' | 'settings'>('variants');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const tabs = [
    { key: 'variants' as const, label: 'Ad Variants' },
    { key: 'analytics' as const, label: 'Analytics' },
    { key: 'settings' as const, label: 'Settings' },
  ];

  // ---------- Handlers ----------

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
      },
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate(campaignId, {
      onSuccess: () => navigate('/campaigns'),
    });
  };

  // ---------- Loading state ----------

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className={`${collapsed ? 'ml-16' : 'ml-64'} transition-all duration-300 flex-1 flex items-center justify-center`}>
          <div className="flex flex-col items-center text-muted-foreground">
            <Loader2Icon className="w-8 h-8 animate-spin mb-3" />
            <p className="text-sm">Loading campaign...</p>
          </div>
        </main>
      </div>
    );
  }

  // ---------- Error state ----------

  if (isError || !campaign) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className={`${collapsed ? 'ml-16' : 'ml-64'} transition-all duration-300 flex-1 flex items-center justify-center`}>
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <AlertCircleIcon className="w-7 h-7 text-red-500" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-1">
              Campaign not found
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              {(error as Error)?.message}
            </p>
            <Link to="/campaigns" className="text-blue-600 text-sm hover:underline">
              Back to campaigns
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // ---------- Derived values ----------

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
    platforms: [],
    budget: campaign.budget_total?.toString() ?? '',
    startDate: campaign.start_date ?? '',
    endDate: campaign.end_date ?? '',
  };

  const statusVariant = statusColors[campaign.status as keyof typeof statusColors] ?? 'default';
  const attachedProductIds = parseProductIds(campaign.product_ids);
  const attachedProducts = attachedProductIds
    .map((productId) => products.find((p) => p.id === productId))
    .filter((p): p is Product => !!p);
  const productContextText = parseProductContext(campaign.product_context);
  const approvedVariants = campaignVariants.filter((variant) => variant.status === 'completed');

  // ---------- Render ----------

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className={`${collapsed ? 'ml-16' : 'ml-64'} transition-all duration-300 flex-1 p-8`}>
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/campaigns"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-1" />
            Back to Campaigns
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-foreground">
                  {campaign.name}
                </h1>
                <Badge variant={statusVariant}>
                  {campaign.status}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Created on{' '}
                {new Date(campaign.created_at).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                leftIcon={<EditIcon className="w-4 h-4" />}
                onClick={() => setShowEditModal(true)}
              >
                Edit Campaign
              </Button>
              <Button
                variant="danger"
                leftIcon={<TrashIcon className="w-4 h-4" />}
                onClick={() => setShowDeleteModal(true)}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Hero Metrics — static placeholders until analytics API exists */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <Card variant="elevated" padding="md">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UsersIcon className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                +12%
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">124.5K</p>
            <p className="text-sm text-muted-foreground">Total Reach</p>
          </Card>

          <Card variant="elevated" padding="md">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MousePointerClickIcon className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                +5.2%
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">4.2%</p>
            <p className="text-sm text-muted-foreground">Click Rate (CTR)</p>
          </Card>

          <Card variant="elevated" padding="md">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <BarChart3Icon className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                +8.4%
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">$1.24</p>
            <p className="text-sm text-muted-foreground">Cost Per Click</p>
          </Card>

          <Card variant="elevated" padding="md">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-amber-100 rounded-lg">
                <GlobeIcon className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full">
                Global
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">4</p>
            <p className="text-sm text-muted-foreground">Active Regions</p>
          </Card>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-border">
          <div className="flex gap-8">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`pb-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        {activeTab === 'variants' && (
          <>
            {isVariantsLoading && (
              <div className="flex items-center justify-center py-14 text-muted-foreground">
                <Loader2Icon className="w-6 h-6 animate-spin mr-2" />
                <span className="text-sm">Loading ad variants...</span>
              </div>
            )}

            {!isVariantsLoading && isVariantsError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                Failed to load ad variants: {(variantsError as Error)?.message}
              </div>
            )}

            {!isVariantsLoading && !isVariantsError && approvedVariants.length === 0 && (
              <Card variant="elevated" padding="lg">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                    <PackageIcon className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      No approved ad variants yet
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Approve a plan in the Generate flow to create variants for this campaign.
                      Once created and approved, they will appear here.
                    </p>
                  </div>
                </div>

                <div className="mb-3">
                  <h3 className="text-sm font-semibold text-foreground">Attached products</h3>
                </div>

                {isProductsLoading ? (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Loader2Icon className="w-4 h-4 animate-spin mr-2" />
                    Loading products...
                  </div>
                ) : attachedProducts.length > 0 ? (
                  <AttachedProducts products={attachedProducts} />
                ) : (
                  <div className="rounded-lg border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
                    {productContextText
                      ? `Attached product context: ${productContextText}`
                      : 'No attached products were found for this campaign.'}
                  </div>
                )}
              </Card>
            )}

            {!isVariantsLoading && !isVariantsError && approvedVariants.length > 0 && (
              <AdVariantsGrid variants={approvedVariants} />
            )}
          </>
        )}

        {activeTab === 'analytics' && (
          <CampaignAnalytics
            metrics={analyticsMetrics}
            personas={personaPerformance}
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

        {/* Modals */}
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

        {showDeleteModal && (
          <DeleteCampaignModal
            campaignName={campaign.name}
            isLoading={deleteMutation.isPending}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={handleDelete}
          />
        )}
      </main>
    </div>
  );
}

function MousePointerClickIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m9 9 5 12 1.8-5.2L21 14Z" />
      <path d="M7.2 2.2 8 5.1" />
      <path d="m5.1 8-2.9-.8" />
      <path d="M14 4.1 12 6" />
      <path d="m6 12-1.9 2" />
    </svg>
  );
}
