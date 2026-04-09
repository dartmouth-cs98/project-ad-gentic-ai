import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/ui/Logo';
import { Sun, Moon, ArrowRight, Menu, X } from 'lucide-react';

const team = [
  {
    name: 'Isaac Cheon',
    initials: 'IC',
    role: 'Co-founder',
    bio: "Obsessed with building products that actually change how people think about marketing. Believes the best ads don't feel like ads.",
    color: 'bg-blue-600',
  },
  {
    name: 'Dickson Alexander',
    initials: 'DA',
    role: 'Co-founder',
    bio: 'Driven by the gap between what ad tech promises and what it delivers. Building the platform he always wished existed.',
    color: 'bg-violet-600',
  },
  {
    name: 'Kasuti Makau',
    initials: 'KM',
    role: 'Co-founder',
    bio: 'Focused on making AI genuinely useful — not impressive on demos, but transformative in production. Ships fast, thinks deep.',
    color: 'bg-emerald-600',
  },
  {
    name: 'Arshdeep Singh',
    initials: 'AS',
    role: 'Co-founder',
    bio: 'Turns complex systems into things that feel simple. Cares deeply about the craft of building and the impact of what gets built.',
    color: 'bg-orange-500',
  },
  {
    name: 'Kevin Guo',
    initials: 'KG',
    role: 'Co-founder',
    bio: "Sees the big picture without losing sight of the details. Relentlessly focused on what it takes to build something people actually need.",
    color: 'bg-rose-500',
  },
];

export function TeamPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const navLinks = [
    { label: 'Features', to: '/features' },
    { label: 'How It Works', to: '/how-it-works' },
    { label: 'Pricing', to: '/pricing' },
    { label: 'Team', to: '/team' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 gap-8">
          <Link to="/"><Logo size="md" /></Link>

          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link key={link.label} to={link.to}
                className={`text-sm transition-colors ${link.label === 'Team' ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/sign-in"
              className="hidden md:block px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors">
              Sign In
            </Link>
            <Link to="/sign-up"
              className="hidden md:block px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Get Started
            </Link>
            <button onClick={toggleTheme}
              className="p-2 bg-muted rounded-lg hover:bg-border transition-colors"
              aria-label="Toggle theme">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 bg-muted rounded-lg hover:bg-border transition-colors">
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border px-4 sm:px-6 py-4 flex flex-col gap-3 bg-background">
            {navLinks.map((link) => (
              <Link key={link.label} to={link.to}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                onClick={() => setMobileMenuOpen(false)}>
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 pt-3 border-t border-border">
              <Link to="/sign-in" className="px-4 py-2 text-sm text-center border border-border rounded-lg hover:bg-muted transition-colors">Sign In</Link>
              <Link to="/sign-up" className="px-4 py-2 text-sm text-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Get Started</Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="py-24 px-6 border-b border-border relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto relative z-10">
          <p className="text-xs text-blue-600 font-semibold uppercase tracking-widest mb-5">The team</p>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.05]">
            We're building the<br />
            <span className="text-blue-600">next great</span> advertising platform.
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
            Five builders who got tired of watching brands waste budgets on ads that miss. We think advertising can be smarter, more honest, and actually effective — so we're making it happen.
          </p>
        </div>
      </section>

      {/* Team Grid */}
      <section className="py-20 px-6 border-b border-border">
        <div className="max-w-5xl mx-auto">
          {/* Top row: 3 cards */}
          <div className="grid sm:grid-cols-3 gap-5 mb-5">
            {team.slice(0, 3).map(({ name, initials, role, bio, color }) => (
              <div key={name} className="group bg-card border border-border rounded-xl p-7 hover:border-foreground/20 transition-all">
                <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-white font-bold text-sm mb-6`}>
                  {initials}
                </div>
                <h3 className="text-lg font-semibold mb-0.5">{name}</h3>
                <p className="text-xs text-blue-600 font-medium mb-4 uppercase tracking-wide">{role}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{bio}</p>
              </div>
            ))}
          </div>
          {/* Bottom row: 2 cards centered */}
          <div className="grid sm:grid-cols-2 gap-5 max-w-[calc(66.666%+10px)] mx-auto">
            {team.slice(3).map(({ name, initials, role, bio, color }) => (
              <div key={name} className="group bg-card border border-border rounded-xl p-7 hover:border-foreground/20 transition-all">
                <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-white font-bold text-sm mb-6`}>
                  {initials}
                </div>
                <h3 className="text-lg font-semibold mb-0.5">{name}</h3>
                <p className="text-xs text-blue-600 font-medium mb-4 uppercase tracking-wide">{role}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission — full-width editorial quote */}
      <section className="py-24 px-6 border-b border-border bg-muted/20">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-[1fr_2fr] gap-16 items-start">
          <div>
            <p className="text-xs text-blue-600 font-semibold uppercase tracking-widest mb-4">Our mission</p>
            <div className="w-8 h-px bg-blue-600 mb-6" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              We started Ad-gentic because we watched brands burn money on campaigns that didn't understand their audience. The tools existed to do better — they just weren't being used right. We're fixing that.
            </p>
          </div>
          <blockquote className="text-3xl sm:text-4xl font-bold tracking-tight leading-snug">
            "Advertising should work for everyone — not just the brands with the{' '}
            <span className="text-blue-600">biggest budgets.</span>"
          </blockquote>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-6 border-b border-border">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs text-blue-600 font-semibold uppercase tracking-widest mb-12">What we believe</p>
          <div className="grid sm:grid-cols-3 gap-px border border-border rounded-xl overflow-hidden bg-border">
            {[
              {
                num: '01',
                title: 'Ship things that matter',
                body: 'We build for impact, not optics. Every feature has to earn its place by making something meaningfully better.',
              },
              {
                num: '02',
                title: 'Honest by default',
                body: 'With advertisers, with users, with each other. The best products are built on trust, and trust starts with honesty.',
              },
              {
                num: '03',
                title: 'Move fast, stay sharp',
                body: 'Speed without thought is noise. We move quickly because we think clearly — not instead of it.',
              },
            ].map(({ num, title, body }) => (
              <div key={title} className="bg-background p-8">
                <span className="text-xs text-muted-foreground block mb-4">{num}</span>
                <h3 className="font-semibold mb-3">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Join */}
      <section className="py-24 px-6 border-b border-border">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7">
            <h2 className="text-3xl font-semibold mb-4">Want to help build this?</h2>
            <p className="text-muted-foreground leading-relaxed max-w-md">
              We're always looking for people who give a damn. If that sounds like you, let's talk.
            </p>
          </div>
          <div className="lg:col-span-5">
            <Link to="/sign-up"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              Get in touch
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            {['Privacy', 'Terms', 'Contact', 'Careers'].map((label) => (
              <a key={label} href="#" className="hover:text-foreground transition-colors">{label}</a>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">© 2026 Ad-gentic. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
