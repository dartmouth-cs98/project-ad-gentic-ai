import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/ui/Logo';
import { Sun, Moon, ArrowRight, Menu, X, Target, Brain, Zap, Sparkles } from 'lucide-react';

export function SimpleLanding() {
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
      <header className="sticky top-0 z-50 border-b border-border bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 gap-8">
          <Logo size="md" />

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
              className="hidden md:block px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors">
              Sign In
            </Link>
            <Link to="/sign-up"
              className="hidden md:block px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Get Started
            </Link>
            <button onClick={toggleTheme}
              className="p-2 border border-border rounded-lg hover:bg-muted transition-colors"
              aria-label="Toggle theme">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 border border-border rounded-lg hover:bg-muted transition-colors">
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
      <section className="py-20 px-6 border-b border-border relative overflow-hidden">
        {/* Subtle blue glow behind content */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left */}
            <div>
              <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-[1.05] tracking-tight">
                Ads that actually <span className="text-blue-600">drive results.</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-md mb-10 leading-relaxed">
                Create, test, and scale high-performing ad campaigns with AI-powered automation.
                Personalized ads tailored to your audience for maximum ROI.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-12">
                <Link to="/sign-up"
                  className="flex items-center justify-center gap-2 px-7 py-3.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                  Start Free Trial
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/how-it-works"
                  className="flex items-center justify-center gap-2 px-7 py-3.5 border border-border rounded-lg text-sm hover:bg-muted transition-colors">
                  See How It Works
                </Link>
              </div>

              {/* Stats panel */}
              <div className="grid grid-cols-3 gap-px border border-border rounded-xl overflow-hidden bg-border">
                {[
                  { value: '10,000+', label: 'Campaigns' },
                  { value: '98%', label: 'Satisfaction' },
                  { value: '3.2x', label: 'Avg ROI' },
                ].map((stat, i) => (
                  <div key={i} className="bg-background py-5 text-center">
                    <div className="text-2xl font-bold mb-0.5">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — neural analysis panel */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-semibold">Neural Analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs text-muted-foreground">Live</span>
                </div>
              </div>
              <div className="space-y-5">
                {[
                  { name: 'The Skeptic', match: 94 },
                  { name: 'Impulse Buyer', match: 87 },
                  { name: 'The Researcher', match: 91 },
                ].map((persona) => (
                  <div key={persona.name}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">{persona.name}</span>
                      <span className="text-sm font-semibold">{persona.match}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                        style={{ width: `${persona.match}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-border">
                <div className="text-xs text-muted-foreground mb-3">Generated Output</div>
                <div className="bg-blue-500/5 rounded-lg border border-blue-500/20 p-4">
                  <p className="text-sm text-foreground leading-relaxed">
                    "Lab-tested. BPA-free. 24hr insulation certified. Join 12,847 verified users."
                  </p>
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
              <span className="w-1 h-1 rounded-full bg-blue-400" />
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
            <h2 className="text-3xl font-semibold mb-3">Everything you need to scale</h2>
            <p className="text-muted-foreground max-w-md">Powerful tools designed for modern advertising teams.</p>
          </div>

          <div className="space-y-4">
            {features.map((feature, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-7 hover:border-foreground/20 transition-colors grid md:grid-cols-[1fr_auto] gap-8 items-center">
                <div>
                  <span className="text-xs text-muted-foreground block mb-2">{feature.num}</span>
                  <h3 className="text-base font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
                <div className="hidden md:block text-right border-l border-border pl-8 min-w-[140px]">
                  <div className="text-4xl font-bold text-foreground">{feature.stat}</div>
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
            <span className="text-blue-500">tripled our output</span>{' '}
            in the first month."
          </p>
          <p className="text-sm text-muted-foreground">— Sarah Chen, Head of Growth at Nomad</p>
          <p className="text-xs text-muted-foreground mt-2">
            Trusted by <strong className="text-foreground">500+ companies</strong>
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 border-b border-border">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7">
              <h2 className="text-3xl font-semibold mb-4">Ready to transform your advertising?</h2>
              <p className="text-muted-foreground mb-8 max-w-md leading-relaxed">
                Join hundreds of companies using AI to create more effective campaigns, faster.
              </p>
              <Link to="/sign-up"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="lg:col-span-5 flex flex-col gap-3">
              {[
                { icon: Sparkles, label: 'No credit card required', sub: 'Start building in 30 seconds' },
                { icon: Zap, label: 'Free 14-day trial', sub: 'Full access to every feature' },
                { icon: Target, label: 'Cancel anytime', sub: 'No lock-in, no hidden fees' },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:border-foreground/20 transition-colors">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                      <span className="text-sm font-medium block">{item.label}</span>
                      <span className="text-xs text-muted-foreground">{item.sub}</span>
                    </div>
                  </div>
                );
              })}
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
