import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import {
  LayoutGridIcon,
  ListIcon,
  SearchIcon,
  PlusIcon,
  XIcon,
  Loader2Icon,
  MegaphoneIcon,
  AlertCircleIcon,
} from 'lucide-react';

import { CampaignGridCard } from '../components/campaigns/CampaignGridCard';
import { CampaignTable } from '../components/campaigns/CampaignTable';
import { CreateCampaignModal } from '../components/campaigns/CreateCampaignModal';
import { DeleteCampaignModal } from '../components/campaigns/DeleteCampaignModal';

import { useUser } from '../contexts/UserContext';
import { BULK_DELETE_MAX_CAMPAIGNS } from '../api/campaigns';
import {
  useCampaigns,
  useDeleteCampaign,
  useDeleteCampaignsBulk,
  useUpdateCampaign,
} from '../hooks/useCampaigns';
import { useProducts } from '../hooks/useProducts';
import {
  campaignToItem,
  distinctGoalsFromCampaigns,
  filterCampaignsByDatePreset,
  type DateRangePreset,
} from '../lib/campaignsList';
import type { Campaign } from '../types';

/** Stable fallback while campaigns query has no data (avoids a new `[]` each render). */
const EMPTY_CAMPAIGNS: Campaign[] = [];

// ---------- Component ----------

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

