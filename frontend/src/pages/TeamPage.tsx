import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/ui/Logo';
import { Sun, Moon, ArrowRight } from 'lucide-react';

const team = [
  {
    name: 'Isaac Cheon',
    initials: 'IC',
    role: 'Co-founder',
    bio: 'Obsessed with building products that actually change how people think about marketing. Believes the best ads don\'t feel like ads.',
  },
  {
    name: 'Dickson Alexander',
    initials: 'DA',
    role: 'Co-founder',
    bio: 'Driven by the gap between what ad tech promises and what it delivers. Building the platform he always wished existed.',
  },
  {
    name: 'Kasuti Makau',
    initials: 'KM',
    role: 'Co-founder',
    bio: 'Focused on making AI genuinely useful — not impressive on demos, but transformative in production. Ships fast, thinks deep.',
  },
  {
    name: 'Arshdeep Singh',
    initials: 'AS',
    role: 'Co-founder',
    bio: 'Turns complex systems into things that feel simple. Cares deeply about the craft of building and the impact of what gets built.',
  },
  {
    name: 'Kevin Guo',
    initials: 'KG',
    role: 'Co-founder',
    bio: 'Sees the big picture without losing sight of the details. Relentlessly focused on what it takes to build something people actually need.',
  },
];

export function TeamPage() {
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
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/"><Logo size="md" /></Link>
            <div className="hidden md:flex items-center gap-8">
              <Link to="/features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</Link>
              <Link to="/how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How It Works</Link>
              <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
              <Link to="/team" className="text-sm text-foreground font-medium">Team</Link>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/sign-in">
                <button className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors">Sign In</button>
              </Link>
              <Link to="/sign-up">
                <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Get Started</button>
              </Link>
              <button onClick={toggleTheme} className="p-2 border border-border rounded-lg hover:bg-muted transition-colors" aria-label="Toggle theme">
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-24 pb-20 px-6 border-b border-border">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wide mb-4">The team</p>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight mb-6 leading-tight">
            We're building the next great advertising platform.
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl">
            Four builders who got tired of watching brands waste budgets on ads that miss. We think advertising can be smarter, more honest, and actually effective — so we're making it happen.
          </p>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 px-6 border-b border-border">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-6">
            {team.map(({ name, initials, role, bio }, i) => (
              <div key={name} className={`bg-card border border-border rounded-xl p-8 hover:bg-muted transition-colors col-span-2 ${i === 3 ? 'lg:col-start-2' : ''} ${i === 4 ? 'lg:col-start-4' : ''}`}>
                <div className="w-14 h-14 rounded-xl bg-foreground flex items-center justify-center text-background font-semibold text-lg mb-6">
                  {initials}
                </div>
                <h3 className="text-xl font-semibold mb-1">{name}</h3>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-4">{role}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-24 px-6 border-b border-border">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wide mb-4">Our mission</p>
          <blockquote className="text-3xl sm:text-4xl font-semibold tracking-tight leading-snug mb-8">
            "Advertising should work for everyone — not just the brands with the biggest budgets."
          </blockquote>
          <p className="text-muted-foreground leading-relaxed max-w-xl">
            We started Ad-gentic because we watched brands burn money on campaigns that didn't understand their audience. The tools existed to do better — they just weren't being used right. We're fixing that. AI-powered, data-driven, human-approved.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-6 bg-muted border-b border-border">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wide mb-10">What we believe</p>
          <div className="grid sm:grid-cols-3 gap-10">
            {[
              {
                title: 'Ship things that matter',
                body: 'We build for impact, not optics. Every feature has to earn its place by making something meaningfully better.',
              },
              {
                title: 'Honest by default',
                body: 'With advertisers, with users, with each other. The best products are built on trust, and trust starts with honesty.',
              },
              {
                title: 'Move fast, stay sharp',
                body: 'Speed without thought is noise. We move quickly because we think clearly — not instead of it.',
              },
            ].map(({ title, body }) => (
              <div key={title}>
                <h3 className="font-semibold mb-3">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Join */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Want to help build this?</h2>
            <p className="text-muted-foreground">We're always looking for people who give a damn.</p>
          </div>
          <Link to="/sign-up">
            <button className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              Get in touch
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-border">
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
