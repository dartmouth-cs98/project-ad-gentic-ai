import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { useCompany } from '../contexts/CompanyContext';
import {
  CreditCardIcon,
  CheckIcon,
  BellIcon,
  ShieldIcon,
  ZapIcon,
  ClockIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  UploadIcon,
  PaletteIcon,
  LinkIcon,
  XIcon,
  ExternalLinkIcon,
  WifiIcon,
  WifiOffIcon,
  MessageSquareIcon,
  MailIcon,
  SmartphoneIcon,
  HashIcon,
  DollarSignIcon,
  UsersIcon,
  SettingsIcon,
  ImageIcon,
  TypeIcon,
  Loader2Icon } from
'lucide-react';
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
{
  id: 'meta',
  name: 'Meta (Facebook/Instagram)',
  description: 'Publish and manage ads across Facebook and Instagram.',
  icon: 'M',
  color: 'bg-blue-600',
  connected: true,
  accountName: 'Acme Inc. Business'
},
{
  id: 'tiktok',
  name: 'TikTok Ads',
  description: 'Create and deploy short-form video ad campaigns.',
  icon: 'T',
  color: 'bg-slate-900',
  connected: true,
  accountName: 'acme_official'
},
{
  id: 'youtube',
  name: 'YouTube Ads',
  description: 'Run video ads and bumper campaigns on YouTube.',
  icon: 'Y',
  color: 'bg-red-600',
  connected: false
},
{
  id: 'linkedin',
  name: 'LinkedIn Ads',
  description: 'Target professionals with sponsored content and InMail.',
  icon: 'in',
  color: 'bg-blue-700',
  connected: false
},
{
  id: 'google',
  name: 'Google Ads',
  description: 'Search, display, and Performance Max campaigns.',
  icon: 'G',
  color: 'bg-emerald-600',
  connected: false
},
{
  id: 'slack',
  name: 'Slack',
  description: 'Get campaign alerts and approvals in your Slack channels.',
  icon: 'S',
  color: 'bg-purple-600',
  connected: true,
  accountName: '#marketing-ads'
},
{
  id: 'hubspot',
  name: 'HubSpot',
  description: 'Sync contacts and audience data from your CRM.',
  icon: 'H',
  color: 'bg-orange-500',
  connected: false
},
{
  id: 'zapier',
  name: 'Zapier',
  description: 'Connect Ad-gentic to 5,000+ apps with automations.',
  icon: 'Z',
  color: 'bg-orange-600',
  connected: false
}];

const toneOptions = [
{
  value: 'professional',
  label: 'Professional',
  desc: 'Polished, authoritative, trustworthy'
},
{
  value: 'casual',
  label: 'Casual',
  desc: 'Friendly, approachable, conversational'
},
{
  value: 'bold',
  label: 'Bold',
  desc: 'Confident, direct, attention-grabbing'
},
{
  value: 'playful',
  label: 'Playful',
  desc: 'Fun, witty, lighthearted'
}];

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
{
  id: 'campaigns',
  title: 'Campaign Updates',
  desc: 'Approvals, launches, pauses, and status changes.',
  icon: ZapIcon,
  email: true,
  inApp: true,
  slack: true
},
{
  id: 'personas',
  title: 'Persona Insights',
  desc: 'New audience segments discovered by AI.',
  icon: ShieldIcon,
  email: true,
  inApp: true,
  slack: false
},
{
  id: 'weekly',
  title: 'Weekly Performance Report',
  desc: 'Summary of ad performance delivered every Monday.',
  icon: ClockIcon,
  email: true,
  inApp: false,
  slack: false
},
{
  id: 'budget',
  title: 'Budget Alerts',
  desc: 'Warnings when spend approaches or exceeds limits.',
  icon: DollarSignIcon,
  email: true,
  inApp: true,
  slack: true
},
{
  id: 'team',
  title: 'Team Activity',
  desc: 'When teammates create, edit, or approve campaigns.',
  icon: UsersIcon,
  email: false,
  inApp: true,
  slack: true
},
{
  id: 'system',
  title: 'System Updates',
  desc: 'New features, maintenance, and platform announcements.',
  icon: SettingsIcon,
  email: true,
  inApp: true,
  slack: false
}];

