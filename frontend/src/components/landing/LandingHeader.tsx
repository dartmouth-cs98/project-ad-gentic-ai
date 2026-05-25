// LandingHeader — sticky, frosted-glass, brand mark + nav + theme toggle + CTA
import { Link } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const NAV_LINKS = [
  { label: 'Features',     to: '/features' },
  { label: 'How It Works', to: '/how-it-works' },
  { label: 'Pricing',      to: '/pricing' },
  { label: 'Team',         to: '/team' },
];

export function LandingHeader() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="lp-site-header">
      <div className="lp-container lp-header-row">
        {/* Brand */}
        <Link to="/" className="lp-brand" aria-label="Adgentic home">
          <span className="lp-brand-mark" aria-hidden="true" />
          <span className="lp-brand-word lp-mono">ADGENTIC</span>
        </Link>

        {/* Nav */}
        <nav className="lp-nav">
          {NAV_LINKS.map(({ label, to }) => (
            <Link key={label} to={to}>{label}</Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="lp-header-cta">
          <button
            onClick={toggleTheme}
            className="lp-theme-toggle"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <Link to="/sign-in" className="lp-btn-ghost">Sign in</Link>
          <Link to="/sign-up" className="lp-btn-solid">
            Get started
            <span className="lp-btn-arrow" aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
