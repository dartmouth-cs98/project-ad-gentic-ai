import { useState } from 'react';
import { HealthBadge } from '../ui/HealthBadge';
import { Link, useLocation } from 'react-router-dom';
import { useCompany } from '../../contexts/CompanyContext';
import { Logo } from '../ui/Logo';
import {
  LayoutDashboardIcon,
  FolderIcon,
  PackageIcon,
  SparklesIcon,
  ChevronLeftIcon,
  LogOutIcon,
  DatabaseIcon,
  SettingsIcon,
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboardIcon },
  { path: '/campaigns', label: 'Campaigns', icon: FolderIcon },
  { path: '/products', label: 'Products', icon: PackageIcon },
  { path: '/generate', label: 'Generate Ads', icon: SparklesIcon },
  { path: '/customer-data', label: 'Customer Data', icon: DatabaseIcon },
];

interface SidebarProps {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function Sidebar({ collapsed: controlledCollapsed, onCollapsedChange }: SidebarProps = {}) {
  const location = useLocation();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const { profile } = useCompany();

  const collapsed = controlledCollapsed ?? internalCollapsed;
  const setCollapsed = (value: boolean) => {
    if (controlledCollapsed !== undefined) {
      onCollapsedChange?.(value);
    } else {
      setInternalCollapsed(value);
    }
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-card border-r border-border flex flex-col transition-all duration-300 ease-out z-50 ${collapsed ? 'w-16' : 'w-64'}`}
    >
      {/* Logo / Company */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <Logo size="sm" showText={false} />
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm truncate text-foreground">
                  {profile.companyName}
                </span>
                {profile.plan !== 'basic' && (
                  <span className="px-1.5 py-0.5 bg-blue-600 text-[10px] font-bold rounded text-white capitalize">
                    {profile.plan === 'enterprise' ? 'ENT' : 'PRO'}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto">
            <Logo size="sm" showText={false} />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground ${collapsed ? 'absolute -right-3 top-5 bg-card border border-border' : ''}`}
        >
          <ChevronLeftIcon className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path === '/campaigns' && location.pathname.startsWith('/campaign')) ||
            (item.path === '/customer-data' && location.pathname === '/all-consumers');
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              } ${collapsed ? 'justify-center' : ''}`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Settings */}
      <div className="px-2 pb-2">
        <Link
          to="/settings"
          title={collapsed ? 'Settings' : undefined}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
            location.pathname === '/settings'
              ? 'bg-muted text-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          } ${collapsed ? 'justify-center' : ''}`}
        >
          <SettingsIcon className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Settings</span>}
        </Link>
      </div>

      {/* Upgrade CTA */}
      {!collapsed && profile.plan === 'basic' && (
        <div className="px-3 pb-3">
          <div className="bg-muted border border-border rounded-lg p-3 text-center">
            <p className="text-sm font-medium mb-0.5">Upgrade to Pro</p>
            <p className="text-xs text-muted-foreground mb-3">Unlock unlimited generations</p>
            <Link to="/settings?tab=plans">
              <button className="w-full py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors">
                Upgrade Now
              </button>
            </Link>
          </div>
        </div>
      )}

      {/* Health Badge */}
      <div className="px-2 pb-1">
        <HealthBadge collapsed={collapsed} />
      </div>

      {/* User */}
      <div className="p-2 border-t border-border">
        <div className={`flex items-center gap-3 px-3 py-2 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-7 h-7 rounded-full bg-muted border border-border flex items-center justify-center text-sm font-medium text-foreground flex-shrink-0">
            {profile.userName.charAt(0)}
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{profile.userName}</p>
                <p className="text-xs text-muted-foreground truncate capitalize">{profile.plan} Plan</p>
              </div>
              <Link
                to="/"
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <LogOutIcon className="w-4 h-4" />
              </Link>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
