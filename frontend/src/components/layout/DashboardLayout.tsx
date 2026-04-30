import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDownIcon, LogOutIcon, Moon, Sun } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Breadcrumbs } from './Breadcrumbs';
import { useSidebar } from '../../contexts/SidebarContext';
import { useUser } from '../../contexts/UserContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useCompany } from '../../contexts/CompanyContext';

interface DashboardLayoutProps {
  children: ReactNode;
  rightActions?: ReactNode;
}

export function DashboardLayout({ children, rightActions }: DashboardLayoutProps) {
  const { collapsed } = useSidebar();
  const { user, logout } = useUser();
  const { profile } = useCompany();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    window.addEventListener('mousedown', onOutsideClick);
    return () => window.removeEventListener('mousedown', onOutsideClick);
  }, []);

  const email = user?.email ?? 'User';
  const initial = email.charAt(0).toUpperCase();

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate('/sign-in');
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar />

      <div className={`${collapsed ? 'ml-16' : 'ml-64'} transition-all duration-300`}>
        <header className="h-16 border-b border-border px-6 flex items-center justify-between bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <Breadcrumbs />

          <div className="flex items-center gap-3">
            {rightActions}
            <button
              onClick={toggleTheme}
              className="p-2 bg-muted rounded-lg hover:bg-border transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setOpen((value) => !value)}
                className="flex items-center gap-2 rounded-lg border border-border px-2 py-1.5 hover:bg-muted transition-colors"
              >
                <span className="w-7 h-7 rounded-full bg-muted border border-border flex items-center justify-center text-sm font-medium">
                  {initial}
                </span>
                <ChevronDownIcon className="w-4 h-4 text-muted-foreground" />
              </button>

              {open && (
                <div className="absolute right-0 mt-2 w-44 rounded-lg border border-border bg-card shadow-lg p-1 z-40">
                  <div className="px-3 py-2 text-xs text-muted-foreground border-b border-border capitalize">
                    {profile.plan} plan
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted text-left"
                  >
                    <LogOutIcon className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
