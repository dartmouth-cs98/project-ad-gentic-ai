import { useState, useEffect } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import {
  LayoutGridIcon,
  ListIcon,
  SearchIcon,
  PlusIcon,
  XIcon,
  Loader2Icon,
  MegaphoneIcon,
  AlertCircleIcon,
  Sun,
  Moon,
} from 'lucide-react';

import { CampaignGridCard } from '../components/campaigns/CampaignGridCard';
import { CampaignTable } from '../components/campaigns/CampaignTable';
import { CreateCampaignModal } from '../components/campaigns/CreateCampaignModal';
import { DeleteCampaignModal } from '../components/campaigns/DeleteCampaignModal';
import type { CampaignItem } from '../components/campaigns/CampaignGridCard';

import { useUser } from '../contexts/UserContext';
import { useSidebar } from '../contexts/SidebarContext';
import { useCampaigns, useDeleteCampaign, useUpdateCampaign } from '../hooks/useCampaigns';
import type { Campaign } from '../types';

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
  const { collapsed } = useSidebar();
  const { user } = useUser();
  const businessClientId = user?.client_id;

  const { data: rawCampaigns = [], isLoading, isError, error } = useCampaigns(businessClientId);
  const deleteMutation = useDeleteCampaign();
  const updateMutation = useUpdateCampaign();

  const campaigns = rawCampaigns.map(campaignToItem);

  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>([]);
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);

  // Modal visibility
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<{ id: number; name: string } | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'dark';
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

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
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />

      <main className={`${collapsed ? 'ml-16' : 'ml-64'} transition-all duration-300 flex-1 p-8`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Campaigns</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage and track your ad campaigns.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center bg-muted border border-border rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <LayoutGridIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'table' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              Create Campaign
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 bg-muted rounded-lg hover:bg-border transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedCampaigns.length > 0 && (
          <div className="mb-4 flex items-center gap-3 bg-blue-600/10 border border-blue-600/20 rounded-lg px-4 py-3">
            <span className="text-sm font-medium text-blue-500">
              {selectedCampaigns.length} campaign{selectedCampaigns.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex-1" />
            <button
              onClick={handleBulkPause}
              className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
            >
              Pause Selected
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1.5 text-sm border border-red-500/30 text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"
            >
              Delete Selected
            </button>
            <button
              onClick={() => setSelectedCampaigns([])}
              className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex gap-8">
          {/* Filters Sidebar */}
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
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Date Range</h3>
              <select className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20">
                <option>Last 30 days</option>
                <option>Last 7 days</option>
                <option>Last 90 days</option>
                <option>All time</option>
              </select>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Platform</h3>
              <div className="space-y-2">
                {['meta', 'tiktok', 'youtube', 'linkedin'].map((platform) => (
                  <label key={platform} className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedPlatforms.includes(platform)}
                      onChange={() => togglePlatform(platform)}
                      className="rounded border-border text-blue-600 focus:ring-blue-500"
                    />
                    <span className="capitalize">{platform}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Objective</h3>
              <div className="space-y-2">
                {['sales', 'awareness', 'engagement', 'leads'].map((objective) => (
                  <label key={objective} className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedObjectives.includes(objective)}
                      onChange={() => toggleObjective(objective)}
                      className="rounded border-border text-blue-600 focus:ring-blue-500"
                    />
                    <span className="capitalize">{objective}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            {/* Loading state */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                <Loader2Icon className="w-6 h-6 animate-spin mb-3" />
                <p className="text-sm">Loading campaigns...</p>
              </div>
            )}

            {/* Error state */}
            {isError && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <AlertCircleIcon className="w-8 h-8 text-red-500 mb-3" />
                <h2 className="text-base font-semibold mb-1">Failed to load campaigns</h2>
                <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
              </div>
            )}

            {/* Empty state */}
            {!isLoading && !isError && campaigns.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <MegaphoneIcon className="w-8 h-8 text-muted-foreground mb-4" />
                <h2 className="text-base font-semibold mb-1">No campaigns yet</h2>
                <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                  Create your first campaign to start reaching your audience with AI-generated ads.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  <PlusIcon className="w-4 h-4" />
                  Create your first campaign
                </button>
              </div>
            )}

            {/* No search results */}
            {!isLoading && !isError && campaigns.length > 0 && filteredCampaigns.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <SearchIcon className="w-8 h-8 text-muted-foreground mb-3" />
                <h2 className="text-base font-semibold mb-1">No campaigns match your filters</h2>
                <p className="text-sm text-muted-foreground">Try adjusting your search or filter criteria.</p>
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
        {showCreateModal && (
          <CreateCampaignModal
            businessClientId={businessClientId ?? 0}
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
