import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { Badge } from '../components/ui/Badge';
import {
  SparklesIcon,
  PlusIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  EyeIcon,
  DollarSignIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  CheckIcon,
  Loader2Icon,
  XIcon,
  ActivityIcon,
  BrainIcon,
  PlayCircleIcon,
  MousePointerClickIcon,
  RocketIcon,
  UploadIcon,
  CalendarIcon,
  BarChart3Icon,
  UsersIcon,
  TargetIcon } from
'lucide-react';
// Mock Data for returning users
const recentActivity = [
{
  id: 1,
  type: 'created',
  title: 'Campaign Launched',
  text: 'Summer Sale 2026 is now live across Meta and TikTok.',
  time: '2 hours ago',
  icon: PlayCircleIcon,
  color: 'text-emerald-600',
  bg: 'bg-emerald-50',
  linkTo: '/campaign/1',
  linkLabel: 'Summer Sale 2026'
},
{
  id: 2,
  type: 'generated',
  title: 'New Variants Generated',
  text: 'AI created 12 new hooks for "Product Launch" targeting The Researcher.',
  time: '5 hours ago',
  icon: SparklesIcon,
  color: 'text-blue-600',
  bg: 'bg-blue-50',
  linkTo: '/campaign/2',
  linkLabel: 'Product Launch'
},
{
  id: 3,
  type: 'approved',
  title: 'Creative Approved',
  text: '3 video variants approved for "Brand Awareness" campaign.',
  time: '1 day ago',
  icon: CheckIcon,
  color: 'text-purple-600',
  bg: 'bg-purple-50',
  linkTo: '/campaign/3',
  linkLabel: 'Brand Awareness'
}];

const topCampaigns = [
{
  id: '1',
  name: 'Summer Sale 2026',
  status: 'active',
  metricLabel: 'Conversions',
  metricValue: '1,240',
  platform: 'Meta',
  trend: 'up' as const,
  trendValue: '+12%'
},
{
  id: '2',
  name: 'Product Launch',
  status: 'active',
  metricLabel: 'CTR',
  metricValue: '4.8%',
  platform: 'TikTok',
  trend: 'up' as const,
  trendValue: '+0.6%'
},
{
  id: '3',
  name: 'Brand Awareness',
  status: 'completed',
  metricLabel: 'Reach',
  metricValue: '450K',
  platform: 'YouTube',
  trend: 'down' as const,
  trendValue: '-3%'
}];

