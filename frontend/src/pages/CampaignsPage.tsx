import { useState } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { Button } from '../components/ui/Button';
import {
  LayoutGridIcon,
  ListIcon,
  SearchIcon,
  PlusIcon,
  XIcon,
} from 'lucide-react';

import { CampaignGridCard } from '../components/campaigns/CampaignGridCard';
import { CampaignTable } from '../components/campaigns/CampaignTable';
import { CreateCampaignModal } from '../components/campaigns/CreateCampaignModal';
import { DeleteCampaignModal } from '../components/campaigns/DeleteCampaignModal';
import type { CampaignItem } from '../components/campaigns/CampaignGridCard';

// ---------- Static seed data (will be replaced by API calls) ----------

const initialCampaigns: CampaignItem[] = [
  {
    id: '1',
    name: 'Summer Sale 2026',
    product: 'Premium Subscription',
    status: 'active',
    reach: '124.5K',
    engagement: '4.2%',
    platform: 'meta',
    objective: 'sales',
    dateCreated: 'Feb 11, 2026',
    thumbnail:
      'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=200&h=150&fit=crop',
  },
  {
    id: '2',
    name: 'Product Launch - AI Features',
    product: 'Enterprise Plan',
    status: 'active',
    reach: '89.2K',
    engagement: '3.8%',
    platform: 'tiktok',
    objective: 'awareness',
    dateCreated: 'Feb 8, 2026',
    thumbnail:
      'https://images.unsplash.com/photo-1551434678-e076c223a692?w=200&h=150&fit=crop',
  },
  {
    id: '3',
    name: 'Brand Awareness Q1',
    product: 'All Products',
    status: 'completed',
    reach: '456.7K',
    engagement: '2.9%',
    platform: 'youtube',
    objective: 'awareness',
    dateCreated: 'Jan 15, 2026',
    thumbnail:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=200&h=150&fit=crop',
  },
  {
    id: '4',
    name: 'Holiday Campaign',
    product: 'Gift Cards',
    status: 'draft',
    reach: '0',
    engagement: '0%',
    platform: 'meta',
    objective: 'engagement',
    dateCreated: 'Jan 3, 2026',
    thumbnail:
      'https://images.unsplash.com/photo-1512314889357-e157c22f938d?w=200&h=150&fit=crop',
  },
  {
    id: '5',
    name: 'Spring Collection',
    product: 'New Arrivals',
    status: 'active',
    reach: '67.8K',
    engagement: '5.1%',
    platform: 'linkedin',
    objective: 'leads',
    dateCreated: 'Feb 1, 2026',
    thumbnail:
      'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=200&h=150&fit=crop',
  },
  {
    id: '6',
    name: 'Retargeting - Cart Abandoners',
    product: 'All Products',
    status: 'active',
    reach: '34.2K',
    engagement: '6.7%',
    platform: 'meta',
    objective: 'sales',
    dateCreated: 'Feb 5, 2026',
    thumbnail:
      'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=200&h=150&fit=crop',
  },
];

// ---------- Component ----------

export function CampaignsPage() {
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>([]);
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);

  // Modal visibility
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null);

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

  const handleBulkPause = () => {
    setCampaigns(
      campaigns.map((c) =>
        selectedCampaigns.includes(c.id) ? { ...c, status: 'draft' as const } : c,
      ),
    );
    setSelectedCampaigns([]);
  };

  const handleBulkDelete = () => {
    setCampaigns(campaigns.filter((c) => !selectedCampaigns.includes(c.id)));
    setSelectedCampaigns([]);
  };

  // ---------- Delete ----------

  const handleDeleteClick = (campaignName: string) => {
    setCampaignToDelete(campaignName);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (campaignToDelete) {
      setCampaigns(campaigns.filter((c) => c.name !== campaignToDelete));
      setShowDeleteModal(false);
      setCampaignToDelete(null);
    }
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
            {viewMode === 'grid' ? (
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
            )}
          </div>
        </div>

        {/* Modals */}
        {showCreateModal && (
          <CreateCampaignModal
            onClose={() => setShowCreateModal(false)}
            onCreated={(campaign) => {
              setCampaigns([campaign, ...campaigns]);
              setShowCreateModal(false);
            }}
          />
        )}

        {showDeleteModal && campaignToDelete && (
          <DeleteCampaignModal
            campaignName={campaignToDelete}
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