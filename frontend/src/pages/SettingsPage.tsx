// SettingsPage — Swiss/Linear editorial theme
import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSocialConnectionStatus, useConnectSocialPlatform, useDisconnectSocialPlatform } from '../hooks/useSocialConnection';
import { AppShell } from '../components/layout/AppShell';
import { useCompany } from '../contexts/CompanyContext';
import { siFacebook, siTiktok, siYoutube, siGoogle, siHubspot, siZapier, siInstagram } from 'simple-icons';


// Manual paths for brands not in this simple-icons version
const SLACK_PATH = 'M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z';
const LINKEDIN_PATH = 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z';

const BRAND_ICON_MAP: Record<string, { path: string; color: string }> = {
  meta:     { path: siFacebook.path,   color: '#1877F2' },
  tiktok:   { path: siTiktok.path,     color: '#010101' },
  youtube:  { path: siYoutube.path,    color: '#FF0000' },
  linkedin: { path: LINKEDIN_PATH,     color: '#0A66C2' },
  google:   { path: siGoogle.path,     color: '#4285F4' },
  slack:    { path: SLACK_PATH,        color: '#4A154B' },
  hubspot:  { path: siHubspot.path,    color: '#FF7A59' },
  zapier:   { path: siZapier.path,     color: '#FF4F00' },
  instagram:{ path: siInstagram.path,  color: '#E4405F' },
};

function BrandIcon({ id, size = 20 }: { id: string; size?: number }) {
  const icon = BRAND_ICON_MAP[id];
  if (!icon) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="#fff"
      aria-label={id}
      style={{ display: 'block', flexShrink: 0 }}
    >
      <path d={icon.path} />
    </svg>
  );
}


type TabKey = 'billing' | 'plans' | 'brand' | 'integrations' | 'notifications';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  connected: boolean;
  comingSoon?: boolean;
  accountName?: string;
}

type NotifIcon = 'zap' | 'shield' | 'clock' | 'dollar' | 'users' | 'settings';

interface NotificationSetting {
  id: string;
  title: string;
  desc: string;
  icon: NotifIcon;
  email: boolean;
  inApp: boolean;
  slack: boolean;
}


const initialIntegrations: Integration[] = [
  { id: 'meta', name: 'Meta (Facebook/Instagram)', description: 'Publish and manage ads across Facebook and Instagram.', icon: 'M', color: '#1877F2', connected: false },
  { id: 'tiktok', name: 'TikTok Ads', description: 'Create and deploy short-form video ad campaigns.', icon: 'T', color: '#010101', connected: false },
  { id: 'youtube', name: 'YouTube Ads', description: 'Run video ads and bumper campaigns on YouTube.', icon: 'Y', color: '#FF0000', connected: false, comingSoon: true },
  { id: 'linkedin', name: 'LinkedIn Ads', description: 'Target professionals with sponsored content and InMail.', icon: 'in', color: '#0A66C2', connected: false, comingSoon: true },
  { id: 'google', name: 'Google Ads', description: 'Search, display, and Performance Max campaigns.', icon: 'G', color: '#34A853', connected: false, comingSoon: true },
  { id: 'slack', name: 'Slack', description: 'Get campaign alerts and approvals in your Slack channels.', icon: 'S', color: '#4A154B', connected: false, comingSoon: true },
  { id: 'hubspot', name: 'HubSpot', description: 'Sync contacts and audience data from your CRM.', icon: 'H', color: '#FF7A59', connected: false, comingSoon: true },
  { id: 'zapier', name: 'Zapier', description: 'Connect Ad-gentic to 5,000+ apps with automations.', icon: 'Z', color: '#FF4A00', connected: false, comingSoon: true },
];

const toneOptions = [
  { value: 'professional', label: 'Professional', desc: 'Polished, authoritative, trustworthy' },
  { value: 'casual', label: 'Casual', desc: 'Friendly, approachable, conversational' },
  { value: 'bold', label: 'Bold', desc: 'Confident, direct, attention-grabbing' },
  { value: 'playful', label: 'Playful', desc: 'Fun, witty, lighthearted' },
];

const initialNotifications: NotificationSetting[] = [
  { id: 'campaigns', title: 'Campaign Updates', desc: 'Approvals, launches, pauses, and status changes.', icon: 'zap', email: true, inApp: true, slack: true },
  { id: 'personas', title: 'Persona Insights', desc: 'New audience segments discovered by AI.', icon: 'shield', email: true, inApp: true, slack: false },
  { id: 'weekly', title: 'Weekly Performance Report', desc: 'Summary of ad performance delivered every Monday.', icon: 'clock', email: true, inApp: false, slack: false },
  { id: 'budget', title: 'Budget Alerts', desc: 'Warnings when spend approaches or exceeds limits.', icon: 'dollar', email: true, inApp: true, slack: true },
  { id: 'team', title: 'Team Activity', desc: 'When teammates create, edit, or approve campaigns.', icon: 'users', email: false, inApp: true, slack: true },
  { id: 'system', title: 'System Updates', desc: 'New features, maintenance, and platform announcements.', icon: 'settings', email: true, inApp: true, slack: false },
];

const TABS: { key: TabKey; label: string }[] = [
  { key: 'billing', label: 'Billing & History' },
  { key: 'plans', label: 'Plans' },
  { key: 'brand', label: 'Brand Profile' },
  { key: 'integrations', label: 'Integrations' },
  { key: 'notifications', label: 'Notifications' },
];