export function CampaignsPage() {
  const { user, loading: userLoading } = useUser();
  const businessClientId = user?.client_id;
  const canManageCampaigns = typeof businessClientId === 'number' && businessClientId > 0;

  const { data: rawCampaignsData, isLoading, isError, error } = useCampaigns(businessClientId);
  const { data: productsData } = useProducts(businessClientId);
  const rawCampaigns = rawCampaignsData ?? EMPTY_CAMPAIGNS;
  const products = productsData ?? [];
  const deleteMutation = useDeleteCampaign();
  const bulkDeleteMutation = useDeleteCampaignsBulk();
  const updateMutation = useUpdateCampaign();

  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>('all');

  const campaignsByDate = useMemo(
    () => filterCampaignsByDatePreset(rawCampaigns, dateRangePreset),
    [rawCampaigns, dateRangePreset],
  );

  const goalOptions = useMemo(() => distinctGoalsFromCampaigns(campaignsByDate), [campaignsByDate]);

  useEffect(() => {
    const allowed = new Set(distinctGoalsFromCampaigns(campaignsByDate));
    setSelectedObjectives((prev) => {
      const next = prev.filter((g) => allowed.has(g));
      if (next.length === prev.length && next.every((g, i) => g === prev[i])) return prev;
      return next;
    });
  }, [campaignsByDate]);

  const campaigns = useMemo(
    () =>
      campaignsByDate.map((c) => {
        const item = campaignToItem(c);
        const firstProductId = parseProductIds(c.product_ids)[0];
        const product = products.find((p) => p.id === firstProductId);
        const productImage = product?.image_urls?.[0];
        return {
          ...item,
          thumbnail: productImage,
        };
      }),
    [campaignsByDate, products],
  );

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>([]);
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [campaignsToDelete, setCampaignsToDelete] = useState<{ id: number; name: string }[]>([]);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const toggleObjective = (objective: string) => {
    setSelectedObjectives((prev) =>
      prev.includes(objective)
        ? prev.filter((o) => o !== objective)
        : [...prev, objective],
    );
  };

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch =
      campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.product.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesObjective =
      selectedObjectives.length === 0 || selectedObjectives.includes(campaign.objective);
    return matchesSearch && matchesObjective;
  });

  const toggleCampaignSelection = (id: string) => {
    setSelectedCampaigns((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    if (selectedCampaigns.length === filteredCampaigns.length) {
      setSelectedCampaigns([]);
    } else {
      setSelectedCampaigns(filteredCampaigns.map((c) => c.id));
    }
  };

  const handleBulkPause = async () => {
    await Promise.all(
      selectedCampaigns.map((id) =>
        updateMutation.mutateAsync({ campaignId: Number(id), data: { status: 'paused' } }),
      ),
    );
    setSelectedCampaigns([]);
  };

  const isDeletingCampaigns =
    deleteMutation.isPending || bulkDeleteMutation.isPending;

  const closeDeleteModal = () => {
    if (isDeletingCampaigns) return;
    setShowDeleteModal(false);
    setCampaignsToDelete([]);
    setDeleteError(null);
  };

  const openDeleteModal = (targets: { id: number; name: string }[]) => {
    if (targets.length === 0) return;
    setDeleteError(null);
    setCampaignsToDelete(targets);
    setShowDeleteModal(true);
  };

  const handleBulkDeleteClick = () => {
    const targets = campaigns
      .filter((c) => selectedCampaigns.includes(c.id))
      .map((c) => ({ id: Number(c.id), name: c.name }));
    openDeleteModal(targets);
  };

  const handleDeleteClick = (campaignId: string, campaignName: string) => {
    openDeleteModal([{ id: Number(campaignId), name: campaignName }]);
  };

  const handleConfirmDelete = async () => {
    if (campaignsToDelete.length === 0) return;
    setDeleteError(null);
    const ids = campaignsToDelete.map((c) => c.id);
    if (ids.length > BULK_DELETE_MAX_CAMPAIGNS) {
      setDeleteError(
        `You can delete at most ${BULK_DELETE_MAX_CAMPAIGNS} campaigns at a time. Deselect some campaigns and try again.`,
      );
      return;
    }
    try {
      if (ids.length === 1) {
        await deleteMutation.mutateAsync(ids[0]);
        setSelectedCampaigns([]);
        setShowDeleteModal(false);
        setCampaignsToDelete([]);
      } else {
        const result = await bulkDeleteMutation.mutateAsync(ids);
        const { deleted_ids, not_found_ids } = result;
        if (deleted_ids.length === 0 && not_found_ids.length > 0) {
          setDeleteError(
            'None of the selected campaigns could be deleted — they may have already been removed.',
          );
          return;
        }
        setSelectedCampaigns([]);
        setShowDeleteModal(false);
        setCampaignsToDelete([]);
        if (not_found_ids.length > 0) {
          setDeleteError(
            `${not_found_ids.length} campaign(s) were already removed and could not be deleted.`,
          );
        }
      }
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete campaigns.');
    }
  };

  const openCreateModal = () => {
    if (!canManageCampaigns) return;
    setShowCreateModal(true);
  };

  const dateRangeSelectId = 'campaigns-date-range';

  return (
    <DashboardLayout>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Campaigns</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage and track your ad campaigns.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center bg-muted border border-border rounded-lg p-1">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <LayoutGridIcon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'table' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={openCreateModal}
              disabled={!canManageCampaigns}
              title={!canManageCampaigns ? 'A business client is required to create campaigns.' : undefined}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              <PlusIcon className="w-4 h-4" />
              Create Campaign
            </button>
          </div>
        </div>

        {deleteError && (
          <div
            className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100 flex items-start justify-between gap-3"
            role="alert"
          >
            <span>{deleteError}</span>
            <button
              type="button"
              onClick={() => setDeleteError(null)}
              className="text-amber-900/70 dark:text-amber-100/70 hover:text-amber-900 dark:hover:text-amber-100"
              aria-label="Dismiss"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        {!userLoading && user && !canManageCampaigns && (
          <div
            className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100"
            role="status"
          >
            Your profile does not have a business client id yet. Campaigns cannot be loaded or created until one is
            assigned.
          </div>
        )}

        {selectedCampaigns.length > 0 && (
          <div className="mb-4 flex items-center gap-3 bg-blue-600/10 border border-blue-600/20 rounded-lg px-4 py-3">
            <span className="text-sm font-medium text-blue-500">
              {selectedCampaigns.length} campaign{selectedCampaigns.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex-1" />
            <button
              type="button"
              onClick={handleBulkPause}
              className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
            >
              Pause Selected
            </button>
            <button
              type="button"
              onClick={handleBulkDeleteClick}
              disabled={selectedCampaigns.length > BULK_DELETE_MAX_CAMPAIGNS}
              title={
                selectedCampaigns.length > BULK_DELETE_MAX_CAMPAIGNS
                  ? `Select at most ${BULK_DELETE_MAX_CAMPAIGNS} campaigns to delete at once`
                  : undefined
              }
              className="px-3 py-1.5 text-sm border border-red-500/30 text-red-500 rounded-lg hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              Delete Selected
            </button>
            <button
              type="button"
              onClick={() => setSelectedCampaigns([])}
              className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        {!userLoading && !user ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-4">
            <MegaphoneIcon className="w-8 h-8 text-muted-foreground mb-4" />
            <h2 className="text-base font-semibold mb-1">Sign in to view campaigns</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              You need an account to load your campaigns and create new ones.
            </p>
            <Link
              to="/sign-in"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Sign in
            </Link>
          </div>
        ) : (
        <div className="flex gap-8">
          <div className="w-56 flex-shrink-0 space-y-6">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20 placeholder:text-muted-foreground"
              />
            </div>

            <div>
              <label htmlFor={dateRangeSelectId} className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Date range
              </label>
              <select
                id={dateRangeSelectId}
                value={dateRangePreset}
                onChange={(e) => setDateRangePreset(e.target.value as DateRangePreset)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="all">All time</option>
              </select>
              <p className="mt-1.5 text-xs text-muted-foreground">Filters by campaign created date.</p>
            </div>

            {goalOptions.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Goal</h3>
                <div className="space-y-2">
                  {goalOptions.map((objective) => (
                    <label
                      key={objective}
                      className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedObjectives.includes(objective)}
                        onChange={() => toggleObjective(objective)}
                        className="rounded border-border text-blue-600 focus:ring-blue-500"
                      />
                      <span className="truncate" title={objective}>
                        {objective}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex-1">
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                <Loader2Icon className="w-6 h-6 animate-spin mb-3" />
                <p className="text-sm">Loading campaigns...</p>
              </div>
            )}

            {isError && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <AlertCircleIcon className="w-8 h-8 text-red-500 mb-3" />
                <h2 className="text-base font-semibold mb-1">Failed to load campaigns</h2>
                <p className="text-sm text-muted-foreground">
                  {error instanceof Error ? error.message : String(error ?? 'Unknown error')}
                </p>
              </div>
            )}

            {!isLoading && !isError && canManageCampaigns && rawCampaigns.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <MegaphoneIcon className="w-8 h-8 text-muted-foreground mb-4" />
                <h2 className="text-base font-semibold mb-1">No campaigns yet</h2>
                <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                  Create your first campaign to start reaching your audience with AI-generated ads.
                </p>
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  <PlusIcon className="w-4 h-4" />
                  Create your first campaign
                </button>
              </div>
            )}

            {!isLoading && !isError && canManageCampaigns && rawCampaigns.length > 0 && campaigns.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <MegaphoneIcon className="w-8 h-8 text-muted-foreground mb-4" />
                <h2 className="text-base font-semibold mb-1">No campaigns in this date range</h2>
                <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                  Try choosing &ldquo;All time&rdquo; or a longer window. Filters use each campaign&rsquo;s created date.
                </p>
                <button
                  type="button"
                  onClick={() => setDateRangePreset('all')}
                  className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  Show all time
                </button>
              </div>
            )}

            {!isLoading && !isError && canManageCampaigns && campaigns.length > 0 && filteredCampaigns.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <SearchIcon className="w-8 h-8 text-muted-foreground mb-3" />
                <h2 className="text-base font-semibold mb-1">No campaigns match your filters</h2>
                <p className="text-sm text-muted-foreground">Try adjusting your search, date range, or goal filters.</p>
              </div>
            )}

            {!isLoading && !isError && filteredCampaigns.length > 0 && (
              viewMode === 'grid' ? (
                <div className="grid grid-cols-2 gap-6">
                  {filteredCampaigns.map((campaign) => (
                    <CampaignGridCard
                      key={campaign.id}
                      campaign={campaign}
                      isSelected={selectedCampaigns.includes(campaign.id)}
                      onToggleSelection={toggleCampaignSelection}
                    />
                  ))}
                </div>
              ) : (
                <CampaignTable
                  campaigns={filteredCampaigns}
                  selectedCampaigns={selectedCampaigns}
                  onToggleSelection={toggleCampaignSelection}
                  onToggleSelectAll={toggleSelectAll}
                  onDeleteClick={handleDeleteClick}
                />
              )
            )}
          </div>
        </div>
        )}

        {showCreateModal && typeof businessClientId === 'number' && businessClientId > 0 && (
          <CreateCampaignModal
            businessClientId={businessClientId}
            onClose={() => setShowCreateModal(false)}
          />
        )}

        {showDeleteModal && campaignsToDelete.length > 0 && (
          <DeleteCampaignModal
            campaignNames={campaignsToDelete.map((c) => c.name)}
            isLoading={isDeletingCampaigns}
            error={deleteError}
            onClose={closeDeleteModal}
            onConfirm={handleConfirmDelete}
          />
        )}
    </DashboardLayout>
  );
}
