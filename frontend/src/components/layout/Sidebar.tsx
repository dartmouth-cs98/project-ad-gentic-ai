import { useState } from 'react';
import { HealthBadge } from '../ui/HealthBadge';
import { Link, useLocation } from 'react-router-dom';
import { useCompany } from '../../contexts/CompanyContext';
import {
  LayoutDashboardIcon,
  FolderIcon,
  SparklesIcon,
  ChevronLeftIcon,
  LogOutIcon,
  DatabaseIcon,
  SettingsIcon
} from
  'lucide-react';
const navItems = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboardIcon
  },
  {
    path: '/campaigns',
    label: 'Campaigns',
    icon: FolderIcon
  },
  {
    path: '/generate',
    label: 'Generate Ads',
    icon: SparklesIcon,
    highlight: true
  },
  {
    path: '/customer-data',
    label: 'Customer Data',
    icon: DatabaseIcon
  }];

export function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { profile } = useCompany();
  return (
    <aside
      className={`
        fixed left-0 top-0 h-full bg-[#0A1628] text-white
        flex flex-col transition-all duration-300 ease-out z-50
        ${collapsed ? 'w-16' : 'w-64'}
      `}>

      {/* Logo / Company Name */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
        {!collapsed &&
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
              <SparklesIcon className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm truncate">
                  {profile.companyName}
                </span>
                {profile.plan !== 'basic' &&
                  <span className="px-1.5 py-0.5 bg-gradient-to-r from-orange-500 to-amber-500 text-[10px] font-bold rounded text-white shadow-sm capitalize">
                    {profile.plan === 'enterprise' ? 'ENT' : 'PRO'}
                  </span>
                }
              </div>
            </div>
          </div>
        }
        {collapsed &&
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto">
            <SparklesIcon className="w-4 h-4 text-white" />
          </div>
        }
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`
            p-1.5 rounded-lg hover:bg-white/10 transition-colors
            ${collapsed ? 'absolute -right-3 top-5 bg-[#0A1628] border border-white/10' : ''}
          `}>

          <ChevronLeftIcon
            className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />

        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto dark-scrollbar">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            item.path === '/campaigns' &&
            location.pathname.startsWith('/campaign');
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl
                transition-all duration-200
                ${isActive ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}
                ${item.highlight && !isActive ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 hover:text-blue-300' : ''}
                ${collapsed ? 'justify-center' : ''}
              `}
              title={collapsed ? item.label : undefined}>

              <Icon
                className={`w-5 h-5 flex-shrink-0 ${item.highlight && !isActive ? 'text-blue-400' : ''}`} />

              {!collapsed &&
                <span className="font-medium text-sm">{item.label}</span>
              }
            </Link>);

        })}
      </nav>

      {/* Settings Link */}
      <div className="px-2 pb-2">
        <Link
          to="/settings"
          className={`
            flex items-center gap-3 px-3 py-2.5 rounded-xl
            transition-all duration-200 text-white/60 hover:text-white hover:bg-white/5
            ${collapsed ? 'justify-center' : ''}
            ${location.pathname === '/settings' ? 'bg-white/10 text-white' : ''}
          `}
          title={collapsed ? 'Settings' : undefined}>

          <SettingsIcon className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="font-medium text-sm">Settings</span>}
        </Link>
      </div>

      {/* Upgrade CTA for non-premium */}
      {!collapsed && profile.plan === 'basic' &&
        <div className="px-4 pb-4">
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-4 text-center">
            <p className="text-sm font-semibold mb-1">Upgrade to Pro</p>
            <p className="text-xs text-white/80 mb-3">
              Unlock unlimited generations
            </p>
            <Link to="/settings?tab=plans">
              <button className="w-full py-1.5 bg-white text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-50 transition-colors">
                Upgrade Now
              </button>
            </Link>
          </div>
        </div>
      }

      {/* Health Badge */}
      <div className="px-2 pb-1">
        <HealthBadge collapsed={collapsed} />
      </div>

      {/* User section */}
      <div className="p-2 border-t border-white/10">
        <div
          className={`flex items-center gap-3 px-3 py-2 ${collapsed ? 'justify-center' : ''}`}>

          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-sm font-medium">
            {profile.userName.charAt(0)}
          </div>
          {!collapsed &&
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile.userName}</p>
              <p className="text-xs text-white/50 truncate capitalize">
                {profile.plan} Plan
              </p>
            </div>
          }
          {!collapsed &&
            <Link
              to="/"
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/50 hover:text-white">

              <LogOutIcon className="w-4 h-4" />
            </Link>
          }
        </div>
      </div>
    </aside>);

}