function CheckIcon() {
  return (
    <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={9} height={9}>
      <path d="M1.5 5l2.5 2.5L8.5 2" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" width={11} height={11}>
      <path d="M2 2l8 8M10 2L2 10" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" width={18} height={18}>
      <rect x="2" y="5" width="16" height="12" />
      <path d="M2 9h16" />
    </svg>
  );
}

function ReceiptIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" width={22} height={22}>
      <path d="M5 2h10v16l-2-1.5L11 18l-1-1.5L9 18l-1-1.5L6 18l-2-1.5V2z" />
      <path d="M8 7h4M8 10h4M8 13h2" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width={13} height={13}>
      <path d="M7 9V3M5 5l2-2 2 2" />
      <path d="M2 11h10" />
    </svg>
  );
}

function PlugIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" width={22} height={22}>
      <path d="M7 2v4M13 2v4M5 6h10l-1 6H6L5 6zM8 12v4M12 12v4" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width={13} height={13} style={{ animation: 'as-spin 0.8s linear infinite' }}>
      <circle cx="8" cy="8" r="6" strokeDasharray="18 8" />
    </svg>
  );
}

function NotifIconSvg({ type }: { type: NotifIcon }) {
  const props = { viewBox: '0 0 14 14', fill: 'none', stroke: 'currentColor', strokeWidth: '1.5', strokeLinecap: 'round' as const, width: 12, height: 12 };
  switch (type) {
    case 'zap': return <svg {...props}><path d="M8 1L3 8h5l-2 5 6-7H7l1-5z" /></svg>;
    case 'shield': return <svg {...props}><path d="M7 1L2 3v4c0 3 2.5 5.5 5 6 2.5-.5 5-3 5-6V3L7 1z" /></svg>;
    case 'clock': return <svg {...props} strokeLinejoin="round"><circle cx="7" cy="7" r="5.5" /><path d="M7 4v3l2 1.5" /></svg>;
    case 'dollar': return <svg {...props}><path d="M7 1v12M4 4h4.5a2 2 0 010 4H4.5a2 2 0 000 4H9" /></svg>;
    case 'users': return <svg {...props}><circle cx="5" cy="5" r="2.5" /><path d="M1 12c0-2.2 1.8-4 4-4s4 1.8 4 4M10 4c1.1 0 2 .9 2 2s-.9 2-2 2M13 12c0-1.5-1-2.8-2.5-3.3" /></svg>;
    case 'settings': return <svg {...props} strokeLinejoin="round"><circle cx="7" cy="7" r="2" /><path d="M7 1v2M7 11v2M1 7h2M11 7h2M3.2 3.2l1.4 1.4M9.4 9.4l1.4 1.4M9.4 4.6L8 6M5.4 8l-1.4 1.4" /></svg>;
  }
}


function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      className={`stg-toggle${checked ? ' on' : ''}`}
      onClick={onChange}
    >
      <span className="stg-toggle-thumb" />
    </button>
  );
}


