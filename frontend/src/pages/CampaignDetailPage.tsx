import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import {
  ArrowLeftIcon,
  MoreVerticalIcon,
  DownloadIcon,
  PlayCircleIcon,
  BarChart3Icon,
  UsersIcon,
  GlobeIcon,
  EditIcon,
  TrashIcon,
  XIcon,
  AlertTriangleIcon,
  CheckIcon,
  BrainIcon
} from
  'lucide-react';
const adVariants = [
  {
    id: 'a',
    label: 'Variant A',
    persona: 'The Skeptic',
    personaColors: 'bg-teal-50 text-teal-600 border-teal-100',
    headline:
      "Stop Wasting Money on Ads That Don't Convert — Try Ad-gentic Today",
    ctr: '4.2%',
    image:
      'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=300&fit=crop'
  },
  {
    id: 'b',
    label: 'Variant B',
    persona: 'The Impulse Buyer',
    personaColors: 'bg-orange-50 text-orange-600 border-orange-100',
    headline: "🔥 Flash Sale: 48 Hours Only — Don't Miss Out",
    ctr: '5.8%',
    image:
      'https://images.unsplash.com/photo-1563986768609-322da13575f2?w=400&h=300&fit=crop'
  },
  {
    id: 'c',
    label: 'Variant C',
    persona: 'The Researcher',
    personaColors: 'bg-blue-50 text-blue-600 border-blue-100',
    headline: 'Side-by-Side: How We Compare to 5 Competitors',
    ctr: '3.1%',
    image:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop'
  },
  {
    id: 'd',
    label: 'Variant D',
    persona: 'The Skeptic',
    personaColors: 'bg-teal-50 text-teal-600 border-teal-100',
    headline: "See the Data: 12,847 Verified Reviews Can't Be Wrong",
    ctr: '4.5%',
    image:
      'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=300&fit=crop'
  },
  {
    id: 'e',
    label: 'Variant E',
    persona: 'The Impulse Buyer',
    personaColors: 'bg-orange-50 text-orange-600 border-orange-100',
    headline: 'Last Chance — 73% Already Sold Out',
    ctr: '6.2%',
    image:
      'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=400&h=300&fit=crop'
  },
  {
    id: 'f',
    label: 'Variant F',
    persona: 'The Researcher',
    personaColors: 'bg-blue-50 text-blue-600 border-blue-100',
    headline: '14-Feature Comparison: The Complete Breakdown',
    ctr: '2.9%',
    image:
      'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&h=300&fit=crop'
  }];

const analyticsMetrics = [
  {
    label: 'Impressions',
    value: '342,180',
    change: '+14%',
    positive: true
  },
  {
    label: 'Clicks',
    value: '14,371',
    change: '+22%',
    positive: true
  },
  {
    label: 'CTR',
    value: '4.2%',
    change: '+0.8%',
    positive: true
  },
  {
    label: 'CPC',
    value: '$0.86',
    change: '-12%',
    positive: true
  },
  {
    label: 'Conversions',
    value: '1,240',
    change: '+18%',
    positive: true
  },
  {
    label: 'ROAS',
    value: '3.4x',
    change: '+0.6x',
    positive: true
  }];

const personaPerformance = [
  {
    name: 'The Skeptic',
    convRate: '4.3%',
    impressions: '142K',
    color: 'teal'
  },
  {
    name: 'The Impulse Buyer',
    convRate: '5.9%',
    impressions: '118K',
    color: 'orange'
  },
  {
    name: 'The Researcher',
    convRate: '3.0%',
    impressions: '82K',
    color: 'blue'
  }];

const settingsPlatforms = [
  {
    id: 'meta',
    label: 'Meta (Facebook/Instagram)'
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
  },
  {
    id: 'google',
    label: 'Google Ads'
  }];

