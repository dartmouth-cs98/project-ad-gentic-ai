import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import {
  ArrowLeftIcon,
  BarChart3Icon,
  UsersIcon,
  GlobeIcon,
  EditIcon,
  TrashIcon,
} from 'lucide-react';

import { AdVariantsGrid } from '../components/campaigns/AdVariantsGrid';
import { CampaignAnalytics } from '../components/campaigns/CampaignAnalytics';
import { CampaignSettings } from '../components/campaigns/CampaignSettings';
import { EditCampaignModal } from '../components/campaigns/EditCampaignModal';
import { DeleteCampaignModal } from '../components/campaigns/DeleteCampaignModal';

import type { AdVariant } from '../components/campaigns/AdVariantsGrid';
import type { AnalyticsMetric, PersonaPerf } from '../components/campaigns/CampaignAnalytics';

// ---------- Static seed data (will be replaced by API calls) ----------

const adVariants: AdVariant[] = [
  {
    id: 'a',
    label: 'Variant A',
    persona: 'The Skeptic',
    personaColors: 'bg-teal-50 text-teal-600 border-teal-100',
    headline: "Stop Wasting Money on Ads That Don't Convert — Try Ad-gentic Today",
    ctr: '4.2%',
    image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=300&fit=crop',
  },
  {
    id: 'b',
    label: 'Variant B',
    persona: 'The Impulse Buyer',
    personaColors: 'bg-orange-50 text-orange-600 border-orange-100',
    headline: "🔥 Flash Sale: 48 Hours Only — Don't Miss Out",
    ctr: '5.8%',
    image: 'https://images.unsplash.com/photo-1563986768609-322da13575f2?w=400&h=300&fit=crop',
  },
  {
    id: 'c',
    label: 'Variant C',
    persona: 'The Researcher',
    personaColors: 'bg-blue-50 text-blue-600 border-blue-100',
    headline: 'Side-by-Side: How We Compare to 5 Competitors',
    ctr: '3.1%',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop',
  },
  {
    id: 'd',
    label: 'Variant D',
    persona: 'The Skeptic',
    personaColors: 'bg-teal-50 text-teal-600 border-teal-100',
    headline: "See the Data: 12,847 Verified Reviews Can't Be Wrong",
    ctr: '4.5%',
    image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=300&fit=crop',
  },
  {
    id: 'e',
    label: 'Variant E',
    persona: 'The Impulse Buyer',
    personaColors: 'bg-orange-50 text-orange-600 border-orange-100',
    headline: 'Last Chance — 73% Already Sold Out',
    ctr: '6.2%',
    image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=400&h=300&fit=crop',
  },
  {
    id: 'f',
    label: 'Variant F',
    persona: 'The Researcher',
    personaColors: 'bg-blue-50 text-blue-600 border-blue-100',
    headline: '14-Feature Comparison: The Complete Breakdown',
    ctr: '2.9%',
    image: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&h=300&fit=crop',
  },
];

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

// ---------- Component ----------

export function CampaignDetailPage() {
  const { id: _id } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'variants' | 'analytics' | 'settings'>('variants');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [editForm, setEditForm] = useState({
    name: 'Summer Sale 2026',
    status: 'active',
    goal: 'awareness',
    customGoal: '',
    targetAudience: 'Tech-savvy millennials interested in productivity tools.',
  });

  const tabs = [
    { key: 'variants' as const, label: 'Ad Variants' },
    { key: 'analytics' as const, label: 'Analytics' },
    { key: 'settings' as const, label: 'Settings' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="ml-64 flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/campaigns"
            className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900 mb-4"
          >
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

        {/* Hero Metrics */}
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

        {/* Tabs */}
        <div className="mb-6 border-b border-slate-200">
          <div className="flex gap-8">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`pb-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        {activeTab === 'variants' && <AdVariantsGrid variants={adVariants} />}

        {activeTab === 'analytics' && (
          <CampaignAnalytics
            metrics={analyticsMetrics}
            personas={personaPerformance}
          />
        )}

        {activeTab === 'settings' && (
          <CampaignSettings
            initial={{
              name: 'Summer Sale 2026',
              status: 'active',
              platforms: ['meta', 'tiktok'],
              budget: '5000',
              startDate: '2026-02-11',
              endDate: '2026-03-11',
            }}
          />
        )}

        {/* Modals */}
        {showEditModal && (
          <EditCampaignModal
            initial={editForm}
            onClose={() => setShowEditModal(false)}
            onSave={(data) => {
              setEditForm(data);
              setShowEditModal(false);
            }}
          />
        )}

        {showDeleteModal && (
          <DeleteCampaignModal
            campaignName={editForm.name}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={() => {
              setShowDeleteModal(false);
              navigate('/dashboard');
            }}
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