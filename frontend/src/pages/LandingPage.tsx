import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/ui/Logo';
import { Sun, Moon, ArrowRight, Menu, X, Target, BarChart3, Zap } from 'lucide-react';

export function LandingPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'light';
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
    { label: 'Features', href: '#features' },
    { label: 'How It Works', to: '/how-it-works' },
    { label: 'Pricing', to: '/pricing' },
    { label: 'Team', to: '/team' },
  ];

  const features = [
    {
      icon: Zap,
      iconBg: 'bg-amber-100 dark:bg-amber-500/15',
      iconColor: 'text-amber-600 dark:text-amber-400',
      title: 'AI-Powered Creation',
      description: 'Generate high-performing ad variations in seconds. Let intelligent automation handle the heavy lifting while you focus on strategy.',
    },
    {
      icon: BarChart3,
      iconBg: 'bg-violet-100 dark:bg-violet-500/15',
      iconColor: 'text-violet-600 dark:text-violet-400',
      title: 'Data-Driven Performance',
      description: 'Real-time analytics and insights that show exactly what drives results. Make decisions based on data, not guesswork.',
    },
    {
      icon: Target,
      iconBg: 'bg-emerald-100 dark:bg-emerald-500/15',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      title: 'Scale With Precision',
      description: 'Create hundreds of targeted variations instantly. Reach the right audience with the right message at the right time.',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 gap-8">
          <Logo size="md" />

          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) =>
              link.to ? (
                <Link
                  key={link.label}
                  to={link.to}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </a>
              )
            )}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/sign-in"
              className="hidden md:block px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/sign-up"
              className="hidden md:block px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Get Started
            </Link>

            <button
              onClick={toggleTheme}
              className="p-2 bg-muted rounded-lg hover:bg-border transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 bg-muted rounded-lg hover:bg-border transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-3 bg-background">
            {navLinks.map((link) =>
              link.to ? (
                <Link
                  key={link.label}
                  to={link.to}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              )
            )}
            <div className="flex flex-col gap-2 pt-3 border-t border-border">
              <Link to="/sign-in" className="px-4 py-2 text-sm text-center border border-border rounded-lg hover:bg-muted transition-colors">
                Sign In
              </Link>
              <Link to="/sign-up" className="px-4 py-2 text-sm text-center bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                Get Started
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative py-28 px-6 border-b border-border overflow-hidden">
        {/* Subtle radial glow behind hero text */}
        <div
          className="pointer-events-none absolute inset-0 -z-0"
          style={{
            background: 'radial-gradient(ellipse 70% 50% at 50% -10%, rgba(245,158,11,0.07) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 80% 60%, rgba(129,140,248,0.05) 0%, transparent 60%)',
          }}
        />

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-semibold mb-6 leading-tight tracking-tight">
            Advertising that{' '}
            <em className="font-serif italic">actually</em>{' '}
            drives results
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
            Create, test, and scale high-performing ad campaigns with AI-powered automation.
            Personalized ads tailored to your audience for maximum ROI.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-20">
            <Link
              to="/sign-up"
              className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Start Free Trial
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/how-it-works"
              className="flex items-center gap-2 px-6 py-3 border border-border rounded-lg text-sm hover:bg-muted transition-colors"
            >
              See How It Works
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-px border border-border rounded-xl overflow-hidden bg-border">
            {[
              { value: '10,000+', label: 'Campaigns Generated' },
              { value: '98%', label: 'Customer Satisfaction' },
              { value: '3.2x', label: 'Average ROI Increase' },
            ].map((stat, i) => (
              <div key={i} className="bg-background py-8">
                <div
                  className="text-3xl font-semibold mb-1"
                  style={{
                    background: 'linear-gradient(135deg, #F59E0B 0%, #818CF8 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 border-b border-border" id="features">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-3">Features</p>
            <h2 className="text-3xl font-semibold mb-3">Everything you need to scale</h2>
            <p className="text-muted-foreground max-w-md">Powerful tools designed for modern advertising teams.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-7 hover:border-foreground/20 transition-colors">
                <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg mb-4 ${feature.iconBg}`}>
                  <feature.icon className={`w-4 h-4 ${feature.iconColor}`} />
                </div>
                <h3 className="text-base font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
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
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-semibold mb-4">Ready to transform your advertising?</h2>
          <p className="text-muted-foreground mb-8">
            Join hundreds of companies using AI to create more effective campaigns, faster.
          </p>
          <Link
            to="/sign-up"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Get Started Free
            <ArrowRight className="w-4 h-4" />
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-muted-foreground">
            {['No credit card required', 'Free 14-day trial', 'Cancel anytime'].map((text) => (
              <span key={text}>{text}</span>
            ))}
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