export function SettingsPage() {
  const { profile, updateProfile } = useCompany();
  const location = useLocation();
  const navigate = useNavigate();
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<TabKey>('billing');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [oauthFeedback, setOauthFeedback] = useState<
    { kind: 'connected'; platform: string }
    | { kind: 'error'; reason: string }
    | null
  >(null);

  const cardKey = `card-info-${profile.email}`;
  const [savedCard, setSavedCard] = useState<{ last4: string; brand: string; expiry: string; name: string; address: string; city: string; state: string; zip: string; country: string } | null>(() => {
    try { const s = localStorage.getItem(`card-info-${profile.email}`); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [showCardModal, setShowCardModal] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<'basic' | 'premium' | 'enterprise' | null>(null);
  const [cardForm, setCardForm] = useState({ number: '', expiry: '', cvv: '', name: '', address: '', city: '', state: '', zip: '', country: '' });
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({});

  // Brand — persisted per user email
  const brandKey = `brand-settings-${profile.email}`;
  const configuredKey = `brand-configured-${profile.email}`;

  const [brandConfigured, setBrandConfigured] = useState(() => {
    try { return localStorage.getItem(configuredKey) === 'true'; } catch { return false; }
  });
  const [brandSaving, setBrandSaving] = useState(false);
  const [brandSaved, setBrandSaved] = useState(false);

  const [logoPreview, setLogoPreview] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(brandKey);
      return saved ? (JSON.parse(saved).logoPreview ?? null) : null;
    } catch { return null; }
  });

  const [brandForm, setBrandForm] = useState(() => {
    const defaults = { companyName: profile.companyName, primaryColor: '#3B82F6', secondaryColor: '#1E293B', accentColor: '#10B981', tone: 'professional', guidelines: '' };
    try {
      const saved = localStorage.getItem(brandKey);
      if (saved) { const p = JSON.parse(saved); return { ...defaults, ...p, companyName: p.companyName ?? profile.companyName }; }
    } catch { /* ignore */ }
    return defaults;
  });

  const { data: socialStatus = [] } = useSocialConnectionStatus();
  const connectMeta = useConnectSocialPlatform();
  const disconnectMeta = useDisconnectSocialPlatform();

  const integrationPlatformMap: Record<string, string> = {
    meta: 'instagram', tiktok: 'tiktok', youtube: 'youtube', linkedin: 'linkedin',
    google: 'google', slack: 'slack', hubspot: 'hubspot', zapier: 'zapier',
  };
  const statusByPlatform = new Map(socialStatus.map((s) => [s.platform, s]));
  const integrations = initialIntegrations.map((int) => {
    const liveStatus = statusByPlatform.get(integrationPlatformMap[int.id]);
    if (!liveStatus) return int;
    return { ...int, connected: liveStatus.connected, accountName: liveStatus.platform_account_id ?? undefined };
  });
  const connectedCount = integrations.filter((i) => i.connected).length;

  const [notifications, setNotifications] = useState(initialNotifications);
  const [channelMasters, setChannelMasters] = useState({ email: true, inApp: true, slack: true });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && TABS.some((t) => t.key === tab)) setActiveTab(tab as TabKey);
    const connectedPlatform = params.get('connected');
    const errorReason = params.get('error');
    if (connectedPlatform) {
      setOauthFeedback({ kind: 'connected', platform: connectedPlatform });
      setTimeout(() => setOauthFeedback(null), 4000);
    } else if (errorReason) {
      setOauthFeedback({ kind: 'error', reason: errorReason });
      setTimeout(() => setOauthFeedback(null), 6000);
    }
    if (connectedPlatform || errorReason) {
      params.delete('connected');
      params.delete('error');
      navigate(`${location.pathname}${params.toString() ? `?${params}` : ''}`, { replace: true });
    }
  }, [location.pathname, location.search, navigate]);

  const platformDisplayName = (platform: string): string => {
    if (platform === 'instagram') return 'Meta';
    if (platform === 'tiktok') return 'TikTok';
    return platform;
  };

  const oauthErrorMessage = (reason: string): string => {
    switch (reason) {
      case 'oauth_failed':
        return 'We couldn’t complete the connection. Try again, or check your account permissions.';
      case 'oauth_missing_params':
        return 'The provider returned an incomplete response. Try connecting again.';
      case 'oauth_no_advertisers':
        return 'No advertiser accounts were granted. Re-authorize and pick at least one ad account.';
      default:
        return 'Connection failed. Please try again.';
    }
  };

  const handleUpgrade = (plan: 'basic' | 'premium' | 'enterprise') => {
    if (plan !== 'basic' && !savedCard) {
      setPendingPlan(plan);
      setShowCardModal(true);
      return;
    }
    setShowSuccess(true);
    setTimeout(() => { updateProfile({ plan }); setShowSuccess(false); }, 2000);
  };

  const handleCardSubmit = () => {
    const errs: Record<string, string> = {};
    const raw = cardForm.number.replace(/\s/g, '');
    if (raw.length < 15) errs.number = 'Enter a valid card number';
    const parts = cardForm.expiry.split('/');
    if (parts.length !== 2 || parts[0].length !== 2 || parts[1].length !== 2) errs.expiry = 'Use MM/YY format';
    if (cardForm.cvv.length < 3) errs.cvv = 'Enter a valid CVV';
    if (!cardForm.name.trim()) errs.name = 'Name is required';
    if (!cardForm.address.trim()) errs.address = 'Address is required';
    if (!cardForm.city.trim()) errs.city = 'City is required';
    if (!cardForm.zip.trim()) errs.zip = 'ZIP / postal code is required';
    if (!cardForm.country.trim()) errs.country = 'Country is required';
    if (Object.keys(errs).length > 0) { setCardErrors(errs); return; }
    const brand = raw[0] === '4' ? 'Visa' : raw[0] === '5' ? 'Mastercard' : raw[0] === '3' ? 'Amex' : 'Card';
    const card = { last4: raw.slice(-4), brand, expiry: cardForm.expiry, name: cardForm.name.trim(), address: cardForm.address.trim(), city: cardForm.city.trim(), state: cardForm.state.trim(), zip: cardForm.zip.trim(), country: cardForm.country.trim() };
    try { localStorage.setItem(cardKey, JSON.stringify(card)); } catch { /* ignore */ }
    setSavedCard(card);
    setShowCardModal(false);
    setCardForm({ number: '', expiry: '', cvv: '', name: '', address: '', city: '', state: '', zip: '', country: '' });
    setCardErrors({});
    if (pendingPlan) {
      const plan = pendingPlan;
      setPendingPlan(null);
      setShowSuccess(true);
      setTimeout(() => { updateProfile({ plan }); setShowSuccess(false); }, 2000);
    }
  };

  const getPlanButtonText = (planId: string) => {
    if (profile.plan === planId) return 'Current Plan';
    return ['basic', 'premium', 'enterprise'].indexOf(profile.plan) < ['basic', 'premium', 'enterprise'].indexOf(planId) ? 'Upgrade' : 'Downgrade';
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSaveBrand = () => {
    setBrandSaving(true);
    setTimeout(() => {
      updateProfile({ companyName: brandForm.companyName });
      let persisted = false;
      try {
        localStorage.setItem(brandKey, JSON.stringify({ ...brandForm, logoPreview }));
        localStorage.setItem(configuredKey, 'true');
        persisted = true;
      } catch { /* storage full */ }
      setBrandSaving(false);
      if (persisted) { setBrandSaved(true); setBrandConfigured(true); setTimeout(() => setBrandSaved(false), 3000); }
    }, 1200);
  };

  return (
    <AppShell>
      <div className="as-main">
        <div className="as-canvas">

          {/* Header */}
          <div className="as-page-head">
            <div>
              <span className="as-eyebrow">— SETTINGS</span>
              <h1>Settings & Billing</h1>
            </div>
          </div>

          {/* OAuth feedback toast (top-right) — editorial style */}
          {oauthFeedback && (
            <div
              role="status"
              style={{
                position: 'fixed', top: 20, right: 20, zIndex: 1000, maxWidth: 380,
                padding: '12px 16px',
                border: `1px solid ${oauthFeedback.kind === 'connected' ? 'var(--as-rule-strong)' : 'rgba(185,28,28,0.45)'}`,
                background: 'var(--as-bg)',
                fontSize: 13,
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              }}
            >
              {oauthFeedback.kind === 'connected' ? (
                <>
                  <div style={{ fontWeight: 600, color: 'var(--as-ink)' }}>
                    {platformDisplayName(oauthFeedback.platform)} connected
                  </div>
                  <div style={{ color: 'var(--as-ink-2)', marginTop: 2 }}>
                    You can now publish campaigns to {platformDisplayName(oauthFeedback.platform)}.
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontWeight: 600, color: 'var(--as-danger, #b91c1c)' }}>
                    Connection failed
                  </div>
                  <div style={{ color: 'var(--as-ink-2)', marginTop: 2 }}>
                    {oauthErrorMessage(oauthFeedback.reason)}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Tab bar */}
          <div className="stg-tabs">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                className={`stg-tab${activeTab === tab.key ? ' on' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ══ BILLING TAB ══ */}
          {activeTab === 'billing' && (
            <div>
              <div className="stg-billing-grid">
                {/* Current plan + payment */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div>
                      <div className="stg-section-head">Current Plan</div>
                      {profile.plan !== 'basic' && <div className="stg-section-sub" style={{ marginBottom: 0 }}>Renews March 12, 2026</div>}
                    </div>
                    <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', border: '1px solid var(--as-rule-strong)', padding: '3px 10px', color: 'var(--as-ink-2)' }}>
                      {profile.plan} plan
                    </span>
                  </div>

                  {savedCard ? (
                    <div className="stg-payment-row">
                      <div className="stg-payment-icon"><CardIcon /></div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--as-ink)' }}>{savedCard.brand} ending in {savedCard.last4}</div>
                        <div style={{ fontSize: 11, color: 'var(--as-ink-3)', fontFamily: "'Geist Mono', monospace" }}>
                          Expires {savedCard.expiry}{savedCard.name ? ` · ${savedCard.name}` : ''}
                        </div>
                        {savedCard.address && (
                          <div style={{ fontSize: 11, color: 'var(--as-ink-3)', marginTop: 2 }}>
                            {savedCard.address}, {savedCard.city}{savedCard.state ? `, ${savedCard.state}` : ''} {savedCard.zip}{savedCard.country ? ` · ${savedCard.country}` : ''}
                          </div>
                        )}
                      </div>
                      <button className="as-btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => setShowCardModal(true)}>Update</button>
                    </div>
                  ) : (
                    <div className="stg-payment-row">
                      <div className="stg-payment-icon" style={{ opacity: 0.4 }}><CardIcon /></div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: 'var(--as-ink-3)' }}>No payment method on file</div>
                        <div style={{ fontSize: 11, color: 'var(--as-ink-3)', fontFamily: "'Geist Mono', monospace" }}>Required for paid plans</div>
                      </div>
                      {profile.plan !== 'basic' && (
                        <button className="as-btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => setShowCardModal(true)}>Add Card</button>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="as-btn-ghost" style={{ padding: '8px 16px', fontSize: 12 }} onClick={() => setActiveTab('plans')}>
                      Change Plan
                    </button>
                    {profile.plan !== 'basic' && (
                      <button
                        onClick={() => setShowCancelModal(true)}
                        style={{ padding: '8px 16px', fontSize: 12, background: 'none', border: '1px solid rgba(185,28,28,0.3)', color: 'var(--as-danger)', cursor: 'pointer', fontFamily: 'inherit' }}
                      >
                        Cancel Subscription
                      </button>
                    )}
                  </div>
                </div>

                {/* Usage */}
                <div style={{ borderLeft: '1px solid var(--as-rule)' }}>
                  <div className="stg-section-head" style={{ marginBottom: 20 }}>Usage</div>
                  {[
                    { label: 'Generations', value: '84 / 100', pct: 84 },
                    { label: 'Storage', value: '2.1 GB / 5 GB', pct: 42 },
                    { label: 'Team Members', value: '3 / 5', pct: 60 },
                  ].map((item) => (
                    <div key={item.label} className="stg-usage-item">
                      <div className="stg-usage-labels"><span>{item.label}</span><span>{item.value}</span></div>
                      <div className="stg-usage-track">
                        <div className="stg-usage-fill" style={{ width: `${item.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Billing history */}
              <div style={{ border: '1px solid var(--as-rule)' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--as-rule)', fontSize: 13, fontWeight: 500 }}>
                  Billing History
                </div>
                {profile.plan === 'basic' ? (
                  <div className="stg-empty">
                    <div className="stg-empty-icon"><ReceiptIcon /></div>
                    <h4>No invoices yet</h4>
                    <p>You're on the free plan. Upgrade to Premium to unlock invoices and detailed billing history.</p>
                    <button className="as-btn-solid" style={{ padding: '9px 18px' }} onClick={() => setActiveTab('plans')}>
                      View Plans
                    </button>
                  </div>
                ) : (
                  <table className="stg-invoice-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Plan</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Invoice</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { date: 'Feb 12, 2026', plan: 'Premium Plan', amount: '$99.00' },
                        { date: 'Jan 12, 2026', plan: 'Premium Plan', amount: '$99.00' },
                        { date: 'Dec 12, 2025', plan: 'Premium Plan', amount: '$99.00' },
                      ].map((item, i) => (
                        <tr key={i}>
                          <td style={{ color: 'var(--as-ink)', fontWeight: 500 }}>{item.date}</td>
                          <td>{item.plan}</td>
                          <td style={{ color: 'var(--as-ink)', fontWeight: 500 }}>{item.amount}</td>
                          <td><span className="stg-invoice-paid">Paid</span></td>
                          <td style={{ textAlign: 'right' }}>
                            <button style={{ fontSize: 11, color: 'var(--as-ink-3)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                              Download
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ══ PLANS TAB ══ */}
          {activeTab === 'plans' && (
            <div className="stg-plans-grid">
              {[
                { id: 'basic', name: 'Basic', price: '$0', period: 'Free forever', features: ['3 campaigns', 'Basic analytics', 'Email support'] },
                { id: 'premium', name: 'Premium', price: '$99', period: 'per month', features: ['Unlimited campaigns', 'Advanced analytics', 'Priority support', 'Team access'], highlight: true },
                { id: 'enterprise', name: 'Enterprise', price: 'Custom', period: 'contact sales', features: ['Dedicated manager', 'Custom integrations', 'SLA guarantee', 'SSO'] },
              ].map((plan) => (
                <div key={plan.id} className={`stg-plan-card${profile.plan === plan.id ? ' current' : ''}`}>
                  {(profile.plan === plan.id || (plan.highlight && profile.plan !== plan.id)) && (
                    <div className="stg-plan-badge">
                      {profile.plan === plan.id ? 'Current Plan' : 'Most Popular'}
                    </div>
                  )}
                  <div className="stg-plan-name">{plan.name}</div>
                  <div className="stg-plan-price">{plan.price}</div>
                  <div className="stg-plan-period">{plan.period}</div>
                  <ul className="stg-plan-features">
                    {plan.features.map((f) => (
                      <li key={f} className="stg-plan-feature">
                        <span className="stg-plan-feature-check"><CheckIcon /></span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    className={profile.plan === plan.id ? 'as-btn-ghost' : 'as-btn-solid'}
                    disabled={profile.plan === plan.id}
                    onClick={() => handleUpgrade(plan.id as 'basic' | 'premium' | 'enterprise')}
                    style={{ width: '100%', padding: '10px', justifyContent: 'center' }}
                  >
                    {getPlanButtonText(plan.id)}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ══ BRAND TAB ══ */}
          {activeTab === 'brand' && (
            !brandConfigured ? (
              /* Empty state */
              <div style={{ border: '1px solid var(--as-rule)' }}>
                <div className="stg-empty">
                  <div className="stg-empty-icon">
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" width={20} height={20}>
                      <circle cx="10" cy="10" r="8" />
                      <path d="M10 6v4l2.5 2.5" />
                    </svg>
                  </div>
                  <h4>Your brand profile isn't set up yet</h4>
                  <p>Add your logo, brand colors, and voice so Ad-gentic can generate ads that look and sound exactly like you.</p>
                  <button className="as-btn-solid" style={{ padding: '9px 18px' }} onClick={() => setBrandConfigured(true)}>
                    Set Up Brand Profile
                  </button>
                </div>
                <div style={{ borderTop: '1px solid var(--as-rule)', padding: '14px 24px', display: 'flex', justifyContent: 'center', gap: 32 }}>
                  {['Logo upload', 'Brand colors', 'AI voice & tone'].map((label) => (
                    <span key={label} style={{ fontSize: 11, color: 'var(--as-ink-3)', fontFamily: "'Geist Mono', monospace", letterSpacing: '0.06em' }}>
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              /* Brand form */
              <div style={{ maxWidth: 680 }}>
                {brandSaved && (
                  <div className="stg-toast ok">
                    <CheckIcon /> Brand profile saved successfully.
                  </div>
                )}

                {/* Company identity */}
                <div className="stg-section">
                  <div className="stg-section-head">Company Identity</div>
                  <div className="stg-section-sub">Your brand identity is used across all generated ads.</div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 0 }}>
                    <input ref={logoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
                    {logoPreview ? (
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <img src={logoPreview} alt="Brand logo" className="stg-logo-img" onClick={() => logoInputRef.current?.click()} />
                        <button
                          onClick={(e) => { e.stopPropagation(); setLogoPreview(null); if (logoInputRef.current) logoInputRef.current.value = ''; }}
                          style={{ position: 'absolute', top: 4, right: 4, width: 18, height: 18, background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center', color: '#fff' }}
                        >
                          <XIcon />
                        </button>
                      </div>
                    ) : (
                      <div className="stg-logo-drop" onClick={() => logoInputRef.current?.click()}>
                        <UploadIcon />
                        <div className="stg-logo-drop-label">Upload<br />logo</div>
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <label className="stg-label">Company Name</label>
                      <input
                        className="stg-input"
                        type="text"
                        value={brandForm.companyName}
                        onChange={(e) => setBrandForm({ ...brandForm, companyName: e.target.value })}
                        placeholder="e.g. Acme Inc."
                      />
                    </div>
                  </div>
                </div>

                {/* Brand colors */}
                <div className="stg-section">
                  <div className="stg-section-head">Brand Colors</div>
                  <div className="stg-section-sub">These colors will be applied to generated ad creatives.</div>
                  <div className="stg-colors-grid">
                    {[
                      { label: 'Primary', key: 'primaryColor' as const },
                      { label: 'Secondary', key: 'secondaryColor' as const },
                      { label: 'Accent', key: 'accentColor' as const },
                    ].map((c) => (
                      <div key={c.key} className="stg-color-cell">
                        <label className="stg-label">{c.label}</label>
                        <div className="stg-color-swatch" style={{ backgroundColor: brandForm[c.key] }} onClick={() => (document.getElementById(`cp-${c.key}`) as HTMLInputElement)?.click()}>
                          <input id={`cp-${c.key}`} type="color" value={brandForm[c.key]} onChange={(e) => setBrandForm({ ...brandForm, [c.key]: e.target.value })} />
                        </div>
                        <input className="stg-color-hex" type="text" value={brandForm[c.key]} onChange={(e) => setBrandForm({ ...brandForm, [c.key]: e.target.value })} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Brand voice */}
                <div className="stg-section">
                  <div className="stg-section-head">Brand Voice & Tone</div>
                  <div className="stg-section-sub">AI will match this tone when generating ad copy.</div>
                  <div className="stg-tones-grid">
                    {toneOptions.map((tone) => (
                      <button
                        key={tone.value}
                        className={`stg-tone-btn${brandForm.tone === tone.value ? ' on' : ''}`}
                        onClick={() => setBrandForm({ ...brandForm, tone: tone.value })}
                      >
                        <div>
                          <div className="stg-tone-name">{tone.label}</div>
                          <div className="stg-tone-desc">{tone.desc}</div>
                        </div>
                        {brandForm.tone === tone.value && <CheckIcon />}
                      </button>
                    ))}
                  </div>

                  <label className="stg-label">Brand Guidelines</label>
                  <textarea
                    className="stg-input stg-textarea"
                    rows={4}
                    placeholder="Describe your brand's dos and don'ts for ad copy…"
                    value={brandForm.guidelines}
                    onChange={(e) => setBrandForm({ ...brandForm, guidelines: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <button
                    className="as-btn-ghost"
                    style={{ padding: '8px 16px', fontSize: 12 }}
                    onClick={() => { setBrandConfigured(false); localStorage.removeItem(configuredKey); }}
                  >
                    ← Reset
                  </button>
                  <button
                    className="as-btn-solid"
                    style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 8 }}
                    onClick={handleSaveBrand}
                    disabled={brandSaving}
                  >
                    {brandSaving ? <><SpinnerIcon /> Saving…</> : <><CheckIcon /> Save Brand</>}
                  </button>
                </div>
              </div>
            )
          )}

          {/* ══ INTEGRATIONS TAB ══ */}
          {activeTab === 'integrations' && (
            <div>
              <div style={{ marginBottom: 20 }}>
                <div className="stg-section-head">Connected Platforms</div>
                <div className="stg-section-sub" style={{ marginBottom: 0 }}>
                  {connectedCount === 0
                    ? 'No integrations connected yet'
                    : `${connectedCount} of ${integrations.length} integrations active`}
                </div>
              </div>

              {connectedCount === 0 && (
                <div style={{ border: '1px solid var(--as-rule)', marginBottom: 20 }}>
                  <div className="stg-empty" style={{ padding: '40px 24px' }}>
                    <div className="stg-empty-icon"><PlugIcon /></div>
                    <h4>Connect your first platform</h4>
                    <p>Push ads directly to your ad channels and get alerts in your tools.</p>
                  </div>
                  <div style={{ borderTop: '1px solid var(--as-rule)', padding: '12px 24px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {initialIntegrations.slice(0, 5).map((int) => (
                      <span key={int.id} style={{ fontSize: 11, color: 'var(--as-ink-3)', border: '1px solid var(--as-rule-strong)', padding: '3px 10px', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 16, height: 16, background: BRAND_ICON_MAP[int.id]?.color ?? int.color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          <BrandIcon id={int.id} size={10} />
                        </span>
                        {int.name.split(' ')[0]}
                      </span>
                    ))}
                    <span style={{ fontSize: 11, color: 'var(--as-ink-3)', border: '1px solid var(--as-rule-strong)', padding: '3px 10px' }}>
                      +{initialIntegrations.length - 5} more
                    </span>
                  </div>
                </div>
              )}

              <div className="stg-integrations-grid">
                {integrations.map((int) => (
                  <div key={int.id} className="stg-int-card">
                    <div className="stg-int-icon" style={{ background: BRAND_ICON_MAP[int.id]?.color ?? int.color }}>
                      <BrandIcon id={int.id} size={20} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="stg-int-name">{int.name}</div>
                      <div className={`stg-int-status${int.connected ? ' connected' : int.comingSoon ? ' soon' : ' none'}`}>
                        {int.connected ? 'Connected' : int.comingSoon ? 'Coming soon' : 'Not connected'}
                      </div>
                      <div className="stg-int-desc">{int.description}</div>
                      {int.connected ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 11, color: 'var(--as-ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{int.accountName}</span>
                          <button
                            onClick={() => disconnectMeta.mutate({ platform: integrationPlatformMap[int.id] ?? int.id })}
                            style={{ fontSize: 11, color: 'var(--as-danger)', background: 'none', border: '1px solid rgba(185,28,28,0.3)', padding: '3px 10px', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, marginLeft: 8 }}
                          >
                            Disconnect
                          </button>
                        </div>
                      ) : int.comingSoon ? (
                        <span style={{ fontSize: 11, color: 'var(--as-ink-3)', fontFamily: "'Geist Mono', monospace" }}>Available soon</span>
                      ) : (
                        <button
                          className="as-btn-ghost"
                          style={{ padding: '5px 12px', fontSize: 11 }}
                          onClick={() => {
                            const platform = integrationPlatformMap[int.id];
                            if (platform && (int.id === 'meta' || int.id === 'tiktok')) {
                              connectMeta.mutate({ platform });
                            }
                          }}
                        >
                          Connect
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ NOTIFICATIONS TAB ══ */}
          {activeTab === 'notifications' && (
            <div style={{ maxWidth: 720 }}>
              {/* Channel masters */}
              <div className="stg-section">
                <div className="stg-section-head">Notification Channels</div>
                <div className="stg-section-sub">Enable or disable entire notification channels.</div>
                <div className="stg-notif-channels">
                  {[
                    { key: 'email' as const, label: 'Email', desc: 'alex@acme.inc', icon: (
                      <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width={12} height={12}>
                        <rect x="1" y="3" width="12" height="9" /><path d="M1 3l6 5 6-5" />
                      </svg>
                    )},
                    { key: 'inApp' as const, label: 'In-App', desc: 'Browser notifications', icon: (
                      <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width={12} height={12}>
                        <rect x="2" y="1" width="10" height="13" rx="0" /><path d="M5 11h4" />
                      </svg>
                    )},
                    { key: 'slack' as const, label: 'Slack', desc: '#marketing-ads', icon: (
                      <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width={12} height={12}>
                        <path d="M6 2v4M8 2v4M2 6h4M2 8h4M8 10v2M6 10v2M10 6h2M10 8h2" />
                      </svg>
                    )},
                  ].map((ch) => (
                    <div key={ch.key} className={`stg-notif-channel${!channelMasters[ch.key] ? ' off' : ''}`}>
                      <div className="stg-notif-channel-top">
                        <div className="stg-notif-channel-icon">{ch.icon}</div>
                        <Toggle
                          checked={channelMasters[ch.key]}
                          onChange={() => setChannelMasters((prev) => ({ ...prev, [ch.key]: !prev[ch.key] }))}
                        />
                      </div>
                      <div className="stg-notif-ch-name">{ch.label}</div>
                      <div className="stg-notif-ch-desc">{ch.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Granular controls */}
              <div className="stg-section">
                <div className="stg-section-head">Notification Preferences</div>
                <div className="stg-section-sub">Fine-tune which notifications you receive per channel.</div>
                <table className="stg-notif-table">
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th className="center">Email</th>
                      <th className="center">In-App</th>
                      <th className="center">Slack</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notifications.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="stg-notif-icon"><NotifIconSvg type={item.icon} /></div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--as-ink)' }}>{item.title}</div>
                              <div style={{ fontSize: 11, color: 'var(--as-ink-3)' }}>{item.desc}</div>
                            </div>
                          </div>
                        </td>
                        {(['email', 'inApp', 'slack'] as const).map((ch) => (
                          <td key={ch} className="center">
                            <Toggle
                              checked={item[ch] && channelMasters[ch]}
                              disabled={!channelMasters[ch]}
                              onChange={() => setNotifications((prev) => prev.map((n) => n.id === item.id ? { ...n, [ch]: !n[ch] } : n))}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Plan-change success overlay */}
      {showSuccess && (
        <div className="as-modal-overlay" style={{ backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--as-bg)', border: '1px solid var(--as-rule-strong)', padding: '40px 48px', textAlign: 'center' }}>
            <div style={{ width: 40, height: 40, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', display: 'grid', placeItems: 'center', margin: '0 auto 16px', color: '#10b981' }}>
              <CheckIcon />
            </div>
            <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--as-ink)', marginBottom: 4 }}>Plan Updated</div>
            <div style={{ fontSize: 12, color: 'var(--as-ink-3)' }}>Your subscription has been changed.</div>
          </div>
        </div>
      )}

      {/* Card input modal */}
      {showCardModal && (
        <div className="as-modal-overlay" onClick={() => { setShowCardModal(false); setPendingPlan(null); setCardErrors({}); }}>
          <div style={{ background: 'var(--as-bg)', border: '1px solid var(--as-rule-strong)', padding: '32px 36px', width: 360 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--as-ink)', marginBottom: 4 }}>
              {pendingPlan ? `Upgrade to ${pendingPlan.charAt(0).toUpperCase() + pendingPlan.slice(1)}` : 'Payment Method'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--as-ink-3)', marginBottom: 24 }}>
              {pendingPlan ? 'Add a payment method to complete your upgrade.' : 'Update your saved payment method.'}
            </div>

            <div style={{ marginBottom: 14 }}>
              <label className="stg-label">Name on Card</label>
              <input
                className="stg-input"
                type="text"
                placeholder="Jane Smith"
                value={cardForm.name}
                onChange={(e) => { setCardForm({ ...cardForm, name: e.target.value }); if (cardErrors.name) setCardErrors({ ...cardErrors, name: '' }); }}
              />
              {cardErrors.name && <div style={{ fontSize: 11, color: 'var(--as-danger)', marginTop: 4 }}>{cardErrors.name}</div>}
            </div>

            <div style={{ marginBottom: 14 }}>
              <label className="stg-label">Card Number</label>
              <input
                className="stg-input"
                type="text"
                placeholder="1234 5678 9012 3456"
                value={cardForm.number}
                maxLength={19}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 16);
                  const formatted = digits.replace(/(.{4})(?=.)/g, '$1 ');
                  setCardForm({ ...cardForm, number: formatted });
                  if (cardErrors.number) setCardErrors({ ...cardErrors, number: '' });
                }}
              />
              {cardErrors.number && <div style={{ fontSize: 11, color: 'var(--as-danger)', marginTop: 4 }}>{cardErrors.number}</div>}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label className="stg-label">Expiry</label>
                <input
                  className="stg-input"
                  type="text"
                  placeholder="MM/YY"
                  value={cardForm.expiry}
                  maxLength={5}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
                    const formatted = digits.length > 2 ? digits.slice(0, 2) + '/' + digits.slice(2) : digits;
                    setCardForm({ ...cardForm, expiry: formatted });
                    if (cardErrors.expiry) setCardErrors({ ...cardErrors, expiry: '' });
                  }}
                />
                {cardErrors.expiry && <div style={{ fontSize: 11, color: 'var(--as-danger)', marginTop: 4 }}>{cardErrors.expiry}</div>}
              </div>
              <div style={{ flex: 1 }}>
                <label className="stg-label">CVV</label>
                <input
                  className="stg-input"
                  type="text"
                  placeholder="123"
                  value={cardForm.cvv}
                  maxLength={4}
                  onChange={(e) => {
                    setCardForm({ ...cardForm, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) });
                    if (cardErrors.cvv) setCardErrors({ ...cardErrors, cvv: '' });
                  }}
                />
                {cardErrors.cvv && <div style={{ fontSize: 11, color: 'var(--as-danger)', marginTop: 4 }}>{cardErrors.cvv}</div>}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--as-rule)', margin: '20px 0 16px', paddingTop: 16, fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--as-ink-3)' }}>
              Billing Address
            </div>

            <div style={{ marginBottom: 14 }}>
              <label className="stg-label">Address</label>
              <input
                className="stg-input"
                type="text"
                placeholder="123 Main St"
                value={cardForm.address}
                onChange={(e) => { setCardForm({ ...cardForm, address: e.target.value }); if (cardErrors.address) setCardErrors({ ...cardErrors, address: '' }); }}
              />
              {cardErrors.address && <div style={{ fontSize: 11, color: 'var(--as-danger)', marginTop: 4 }}>{cardErrors.address}</div>}
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
              <div style={{ flex: 2 }}>
                <label className="stg-label">City</label>
                <input
                  className="stg-input"
                  type="text"
                  placeholder="New York"
                  value={cardForm.city}
                  onChange={(e) => { setCardForm({ ...cardForm, city: e.target.value }); if (cardErrors.city) setCardErrors({ ...cardErrors, city: '' }); }}
                />
                {cardErrors.city && <div style={{ fontSize: 11, color: 'var(--as-danger)', marginTop: 4 }}>{cardErrors.city}</div>}
              </div>
              <div style={{ flex: 1 }}>
                <label className="stg-label">State</label>
                <input
                  className="stg-input"
                  type="text"
                  placeholder="NY"
                  value={cardForm.state}
                  onChange={(e) => setCardForm({ ...cardForm, state: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label className="stg-label">ZIP / Postal Code</label>
                <input
                  className="stg-input"
                  type="text"
                  placeholder="10001"
                  value={cardForm.zip}
                  onChange={(e) => { setCardForm({ ...cardForm, zip: e.target.value }); if (cardErrors.zip) setCardErrors({ ...cardErrors, zip: '' }); }}
                />
                {cardErrors.zip && <div style={{ fontSize: 11, color: 'var(--as-danger)', marginTop: 4 }}>{cardErrors.zip}</div>}
              </div>
              <div style={{ flex: 1 }}>
                <label className="stg-label">Country</label>
                <input
                  className="stg-input"
                  type="text"
                  placeholder="United States"
                  value={cardForm.country}
                  onChange={(e) => { setCardForm({ ...cardForm, country: e.target.value }); if (cardErrors.country) setCardErrors({ ...cardErrors, country: '' }); }}
                />
                {cardErrors.country && <div style={{ fontSize: 11, color: 'var(--as-danger)', marginTop: 4 }}>{cardErrors.country}</div>}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
              <button
                className="as-btn-ghost"
                style={{ padding: '9px 18px', fontSize: 12 }}
                onClick={() => { setShowCardModal(false); setPendingPlan(null); setCardErrors({}); setCardForm({ number: '', expiry: '', cvv: '', name: '', address: '', city: '', state: '', zip: '', country: '' }); }}
              >
                Cancel
              </button>
              <button
                className="as-btn-solid"
                style={{ padding: '9px 18px', fontSize: 12 }}
                onClick={handleCardSubmit}
              >
                {pendingPlan ? 'Add Card & Upgrade' : 'Save Card'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel modal */}
      {showCancelModal && (
        <div className="as-modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="stg-cancel-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Are you sure?</h3>
            <p>You will lose access to unlimited ad variants and automated posting.</p>
            <div className="stg-cancel-actions">
              <button
                style={{ border: '1px solid var(--as-rule-strong)', color: 'var(--as-ink-2)', background: 'none' }}
                onClick={() => { setShowCancelModal(false); handleUpgrade('basic'); }}
              >
                Confirm Cancellation
              </button>
              <button
                style={{ background: 'var(--as-ink)', color: 'var(--as-bg)', border: 'none', fontWeight: 500 }}
                onClick={() => setShowCancelModal(false)}
              >
                Keep My Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
