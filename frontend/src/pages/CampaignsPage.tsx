import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import {
  LayoutGridIcon,
  ListIcon,
  SearchIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  AlertTriangleIcon,
  XIcon,
  CheckIcon,
  Loader2Icon,
  SparklesIcon
} from
  'lucide-react';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
const initialCampaigns = [
  {
    id: '1',
    name: 'Summer Sale 2026',
    product: 'Premium Subscription',
    status: 'active' as const,
    reach: '124.5K',
    engagement: '4.2%',
    platform: 'meta',
    objective: 'sales',
    dateCreated: 'Feb 11, 2026',
    thumbnail:
      'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=200&h=150&fit=crop'
  },
  {
    id: '2',
    name: 'Product Launch - AI Features',
    product: 'Enterprise Plan',
    status: 'active' as const,
    reach: '89.2K',
    engagement: '3.8%',
    platform: 'tiktok',
    objective: 'awareness',
    dateCreated: 'Feb 8, 2026',
    thumbnail:
      'https://images.unsplash.com/photo-1551434678-e076c223a692?w=200&h=150&fit=crop'
  },
  {
    id: '3',
    name: 'Brand Awareness Q1',
    product: 'All Products',
    status: 'completed' as const,
    reach: '456.7K',
    engagement: '2.9%',
    platform: 'youtube',
    objective: 'awareness',
    dateCreated: 'Jan 15, 2026',
    thumbnail:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=200&h=150&fit=crop'
  },
  {
    id: '4',
    name: 'Holiday Campaign',
    product: 'Gift Cards',
    status: 'draft' as const,
    reach: '0',
    engagement: '0%',
    platform: 'meta',
    objective: 'engagement',
    dateCreated: 'Jan 3, 2026',
    thumbnail:
      'https://images.unsplash.com/photo-1512314889357-e157c22f938d?w=200&h=150&fit=crop'
  },
  {
    id: '5',
    name: 'Spring Collection',
    product: 'New Arrivals',
    status: 'active' as const,
    reach: '67.8K',
    engagement: '5.1%',
    platform: 'linkedin',
    objective: 'leads',
    dateCreated: 'Feb 1, 2026',
    thumbnail:
      'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=200&h=150&fit=crop'
  },
  {
    id: '6',
    name: 'Retargeting - Cart Abandoners',
    product: 'All Products',
    status: 'active' as const,
    reach: '34.2K',
    engagement: '6.7%',
    platform: 'meta',
    objective: 'sales',
    dateCreated: 'Feb 5, 2026',
    thumbnail:
      'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=200&h=150&fit=crop'
  }];

const platforms = [
  {
    id: 'meta',
    label: 'Meta'
  },
  {
    id: 'tiktok',
    label: 'TikTok'
  },
  {
    id: 'youtube',
    label: 'YouTube'
  },
  {
    id: 'linkedin',
    label: 'LinkedIn'
  }];

const regions = [
  {
    id: 'na',
    label: 'North America'
  },
  {
    id: 'eu',
    label: 'Europe'
  },
  {
    id: 'apac',
    label: 'Asia Pacific'
  },
  {
    id: 'global',
    label: 'Global'
  }];

