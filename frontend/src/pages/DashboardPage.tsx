import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import {
  SparklesIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  CheckIcon,
  Loader2Icon,
  XIcon,
  Sun,
  Moon,
} from 'lucide-react';

const recentActivity = [
  { id: 1, title: 'Campaign Launched', text: 'Summer Sale 2026 is now live across Meta and TikTok.', time: '2 hours ago', linkTo: '/campaign/1', linkLabel: 'Summer Sale 2026' },
  { id: 2, title: 'New Variants Generated', text: 'AI created 12 new hooks for "Product Launch" targeting The Researcher.', time: '5 hours ago', linkTo: '/campaign/2', linkLabel: 'Product Launch' },
  { id: 3, title: 'Creative Approved', text: '3 video variants approved for "Brand Awareness" campaign.', time: '1 day ago', linkTo: '/campaign/3', linkLabel: 'Brand Awareness' },
];

const topCampaigns = [
  { id: '1', name: 'Summer Sale 2026', status: 'active', metricLabel: 'Conversions', metricValue: '1,240', platform: 'Meta', trend: 'up' as const, trendValue: '+12%' },
  { id: '2', name: 'Product Launch', status: 'active', metricLabel: 'CTR', metricValue: '4.8%', platform: 'TikTok', trend: 'up' as const, trendValue: '+0.6%' },
  { id: '3', name: 'Brand Awareness', status: 'completed', metricLabel: 'Reach', metricValue: '450K', platform: 'YouTube', trend: 'down' as const, trendValue: '-3%' },
];

const timeRanges = [
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
  { value: 'all', label: 'All' },
];

const platforms = [
  { id: 'meta', label: 'Meta' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'linkedin', label: 'LinkedIn' },
];

const regions = [
  { id: 'na', label: 'North America' },
  { id: 'eu', label: 'Europe' },
  { id: 'apac', label: 'Asia Pacific' },
  { id: 'global', label: 'Global' },
];

const inputClass = 'w-full px-3 py-2 bg-background border border-border rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20';
const labelClass = 'block text-sm font-medium mb-1.5';

