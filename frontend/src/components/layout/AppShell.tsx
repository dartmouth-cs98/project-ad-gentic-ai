// AppShell — Swiss/Linear rail + topbar for authenticated app routes.

import { ReactNode } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { AppIcon } from '../ui/AppIcon';
import { useTheme } from '../../contexts/ThemeContext';
import { useUser } from '../../contexts/UserContext';
import { useCompany } from '../../contexts/CompanyContext';
import '../../app.css';

const NAV_ITEMS = [
  { id: 'dashboard',     path: '/dashboard',       icon: 'dashboard' as const,  label: 'Dashboard' },
  { id: 'products',      path: '/products',         icon: 'package' as const,    label: 'Products' },
  { id: 'campaigns',     path: '/campaigns',        icon: 'folder' as const,     label: 'Campaigns' },
  { id: 'generate',      path: '/generate',         icon: 'sparkles' as const,   label: 'Generate' },
  { id: 'customer-data', path: '/customer-data',    icon: 'database' as const,   label: 'Customer Data' },
];

const CRUMB_LABEL_MAX = 28;

function formatCrumbLabel(label: string): string {
  const upper = label.toUpperCase();
  if (upper.length <= CRUMB_LABEL_MAX) return upper;
  return `${upper.slice(0, CRUMB_LABEL_MAX - 1)}…`;
}

const PAGE_LABELS: Record<string, string> = {
  '/dashboard':    'DASHBOARD',
  '/products':     'PRODUCTS',
  '/campaigns':    'CAMPAIGNS',
  '/generate':     'GENERATE',
  '/customer-data':'CUSTOMER DATA',
  '/settings':     'SETTINGS',
  '/profile':      'PROFILE',
};

interface AppShellProps {
  children: ReactNode;
  /** Shown in topbar pill group — pass handler from the page */
  timeRange?: string;
  onTimeRangeChange?: (r: string) => void;
  /** Whether to show the "New campaign" button */
  showNewCampaign?: boolean;
  onNewCampaign?: () => void;
  /** Pass true on /generate to use height:100vh layout */
  fullHeight?: boolean;
  /** Override the breadcrumb segment after WORKSPACE (e.g. campaign name on detail page) */
  pageLabel?: string;
}

export function AppShell({
  children,
  timeRange,
  onTimeRangeChange,
  showNewCampaign,
  onNewCampaign,
  fullHeight,
  pageLabel: pageLabelOverride,
}: AppShellProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout, loading: userLoading } = useUser();
  const { profile, loading: companyLoading } = useCompany();
  const location = useLocation();
  const navigate = useNavigate();

  const dark = theme === 'dark';
  const isCampaignDetail = /^\/campaign\/\d+/.test(location.pathname);
  const rawPageLabel = pageLabelOverride
    ?? (isCampaignDetail ? 'CAMPAIGN' : PAGE_LABELS[location.pathname])
    ?? 'WORKSPACE';
  const pageLabel = formatCrumbLabel(rawPageLabel);
  const creditsLoading = companyLoading || userLoading;
  const creditsBalance = profile.creditsBalance;

  const userInitial = user?.business_name
    ? user.business_name.charAt(0).toUpperCase()
    : user?.email?.charAt(0).toUpperCase() ?? 'U';

  return (
    <div
      className={`app-shell${fullHeight ? ' as-full-height' : ''}`}
      data-dark={dark ? 'on' : undefined}
    >
      {/* ── Rail ── */}
      <aside className="as-rail">
        <NavLink to="/dashboard" className="as-rail-brand" aria-label="Dashboard">
          <span className="as-rail-brand-letter">A</span>
        </NavLink>

        <div className="as-rail-divider" />

        <nav className="as-rail-nav">
          {NAV_ITEMS.map((n) => (
            <NavLink
              key={n.id}
              to={n.path}
              className={({ isActive }) =>
                `as-rail-item${isActive || (n.id === 'campaigns' && isCampaignDetail) ? ' active' : ''}`
              }
            >
              <span className="as-rail-icon">
                <AppIcon name={n.icon} size={18} />
              </span>
              <span className="as-rail-tip">{n.label.toUpperCase()}</span>
            </NavLink>
          ))}
        </nav>

        <div className="as-rail-foot">
          <div
            className={`as-rail-credits${
              creditsLoading
                ? ''
                : creditsBalance <= 0
                  ? ' empty'
                  : creditsBalance <= 5
                    ? ' low'
                    : ''
            }`}
            title={
              creditsLoading
                ? 'Loading credits…'
                : `${creditsBalance} credit${creditsBalance === 1 ? '' : 's'} remaining`
            }
          >
            <span className="as-rail-credits-val">{creditsLoading ? '—' : creditsBalance}</span>
            <span className="as-rail-credits-label">LEFT</span>
          </div>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `as-rail-item${isActive ? ' active' : ''}`
            }
          >
            <span className="as-rail-icon">
              <AppIcon name="settings" size={18} />
            </span>
            <span className="as-rail-tip">SETTINGS</span>
          </NavLink>
          <button
            className="as-rail-item"
            onClick={() => { logout(); navigate('/sign-in'); }}
            aria-label="Sign out"
          >
            <span className="as-rail-icon">
              <AppIcon name="logout" size={18} />
            </span>
            <span className="as-rail-tip">SIGN OUT</span>
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="as-main">
        {/* Topbar */}
        <header className="as-topbar">
          <div className="as-crumbs">
            <span>ADGENTIC</span>
            <span className="sep">/</span>
            <span>WORKSPACE</span>
            <span className="sep">/</span>
            <span className="now">{pageLabel}</span>
          </div>

          <div className="as-topbar-actions">
            {/* Time range pills — only shown when prop is provided */}
            {timeRange && onTimeRangeChange && (
              <div className="as-pill-group" role="tablist">
                {['7D', '30D', '90D', 'ALL'].map((r) => (
                  <button
                    key={r}
                    className={`as-pill${timeRange === r ? ' on' : ''}`}
                    onClick={() => onTimeRangeChange(r)}
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}

            {/* Theme toggle */}
            <button
              className="as-icon-btn"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              <AppIcon name={dark ? 'sun' : 'moon'} size={14} />
            </button>

            {/* New campaign */}
            {showNewCampaign && onNewCampaign && (
              <button className="as-btn-solid" onClick={onNewCampaign}>
                <span style={{ display: 'inline-grid', placeItems: 'center', width: 14, height: 14 }}>
                  <AppIcon name="plus" size={14} />
                </span>
                New campaign
              </button>
            )}

            {/* User profile */}
            <NavLink
              to="/profile"
              className={({ isActive }) => `as-user-dot${isActive ? ' active' : ''}`}
              aria-label="Company profile"
              title="Company profile"
            >
              {userInitial}
            </NavLink>
          </div>
        </header>

        {/* Page content */}
        {children}
      </div>
    </div>
  );
}
