import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { useSidebar } from '../contexts/SidebarContext';
import { useCompany } from '../contexts/CompanyContext';
import {
  CreditCardIcon,
  CheckIcon,
  ShieldIcon,
  ZapIcon,
  ClockIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  LinkIcon,
  MailIcon,
  SmartphoneIcon,
  HashIcon,
  DollarSignIcon,
  UsersIcon,
  SettingsIcon,
  ImageIcon,
  Loader2Icon,
  Sun,
  Moon,
} from 'lucide-react';

type TabKey = 'billing' | 'plans' | 'brand' | 'integrations' | 'notifications';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  connected: boolean;
  accountName?: string;
}

const initialIntegrations: Integration[] = [
  { id: 'meta', name: 'Meta (Facebook/Instagram)', description: 'Publish and manage ads across Facebook and Instagram.', icon: 'M', color: 'bg-blue-600', connected: true, accountName: 'Acme Inc. Business' },
  { id: 'tiktok', name: 'TikTok Ads', description: 'Create and deploy short-form video ad campaigns.', icon: 'T', color: 'bg-slate-800', connected: true, accountName: 'acme_official' },
  { id: 'youtube', name: 'YouTube Ads', description: 'Run video ads and bumper campaigns on YouTube.', icon: 'Y', color: 'bg-red-600', connected: false },
  { id: 'linkedin', name: 'LinkedIn Ads', description: 'Target professionals with sponsored content and InMail.', icon: 'in', color: 'bg-blue-700', connected: false },
  { id: 'google', name: 'Google Ads', description: 'Search, display, and Performance Max campaigns.', icon: 'G', color: 'bg-emerald-600', connected: false },
  { id: 'slack', name: 'Slack', description: 'Get campaign alerts and approvals in your Slack channels.', icon: 'S', color: 'bg-purple-600', connected: true, accountName: '#marketing-ads' },
  { id: 'hubspot', name: 'HubSpot', description: 'Sync contacts and audience data from your CRM.', icon: 'H', color: 'bg-orange-500', connected: false },
  { id: 'zapier', name: 'Zapier', description: 'Connect Ad-gentic to 5,000+ apps with automations.', icon: 'Z', color: 'bg-orange-600', connected: false },
];

const toneOptions = [
  { value: 'professional', label: 'Professional', desc: 'Polished, authoritative, trustworthy' },
  { value: 'casual', label: 'Casual', desc: 'Friendly, approachable, conversational' },
  { value: 'bold', label: 'Bold', desc: 'Confident, direct, attention-grabbing' },
  { value: 'playful', label: 'Playful', desc: 'Fun, witty, lighthearted' },
];

interface NotificationSetting {
  id: string;
  title: string;
  desc: string;
  icon: React.ElementType;
  email: boolean;
  inApp: boolean;
  slack: boolean;
}

const initialNotifications: NotificationSetting[] = [
  { id: 'campaigns', title: 'Campaign Updates', desc: 'Approvals, launches, pauses, and status changes.', icon: ZapIcon, email: true, inApp: true, slack: true },
  { id: 'personas', title: 'Persona Insights', desc: 'New audience segments discovered by AI.', icon: ShieldIcon, email: true, inApp: true, slack: false },
  { id: 'weekly', title: 'Weekly Performance Report', desc: 'Summary of ad performance delivered every Monday.', icon: ClockIcon, email: true, inApp: false, slack: false },
  { id: 'budget', title: 'Budget Alerts', desc: 'Warnings when spend approaches or exceeds limits.', icon: DollarSignIcon, email: true, inApp: true, slack: true },
  { id: 'team', title: 'Team Activity', desc: 'When teammates create, edit, or approve campaigns.', icon: UsersIcon, email: false, inApp: true, slack: true },
  { id: 'system', title: 'System Updates', desc: 'New features, maintenance, and platform announcements.', icon: SettingsIcon, email: true, inApp: true, slack: false },
];