const timeRanges = [
{
  value: '7d',
  label: 'Last 7 days'
},
{
  value: '30d',
  label: 'Last 30 days'
},
{
  value: '90d',
  label: 'Last 90 days'
},
{
  value: 'all',
  label: 'All time'
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

export function DashboardPage() {
  const navigate = useNavigate();
  const authFlow = localStorage.getItem('adgentic_auth_flow');
  const isReturningUser = authFlow === 'signin';
  const userName = localStorage.getItem('adgentic_last_name');
  const firstName = userName ? userName.split(' ')[0] : 'there';
  const [timeRange, setTimeRange] = useState('30d');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isAutofilling, setIsAutofilling] = useState(false);
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
  const togglePlatform = (platformId: string) => {
    setNewCampaign({
      ...newCampaign,
      platforms: newCampaign.platforms.includes(platformId) ?
      newCampaign.platforms.filter((p) => p !== platformId) :
      [...newCampaign.platforms, platformId]
    });
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
    setShowCreateModal(false);
    navigate('/generate', {
      state: {
        campaignContext: {
          ...newCampaign,
          goal: newCampaign.goal === 'other' ? customGoal : newCampaign.goal
        }
      }
    });
  };
  return (
    <div className="min-h-screen bg-slate-50/50">
      <Sidebar />
      <main className="ml-64 p-8 max-w-[1600px] mx-auto">
        {isReturningUser /* ===================== RETURNING USER DASHBOARD ===================== */ ?
        <>
            {/* Header */}
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
                  Command Center
                </h1>
                <p className="text-slate-500 font-light text-lg">
                  Real-time performance across your active ecosystem.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-white border border-slate-200 rounded-full p-0.5 shadow-sm">
                  {timeRanges.map((range) =>
                <button
                  key={range.value}
                  onClick={() => setTimeRange(range.value)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${timeRange === range.value ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>

                      {range.label}
                    </button>
                )}
                </div>
                <button
                onClick={() => navigate('/generate')}
                className="px-6 py-3 rounded-full bg-slate-900 text-white font-medium shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2 group">

                  <SparklesIcon className="w-4 h-4 group-hover:animate-pulse" />
                  Generate New Ad
                </button>
              </div>
            </div>

            {/* Welcome back banner (compact) */}
            <div className="mb-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center text-sm font-bold">
                  {firstName.charAt(0)}
                </div>
                <div>
                  <h2 className="font-bold text-lg">
                    Welcome back, {firstName}
                  </h2>
                  <p className="text-white/60 text-xs">
                    Here's what's happening with your campaigns.
                  </p>
                </div>
              </div>
            </div>

            {/* Asymmetric Grid */}
            <div className="grid grid-cols-12 gap-6 mb-8">
              {/* Total Reach */}
              <div className="col-span-12 lg:col-span-7">
                <div className="h-full bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.06)] rounded-3xl p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8">
                    <div className="flex items-center gap-2 bg-emerald-50/80 backdrop-blur-sm px-3 py-1 rounded-full border border-emerald-100">
                      <TrendingUpIcon className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm font-bold text-emerald-700">
                        +12%
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col h-full justify-between relative z-10">
                    <div className="mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-6">
                        <EyeIcon className="w-6 h-6 text-blue-600" />
                      </div>
                      <h2 className="text-6xl font-bold text-slate-900 tracking-tighter mb-2">
                        2.4M
                      </h2>
                      <p className="text-slate-500 font-medium uppercase tracking-widest text-xs">
                        Total Reach
                      </p>
                    </div>
                    <div className="flex items-end justify-between">
                      <p className="text-slate-600 font-light max-w-xs leading-relaxed">
                        Across 4 platforms — up 12% from AI-optimized targeting
                        strategies this week.
                      </p>
                      <svg
                      className="w-48 h-16 text-blue-500"
                      viewBox="0 0 100 40"
                      preserveAspectRatio="none">

                        <defs>
                          <linearGradient
                          id="gradientReach"
                          x1="0"
                          x2="0"
                          y1="0"
                          y2="1">

                            <stop
                            offset="0%"
                            stopColor="currentColor"
                            stopOpacity="0.2" />

                            <stop
                            offset="100%"
                            stopColor="currentColor"
                            stopOpacity="0" />

                          </linearGradient>
                        </defs>
                        <path
                        d="M0 35 Q 10 30, 20 32 T 40 20 T 60 25 T 80 10 T 100 5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        vectorEffect="non-scaling-stroke" />

                        <path
                        d="M0 35 Q 10 30, 20 32 T 40 20 T 60 25 T 80 10 T 100 5 V 40 H 0 Z"
                        fill="url(#gradientReach)"
                        stroke="none" />

                      </svg>
                    </div>
                  </div>
                  <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
                </div>
              </div>

              {/* Persona Spotlight */}
              <div className="col-span-12 lg:col-span-5">
                <div className="h-full bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.06)] rounded-3xl p-8 relative overflow-hidden">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <BrainIcon className="w-5 h-5 text-teal-600" />
                        <span className="text-xs font-bold uppercase tracking-widest text-teal-600">
                          Top Performing Segment
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900">
                        The Skeptic
                      </h3>
                    </div>
                    <button className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors group">
                      View Audience
                      <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="relative w-32 h-32 flex-shrink-0">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                        cx="64"
                        cy="64"
                        r="56"
                        fill="none"
                        stroke="#e2e8f0"
                        strokeWidth="8" />

                        <circle
                        cx="64"
                        cy="64"
                        r="56"
                        fill="none"
                        stroke="#0d9488"
                        strokeWidth="8"
                        strokeDasharray="351.86"
                        strokeDashoffset="77.4"
                        strokeLinecap="round" />

                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-slate-900">
                          78%
                        </span>
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          Conv. Rate
                        </span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <p className="text-sm text-slate-600 font-light leading-relaxed">
                        This segment responds best to data-heavy comparisons and
                        transparency.
                      </p>
                      <div className="flex gap-2">
                        <Badge
                        variant="info"
                        className="bg-teal-50 text-teal-700 border-teal-100">

                          Data-Driven
                        </Badge>
                        <Badge
                        variant="info"
                        className="bg-teal-50 text-teal-700 border-teal-100">

                          High Intent
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-12 gap-6 mb-8">
              <div className="col-span-12 md:col-span-6">
                <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.06)] rounded-3xl p-6 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-emerald-50 rounded-lg">
                        <DollarSignIcon className="w-5 h-5 text-emerald-600" />
                      </div>
                      <span className="text-sm font-medium text-slate-500">
                        Total Ad Spend
                      </span>
                    </div>
                    <div className="flex items-baseline gap-3 mb-2">
                      <span className="text-3xl font-bold text-slate-900">
                        $12.4K
                      </span>
                      <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                        +18%
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 font-light">
                      Optimized by 18% through persona-based bidding.
                    </p>
                  </div>
                  <svg
                  className="w-24 h-12 text-emerald-500 opacity-50"
                  viewBox="0 0 64 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2">

                    <path
                    d="M0 20 L10 15 L20 18 L30 10 L40 12 L50 5 L64 2"
                    vectorEffect="non-scaling-stroke" />

                  </svg>
                </div>
              </div>
              <div className="col-span-12 md:col-span-6">
                <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.06)] rounded-3xl p-6 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-purple-50 rounded-lg">
                        <MousePointerClickIcon className="w-5 h-5 text-purple-600" />
                      </div>
                      <span className="text-sm font-medium text-slate-500">
                        Avg. Conversion
                      </span>
                    </div>
                    <div className="flex items-baseline gap-3 mb-2">
                      <span className="text-3xl font-bold text-slate-900">
                        3.2%
                      </span>
                      <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                        +0.4%
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 font-light">
                      Skeptic segment driving highest returns this week.
                    </p>
                  </div>
                  <svg
                  className="w-24 h-12 text-purple-500 opacity-50"
                  viewBox="0 0 64 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2">

                    <path
                    d="M0 18 L15 15 L25 20 L35 10 L45 8 L64 4"
                    vectorEffect="non-scaling-stroke" />

                  </svg>
                </div>
              </div>
            </div>

            {/* Pulse Feed + Top Campaigns */}
            <div className="grid grid-cols-12 gap-8">
              <div className="col-span-12 lg:col-span-4">
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <ActivityIcon className="w-5 h-5 text-slate-400" />
                  Pulse Feed
                </h2>
                <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.06)] rounded-3xl p-6">
                  <div className="relative pl-2">
                    <div className="absolute top-4 bottom-4 left-[19px] w-0.5 bg-slate-100" />
                    <div className="space-y-8">
                      {recentActivity.map((activity) =>
                    <div
                      key={activity.id}
                      className="relative flex gap-4 group">

                          <div
                        className={`w-10 h-10 rounded-xl border border-white shadow-sm flex items-center justify-center flex-shrink-0 z-10 ${activity.bg}`}>

                            <activity.icon
                          className={`w-5 h-5 ${activity.color}`} />

                          </div>
                          <div className="pt-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-slate-900 text-sm">
                                {activity.title}
                              </h4>
                              <span className="text-xs text-slate-400 font-light">
                                {activity.time}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 font-light leading-relaxed">
                              {activity.text}
                            </p>
                            <Link
                          to={activity.linkTo}
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium mt-1.5 group/link">

                              View {activity.linkLabel}
                              <ArrowUpRightIcon className="w-3 h-3 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                            </Link>
                          </div>
                        </div>
                    )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-span-12 lg:col-span-8">
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <TrendingUpIcon className="w-5 h-5 text-slate-400" />
                  Top Performing Campaigns
                </h2>
                <div className="space-y-4">
                  {topCampaigns.map((campaign) =>
                <div
                  key={campaign.id}
                  className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_4px_16px_rgba(0,0,0,0.04)] rounded-2xl p-5 flex items-center justify-between group hover:shadow-md transition-all cursor-pointer"
                  onClick={() => navigate(`/campaign/${campaign.id}`)}>

                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                          {campaign.id}
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-bold text-slate-900">
                              {campaign.name}
                            </h3>
                            <Badge
                          variant={
                          campaign.status === 'active' ?
                          'success' :
                          'default'
                          }>

                              {campaign.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-500 font-light">
                            Platform:{' '}
                            <span className="font-medium">
                              {campaign.platform}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="text-right">
                          <div className="flex items-center justify-end gap-2 mb-0.5">
                            <p className="text-2xl font-bold text-slate-900 tracking-tight">
                              {campaign.metricValue}
                            </p>
                            <span
                          className={`inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full ${campaign.trend === 'up' ? 'text-emerald-700 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>

                              {campaign.trend === 'up' ?
                          <TrendingUpIcon className="w-3 h-3" /> :

                          <TrendingDownIcon className="w-3 h-3" />
                          }
                              {campaign.trendValue}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">
                            {campaign.metricLabel}
                          </p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                          <ArrowRightIcon className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                )}
                </div>
              </div>
            </div>
          </> /* ===================== NEW USER ONBOARDING DASHBOARD ===================== */ :

        <>
            {/* Header */}
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
                  Command Center
                </h1>
                <p className="text-slate-500 font-light text-lg">
                  Your advertising hub — let's get you started.
                </p>
              </div>
              <button
              onClick={() => navigate('/generate')}
              className="px-6 py-3 rounded-full bg-slate-900 text-white font-medium shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2 group">

                <SparklesIcon className="w-4 h-4 group-hover:animate-pulse" />
                Generate New Ad
              </button>
            </div>

            {/* Welcome Banner */}
            <div className="mb-8 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-3xl p-8 text-white relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <RocketIcon className="w-6 h-6" />
                  <span className="text-sm font-semibold text-white/80 uppercase tracking-wider">
                    Getting Started
                  </span>
                </div>
                <h2 className="text-2xl font-bold mb-2">
                  Welcome to Ad-gentic AI
                </h2>
                <p className="text-white/70 text-sm max-w-xl">
                  Your command center will fill with real-time performance data
                  once you launch your first campaign. Follow the steps below to
                  get started.
                </p>
              </div>
              <div className="absolute -right-16 -bottom-16 w-56 h-56 bg-white/5 rounded-full blur-2xl" />
              <div className="absolute right-24 -top-10 w-36 h-36 bg-white/5 rounded-full blur-2xl" />
            </div>

            {/* Getting Started Steps */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-slate-900 mb-1">
                Get started in 3 steps
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                Complete these to unlock your full dashboard with live metrics
                and insights.
              </p>
              <div className="grid grid-cols-3 gap-6">
                <div
                className="bg-white rounded-2xl border border-slate-200 p-6 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group"
                onClick={() => navigate('/customer-data')}>

                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                      <UploadIcon className="w-5 h-5 text-purple-600" />
                    </div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Step 1
                    </span>
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1.5">
                    Upload customer data
                  </h3>
                  <p className="text-sm text-slate-500 mb-4 leading-relaxed">
                    Import your audience data so our AI can build psychological
                    profiles and persona segments.
                  </p>
                  <span className="inline-flex items-center gap-1 text-sm text-purple-600 font-medium group-hover:gap-2 transition-all">
                    Upload data <ArrowRightIcon className="w-4 h-4" />
                  </span>
                </div>
                <div
                className="bg-white rounded-2xl border border-slate-200 p-6 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group"
                onClick={() => navigate('/generate')}>

                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                      <SparklesIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Step 2
                    </span>
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1.5">
                    Generate your first ad
                  </h3>
                  <p className="text-sm text-slate-500 mb-4 leading-relaxed">
                    Describe your product and let AI create persona-targeted ad
                    variants across multiple platforms.
                  </p>
                  <span className="inline-flex items-center gap-1 text-sm text-blue-600 font-medium group-hover:gap-2 transition-all">
                    Start generating <ArrowRightIcon className="w-4 h-4" />
                  </span>
                </div>
                <div
                className="bg-white rounded-2xl border border-slate-200 p-6 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group"
                onClick={() => navigate('/campaigns')}>

                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <BarChart3Icon className="w-5 h-5 text-emerald-600" />
                    </div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Step 3
                    </span>
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1.5">
                    Launch & measure
                  </h3>
                  <p className="text-sm text-slate-500 mb-4 leading-relaxed">
                    Deploy ads across Meta, TikTok, YouTube and more — then
                    track real-time performance here.
                  </p>
                  <span className="inline-flex items-center gap-1 text-sm text-emerald-600 font-medium group-hover:gap-2 transition-all">
                    View campaigns <ArrowRightIcon className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>

            {/* Empty State Panels */}
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-8">
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <TrendingUpIcon className="w-5 h-5 text-slate-400" />
                  Performance Overview
                </h2>
                <div className="bg-white/70 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-8 flex flex-col items-center justify-center min-h-[280px] text-center">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                    <BarChart3Icon className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="font-semibold text-slate-700 mb-1">
                    No performance data yet
                  </h3>
                  <p className="text-sm text-slate-400 max-w-sm mb-5">
                    Once you launch your first campaign, you'll see real-time
                    metrics for reach, conversions, CTR, and ad spend here.
                  </p>
                  <button
                  onClick={() => navigate('/generate')}
                  className="px-4 py-2 bg-slate-900 text-white rounded-full text-sm font-medium hover:bg-slate-800 transition-colors flex items-center gap-2">

                    <SparklesIcon className="w-4 h-4" />
                    Create your first ad
                  </button>
                </div>
              </div>
              <div className="col-span-12 lg:col-span-4">
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <ActivityIcon className="w-5 h-5 text-slate-400" />
                  Pulse Feed
                </h2>
                <div className="bg-white/70 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-6 flex flex-col items-center justify-center min-h-[280px] text-center">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
                    <ActivityIcon className="w-6 h-6 text-slate-300" />
                  </div>
                  <h3 className="font-semibold text-slate-700 mb-1 text-sm">
                    No activity yet
                  </h3>
                  <p className="text-xs text-slate-400 max-w-[200px]">
                    Campaign launches, ad generations, and approvals will appear
                    here.
                  </p>
                </div>
              </div>
            </div>
          </>
        }
      </main>

      {/* Create Campaign Modal */}
      {showCreateModal &&
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
          className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          onClick={() => setShowCreateModal(false)} />

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
              className="p-1 rounded-lg hover:bg-slate-100 transition-colors">

                <XIcon className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="space-y-4">
              <button
              onClick={handleAutofill}
              disabled={isAutofilling}
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
              error={errors.name} />

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
              error={errors.product} />

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
              error={errors.targetAudience} />

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
                } />

                {newCampaign.goal === 'other' &&
              <div className="mt-2">
                    <Input
                  label="Custom Goal"
                  placeholder="Describe your specific goal..."
                  value={customGoal}
                  onChange={(e) => setCustomGoal(e.target.value)} />

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
                  onClick={() => togglePlatform(platform.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-all ${newCampaign.platforms.includes(platform.id) ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-slate-300 text-slate-700'}`}>

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
              } />

            </div>
            <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-slate-100">
              <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button
              onClick={handleCreateCampaign}
              leftIcon={<SparklesIcon className="w-4 h-4" />}>

                Create & Generate Ads
              </Button>
            </div>
          </Card>
        </div>
      }
    </div>);

}