const statusColors = {
  active: 'success',
  completed: 'default',
  draft: 'warning'
} as const;
export function CampaignsPage() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>([]);
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isAutofilling, setIsAutofilling] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [customGoal, setCustomGoal] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    product: '',
    targetAudience: '',
    goal: '',
    platforms: [] as string[],
    region: ''
  });
  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ?
        prev.filter((p) => p !== platform) :
        [...prev, platform]
    );
  };
  const toggleNewCampaignPlatform = (platformId: string) => {
    setNewCampaign({
      ...newCampaign,
      platforms: newCampaign.platforms.includes(platformId) ?
        newCampaign.platforms.filter((p) => p !== platformId) :
        [...newCampaign.platforms, platformId]
    });
  };
  const toggleObjective = (objective: string) => {
    setSelectedObjectives((prev) =>
      prev.includes(objective) ?
        prev.filter((o) => o !== objective) :
        [...prev, objective]
    );
  };
  const handleAutofill = () => {
    setIsAutofilling(true);
    setTimeout(() => {
      setNewCampaign({
        ...newCampaign,
        platforms: ['meta', 'tiktok'],
        region: 'na',
        goal: 'sales',
        targetAudience:
          'Tech-savvy millennials interested in productivity tools.'
      });
      setIsAutofilling(false);
    }, 1500);
  };
  const handleCreateCampaign = () => {
    const newErrors: Record<string, string> = {};
    if (!newCampaign.name) newErrors.name = 'Campaign name is required';
    if (!newCampaign.product) newErrors.product = 'Product/Service is required';
    if (!newCampaign.targetAudience)
      newErrors.targetAudience = 'Target audience is required';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setIsCreating(true);
    setTimeout(() => {
      const createdCampaign = {
        id: Date.now().toString(),
        name: newCampaign.name,
        product: newCampaign.product,
        status: 'draft' as const,
        reach: '0',
        engagement: '0%',
        platform: newCampaign.platforms[0] || 'meta',
        objective: newCampaign.goal === 'other' ? 'custom' : newCampaign.goal,
        dateCreated: 'Just now',
        thumbnail:
          'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=200&h=150&fit=crop'
      };
      setCampaigns([createdCampaign, ...campaigns]);
      setIsCreating(false);
      setShowCreateModal(false);
      setNewCampaign({
        name: '',
        product: '',
        targetAudience: '',
        goal: '',
        platforms: [],
        region: ''
      });
    }, 1500);
  };
  const toggleCampaignSelection = (id: string) => {
    setSelectedCampaigns((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };
  const toggleSelectAll = () => {
    if (selectedCampaigns.length === filteredCampaigns.length) {
      setSelectedCampaigns([]);
    } else {
      setSelectedCampaigns(filteredCampaigns.map((c) => c.id));
    }
  };
  const handleBulkPause = () => {
    setCampaigns(
      campaigns.map((c) =>
        selectedCampaigns.includes(c.id) ?
          {
            ...c,
            status: 'draft' as const
          } :
          c
      )
    );
    setSelectedCampaigns([]);
  };
  const handleBulkDelete = () => {
    setCampaigns(campaigns.filter((c) => !selectedCampaigns.includes(c.id)));
    setSelectedCampaigns([]);
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
  const handleDeleteClick = (campaignName: string) => {
    setCampaignToDelete(campaignName);
    setDeleteConfirmation('');
    setShowDeleteModal(true);
  };
  const handleConfirmDelete = () => {
    if (campaignToDelete) {
      setCampaigns(campaigns.filter((c) => c.name !== campaignToDelete));
      setShowDeleteModal(false);
      setCampaignToDelete(null);
    }
  };
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
                className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>

                <LayoutGridIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'table' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>

                <ListIcon className="w-4 h-4" />
              </button>
            </div>
            <Button
              leftIcon={<PlusIcon className="w-4 h-4" />}
              onClick={() => setShowCreateModal(true)}>

              Create Campaign
            </Button>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedCampaigns.length > 0 &&
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
              className="p-1 rounded hover:bg-blue-100 transition-colors">

              <XIcon className="w-4 h-4 text-blue-500" />
            </button>
          </div>
        }

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
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />

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
                {['meta', 'tiktok', 'youtube', 'linkedin'].map((platform) =>
                  <label
                    key={platform}
                    className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">

                    <input
                      type="checkbox"
                      checked={selectedPlatforms.includes(platform)}
                      onChange={() => togglePlatform(platform)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />

                    <span className="capitalize">{platform}</span>
                  </label>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Objective
              </h3>
              <div className="space-y-2">
                {['sales', 'awareness', 'engagement', 'leads'].map(
                  (objective) =>
                    <label
                      key={objective}
                      className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">

                      <input
                        type="checkbox"
                        checked={selectedObjectives.includes(objective)}
                        onChange={() => toggleObjective(objective)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />

                      <span className="capitalize">{objective}</span>
                    </label>

                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            {viewMode === 'grid' ?
              <div className="grid grid-cols-2 gap-6">
                {filteredCampaigns.map((campaign) =>
                  <div key={campaign.id} className="relative">
                    {/* Selection checkbox */}
                    <div
                      className="absolute top-3 left-3 z-10"
                      onClick={(e) => e.preventDefault()}>

                      <input
                        type="checkbox"
                        checked={selectedCampaigns.includes(campaign.id)}
                        onChange={() => toggleCampaignSelection(campaign.id)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />

                    </div>
                    <Link to={`/campaign/${campaign.id}`}>
                      <Card
                        variant="elevated"
                        padding="none"
                        className="overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group">

                        <div className="flex h-full">
                          <div className="w-32 flex-shrink-0 relative">
                            <img
                              src={campaign.thumbnail}
                              alt={campaign.name}
                              className="w-full h-full object-cover" />

                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                          </div>
                          <div className="flex-1 p-4 flex flex-col">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3
                                  className="font-semibold text-slate-900 truncate max-w-[200px]"
                                  title={campaign.name}>

                                  {campaign.name}
                                </h3>
                                <p className="text-sm text-slate-500 line-clamp-1">
                                  {campaign.product}
                                </p>
                              </div>
                              <Badge variant={statusColors[campaign.status]}>
                                {campaign.status}
                              </Badge>
                            </div>
                            <div className="mt-auto flex items-center gap-4 pt-4 border-t border-slate-100">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">
                                  {campaign.reach}
                                </p>
                                <p className="text-xs text-slate-500">Reach</p>
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-900">
                                  {campaign.engagement}
                                </p>
                                <p className="text-xs text-slate-500">Eng.</p>
                              </div>
                              <div className="ml-auto text-xs text-slate-400">
                                {campaign.dateCreated}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  </div>
                )}
              </div> :

              <Card
                variant="elevated"
                padding="none"
                className="overflow-hidden">

                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 w-10">
                        <input
                          type="checkbox"
                          checked={
                            selectedCampaigns.length ===
                            filteredCampaigns.length &&
                            filteredCampaigns.length > 0
                          }
                          onChange={toggleSelectAll}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />

                      </th>
                      <th className="px-4 py-3 font-semibold text-slate-900">
                        Name
                      </th>
                      <th className="px-4 py-3 font-semibold text-slate-900">
                        Status
                      </th>
                      <th className="px-4 py-3 font-semibold text-slate-900">
                        Product
                      </th>
                      <th className="px-4 py-3 font-semibold text-slate-900">
                        Reach
                      </th>
                      <th className="px-4 py-3 font-semibold text-slate-900">
                        Engagement
                      </th>
                      <th className="px-4 py-3 font-semibold text-slate-900">
                        Date Created
                      </th>
                      <th className="px-4 py-3 font-semibold text-slate-900 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCampaigns.map((campaign) =>
                      <tr
                        key={campaign.id}
                        className={`hover:bg-slate-50 transition-colors ${selectedCampaigns.includes(campaign.id) ? 'bg-blue-50/50' : ''}`}>

                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedCampaigns.includes(campaign.id)}
                            onChange={() =>
                              toggleCampaignSelection(campaign.id)
                            }
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />

                        </td>
                        <td className="px-4 py-4">
                          <Link
                            to={`/campaign/${campaign.id}`}
                            className="font-medium text-slate-900 hover:text-blue-600">

                            {campaign.name}
                          </Link>
                        </td>
                        <td className="px-4 py-4">
                          <Badge variant={statusColors[campaign.status]}>
                            {campaign.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-slate-600">
                          {campaign.product}
                        </td>
                        <td className="px-4 py-4 font-medium text-slate-900">
                          {campaign.reach}
                        </td>
                        <td className="px-4 py-4 font-medium text-slate-900">
                          {campaign.engagement}
                        </td>
                        <td className="px-4 py-4 text-slate-500">
                          {campaign.dateCreated}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <Button
                              variant="secondary"
                              size="sm"
                              className="h-9 px-3"
                              onClick={() =>
                                navigate(`/campaign/${campaign.id}`)
                              }
                              leftIcon={<EditIcon className="w-3.5 h-3.5" />}>

                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 px-3 text-red-600 hover:bg-red-50 hover:text-red-700"
                              onClick={() => handleDeleteClick(campaign.name)}
                              leftIcon={<TrashIcon className="w-3.5 h-3.5" />}>

                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </Card>
            }
          </div>
        </div>

        {/* Create Campaign Modal */}
        {showCreateModal &&
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => !isCreating && setShowCreateModal(false)} />

            <Card
              variant="elevated"
              padding="lg"
              className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto">

              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-900">
                  Create New Campaign
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
                  disabled={isCreating}>

                  <XIcon className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="space-y-4">
                <button
                  onClick={handleAutofill}
                  disabled={isAutofilling || isCreating}
                  className="w-full flex items-center justify-center gap-2 p-3 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors font-medium mb-4 disabled:opacity-50">

                  {isAutofilling ?
                    <>
                      <Loader2Icon className="w-4 h-4 animate-spin" />
                      Auto-filling details...
                    </> :

                    <>
                      <SparklesIcon className="w-4 h-4" />
                      Auto-fill from profile
                    </>
                  }
                </button>

                <Input
                  label="Campaign Name *"
                  placeholder="e.g., Summer Sale 2026"
                  value={newCampaign.name}
                  onChange={(e) =>
                    setNewCampaign({
                      ...newCampaign,
                      name: e.target.value
                    })
                  }
                  error={errors.name}
                  disabled={isCreating} />

                <Input
                  label="Product / Service *"
                  placeholder="What are you advertising?"
                  value={newCampaign.product}
                  onChange={(e) =>
                    setNewCampaign({
                      ...newCampaign,
                      product: e.target.value
                    })
                  }
                  error={errors.product}
                  disabled={isCreating} />

                <Textarea
                  label="Target Audience *"
                  placeholder="Describe who you want to reach..."
                  rows={3}
                  value={newCampaign.targetAudience}
                  onChange={(e) =>
                    setNewCampaign({
                      ...newCampaign,
                      targetAudience: e.target.value
                    })
                  }
                  error={errors.targetAudience}
                  disabled={isCreating} />

                <div>
                  <Select
                    label="Campaign Goal"
                    options={[
                      {
                        value: 'awareness',
                        label: 'Brand Awareness'
                      },
                      {
                        value: 'leads',
                        label: 'Lead Generation'
                      },
                      {
                        value: 'sales',
                        label: 'Direct Sales'
                      },
                      {
                        value: 'engagement',
                        label: 'Engagement'
                      },
                      {
                        value: 'other',
                        label: 'Other'
                      }]
                    }
                    placeholder="Select goal"
                    value={newCampaign.goal}
                    onChange={(e) =>
                      setNewCampaign({
                        ...newCampaign,
                        goal: e.target.value
                      })
                    }
                    disabled={isCreating} />

                  {newCampaign.goal === 'other' &&
                    <div className="mt-2">
                      <Input
                        label="Custom Goal"
                        placeholder="Describe your specific goal..."
                        value={customGoal}
                        onChange={(e) => setCustomGoal(e.target.value)}
                        disabled={isCreating} />

                    </div>
                  }
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Target Platforms
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {platforms.map((platform) =>
                      <button
                        key={platform.id}
                        type="button"
                        onClick={() => toggleNewCampaignPlatform(platform.id)}
                        disabled={isCreating}
                        className={`
                          flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-all
                          ${newCampaign.platforms.includes(platform.id) ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-slate-300 text-slate-700'}
                          ${isCreating ? 'opacity-50 cursor-not-allowed' : ''}
                        `}>

                        {newCampaign.platforms.includes(platform.id) &&
                          <CheckIcon className="w-3.5 h-3.5" />
                        }
                        {platform.label}
                      </button>
                    )}
                  </div>
                </div>
                <Select
                  label="Target Region"
                  options={regions.map((r) => ({
                    value: r.id,
                    label: r.label
                  }))}
                  placeholder="Select region"
                  value={newCampaign.region}
                  onChange={(e) =>
                    setNewCampaign({
                      ...newCampaign,
                      region: e.target.value
                    })
                  }
                  disabled={isCreating} />

              </div>

              <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-slate-100">
                <Button
                  variant="ghost"
                  onClick={() => setShowCreateModal(false)}
                  disabled={isCreating}>

                  Cancel
                </Button>
                <Button
                  onClick={handleCreateCampaign}
                  leftIcon={
                    isCreating ? undefined :
                      <SparklesIcon className="w-4 h-4" />

                  }
                  isLoading={isCreating}
                  disabled={isCreating}>

                  {isCreating ? 'Creating...' : 'Create Campaign'}
                </Button>
              </div>
            </Card>
          </div>
        }

        {/* Delete Modal */}
        {showDeleteModal &&
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => setShowDeleteModal(false)} />

            <Card
              variant="elevated"
              padding="lg"
              className="relative w-full max-w-md">

              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangleIcon className="w-6 h-6 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">
                  Delete Campaign?
                </h2>
                <p className="text-slate-500 text-sm">
                  This action cannot be undone. This will permanently delete the
                  campaign and all generated ads.
                </p>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-700">
                  Type <span className="font-bold">{campaignToDelete}</span> to
                  confirm
                </label>
                <Input
                  placeholder={campaignToDelete || ''}
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)} />

              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="ghost"
                  onClick={() => setShowDeleteModal(false)}>

                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={handleConfirmDelete}
                  disabled={deleteConfirmation !== campaignToDelete}>

                  Delete Campaign
                </Button>
              </div>
            </Card>
          </div>
        }
      </main>
    </div>);

}