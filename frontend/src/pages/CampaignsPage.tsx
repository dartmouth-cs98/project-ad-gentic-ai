import { useMemo, useState } from 'react';
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

import { useUser } from '../contexts/UserContext';
import { useSidebar } from '../contexts/SidebarContext';
import { useTheme } from '../contexts/ThemeContext';
import { useCampaigns, useDeleteCampaign, useUpdateCampaign } from '../hooks/useCampaigns';
import {
  campaignToItem,
  distinctGoalsFromCampaigns,
  filterCampaignsByDatePreset,
  type DateRangePreset,
} from '../lib/campaignsList';

// ---------- Component ----------

export function CampaignsPage() {
  const { collapsed } = useSidebar();
  const { theme, toggleTheme } = useTheme();
  const { user, loading: userLoading } = useUser();
  const businessClientId = user?.client_id;
  const canManageCampaigns = typeof businessClientId === 'number' && businessClientId > 0;

  const { data: rawCampaigns = [], isLoading, isError, error } = useCampaigns(businessClientId);
  const deleteMutation = useDeleteCampaign();
  const updateMutation = useUpdateCampaign();

  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>('all');

  const campaignsByDate = useMemo(
    () => filterCampaignsByDatePreset(rawCampaigns, dateRangePreset),
    [rawCampaigns, dateRangePreset],
  );

  const goalOptions = useMemo(() => distinctGoalsFromCampaigns(campaignsByDate), [campaignsByDate]);

  const campaigns = useMemo(
    () => campaignsByDate.map((c) => campaignToItem(c)),
    [campaignsByDate],
  );

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>([]);
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<{ id: number; name: string } | null>(null);

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

  const handleBulkDelete = async () => {
    await Promise.all(
      selectedCampaigns.map((id) => deleteMutation.mutateAsync(Number(id))),
    );
    setSelectedCampaigns([]);
  };

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

  const openCreateModal = () => {
    if (!canManageCampaigns) return;
    setShowCreateModal(true);
  };

  const dateRangeSelectId = 'campaigns-date-range';

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />

      <main className={`${collapsed ? 'ml-16' : 'ml-64'} transition-all duration-300 flex-1 p-8`}>
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
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 bg-muted rounded-lg hover:bg-border transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

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
              onClick={handleBulkDelete}
              className="px-3 py-1.5 text-sm border border-red-500/30 text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"
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
                <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
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

        {showCreateModal && typeof businessClientId === 'number' && businessClientId > 0 && (
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