export function CampaignDetailPage() {
  const { id: _id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    'variants' | 'analytics' | 'settings'>(
      'variants');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [editForm, setEditForm] = useState({
    name: 'Summer Sale 2026',
    status: 'active',
    goal: 'awareness',
    customGoal: '',
    targetAudience: 'Tech-savvy millennials interested in productivity tools.'
  });
  // Settings tab state
  const [settingsForm, setSettingsForm] = useState({
    name: 'Summer Sale 2026',
    status: 'active',
    platforms: ['meta', 'tiktok'],
    budget: '5000',
    startDate: '2026-02-11',
    endDate: '2026-03-11'
  });
  const toggleSettingsPlatform = (platformId: string) => {
    setSettingsForm({
      ...settingsForm,
      platforms: settingsForm.platforms.includes(platformId) ?
        settingsForm.platforms.filter((p) => p !== platformId) :
        [...settingsForm.platforms, platformId]
    });
  };
  const handleDelete = () => {
    if (deleteConfirmation === editForm.name) {
      setShowDeleteModal(false);
      navigate('/dashboard');
    }
  };
  const tabs = [
    {
      key: 'variants' as const,
      label: 'Ad Variants'
    },
    {
      key: 'analytics' as const,
      label: 'Analytics'
    },
    {
      key: 'settings' as const,
      label: 'Settings'
    }];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="ml-64 flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/campaigns"
            className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900 mb-4">

            <ArrowLeftIcon className="w-4 h-4 mr-1" />
            Back to Campaigns
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-slate-900">
                  {editForm.name}
                </h1>
                <Badge variant="success">Active</Badge>
              </div>
              <p className="text-slate-500">
                Created on Feb 11, 2026 • Last updated 2 hours ago
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                leftIcon={<EditIcon className="w-4 h-4" />}
                onClick={() => setShowEditModal(true)}>

                Edit Campaign
              </Button>
              <Button
                variant="danger"
                leftIcon={<TrashIcon className="w-4 h-4" />}
                onClick={() => setShowDeleteModal(true)}>

                Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
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
            <p className="text-2xl font-bold text-slate-900">124.5K</p>
            <p className="text-sm text-slate-500">Total Reach</p>
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
            <p className="text-2xl font-bold text-slate-900">4.2%</p>
            <p className="text-sm text-slate-500">Click Rate (CTR)</p>
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
            <p className="text-2xl font-bold text-slate-900">$1.24</p>
            <p className="text-sm text-slate-500">Cost Per Click</p>
          </Card>

          <Card variant="elevated" padding="md">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-amber-100 rounded-lg">
                <GlobeIcon className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                Global
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900">4</p>
            <p className="text-sm text-slate-500">Active Regions</p>
          </Card>
        </div>

        {/* Content Tabs */}
        <div className="mb-6 border-b border-slate-200">
          <div className="flex gap-8">
            {tabs.map((tab) =>
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`pb-4 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.key ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>

                {tab.label}
              </button>
            )}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'variants' &&
          <div className="grid grid-cols-3 gap-6">
            {adVariants.map((variant) =>
              <Card
                key={variant.id}
                variant="elevated"
                padding="none"
                className="overflow-hidden group">

                <div className="relative aspect-video bg-slate-100">
                  <img
                    src={variant.image}
                    alt={`${variant.label} - ${variant.persona}`}
                    className="w-full h-full object-cover" />

                  <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 backdrop-blur-md rounded text-xs text-white font-medium">
                    {variant.label}
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="sm" variant="secondary">
                      <PlayCircleIcon className="w-4 h-4" /> Preview
                    </Button>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Badge
                      variant="info"
                      className={`border ${variant.personaColors}`}>

                      {variant.persona}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <BarChart3Icon className="w-3 h-3" />
                      <span>{variant.ctr} CTR</span>
                    </div>
                  </div>
                  <h3 className="font-medium text-slate-900 mb-4 line-clamp-2 text-sm leading-relaxed">
                    {variant.headline}
                  </h3>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="flex-1 text-xs">

                      <DownloadIcon className="w-3 h-3 mr-1" /> Download
                    </Button>
                    <Button size="sm" variant="ghost" className="px-2">
                      <MoreVerticalIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        }

        {activeTab === 'analytics' &&
          <div className="space-y-8">
            {/* Performance Chart */}
            <Card variant="elevated" padding="lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-slate-900">
                  Performance Over Time
                </h3>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />{' '}
                    Impressions
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />{' '}
                    Clicks
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />{' '}
                    Conversions
                  </span>
                </div>
              </div>
              <svg
                className="w-full h-48"
                viewBox="0 0 800 180"
                preserveAspectRatio="none">

                <defs>
                  <linearGradient
                    id="impressionsGrad"
                    x1="0"
                    x2="0"
                    y1="0"
                    y2="1">

                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="clicksGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Grid lines */}
                <line
                  x1="0"
                  y1="45"
                  x2="800"
                  y2="45"
                  stroke="#e2e8f0"
                  strokeWidth="1" />

                <line
                  x1="0"
                  y1="90"
                  x2="800"
                  y2="90"
                  stroke="#e2e8f0"
                  strokeWidth="1" />

                <line
                  x1="0"
                  y1="135"
                  x2="800"
                  y2="135"
                  stroke="#e2e8f0"
                  strokeWidth="1" />

                {/* Impressions area */}
                <path
                  d="M0 140 C100 120, 200 100, 300 80 S500 50, 600 40 S700 30, 800 20 V180 H0Z"
                  fill="url(#impressionsGrad)" />

                <path
                  d="M0 140 C100 120, 200 100, 300 80 S500 50, 600 40 S700 30, 800 20"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2.5" />

                {/* Clicks line */}
                <path
                  d="M0 160 C100 150, 200 140, 300 120 S500 100, 600 90 S700 85, 800 70"
                  fill="url(#clicksGrad)" />

                <path
                  d="M0 160 C100 150, 200 140, 300 120 S500 100, 600 90 S700 85, 800 70"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2" />

                {/* Conversions line */}
                <path
                  d="M0 170 C100 165, 200 158, 300 150 S500 135, 600 125 S700 120, 800 110"
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth="2"
                  strokeDasharray="6 3" />

              </svg>
              <div className="flex justify-between mt-2 text-xs text-slate-400">
                <span>Feb 11</span>
                <span>Feb 14</span>
                <span>Feb 17</span>
                <span>Feb 20</span>
                <span>Feb 23</span>
                <span>Today</span>
              </div>
            </Card>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-4">
              {analyticsMetrics.map((metric) =>
                <Card key={metric.label} variant="elevated" padding="md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-500">
                      {metric.label}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${metric.positive ? 'text-emerald-700 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>

                      {metric.change}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">
                    {metric.value}
                  </p>
                </Card>
              )}
            </div>

            {/* Persona Performance */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <BrainIcon className="w-5 h-5 text-slate-400" />
                Persona Performance
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {personaPerformance.map((persona) =>
                  <Card key={persona.name} variant="elevated" padding="md">
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${persona.color === 'teal' ? 'bg-teal-50' : persona.color === 'orange' ? 'bg-orange-50' : 'bg-blue-50'}`}>

                        <BrainIcon
                          className={`w-5 h-5 ${persona.color === 'teal' ? 'text-teal-600' : persona.color === 'orange' ? 'text-orange-600' : 'text-blue-600'}`} />

                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 text-sm">
                          {persona.name}
                        </h4>
                        <p className="text-xs text-slate-500">
                          {persona.impressions} impressions
                        </p>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-slate-900">
                        {persona.convRate}
                      </span>
                      <span className="text-xs text-slate-500">conv. rate</span>
                    </div>
                    <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${persona.color === 'teal' ? 'bg-teal-500' : persona.color === 'orange' ? 'bg-orange-500' : 'bg-blue-500'}`}
                        style={{
                          width: `${parseFloat(persona.convRate) * 15}%`
                        }} />

                    </div>
                  </Card>
                )}
              </div>
            </div>
          </div>
        }

        {activeTab === 'settings' &&
          <Card variant="elevated" padding="lg" className="max-w-2xl">
            <h3 className="font-semibold text-slate-900 mb-6">
              Campaign Settings
            </h3>
            <div className="space-y-6">
              <Input
                label="Campaign Name"
                value={settingsForm.name}
                onChange={(e) =>
                  setSettingsForm({
                    ...settingsForm,
                    name: e.target.value
                  })
                } />


              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Status
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      setSettingsForm({
                        ...settingsForm,
                        status: 'active'
                      })
                    }
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${settingsForm.status === 'active' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>

                    Active
                  </button>
                  <button
                    onClick={() =>
                      setSettingsForm({
                        ...settingsForm,
                        status: 'paused'
                      })
                    }
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${settingsForm.status === 'paused' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>

                    Paused
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Target Platforms
                </label>
                <div className="flex flex-wrap gap-2">
                  {settingsPlatforms.map((platform) =>
                    <button
                      key={platform.id}
                      type="button"
                      onClick={() => toggleSettingsPlatform(platform.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-all ${settingsForm.platforms.includes(platform.id) ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-slate-300 text-slate-700'}`}>

                      {settingsForm.platforms.includes(platform.id) &&
                        <CheckIcon className="w-3.5 h-3.5" />
                      }
                      {platform.label}
                    </button>
                  )}
                </div>
              </div>

              <Input
                label="Daily Budget ($)"
                type="number"
                value={settingsForm.budget}
                onChange={(e) =>
                  setSettingsForm({
                    ...settingsForm,
                    budget: e.target.value
                  })
                } />


              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Start Date"
                  type="date"
                  value={settingsForm.startDate}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      startDate: e.target.value
                    })
                  } />

                <Input
                  label="End Date"
                  type="date"
                  value={settingsForm.endDate}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      endDate: e.target.value
                    })
                  } />

              </div>

              <div className="pt-4 border-t border-slate-100">
                <Button>Save Changes</Button>
              </div>
            </div>
          </Card>
        }

        {/* Edit Modal */}
        {showEditModal &&
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => setShowEditModal(false)} />

            <Card
              variant="elevated"
              padding="lg"
              className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto">

              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-900">
                  Edit Campaign
                </h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-100">

                  <XIcon className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <div className="space-y-4">
                <Input
                  label="Campaign Name"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      name: e.target.value
                    })
                  } />

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
                    value={editForm.goal}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        goal: e.target.value
                      })
                    } />

                  {editForm.goal === 'other' &&
                    <div className="mt-2">
                      <Textarea
                        label="Custom Goal"
                        placeholder="Describe your specific goal..."
                        rows={3}
                        value={editForm.customGoal}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            customGoal: e.target.value
                          })
                        } />

                    </div>
                  }
                </div>
                <Textarea
                  label="Target Audience"
                  rows={3}
                  value={editForm.targetAudience}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      targetAudience: e.target.value
                    })
                  } />

              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="ghost" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setShowEditModal(false)}>
                  Save Changes
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
                  Type <span className="font-bold">{editForm.name}</span> to
                  confirm
                </label>
                <Input
                  placeholder={editForm.name}
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
                  onClick={handleDelete}
                  disabled={deleteConfirmation !== editForm.name}>

                  Delete Campaign
                </Button>
              </div>
            </Card>
          </div>
        }
      </main>
    </div>);

}
function MousePointerClickIcon({ className }: { className?: string; }) {
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
      className={className}>

      <path d="m9 9 5 12 1.8-5.2L21 14Z" />
      <path d="M7.2 2.2 8 5.1" />
      <path d="m5.1 8-2.9-.8" />
      <path d="M14 4.1 12 6" />
      <path d="m6 12-1.9 2" />
    </svg>);

}