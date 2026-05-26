// CampaignsPage — Swiss/Linear editorial theme
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';

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

const EMPTY_CAMPAIGNS: Campaign[] = [];


function PlusIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" width={13} height={13}>
      <path d="M7 2v10M2 7h10" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width={12} height={12}>
      <circle cx="5.5" cy="5.5" r="4" />
      <path d="M9 9l3.5 3.5" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width={13} height={13}>
      <rect x="1" y="1" width="5" height="5" />
      <rect x="8" y="1" width="5" height="5" />
      <rect x="1" y="8" width="5" height="5" />
      <rect x="8" y="8" width="5" height="5" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width={13} height={13}>
      <path d="M1 3h12M1 7h12M1 11h12" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" width={11} height={11}>
      <path d="M2 2l8 8M10 2L2 10" />
    </svg>
  );
}

function MegaphoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" width={34} height={34}>
      <path d="M3 11v2M18 4l2-2M18 20l2 2M6 15h2a2 2 0 002-2v-2a2 2 0 00-2-2H6L3 7v10l3-2zM18 9v6" />
    </svg>
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


export function CampaignsPage() {
  const { user, loading: userLoading } = useUser();
  const businessClientId = user?.client_id;
  const canManage = typeof businessClientId === 'number' && businessClientId > 0;

  const { data: rawCampaignsData, isLoading, isError, error } = useCampaigns(businessClientId);
  const { data: productsData } = useProducts(businessClientId);
  const rawCampaigns = rawCampaignsData ?? EMPTY_CAMPAIGNS;
  const products = productsData ?? [];

  const deleteMutation = useDeleteCampaign();
  const bulkDeleteMutation = useDeleteCampaignsBulk();
  const updateMutation = useUpdateCampaign();

  const [dateRange, setDateRange] = useState<DateRangePreset>('all');
  const campaignsByDate = useMemo(
    () => filterCampaignsByDatePreset(rawCampaigns, dateRange),
    [rawCampaigns, dateRange],
  );

  const goalOptions = useMemo(() => distinctGoalsFromCampaigns(campaignsByDate), [campaignsByDate]);

  useEffect(() => {
    const allowed = new Set(distinctGoalsFromCampaigns(campaignsByDate));
    setSelectedGoals((prev) => {
      const next = prev.filter((g) => allowed.has(g));
      if (next.length === prev.length && next.every((g, i) => g === prev[i])) return prev;
      return next;
    });
  }, [campaignsByDate]);

  const campaigns = useMemo(
    () => campaignsByDate.map((c) => {
      const item = campaignToItem(c);
      const firstProductId = parseProductIds(c.product_ids)[0];
      const product = products.find((p) => p.id === firstProductId);
      return { ...item, thumbnail: product?.image_urls?.[0] };
    }),
    [campaignsByDate, products],
  );

  /** Names for any loaded campaign id (not limited to the current date filter). */
  const campaignNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of rawCampaigns) {
      map.set(String(c.id), c.name);
    }
    return map;
  }, [rawCampaigns]);

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [campaignsToDelete, setCampaignsToDelete] = useState<{ id: number; name: string }[]>([]);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isDeletingCampaigns =
    deleteMutation.isPending || bulkDeleteMutation.isPending;

  const closeDeleteModal = () => {
    if (isDeletingCampaigns) return;
    setShowDeleteModal(false);
    setCampaignsToDelete([]);
    setDeleteError(null);
  };

  const filteredCampaigns = campaigns.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.product.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGoal = selectedGoals.length === 0 || selectedGoals.includes(c.objective);
    return matchesSearch && matchesGoal;
  });

  const toggleGoal = (g: string) =>
    setSelectedGoals((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]);

  const toggleSelection = (id: string) =>
    setSelectedCampaigns((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);

  const toggleSelectAll = () =>
    setSelectedCampaigns(selectedCampaigns.length === filteredCampaigns.length ? [] : filteredCampaigns.map((c) => c.id));

  const handleBulkPause = async () => {
    await Promise.all(
      selectedCampaigns.map((id) =>
        updateMutation.mutateAsync({ campaignId: Number(id), data: { status: 'paused' } }),
      ),
    );
    setSelectedCampaigns([]);
  };

  const openDeleteModal = (targets: { id: number; name: string }[]) => {
    if (targets.length === 0) return;
    setDeleteError(null);
    setCampaignsToDelete(targets);
    setShowDeleteModal(true);
  };

  const handleBulkDeleteClick = () => {
    const targets = selectedCampaigns.map((id) => ({
      id: Number(id),
      name: campaignNameById.get(id) ?? `Campaign #${id}`,
    }));
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
        `You can delete at most ${BULK_DELETE_MAX_CAMPAIGNS} campaigns at a time. Deselect some and try again.`,
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

  const DATE_PRESETS: { id: DateRangePreset; label: string }[] = [
    { id: '7d', label: '7D' },
    { id: '30d', label: '30D' },
    { id: '90d', label: '90D' },
    { id: 'all', label: 'ALL' },
  ];

  return (
    <AppShell>
      <div className="as-main">
        <div className="as-canvas">

          {/* Page header */}
          <div className="as-page-head">
            <div>
              <span className="as-eyebrow">— CAMPAIGNS</span>
              <h1>
                Campaigns
                {rawCampaigns.length > 0 && <span className="muted"> · {rawCampaigns.length}</span>}
              </h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* View toggle */}
              <div className="cmp-view-toggle">
                <button
                  className={`cmp-view-btn${viewMode === 'grid' ? ' on' : ''}`}
                  onClick={() => setViewMode('grid')}
                  title="Grid view"
                >
                  <GridIcon />
                </button>
                <button
                  className={`cmp-view-btn${viewMode === 'table' ? ' on' : ''}`}
                  onClick={() => setViewMode('table')}
                  title="Table view"
                >
                  <ListIcon />
                </button>
              </div>
              <button
                className="as-btn-solid"
                onClick={() => canManage && setShowCreateModal(true)}
                disabled={!canManage}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px' }}
              >
                <PlusIcon />
                Create Campaign
              </button>
            </div>
          </div>

          {/* Warn: no business client */}
          {!userLoading && user && !canManage && (
            <div className="cmp-warn">
              <span className="cmp-warn-dot" />
              Your profile does not have a business client ID. Campaigns cannot be loaded or created until one is assigned.
            </div>
          )}

          {/* Delete error banner (shown after modal closes on partial failure) */}
          {deleteError && !showDeleteModal && (
            <div className="cmp-warn" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{deleteError}</span>
              <button
                onClick={() => setDeleteError(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '0 2px' }}
                aria-label="Dismiss"
              >
                <XIcon />
              </button>
            </div>
          )}

          {/* Bulk selection bar */}
          {selectedCampaigns.length > 0 && (
            <div className="cmp-selection-bar">
              <span className="cmp-selection-count">{selectedCampaigns.length} selected</span>
              <div style={{ flex: 1 }} />
              <button className="cmp-sb-btn" onClick={handleBulkPause}>Pause</button>
              <button className="cmp-sb-btn danger" onClick={handleBulkDeleteClick}>Delete</button>
              <button className="cmp-sb-clear" onClick={() => setSelectedCampaigns([])} aria-label="Clear selection">
                <XIcon />
              </button>
            </div>
          )}

          {/* Not signed in */}
          {!userLoading && !user ? (
            <div className="prd-state">
              <div className="prd-state-icon"><MegaphoneIcon /></div>
              <h2>Sign in to view campaigns</h2>
              <p>You need an account to load your campaigns and create new ones.</p>
              <Link to="/sign-in" className="as-btn-solid" style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px' }}>
                Sign in
              </Link>
            </div>
          ) : (
            <>
              {/* Toolbar: search + date range + goal filters */}
              <div className="cmp-toolbar">
                <div className="cmp-search-wrap">
                  <SearchIcon />
                  <input
                    type="text"
                    className="cmp-search"
                    placeholder="Search campaigns…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                {/* Date range pills */}
                <div className="as-pill-group">
                  {DATE_PRESETS.map((d) => (
                    <button
                      key={d.id}
                      className={`as-pill${dateRange === d.id ? ' on' : ''}`}
                      onClick={() => setDateRange(d.id)}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Goal filter chips */}
              {goalOptions.length > 0 && (
                <div className="cmp-filter-row">
                  <span className="cmp-filter-label">Goal</span>
                  {goalOptions.map((g) => (
                    <button
                      key={g}
                      className={`as-pill${selectedGoals.includes(g) ? ' on' : ''}`}
                      onClick={() => toggleGoal(g)}
                    >
                      {g}
                    </button>
                  ))}
                  {selectedGoals.length > 0 && (
                    <button
                      className="as-btn-ghost"
                      onClick={() => setSelectedGoals([])}
                      style={{ padding: '3px 8px', fontSize: 10 }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              )}

              {/* Loading */}
              {isLoading && (
                <div className="prd-state">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width={20} height={20} style={{ animation: 'as-spin 0.8s linear infinite' }}>
                    <circle cx="8" cy="8" r="6" strokeDasharray="18 8" />
                  </svg>
                </div>
              )}

              {/* Error */}
              {isError && (
                <div className="prd-state">
                  <h2>Failed to load campaigns</h2>
                  <p>{error instanceof Error ? error.message : String(error ?? 'Unknown error')}</p>
                </div>
              )}

              {/* Empty — no campaigns at all */}
              {!isLoading && !isError && canManage && rawCampaigns.length === 0 && (
                <div className="prd-state">
                  <div className="prd-state-icon"><MegaphoneIcon /></div>
                  <h2>No campaigns yet</h2>
                  <p>Create your first campaign to start reaching your audience with AI-generated ads.</p>
                  <button
                    className="as-btn-solid"
                    onClick={() => setShowCreateModal(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px' }}
                  >
                    <PlusIcon />
                    Create your first campaign
                  </button>
                </div>
              )}

              {/* Empty — date range filter removes all */}
              {!isLoading && !isError && canManage && rawCampaigns.length > 0 && campaigns.length === 0 && (
                <div className="prd-state">
                  <h2>No campaigns in this period</h2>
                  <p>Try "ALL TIME" or a longer date window.</p>
                  <button className="as-btn-ghost" onClick={() => setDateRange('all')} style={{ padding: '7px 16px' }}>
                    Show all time
                  </button>
                </div>
              )}

              {/* Empty — search/goal filter removes all */}
              {!isLoading && !isError && canManage && campaigns.length > 0 && filteredCampaigns.length === 0 && (
                <div className="prd-state">
                  <h2>No matches</h2>
                  <p>Try adjusting your search or goal filters.</p>
                </div>
              )}

              {/* Campaign list */}
              {!isLoading && !isError && filteredCampaigns.length > 0 && (
                viewMode === 'grid' ? (
                  <div className="cmp-grid">
                    {filteredCampaigns.map((c) => (
                      <CampaignGridCard
                        key={c.id}
                        campaign={c}
                        isSelected={selectedCampaigns.includes(c.id)}
                        onToggleSelection={toggleSelection}
                      />
                    ))}
                  </div>
                ) : (
                  <CampaignTable
                    campaigns={filteredCampaigns}
                    selectedCampaigns={selectedCampaigns}
                    onToggleSelection={toggleSelection}
                    onToggleSelectAll={toggleSelectAll}
                    onDeleteClick={handleDeleteClick}
                  />
                )
              )}
            </>
          )}

        </div>
      </div>

      {showCreateModal && canManage && (
        <CreateCampaignModal
          businessClientId={businessClientId!}
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
    </AppShell>
  );
}