export function SettingsPage() {
  const { profile, updateProfile } = useCompany();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<TabKey>('billing');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  // Brand state
  const [brandForm, setBrandForm] = useState({
    companyName: profile.companyName,
    primaryColor: '#3B82F6',
    secondaryColor: '#1E293B',
    accentColor: '#10B981',
    tone: 'professional',
    guidelines:
    'Always lead with value. Avoid jargon. Use data to support claims. Maintain a confident but approachable voice.'
  });
  // Integrations state
  const [integrations, setIntegrations] = useState(initialIntegrations);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  // Notifications state
  const [notifications, setNotifications] = useState(initialNotifications);
  const [channelMasters, setChannelMasters] = useState({
    email: true,
    inApp: true,
    slack: true
  });
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (
    tab &&
    ['plans', 'billing', 'notifications', 'brand', 'integrations'].includes(
      tab
    ))
    {
      setActiveTab(tab as TabKey);
    }
  }, [location.search]);
  const handleUpgrade = (plan: 'basic' | 'premium' | 'enterprise') => {
    setShowSuccess(true);
    setTimeout(() => {
      updateProfile({
        plan
      });
      setShowSuccess(false);
    }, 2000);
  };
  const handleCancelSubscription = () => {
    setShowCancelModal(false);
    handleUpgrade('basic');
  };
  const getPlanButtonText = (planId: string) => {
    if (profile.plan === planId) return 'Current Plan';
    const plans = ['basic', 'premium', 'enterprise'];
    const currentIdx = plans.indexOf(profile.plan);
    const targetIdx = plans.indexOf(planId);
    return currentIdx < targetIdx ? 'Upgrade' : 'Downgrade';
  };
  const handleConnect = (id: string) => {
    setConnectingId(id);
    setTimeout(() => {
      setIntegrations((prev) =>
      prev.map((i) =>
      i.id === id ?
      {
        ...i,
        connected: true,
        accountName: 'Connected Account'
      } :
      i
      )
      );
      setConnectingId(null);
    }, 1500);
  };
  const handleDisconnect = (id: string) => {
    setIntegrations((prev) =>
    prev.map((i) =>
    i.id === id ?
    {
      ...i,
      connected: false,
      accountName: undefined
    } :
    i
    )
    );
  };
  const toggleNotification = (
  id: string,
  channel: 'email' | 'inApp' | 'slack') =>
  {
    setNotifications((prev) =>
    prev.map((n) =>
    n.id === id ?
    {
      ...n,
      [channel]: !n[channel]
    } :
    n
    )
    );
  };
  const tabs: {
    key: TabKey;
    label: string;
  }[] = [
  {
    key: 'billing',
    label: 'Billing & History'
  },
  {
    key: 'plans',
    label: 'Plans'
  },
  {
    key: 'brand',
    label: 'Brand Profile'
  },
  {
    key: 'integrations',
    label: 'Integrations'
  },
  {
    key: 'notifications',
    label: 'Notifications'
  }];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="ml-64 flex-1 p-8 relative">
        {/* Success Overlay */}
        {showSuccess &&
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircleIcon className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                Plan Updated!
              </h3>
              <p className="text-slate-500">
                Your subscription has been changed successfully.
              </p>
            </div>
          </div>
        }

        {/* Cancel Modal */}
        {showCancelModal &&
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setShowCancelModal(false)} />

            <Card
            variant="elevated"
            padding="lg"
            className="relative w-full max-w-md z-10">

              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangleIcon className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  Are you sure?
                </h3>
                <p className="text-slate-500 text-sm">
                  You will lose access to unlimited ad variants and automated
                  posting.
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                variant="ghost"
                className="flex-1 text-slate-500 hover:text-slate-700"
                onClick={handleCancelSubscription}>

                  Confirm Cancellation
                </Button>
                <Button
                className="flex-1"
                onClick={() => setShowCancelModal(false)}>

                  Keep My Plan
                </Button>
              </div>
            </Card>
          </div>
        }

        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Settings & Billing
          </h1>
          <p className="text-slate-500 mb-8">
            Manage your subscription, brand identity, integrations, and
            preferences.
          </p>

          {/* Tabs */}
          <div className="flex border-b border-slate-200 mb-8 overflow-x-auto">
            {tabs.map((tab) =>
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-4 px-4 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === tab.key ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>

                {tab.label}
                {activeTab === tab.key &&
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
              }
              </button>
            )}
          </div>

          {/* ==================== BILLING TAB ==================== */}
          {activeTab === 'billing' &&
          <div className="space-y-8">
              <div className="grid grid-cols-3 gap-8">
                <Card variant="elevated" padding="lg" className="col-span-2">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        Current Plan
                      </h3>
                      <p className="text-slate-500 text-sm">
                        Renews on March 12, 2026
                      </p>
                    </div>
                    <Badge
                    variant="info"
                    className="text-sm px-3 py-1 capitalize">

                      {profile.plan} Plan
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 mb-6">
                    <div className="w-12 h-12 bg-white rounded-lg border border-slate-200 flex items-center justify-center">
                      <CreditCardIcon className="w-6 h-6 text-slate-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        Visa ending in 4242
                      </p>
                      <p className="text-xs text-slate-500">Expires 12/28</p>
                    </div>
                    <Button variant="ghost" size="sm" className="ml-auto">
                      Update
                    </Button>
                  </div>
                  <div className="flex gap-3">
                    <Button
                    variant="secondary"
                    onClick={() => setActiveTab('plans')}>

                      Change Plan
                    </Button>
                    {profile.plan !== 'basic' &&
                  <Button
                    variant="ghost"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => setShowCancelModal(true)}>

                        Cancel Subscription
                      </Button>
                  }
                  </div>
                </Card>
                <Card variant="elevated" padding="lg">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    Usage
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>Generations</span>
                        <span>84 / 100</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full w-[84%] bg-blue-500 rounded-full" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>Storage</span>
                        <span>2.1GB / 5GB</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full w-[42%] bg-purple-500 rounded-full" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>Team Members</span>
                        <span>3 / 5</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full w-[60%] bg-emerald-500 rounded-full" />
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
              <Card variant="default" padding="none">
                <div className="p-6 border-b border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Billing History
                  </h3>
                </div>
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-6 py-3 font-medium">Date</th>
                      <th className="px-6 py-3 font-medium">Plan</th>
                      <th className="px-6 py-3 font-medium">Amount</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                      <th className="px-6 py-3 font-medium text-right">
                        Invoice
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                  {
                    date: 'Feb 12, 2026',
                    plan: 'Premium Plan',
                    amount: '$99.00',
                    status: 'Paid'
                  },
                  {
                    date: 'Jan 12, 2026',
                    plan: 'Premium Plan',
                    amount: '$99.00',
                    status: 'Paid'
                  },
                  {
                    date: 'Dec 12, 2025',
                    plan: 'Premium Plan',
                    amount: '$99.00',
                    status: 'Paid'
                  }].
                  map((item, i) =>
                  <tr key={i} className="hover:bg-slate-50">
                        <td className="px-6 py-4 text-slate-900">
                          {item.date}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {item.plan}
                        </td>
                        <td className="px-6 py-4 text-slate-900 font-medium">
                          {item.amount}
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                        variant="success"
                        className="bg-emerald-50 text-emerald-700 border border-emerald-100">

                            {item.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700">

                            Download
                          </Button>
                        </td>
                      </tr>
                  )}
                  </tbody>
                </table>
              </Card>
            </div>
          }

          {/* ==================== PLANS TAB ==================== */}
          {activeTab === 'plans' &&
          <div className="grid md:grid-cols-3 gap-6">
              {[
            {
              id: 'basic',
              name: 'Basic',
              price: '$0',
              features: ['3 campaigns', 'Basic analytics', 'Email support']
            },
            {
              id: 'premium',
              name: 'Premium',
              price: '$99',
              features: [
              'Unlimited campaigns',
              'Advanced analytics',
              'Priority support',
              'Team access'],

              highlight: true
            },
            {
              id: 'enterprise',
              name: 'Enterprise',
              price: 'Custom',
              features: [
              'Dedicated manager',
              'Custom integrations',
              'SLA guarantee',
              'SSO']

            }].
            map((plan) =>
            <Card
              key={plan.id}
              variant="elevated"
              padding="lg"
              className={`relative flex flex-col ${profile.plan === plan.id ? 'ring-2 ring-blue-500 bg-blue-50/50' : ''} ${plan.highlight && profile.plan !== plan.id ? 'ring-2 ring-orange-400 shadow-lg shadow-orange-100/50' : ''}`}>

                  {profile.plan === plan.id &&
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-full shadow-sm">
                      Current Plan
                    </div>
              }
                  {plan.highlight && profile.plan !== plan.id &&
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold rounded-full shadow-lg">
                      Most Popular
                    </div>
              }
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-slate-900">
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-3xl font-bold text-slate-900">
                        {plan.price}
                      </span>
                      {plan.price !== 'Custom' &&
                  <span className="text-slate-500">/mo</span>
                  }
                    </div>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature, i) =>
                <li
                  key={i}
                  className="flex items-center gap-2 text-sm text-slate-600">

                        <CheckIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        {feature}
                      </li>
                )}
                  </ul>
                  <Button
                variant={
                profile.plan === plan.id ?
                'secondary' :
                plan.highlight ?
                'primary' :
                'secondary'
                }
                disabled={profile.plan === plan.id}
                onClick={() => handleUpgrade(plan.id as any)}
                className="w-full">

                    {getPlanButtonText(plan.id)}
                  </Button>
                </Card>
            )}
            </div>
          }

          {/* ==================== BRAND PROFILE TAB ==================== */}
          {activeTab === 'brand' &&
          <div className="space-y-8 max-w-3xl">
              {/* Logo & Company */}
              <Card variant="elevated" padding="lg">
                <h3 className="text-lg font-semibold text-slate-900 mb-1">
                  Company Identity
                </h3>
                <p className="text-sm text-slate-500 mb-6">
                  Your brand identity is used across all generated ads.
                </p>
                <div className="flex items-start gap-6 mb-6">
                  <div className="w-24 h-24 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all group">
                    <ImageIcon className="w-6 h-6 text-slate-400 group-hover:text-blue-500 transition-colors" />
                    <span className="text-[10px] text-slate-400 mt-1 group-hover:text-blue-500">
                      Upload logo
                    </span>
                  </div>
                  <div className="flex-1 space-y-4">
                    <Input
                    label="Company Name"
                    value={brandForm.companyName}
                    onChange={(e) =>
                    setBrandForm({
                      ...brandForm,
                      companyName: e.target.value
                    })
                    } />

                  </div>
                </div>
              </Card>

              {/* Brand Colors */}
              <Card variant="elevated" padding="lg">
                <h3 className="text-lg font-semibold text-slate-900 mb-1">
                  Brand Colors
                </h3>
                <p className="text-sm text-slate-500 mb-6">
                  These colors will be applied to generated ad creatives.
                </p>
                <div className="grid grid-cols-3 gap-6">
                  {[
                {
                  label: 'Primary',
                  key: 'primaryColor' as const
                },
                {
                  label: 'Secondary',
                  key: 'secondaryColor' as const
                },
                {
                  label: 'Accent',
                  key: 'accentColor' as const
                }].
                map((color) =>
                <div key={color.key}>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {color.label}
                      </label>
                      <div className="flex items-center gap-3">
                        <div
                      className="w-10 h-10 rounded-lg border border-slate-200 shadow-inner flex-shrink-0"
                      style={{
                        backgroundColor: brandForm[color.key]
                      }} />

                        <input
                      type="text"
                      value={brandForm[color.key]}
                      onChange={(e) =>
                      setBrandForm({
                        ...brandForm,
                        [color.key]: e.target.value
                      })
                      }
                      className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />

                      </div>
                    </div>
                )}
                </div>
              </Card>

              {/* Brand Voice */}
              <Card variant="elevated" padding="lg">
                <h3 className="text-lg font-semibold text-slate-900 mb-1">
                  Brand Voice & Tone
                </h3>
                <p className="text-sm text-slate-500 mb-6">
                  AI will match this tone when generating ad copy.
                </p>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {toneOptions.map((tone) =>
                <button
                  key={tone.value}
                  onClick={() =>
                  setBrandForm({
                    ...brandForm,
                    tone: tone.value
                  })
                  }
                  className={`p-4 rounded-xl border text-left transition-all ${brandForm.tone === tone.value ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200 hover:border-slate-300'}`}>

                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm text-slate-900">
                          {tone.label}
                        </span>
                        {brandForm.tone === tone.value &&
                    <CheckIcon className="w-4 h-4 text-blue-600" />
                    }
                      </div>
                      <p className="text-xs text-slate-500">{tone.desc}</p>
                    </button>
                )}
                </div>
                <Textarea
                label="Brand Guidelines"
                placeholder="Describe your brand's dos and don'ts for ad copy..."
                rows={4}
                value={brandForm.guidelines}
                onChange={(e) =>
                setBrandForm({
                  ...brandForm,
                  guidelines: e.target.value
                })
                } />

              </Card>

              <div className="flex justify-end">
                <Button leftIcon={<CheckIcon className="w-4 h-4" />}>
                  Save Brand Settings
                </Button>
              </div>
            </div>
          }

          {/* ==================== INTEGRATIONS TAB ==================== */}
          {activeTab === 'integrations' &&
          <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Connected Platforms
                  </h3>
                  <p className="text-sm text-slate-500">
                    {integrations.filter((i) => i.connected).length} of{' '}
                    {integrations.length} integrations active
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {integrations.map((integration) =>
              <Card
                key={integration.id}
                variant="elevated"
                padding="md"
                className="flex items-start gap-4">

                    <div
                  className={`w-11 h-11 rounded-xl ${integration.color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>

                      {integration.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="font-semibold text-slate-900 text-sm">
                          {integration.name}
                        </h4>
                        {integration.connected ?
                    <Badge variant="success" className="text-[10px]">
                            Connected
                          </Badge> :

                    <Badge variant="default" className="text-[10px]">
                            Not connected
                          </Badge>
                    }
                      </div>
                      <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                        {integration.description}
                      </p>
                      {integration.connected ?
                  <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400 truncate">
                            {integration.accountName}
                          </span>
                          <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 text-xs"
                      onClick={() => handleDisconnect(integration.id)}>

                            Disconnect
                          </Button>
                        </div> :

                  <Button
                    variant="secondary"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleConnect(integration.id)}
                    disabled={connectingId === integration.id}>

                          {connectingId === integration.id ?
                    <>
                              <Loader2Icon className="w-3 h-3 animate-spin mr-1" />
                              Connecting...
                            </> :

                    <>
                              <LinkIcon className="w-3 h-3 mr-1" />
                              Connect
                            </>
                    }
                        </Button>
                  }
                    </div>
                  </Card>
              )}
              </div>
            </div>
          }

          {/* ==================== NOTIFICATIONS TAB ==================== */}
          {activeTab === 'notifications' &&
          <div className="space-y-8 max-w-3xl">
              {/* Channel Master Toggles */}
              <Card variant="elevated" padding="lg">
                <h3 className="text-lg font-semibold text-slate-900 mb-1">
                  Notification Channels
                </h3>
                <p className="text-sm text-slate-500 mb-6">
                  Enable or disable entire notification channels.
                </p>
                <div className="grid grid-cols-3 gap-4">
                  {[
                {
                  key: 'email' as const,
                  label: 'Email',
                  desc: 'alex@acme.inc',
                  icon: MailIcon,
                  color: 'bg-blue-50 text-blue-600'
                },
                {
                  key: 'inApp' as const,
                  label: 'In-App',
                  desc: 'Browser notifications',
                  icon: SmartphoneIcon,
                  color: 'bg-purple-50 text-purple-600'
                },
                {
                  key: 'slack' as const,
                  label: 'Slack',
                  desc: '#marketing-ads',
                  icon: HashIcon,
                  color: 'bg-emerald-50 text-emerald-600'
                }].
                map((channel) =>
                <div
                  key={channel.key}
                  className={`p-4 rounded-xl border transition-all ${channelMasters[channel.key] ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50 opacity-60'}`}>

                      <div className="flex items-center justify-between mb-3">
                        <div
                      className={`w-9 h-9 rounded-lg ${channel.color} flex items-center justify-center`}>

                          <channel.icon className="w-4.5 h-4.5" />
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={channelMasters[channel.key]}
                        onChange={() =>
                        setChannelMasters((prev) => ({
                          ...prev,
                          [channel.key]: !prev[channel.key]
                        }))
                        } />

                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                        </label>
                      </div>
                      <h4 className="font-medium text-slate-900 text-sm">
                        {channel.label}
                      </h4>
                      <p className="text-xs text-slate-500">{channel.desc}</p>
                    </div>
                )}
                </div>
              </Card>

              {/* Granular Controls */}
              <Card variant="elevated" padding="lg">
                <h3 className="text-lg font-semibold text-slate-900 mb-1">
                  Notification Preferences
                </h3>
                <p className="text-sm text-slate-500 mb-6">
                  Fine-tune which notifications you receive per channel.
                </p>

                {/* Column Headers */}
                <div className="flex items-center mb-4 pb-3 border-b border-slate-100">
                  <div className="flex-1" />
                  <div className="flex items-center gap-6 pr-1">
                    <span className="w-14 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Email
                    </span>
                    <span className="w-14 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      In-App
                    </span>
                    <span className="w-14 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Slack
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  {notifications.map((item) =>
                <div
                  key={item.id}
                  className="flex items-center py-3 border-b border-slate-50 last:border-0">

                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <item.icon className="w-4.5 h-4.5 text-slate-500" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-medium text-slate-900 text-sm">
                            {item.title}
                          </h4>
                          <p className="text-xs text-slate-500 truncate">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 pr-1">
                        {(['email', 'inApp', 'slack'] as const).map(
                      (channel) =>
                      <div
                        key={channel}
                        className="w-14 flex justify-center">

                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={
                            item[channel] && channelMasters[channel]
                            }
                            disabled={!channelMasters[channel]}
                            onChange={() =>
                            toggleNotification(item.id, channel)
                            } />

                                <div
                            className={`w-9 h-5 rounded-full peer after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white ${!channelMasters[channel] ? 'bg-slate-100 cursor-not-allowed' : 'bg-slate-200 peer-checked:bg-blue-600 peer-focus:ring-2 peer-focus:ring-blue-300'}`} />

                              </label>
                            </div>

                    )}
                      </div>
                    </div>
                )}
                </div>
              </Card>
            </div>
          }
        </div>
      </main>
    </div>);

}