import { useState } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { Button } from '../components/ui/Button';
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
import type { CampaignItem } from '../components/campaigns/CampaignGridCard';

import { useUser } from '../contexts/UserContext';
import { useCampaigns, useDeleteCampaign, useUpdateCampaign } from '../hooks/useCampaigns';
import type { Campaign } from '../api/campaigns';

// ---------- Helpers ----------

/**
 * product_context is stored as a JSON object {"text": "..."} in the DB
 * (Azure SQL's ISJSON() only accepts objects/arrays, not scalar strings).
 * Fall back gracefully for any other shape.
 */
function parseProductContext(raw: string | null | undefined): string {
  if (!raw) return '—';
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed.text ?? parsed.description ?? JSON.stringify(parsed);
    }
    if (typeof parsed === 'string') return parsed;
    return String(parsed);
  } catch {
    return raw;
  }
}

// ---------- Mapper: API Campaign → UI CampaignItem ----------

function campaignToItem(c: Campaign): CampaignItem {
  return {
    id: String(c.id),
    name: c.name,
    product: parseProductContext(c.product_context),
    status: c.status,
    reach: '—',
    engagement: '—',
    platform: '—',
    objective: c.goal ?? '—',
    dateCreated: new Date(c.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
  };
}

// ---------- Component ----------

export function CampaignsPage() {
  const { user } = useUser();
  const businessClientId = user?.client_id;

  const { data: rawCampaigns = [], isLoading, isError, error } = useCampaigns(businessClientId);
  const deleteMutation = useDeleteCampaign();
  const updateMutation = useUpdateCampaign();

  const campaigns = rawCampaigns.map(campaignToItem);

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>([]);
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);

  // Modal visibility
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<{ id: number; name: string } | null>(null);

  // ---------- Filter helpers ----------

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform],
    );
  };

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
    const matchesPlatform =
      selectedPlatforms.length === 0 ||
      selectedPlatforms.includes(campaign.platform);
    const matchesObjective =
      selectedObjectives.length === 0 ||
      selectedObjectives.includes(campaign.objective);
    return matchesSearch && matchesPlatform && matchesObjective;
  });

  // ---------- Selection helpers ----------

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

  // ---------- Bulk actions ----------

  const handleBulkPause = async () => {
    await Promise.all(
      selectedCampaigns.map((id) =>
        updateMutation.mutateAsync({ campaignId: Number(id), data: { status: 'paused' } }),
      ),
    );
    setSelectedCampaigns([]);
  };

  const handleBulkDelete = async () => {
    await Promise.all(
      selectedCampaigns.map((id) => deleteMutation.mutateAsync(Number(id))),
    );
    setSelectedCampaigns([]);
  };

  // ---------- Delete ----------

  const handleDeleteClick = (campaignId: string, campaignName: string) => {
    setCampaignToDelete({ id: Number(campaignId), name: campaignName });
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (!campaignToDelete) return;
    deleteMutation.mutate(campaignToDelete.id, {
      onSuccess: () => {
        setShowDeleteModal(false);
        setCampaignToDelete(null);
      },
    });
  };

  // ---------- Render ----------

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="ml-64 flex-1 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            Campaign Manager
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex bg-white rounded-lg border border-slate-200 p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <LayoutGridIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'table'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>
            <Button
              leftIcon={<PlusIcon className="w-4 h-4" />}
              onClick={() => setShowCreateModal(true)}
            >
              Create Campaign
            </Button>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedCampaigns.length > 0 && (
          <div className="mb-4 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
            <span className="text-sm font-medium text-blue-700">
              {selectedCampaigns.length} campaign
              {selectedCampaigns.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex-1" />
            <Button size="sm" variant="secondary" onClick={handleBulkPause}>
              Pause Selected
            </Button>
            <Button size="sm" variant="danger" onClick={handleBulkDelete}>
              Delete Selected
            </Button>
            <button
              onClick={() => setSelectedCampaigns([])}
              className="p-1 rounded hover:bg-blue-100 transition-colors"
            >
              <XIcon className="w-4 h-4 text-blue-500" />
            </button>
          </div>
        )}

        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <div className="w-64 flex-shrink-0 space-y-6">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Date Range
              </h3>
              <select className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Last 30 days</option>
                <option>Last 7 days</option>
                <option>Last 90 days</option>
                <option>All time</option>
              </select>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Platform
              </h3>
              <div className="space-y-2">
                {['meta', 'tiktok', 'youtube', 'linkedin'].map((platform) => (
                  <label
                    key={platform}
                    className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPlatforms.includes(platform)}
                      onChange={() => togglePlatform(platform)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="capitalize">{platform}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Objective
              </h3>
              <div className="space-y-2">
                {['sales', 'awareness', 'engagement', 'leads'].map(
                  (objective) => (
                    <label
                      key={objective}
                      className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedObjectives.includes(objective)}
                        onChange={() => toggleObjective(objective)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="capitalize">{objective}</span>
                    </label>
                  ),
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            {/* Loading state */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                <Loader2Icon className="w-8 h-8 animate-spin mb-3" />
                <p className="text-sm">Loading campaigns...</p>
              </div>
            )}

            {/* Error state */}
            {isError && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mb-4">
                  <AlertCircleIcon className="w-7 h-7 text-red-500" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900 mb-1">
                  Failed to load campaigns
                </h2>
                <p className="text-sm text-slate-500">
                  {(error as Error).message}
                </p>
              </div>
            )}

            {/* Empty state */}
            {!isLoading && !isError && campaigns.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                  <MegaphoneIcon className="w-9 h-9 text-slate-400" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">
                  No campaigns yet
                </h2>
                <p className="text-slate-500 mb-8 max-w-sm text-sm">
                  Create your first campaign to start reaching your audience
                  with AI-generated ads.
                </p>
                <Button
                  leftIcon={<PlusIcon className="w-4 h-4" />}
                  onClick={() => setShowCreateModal(true)}
                >
                  Create your first campaign
                </Button>
              </div>
            )}

            {/* No search results (has campaigns, but filter yields nothing) */}
            {!isLoading && !isError && campaigns.length > 0 && filteredCampaigns.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <SearchIcon className="w-7 h-7 text-slate-400" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900 mb-1">
                  No campaigns match your filters
                </h2>
                <p className="text-sm text-slate-500">
                  Try adjusting your search or filter criteria.
                </p>
              </div>
            )}

            {/* Campaign grid / table */}
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

        {/* Modals */}
        {showCreateModal && businessClientId && (
          <CreateCampaignModal
            businessClientId={businessClientId}
            onClose={() => setShowCreateModal(false)}
          />
        )}

        {showDeleteModal && campaignToDelete && (
          <DeleteCampaignModal
            campaignName={campaignToDelete.name}
            isLoading={deleteMutation.isPending}
            onClose={() => {
              setShowDeleteModal(false);
              setCampaignToDelete(null);
            }}
            onConfirm={handleConfirmDelete}
          />
        )}
      </main>
    </div>
  );
}