export function DashboardPage() {
  const navigate = useNavigate();
  const authFlow = localStorage.getItem('adgentic_auth_flow');
  const isReturningUser = authFlow === 'signin';
  const userName = localStorage.getItem('adgentic_last_name');
  const firstName = userName ? userName.split(' ')[0] : 'there';

  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
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
    region: '',
  });

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

  const togglePlatform = (platformId: string) => {
    setNewCampaign({
      ...newCampaign,
      platforms: newCampaign.platforms.includes(platformId)
        ? newCampaign.platforms.filter((p) => p !== platformId)
        : [...newCampaign.platforms, platformId],
    });
  };

  const handleAutofill = () => {
    setIsAutofilling(true);
    setTimeout(() => {
      setNewCampaign({ ...newCampaign, platforms: ['meta', 'tiktok'], region: 'na', goal: 'sales', targetAudience: 'Tech-savvy millennials interested in productivity tools.' });
      setIsAutofilling(false);
    }, 1500);
  };

  const handleCreateCampaign = () => {
    const newErrors: Record<string, string> = {};
    if (!newCampaign.name) newErrors.name = 'Campaign name is required';
    if (!newCampaign.product) newErrors.product = 'Product/Service is required';
    if (!newCampaign.targetAudience) newErrors.targetAudience = 'Target audience is required';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setShowCreateModal(false);
    navigate('/generate', { state: { campaignContext: { ...newCampaign, goal: newCampaign.goal === 'other' ? customGoal : newCampaign.goal } } });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="ml-64 p-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {isReturningUser ? `Welcome back, ${firstName}` : 'Dashboard'}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isReturningUser ? "Here's what's happening with your campaigns." : "Your advertising hub — let's get started."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isReturningUser && (
              <div className="inline-flex items-center bg-muted border border-border rounded-lg p-1">
                {timeRanges.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setTimeRange(r.value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${timeRange === r.value ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              New Campaign
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 border border-border rounded-lg hover:bg-muted transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {isReturningUser ? (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total Reach', value: '2.4M', change: '+12%', up: true, accent: 'bg-blue-600' },
                { label: 'Ad Spend', value: '$12.4K', change: '+18%', up: true, accent: 'bg-emerald-500' },
                { label: 'Avg. CTR', value: '4.1%', change: '+0.3%', up: true, accent: 'bg-violet-500' },
                { label: 'Conversions', value: '3,820', change: '-2%', up: false, accent: 'bg-orange-500' },
              ].map(({ label, value, change, up, accent }) => (
                <div key={label} className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className={`h-0.5 ${accent}`} />
                  <div className="p-5">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-3">{label}</p>
                    <p className="text-2xl font-semibold tracking-tight mb-1">{value}</p>
                    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${up ? 'text-emerald-600' : 'text-red-500'}`}>
                      {up ? <TrendingUpIcon className="w-3 h-3" /> : <TrendingDownIcon className="w-3 h-3" />}
                      {change}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Main content */}
            <div className="grid grid-cols-12 gap-6">
              {/* Activity feed */}
              <div className="col-span-12 lg:col-span-4">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Activity</h2>
                <div className="bg-card border border-border rounded-xl divide-y divide-border">
                  {recentActivity.map((activity, i) => {
                    const accent = ['border-l-blue-600', 'border-l-violet-500', 'border-l-emerald-500'][i];
                    return (
                      <div key={activity.id} className={`p-4 border-l-2 ${accent}`}>
                        <p className="text-sm font-medium leading-snug">{activity.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{activity.text}</p>
                        <div className="flex items-center justify-between mt-2">
                          <Link to={activity.linkTo} className="inline-flex items-center gap-0.5 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">
                            View <ArrowUpRightIcon className="w-3 h-3" />
                          </Link>
                          <span className="text-xs text-muted-foreground">{activity.time}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top campaigns */}
              <div className="col-span-12 lg:col-span-8">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Top Campaigns</h2>
                <div className="bg-card border border-border rounded-xl divide-y divide-border">
                  {topCampaigns.map((campaign) => (
                    <div
                      key={campaign.id}
                      className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/campaign/${campaign.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${campaign.status === 'active' ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
                        <div>
                          <p className="text-sm font-medium">{campaign.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{campaign.platform} · {campaign.status}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-base font-semibold tracking-tight">{campaign.metricValue}</p>
                          <p className="text-xs text-muted-foreground">{campaign.metricLabel}</p>
                        </div>
                        <span className={`text-xs font-medium ${campaign.trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                          {campaign.trendValue}
                        </span>
                        <ArrowRightIcon className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Getting started */}
            <div className="mb-8">
              <h2 className="text-base font-semibold mb-1">Get started in 3 steps</h2>
              <p className="text-sm text-muted-foreground mb-5">Complete these to unlock your full dashboard with live metrics.</p>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { step: '01', title: 'Upload customer data', desc: 'Import your audience so our AI can build segments and personas.', label: 'Upload data', path: '/customer-data' },
                  { step: '02', title: 'Generate your first ad', desc: 'Describe your product and let AI create targeted ad variants.', label: 'Start generating', path: '/generate' },
                  { step: '03', title: 'Launch & measure', desc: 'Deploy across Meta, TikTok, YouTube and track performance here.', label: 'View campaigns', path: '/campaigns' },
                ].map(({ step, title, desc, label, path }) => (
                  <div
                    key={step}
                    onClick={() => navigate(path)}
                    className="bg-card border border-border rounded-xl p-6 cursor-pointer hover:border-foreground/20 transition-colors group"
                  >
                    <p className="text-3xl font-semibold text-muted-foreground/20 mb-4 tracking-tight">{step}</p>
                    <h3 className="font-medium mb-1.5">{title}</h3>
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{desc}</p>
                    <span className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 font-medium group-hover:gap-2 transition-all">
                      {label} <ArrowRightIcon className="w-3.5 h-3.5" />
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Empty state panels */}
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-8">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Performance Overview</h2>
                <div className="bg-card border border-border rounded-xl p-8 flex flex-col items-center justify-center min-h-[240px] text-center">
                  <p className="text-5xl font-semibold text-muted-foreground/10 mb-4 tracking-tight">—</p>
                  <p className="text-sm font-medium mb-1">No performance data yet</p>
                  <p className="text-xs text-muted-foreground max-w-xs mb-4">Launch your first campaign to see real-time metrics for reach, conversions, CTR, and ad spend.</p>
                  <button
                    onClick={() => navigate('/generate')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Create your first ad
                  </button>
                </div>
              </div>
              <div className="col-span-12 lg:col-span-4">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Activity</h2>
                <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center justify-center min-h-[240px] text-center">
                  <p className="text-sm font-medium mb-1">No activity yet</p>
                  <p className="text-xs text-muted-foreground max-w-[180px]">Campaign launches and ad generations will appear here.</p>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
          <div className="relative w-full max-w-lg bg-card border border-border rounded-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">New Campaign</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleAutofill}
                disabled={isAutofilling}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-border rounded-lg text-sm hover:bg-muted transition-colors disabled:opacity-50"
              >
                {isAutofilling ? (
                  <><Loader2Icon className="w-4 h-4 animate-spin text-muted-foreground" /> Auto-filling...</>
                ) : (
                  <><SparklesIcon className="w-4 h-4 text-blue-600" /> Auto-fill from profile</>
                )}
              </button>

              <div>
                <label className={labelClass}>Campaign Name <span className="text-red-500">*</span></label>
                <input className={inputClass} placeholder="e.g., Summer Sale 2026" value={newCampaign.name} onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })} />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className={labelClass}>Product / Service <span className="text-red-500">*</span></label>
                <input className={inputClass} placeholder="What are you advertising?" value={newCampaign.product} onChange={(e) => setNewCampaign({ ...newCampaign, product: e.target.value })} />
                {errors.product && <p className="text-xs text-red-500 mt-1">{errors.product}</p>}
              </div>

              <div>
                <label className={labelClass}>Target Audience <span className="text-red-500">*</span></label>
                <textarea className={`${inputClass} resize-none`} rows={3} placeholder="Describe who you want to reach..." value={newCampaign.targetAudience} onChange={(e) => setNewCampaign({ ...newCampaign, targetAudience: e.target.value })} />
                {errors.targetAudience && <p className="text-xs text-red-500 mt-1">{errors.targetAudience}</p>}
              </div>

              <div>
                <label className={labelClass}>Campaign Goal</label>
                <select className={`${inputClass}`} value={newCampaign.goal} onChange={(e) => setNewCampaign({ ...newCampaign, goal: e.target.value })}>
                  <option value="">Select goal</option>
                  <option value="awareness">Brand Awareness</option>
                  <option value="leads">Lead Generation</option>
                  <option value="sales">Direct Sales</option>
                  <option value="engagement">Engagement</option>
                  <option value="other">Other</option>
                </select>
                {newCampaign.goal === 'other' && (
                  <input className={`${inputClass} mt-2`} placeholder="Describe your specific goal..." value={customGoal} onChange={(e) => setCustomGoal(e.target.value)} />
                )}
              </div>

              <div>
                <label className={labelClass}>Target Platforms</label>
                <div className="flex flex-wrap gap-2">
                  {platforms.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => togglePlatform(p.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors ${newCampaign.platforms.includes(p.id) ? 'border-blue-600 bg-blue-600/10 text-foreground' : 'border-border text-muted-foreground hover:border-foreground/30'}`}
                    >
                      {newCampaign.platforms.includes(p.id) && <CheckIcon className="w-3.5 h-3.5 text-blue-600" />}
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>Target Region</label>
                <select className={inputClass} value={newCampaign.region} onChange={(e) => setNewCampaign({ ...newCampaign, region: e.target.value })}>
                  <option value="">Select region</option>
                  {regions.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-5 border-t border-border">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                Cancel
              </button>
              <button
                onClick={handleCreateCampaign}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <SparklesIcon className="w-4 h-4" />
                Create & Generate Ads
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
