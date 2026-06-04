import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/ui/Logo';
import { Sun, Moon, ArrowRight, Menu, X, CheckIcon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const gradientText: React.CSSProperties = {
  background: 'linear-gradient(135deg, #F59E0B 0%, #818CF8 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  padding: '0 3px',
  margin: '0 -3px',
};

export function SimpleLanding() {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Features', to: '/features' },
    { label: 'How It Works', to: '/how-it-works' },
    { label: 'Pricing', to: '/pricing' },
    { label: 'Team', to: '/team' },
  ];

  const marqueeWords = [
    'Personalized Ads', 'AI-Powered', 'Data-Driven', 'Scalable',
    'High-Converting', 'Automated', 'Targeted', 'Performance-First',
  ];

  const features = [
    {
      num: '01', title: 'Neural Profiling',
      description: 'Real-time psychological pattern analysis across consumer segments. Understand exactly who buys and why.',
      stat: '156%', statLabel: 'higher click-through rates',
    },
    {
      num: '02', title: 'Data-Driven Performance',
      description: "Real-time analytics and insights that show exactly what drives results. Make decisions based on data, not guesswork.",
      stat: '3.2×', statLabel: 'average ROI increase',
    },
    {
      num: '03', title: 'Scale With Precision',
      description: 'Create hundreds of targeted variations instantly. Reach the right audience with the right message at the right time.',
      stat: '500+', statLabel: 'brands scaled with precision',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 gap-8">
          <Link to="/" className="hover:opacity-75 transition-opacity"><Logo size="md" /></Link>

          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link key={link.label} to={link.to}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/sign-in"
              className="hidden md:block px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded transition-colors">
              Sign In
            </Link>
            <Link to="/sign-up"
              className="hidden md:block px-4 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors">
              Get Started
            </Link>
            <button onClick={toggleTheme}
              className="p-2 bg-muted rounded hover:bg-border transition-colors"
              aria-label="Toggle theme">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 bg-muted rounded hover:bg-border transition-colors">
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
              <Link to="/sign-in" className="px-4 py-2 text-sm text-center border border-border rounded hover:bg-muted transition-colors">Sign In</Link>
              <Link to="/sign-up" className="px-4 py-2 text-sm text-center bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors">Get Started</Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="py-20 px-6 border-b border-border relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 -z-0"
          style={{
            background: 'radial-gradient(ellipse 60% 60% at 80% 20%, rgba(129,140,248,0.07) 0%, transparent 70%), radial-gradient(ellipse 50% 50% at 20% 80%, rgba(245,158,11,0.06) 0%, transparent 65%)',
          }}
        />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left */}
            <div>
              <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-[1.05] tracking-tight">
                Ads that{' '}
                <em className="font-serif italic" style={gradientText}>actually</em>{' '}
                drive results.
              </h1>
              <p className="text-lg text-muted-foreground max-w-md mb-10 leading-relaxed">
                Create, test, and scale high-performing ad campaigns with AI-powered automation.
                Personalized ads tailored to your audience for maximum ROI.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-12">
                <Link to="/sign-up"
                  className="flex items-center justify-center gap-2 px-7 py-3.5 bg-primary text-primary-foreground rounded font-medium hover:bg-primary/90 transition-colors">
                  Start Free Trial
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/how-it-works"
                  className="flex items-center justify-center gap-2 px-7 py-3.5 border border-border rounded text-sm hover:bg-muted transition-colors">
                  See How It Works
                </Link>
              </div>

              {/* Stats — flat row with dividers */}
              <div className="flex divide-x divide-border border-t border-b border-border">
                {[
                  { value: '10,000+', label: 'Campaigns' },
                  { value: '98%', label: 'Satisfaction' },
                  { value: '3.2x', label: 'Avg ROI' },
                ].map((stat, i) => (
                  <div key={i} className="flex-1 py-5 text-center">
                    <div className="text-2xl font-bold mb-0.5" style={gradientText}>{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — pipeline flow card */}
            <div className="bg-card border border-border rounded p-6 shadow-sm">
              <div className="flex flex-col">

                {/* Step 01 — Input */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-amber-500 mt-1 shrink-0" />
                    <div className="w-px flex-1 bg-border mt-1.5" />
                  </div>
                  <div className="pb-6 flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-mono text-[10px] text-amber-600 dark:text-amber-400 font-semibold">01</span>
                      <span className="text-xs font-semibold">Input Brief</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {[
                        { label: 'product', value: 'HydroFlask 32oz' },
                        { label: 'audience', value: 'Health-conscious, 25–34' },
                        { label: 'goal', value: 'Drive purchases' },
                      ].map((row) => (
                        <div key={row.label} className="flex items-baseline gap-3">
                          <span className="font-mono text-[10px] text-muted-foreground w-16 shrink-0">{row.label}</span>
                          <span className="text-xs font-medium truncate">{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Step 02 — Processing */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-violet-500 mt-1 shrink-0" />
                    <div className="w-px flex-1 bg-border mt-1.5" />
                  </div>
                  <div className="pb-6 flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-[10px] text-violet-600 dark:text-violet-400 font-semibold">02</span>
                      <span className="text-xs font-semibold">Processing</span>
                      <span className="ml-auto font-mono text-[10px] text-muted-foreground">2.1s</span>
                    </div>
                    <p className="font-mono text-[10px] text-muted-foreground leading-relaxed">
                      Persona match · Tone calibration · Platform format · 3 variants
                    </p>
                  </div>
                </div>

                {/* Step 03 — Output */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">03</span>
                      <span className="text-xs font-semibold">Output</span>
                      <span className="ml-auto font-mono text-[10px] text-emerald-600 dark:text-emerald-400">top performer</span>
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xs font-medium text-violet-700 dark:text-violet-300 border-l-2 border-violet-400 dark:border-violet-500 pl-2">The Skeptic</span>
                      <span className="text-xs text-muted-foreground">· Meta</span>
                    </div>
                    <p className="text-sm leading-relaxed text-foreground mb-4">
                      "Lab-tested. BPA-free. 24hr insulation certified.{' '}
                      <span className="font-medium">Join 12,847 verified users</span>{' '}
                      who never compromise on quality."
                    </p>
                    <div className="flex divide-x divide-border border-t border-b border-border">
                      {[
                        { label: 'CTR', value: '4.8%', delta: '+156%' },
                        { label: 'Conv Rate', value: '12.3%', delta: '+43%' },
                        { label: 'Reach', value: '47K', delta: '+2.1×' },
                      ].map((m) => (
                        <div key={m.label} className="flex-1 px-3 py-3 text-center">
                          <div className="text-sm font-semibold">{m.value}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">{m.label}</div>
                          <div className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">{m.delta}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee */}
      <div className="overflow-hidden border-b border-border bg-muted/20 py-3">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...marqueeWords, ...marqueeWords, ...marqueeWords].map((word, i) => (
            <span key={i} className="mx-8 text-[10px] tracking-widest uppercase text-muted-foreground flex items-center gap-3">
              <span className="text-muted-foreground/40">/</span>
              {word}
            </span>
          ))}
        </div>
        <style>{`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-33.333%); }
          }
          .animate-marquee { animation: marquee 20s linear infinite; }
        `}</style>
      </div>

      {/* Features */}
      <section className="py-24 px-6 border-b border-border" id="features">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-3">Features</p>
            <h2 className="text-3xl font-semibold mb-3">Everything you need to scale</h2>
            <p className="text-muted-foreground max-w-md">Powerful tools designed for modern advertising teams.</p>
          </div>

          <div className="divide-y divide-border border-t border-b border-border">
            {features.map((feature, i) => (
              <div key={i} className="py-7 grid md:grid-cols-[1fr_auto] gap-8 items-center hover:bg-muted/20 transition-colors px-2">
                <div>
                  <span className="font-mono text-xs text-muted-foreground block mb-2">{feature.num}</span>
                  <h3 className="text-base font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
                <div className="hidden md:block text-right border-l border-border pl-8 min-w-[140px]">
                  <div className="text-4xl font-bold" style={gradientText}>{feature.stat}</div>
                  <div className="text-xs text-muted-foreground mt-1 max-w-[120px] ml-auto">{feature.statLabel}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-16 px-6 border-b border-border bg-muted/10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="flex -space-x-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="w-9 h-9 rounded-full border-2 border-background bg-muted" />
              ))}
            </div>
          </div>
          <p className="text-xl md:text-2xl leading-snug mb-6">
            "We replaced our entire creative workflow and{' '}
            <em className="font-serif italic" style={{ ...gradientText, fontStyle: 'italic' }}>tripled our output</em>{' '}
            in the first month."
          </p>
          <p className="text-sm text-muted-foreground">— Sarah Chen, Head of Growth at Nomad</p>
          <p className="text-xs text-muted-foreground mt-2">
            Trusted by <strong className="text-foreground">500+ companies</strong>
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 px-6 border-b border-border overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 -z-0"
          style={{
            background: 'radial-gradient(ellipse 60% 80% at 50% 100%, rgba(245,158,11,0.06) 0%, transparent 70%)',
          }}
        />
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7">
              <h2 className="text-3xl font-semibold mb-4">Ready to transform your advertising?</h2>
              <p className="text-muted-foreground mb-8 max-w-md leading-relaxed">
                Join hundreds of companies using AI to create more effective campaigns, faster.
              </p>
              <Link to="/sign-up"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded text-sm font-medium hover:bg-primary/90 transition-colors">
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="lg:col-span-5 divide-y divide-border border-t border-b border-border">
              {[
                { label: 'No credit card required', sub: 'Start building in 30 seconds' },
                { label: 'Free 14-day trial', sub: 'Full access to every feature' },
                { label: 'Cancel anytime', sub: 'No lock-in, no hidden fees' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 py-4 pl-4 border-l-2 border-emerald-400 dark:border-emerald-500">
                  <CheckIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div>
                    <span className="text-sm font-medium block">{item.label}</span>
                    <span className="text-xs text-muted-foreground">{item.sub}</span>
                  </div>
                </div>
              ))}
            </div>
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