export function SettingsPage() {
  const { collapsed } = useSidebar();
  const { profile, updateProfile } = useCompany();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<TabKey>('billing');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'dark';
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.add('theme-transitioning');
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    setTimeout(() => document.documentElement.classList.remove('theme-transitioning'), 300);
  };

  const [brandForm, setBrandForm] = useState({
    companyName: profile.companyName,
    primaryColor: '#3B82F6',
    secondaryColor: '#1E293B',
    accentColor: '#10B981',
    tone: 'professional',
    guidelines: 'Always lead with value. Avoid jargon. Use data to support claims. Maintain a confident but approachable voice.',
  });

  const [integrations, setIntegrations] = useState(initialIntegrations);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [channelMasters, setChannelMasters] = useState({ email: true, inApp: true, slack: true });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && ['plans', 'billing', 'notifications', 'brand', 'integrations'].includes(tab)) {
      setActiveTab(tab as TabKey);
    }
  }, [location.search]);

  const handleUpgrade = (plan: 'basic' | 'premium' | 'enterprise') => {
    setShowSuccess(true);
    setTimeout(() => { updateProfile({ plan }); setShowSuccess(false); }, 2000);
  };

  const handleCancelSubscription = () => { setShowCancelModal(false); handleUpgrade('basic'); };

  const getPlanButtonText = (planId: string) => {
    if (profile.plan === planId) return 'Current Plan';
    const plans = ['basic', 'premium', 'enterprise'];
    return plans.indexOf(profile.plan) < plans.indexOf(planId) ? 'Upgrade' : 'Downgrade';
  };

  const handleConnect = (id: string) => {
    setConnectingId(id);
    setTimeout(() => {
      setIntegrations((prev) => prev.map((i) => i.id === id ? { ...i, connected: true, accountName: 'Connected Account' } : i));
      setConnectingId(null);
    }, 1500);
  };

  const handleDisconnect = (id: string) => {
    setIntegrations((prev) => prev.map((i) => i.id === id ? { ...i, connected: false, accountName: undefined } : i));
  };

  const toggleNotification = (id: string, channel: 'email' | 'inApp' | 'slack') => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, [channel]: !n[channel] } : n));
  };

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'billing', label: 'Billing & History' },
    { key: 'plans', label: 'Plans' },
    { key: 'brand', label: 'Brand Profile' },
    { key: 'integrations', label: 'Integrations' },
    { key: 'notifications', label: 'Notifications' },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className={`${collapsed ? 'ml-16' : 'ml-64'} transition-all duration-300 flex-1 p-8 relative`}>

        {/* Success Overlay */}
        {showSuccess && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <div className="bg-card border border-border p-8 rounded-2xl shadow-xl flex flex-col items-center">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircleIcon className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Plan Updated!</h3>
              <p className="text-muted-foreground">Your subscription has been changed successfully.</p>
            </div>
          </div>
        )}

        {/* Cancel Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={() => setShowCancelModal(false)} />
            <div className="relative w-full max-w-md bg-card border border-border rounded-2xl p-8 z-10">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangleIcon className="w-6 h-6 text-amber-500" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Are you sure?</h3>
                <p className="text-muted-foreground text-sm">You will lose access to unlimited ad variants and automated posting.</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCancelSubscription}
                  className="flex-1 py-2.5 border border-border rounded-xl text-sm text-muted-foreground hover:bg-muted transition-colors">
                  Confirm Cancellation
                </button>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
                  Keep My Plan
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-2xl font-bold text-foreground">Settings & Billing</h1>
            <button
              onClick={toggleTheme}
              className="p-2 bg-muted rounded-lg hover:bg-border transition-colors text-foreground"
              aria-label="Toggle theme">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-muted-foreground mb-8">Manage your subscription, brand identity, integrations, and preferences.</p>

          {/* Tabs */}
          <div className="flex border-b border-border mb-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`pb-4 px-4 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === tab.key ? 'text-blue-600' : 'text-muted-foreground hover:text-foreground'}`}>
                {tab.label}
                {activeTab === tab.key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />}
              </button>
            ))}
          </div>

          {/* ==================== BILLING TAB ==================== */}
          {activeTab === 'billing' && (
            <div className="space-y-8">
              <div className="grid grid-cols-3 gap-6">
                {/* Current Plan + Payment */}
                <div className="col-span-2 bg-card border border-border rounded-xl p-7">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-base font-semibold text-foreground">Current Plan</h3>
                      <p className="text-muted-foreground text-sm">Renews on March 12, 2026</p>
                    </div>
                    <span className="px-3 py-1 bg-blue-500/10 text-blue-600 border border-blue-500/20 rounded-full text-xs font-semibold capitalize">
                      {profile.plan} Plan
                    </span>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-muted rounded-xl border border-border mb-6">
                    <div className="w-12 h-12 bg-card rounded-xl border border-border flex items-center justify-center flex-shrink-0">
                      <CreditCardIcon className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Visa ending in 4242</p>
                      <p className="text-xs text-muted-foreground">Expires 12/28</p>
                    </div>
                    <button className="ml-auto px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted transition-colors">
                      Update
                    </button>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setActiveTab('plans')}
                      className="px-4 py-2 border border-border rounded-xl text-sm text-foreground hover:bg-muted transition-colors">
                      Change Plan
                    </button>
                    {profile.plan !== 'basic' && (
                      <button
                        onClick={() => setShowCancelModal(true)}
                        className="px-4 py-2 text-sm text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-xl transition-colors">
                        Cancel Subscription
                      </button>
                    )}
                  </div>
                </div>

                {/* Usage */}
                <div className="bg-card border border-border rounded-xl p-7">
                  <h3 className="text-base font-semibold text-foreground mb-5">Usage</h3>
                  <div className="space-y-5">
                    {[
                      { label: 'Generations', value: '84 / 100', pct: 84, color: 'bg-blue-500' },
                      { label: 'Storage', value: '2.1GB / 5GB', pct: 42, color: 'bg-violet-500' },
                      { label: 'Team Members', value: '3 / 5', pct: 60, color: 'bg-emerald-500' },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                          <span>{item.label}</span>
                          <span>{item.value}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Billing History */}
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="p-6 border-b border-border">
                  <h3 className="text-base font-semibold text-foreground">Billing History</h3>
                </div>
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted text-muted-foreground">
                    <tr>
                      <th className="px-6 py-3 font-medium">Date</th>
                      <th className="px-6 py-3 font-medium">Plan</th>
                      <th className="px-6 py-3 font-medium">Amount</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                      <th className="px-6 py-3 font-medium text-right">Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[
                      { date: 'Feb 12, 2026', plan: 'Premium Plan', amount: '$99.00', status: 'Paid' },
                      { date: 'Jan 12, 2026', plan: 'Premium Plan', amount: '$99.00', status: 'Paid' },
                      { date: 'Dec 12, 2025', plan: 'Premium Plan', amount: '$99.00', status: 'Paid' },
                    ].map((item, i) => (
                      <tr key={i} className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4 text-foreground">{item.date}</td>
                        <td className="px-6 py-4 text-muted-foreground">{item.plan}</td>
                        <td className="px-6 py-4 text-foreground font-medium">{item.amount}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-xs font-medium">
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-sm text-blue-600 hover:text-blue-700 transition-colors">Download</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==================== PLANS TAB ==================== */}
          {activeTab === 'plans' && (
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { id: 'basic', name: 'Basic', price: '$0', features: ['3 campaigns', 'Basic analytics', 'Email support'] },
                { id: 'premium', name: 'Premium', price: '$99', features: ['Unlimited campaigns', 'Advanced analytics', 'Priority support', 'Team access'], highlight: true },
                { id: 'enterprise', name: 'Enterprise', price: 'Custom', features: ['Dedicated manager', 'Custom integrations', 'SLA guarantee', 'SSO'] },
              ].map((plan) => (
                <div
                  key={plan.id}
                  className={`relative flex flex-col bg-card border rounded-xl p-7 ${
                    profile.plan === plan.id
                      ? 'ring-2 ring-blue-600 border-blue-600/30'
                      : plan.highlight && profile.plan !== plan.id
                        ? 'ring-2 ring-blue-600 border-blue-600/30'
                        : 'border-border hover:border-foreground/20'
                  } transition-colors`}>
                  {profile.plan === plan.id && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">
                      Current Plan
                    </div>
                  )}
                  {plan.highlight && profile.plan !== plan.id && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">
                      Most Popular
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                      {plan.price !== 'Custom' && <span className="text-muted-foreground">/mo</span>}
                    </div>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button
                    disabled={profile.plan === plan.id}
                    onClick={() => handleUpgrade(plan.id as 'basic' | 'premium' | 'enterprise')}
                    className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      profile.plan === plan.id
                        ? 'bg-muted text-muted-foreground cursor-not-allowed'
                        : plan.highlight
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'border border-border text-foreground hover:bg-muted'
                    }`}>
                    {getPlanButtonText(plan.id)}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ==================== BRAND PROFILE TAB ==================== */}
          {activeTab === 'brand' && (
            <div className="space-y-6 max-w-3xl">
              {/* Company Identity */}
              <div className="bg-card border border-border rounded-xl p-7">
                <h3 className="text-base font-semibold text-foreground mb-1">Company Identity</h3>
                <p className="text-sm text-muted-foreground mb-6">Your brand identity is used across all generated ads.</p>
                <div className="flex items-start gap-6 mb-6">
                  <div className="w-24 h-24 rounded-xl bg-muted border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors group flex-shrink-0">
                    <ImageIcon className="w-6 h-6 text-muted-foreground group-hover:text-blue-500 transition-colors" />
                    <span className="text-[10px] text-muted-foreground mt-1 group-hover:text-blue-500">Upload logo</span>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-foreground mb-1.5">Company Name</label>
                    <input
                      type="text"
                      value={brandForm.companyName}
                      onChange={(e) => setBrandForm({ ...brandForm, companyName: e.target.value })}
                      className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Brand Colors */}
              <div className="bg-card border border-border rounded-xl p-7">
                <h3 className="text-base font-semibold text-foreground mb-1">Brand Colors</h3>
                <p className="text-sm text-muted-foreground mb-6">These colors will be applied to generated ad creatives.</p>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Primary', key: 'primaryColor' as const },
                    { label: 'Secondary', key: 'secondaryColor' as const },
                    { label: 'Accent', key: 'accentColor' as const },
                  ].map((color) => (
                    <div key={color.key}>
                      <label className="block text-sm font-medium text-foreground mb-2">{color.label}</label>
                      <div className="rounded-xl border border-border overflow-hidden">
                        <div className="h-12 w-full" style={{ backgroundColor: brandForm[color.key] }} />
                        <input
                          type="text"
                          value={brandForm[color.key]}
                          onChange={(e) => setBrandForm({ ...brandForm, [color.key]: e.target.value })}
                          className="w-full px-3 py-2 bg-muted border-t border-border rounded-b-xl text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Brand Voice */}
              <div className="bg-card border border-border rounded-xl p-7">
                <h3 className="text-base font-semibold text-foreground mb-1">Brand Voice & Tone</h3>
                <p className="text-sm text-muted-foreground mb-6">AI will match this tone when generating ad copy.</p>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {toneOptions.map((tone) => (
                    <button
                      key={tone.value}
                      onClick={() => setBrandForm({ ...brandForm, tone: tone.value })}
                      className={`p-4 rounded-xl border text-left transition-all ${brandForm.tone === tone.value ? 'border-blue-600 bg-blue-500/5 ring-1 ring-blue-600' : 'border-border hover:border-foreground/20'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm text-foreground">{tone.label}</span>
                        {brandForm.tone === tone.value && <CheckIcon className="w-4 h-4 text-blue-600" />}
                      </div>
                      <p className="text-xs text-muted-foreground">{tone.desc}</p>
                    </button>
                  ))}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Brand Guidelines</label>
                  <textarea
                    rows={4}
                    placeholder="Describe your brand's dos and don'ts for ad copy..."
                    value={brandForm.guidelines}
                    onChange={(e) => setBrandForm({ ...brandForm, guidelines: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
                  <CheckIcon className="w-4 h-4" />
                  Save Brand Settings
                </button>
              </div>
            </div>
          )}

          {/* ==================== INTEGRATIONS TAB ==================== */}
          {activeTab === 'integrations' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-semibold text-foreground">Connected Platforms</h3>
                <p className="text-sm text-muted-foreground">
                  {integrations.filter((i) => i.connected).length} of {integrations.length} integrations active
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {integrations.map((integration) => (
                  <div key={integration.id} className="bg-card border border-border rounded-xl p-5 flex items-start gap-4 hover:border-foreground/20 transition-colors">
                    <div className={`w-11 h-11 rounded-xl ${integration.color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                      {integration.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="font-semibold text-foreground text-sm">{integration.name}</h4>
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${integration.connected ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-muted text-muted-foreground border-border'}`}>
                          {integration.connected ? 'Connected' : 'Not connected'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{integration.description}</p>
                      {integration.connected ? (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground truncate">{integration.accountName}</span>
                          <button
                            onClick={() => handleDisconnect(integration.id)}
                            className="text-xs text-red-500 border border-red-500/30 hover:border-red-500/60 hover:bg-red-500/10 px-2.5 py-1 rounded-lg transition-colors flex-shrink-0">
                            Disconnect
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleConnect(integration.id)}
                          disabled={connectingId === integration.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-xs text-foreground hover:bg-muted transition-colors disabled:opacity-50">
                          {connectingId === integration.id ? (
                            <><Loader2Icon className="w-3 h-3 animate-spin" />Connecting...</>
                          ) : (
                            <><LinkIcon className="w-3 h-3" />Connect</>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================== NOTIFICATIONS TAB ==================== */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 max-w-3xl">
              {/* Channel Masters */}
              <div className="bg-card border border-border rounded-xl p-7">
                <h3 className="text-base font-semibold text-foreground mb-1">Notification Channels</h3>
                <p className="text-sm text-muted-foreground mb-6">Enable or disable entire notification channels.</p>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { key: 'email' as const, label: 'Email', desc: 'alex@acme.inc', icon: MailIcon },
                    { key: 'inApp' as const, label: 'In-App', desc: 'Browser notifications', icon: SmartphoneIcon },
                    { key: 'slack' as const, label: 'Slack', desc: '#marketing-ads', icon: HashIcon },
                  ].map((channel) => (
                    <div key={channel.key} className={`p-4 rounded-xl border transition-all ${channelMasters[channel.key] ? 'border-border bg-card' : 'border-border bg-muted opacity-60'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                          <channel.icon className="w-4 h-4 text-blue-600" />
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={channelMasters[channel.key]}
                            onChange={() => setChannelMasters((prev) => ({ ...prev, [channel.key]: !prev[channel.key] }))}
                          />
                          <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                        </label>
                      </div>
                      <h4 className="font-medium text-foreground text-sm">{channel.label}</h4>
                      <p className="text-xs text-muted-foreground">{channel.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Granular Controls */}
              <div className="bg-card border border-border rounded-xl p-7">
                <h3 className="text-base font-semibold text-foreground mb-1">Notification Preferences</h3>
                <p className="text-sm text-muted-foreground mb-6">Fine-tune which notifications you receive per channel.</p>

                <div className="flex items-center mb-4 pb-3 border-b border-border">
                  <div className="flex-1" />
                  <div className="flex items-center gap-6 pr-1">
                    {['Email', 'In-App', 'Slack'].map((h) => (
                      <span key={h} className="w-14 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</span>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  {notifications.map((item) => (
                    <div key={item.id} className="flex items-center py-3 border-b border-border last:border-0">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                          <item.icon className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-medium text-foreground text-sm">{item.title}</h4>
                          <p className="text-xs text-muted-foreground truncate">{item.desc}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 pr-1">
                        {(['email', 'inApp', 'slack'] as const).map((channel) => (
                          <div key={channel} className="w-14 flex justify-center">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={item[channel] && channelMasters[channel]}
                                disabled={!channelMasters[channel]}
                                onChange={() => toggleNotification(item.id, channel)}
                              />
                              <div className={`w-9 h-5 rounded-full peer after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white ${!channelMasters[channel] ? 'bg-muted cursor-not-allowed' : 'bg-muted peer-checked:bg-blue-600'}`} />
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
