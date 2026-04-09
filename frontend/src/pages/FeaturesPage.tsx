import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/ui/Logo';
import { Sun, Moon, CheckIcon, Menu, X, ArrowRight } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export function FeaturesPage() {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
                className={`text-sm transition-colors ${link.label === 'Features' ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}>
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
      <section className="py-20 px-6 border-b border-border relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 tracking-tight leading-[1.05]">
            What Ad-gentic <span className="text-blue-600">does</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            From customer data to live campaigns — here's how the platform works.
          </p>
        </div>
      </section>

      {/* Feature 1: Audience Segmentation */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-background border-b border-border">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-semibold text-foreground mb-4">
                Audience segmentation, automatically
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Upload your customer data and Ad-gentic figures out who your buyers actually are.
                It groups them into distinct segments based on real behavior — so your ads speak
                directly to each type of customer.
              </p>
              <ul className="space-y-4">
                {[
                  'Identifies 10+ customer segments from your data, like deal-seekers, brand loyalists, and first-time buyers',
                  'Updates segments in real-time as new data comes in',
                  'Works across industries and audience sizes',
                  'Each segment gets its own tailored ad angle',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-card border border-border rounded-xl p-6">
              <p className="text-xs text-muted-foreground mb-4 font-medium uppercase tracking-wide">Detected segments</p>
              <div className="space-y-3">
                {[
                  { label: 'Deal Seekers', sub: 'Respond to discounts & urgency', match: '98%' },
                  { label: 'Brand Loyalists', sub: 'Value trust & reputation', match: '85%' },
                  { label: 'Researchers', sub: 'Need details & comparisons', match: '92%' },
                ].map(({ label, sub, match }, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-muted rounded-xl border border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-background border border-border flex items-center justify-center text-foreground font-semibold text-sm">
                        {label[0]}
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">{label}</p>
                        <p className="text-xs text-muted-foreground">{sub}</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-blue-600">{match}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 2: Publish Everywhere */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30 border-b border-border">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="bg-card border border-border rounded-xl p-6">
                <p className="text-xs text-muted-foreground mb-4 font-medium uppercase tracking-wide">Your ad, formatted for every platform</p>
                <div className="space-y-2">
                  {[
                    { name: 'Meta & Instagram', formats: '1:1 · 9:16 · 16:9' },
                    { name: 'TikTok', formats: '9:16 vertical' },
                    { name: 'Google', formats: '16:9 · banner · responsive' },
                    { name: 'YouTube', formats: '16:9 · bumper · skippable' },
                  ].map(({ name, formats }, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3 bg-background rounded-xl border border-border">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-600" />
                        <span className="text-sm font-medium text-foreground">{name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">{formats}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <span>1 ad created</span>
                  <span className="text-blue-600 font-medium">→ 4 platforms, auto-formatted</span>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl font-semibold text-foreground mb-4">
                Publish to every platform at once
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Create your ad once and let Ad-gentic handle the rest. It automatically formats
                and sizes your creative for each platform — no manual resizing, no copy-pasting.
              </p>
              <ul className="space-y-4">
                {[
                  'One-click publishing to Meta, TikTok, Instagram, YouTube, and Google',
                  'Auto-resizes to the right format for each platform (9:16, 1:1, 16:9)',
                  'Generates platform-native captions and hashtags',
                  'All your channel performance in one dashboard',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 3: Review & Approve */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-background border-b border-border">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-semibold text-foreground mb-4">
                You stay in control
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                The AI does the heavy lifting, but nothing goes live without your sign-off.
                Every ad goes through a review step so your brand always looks the way you want it to.
              </p>
              <ul className="space-y-4">
                {[
                  'Review every ad before it publishes',
                  "Flag anything that doesn't fit your brand voice",
                  'Built-in quality scoring to surface the best variations first',
                  'Full edit access before and after approval',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="bg-muted rounded-xl p-6 border border-border">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                    <span className="text-sm text-muted-foreground">Awaiting review</span>
                  </div>
                  <span className="px-2 py-1 bg-card border border-border text-foreground text-xs font-semibold rounded">
                    Score: 9.8 / 10
                  </span>
                </div>
                {/* Social ad mockup */}
                <div className="rounded-xl mb-5 overflow-hidden border border-border bg-card text-xs">
                  {/* Brand bar */}
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-[9px]">A</div>
                    <div>
                      <div className="font-semibold text-foreground text-[10px] leading-none">Ad-gentic</div>
                      <div className="text-[9px] text-muted-foreground">Sponsored</div>
                    </div>
                  </div>
                  {/* Image area */}
                  <div className="h-28 bg-muted flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-blue-900/30" />
                    <div className="relative w-10 h-10 rounded-full bg-white/20 border border-white/30 backdrop-blur-sm flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="2 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                  {/* Copy */}
                  <div className="px-3 py-2.5">
                    <div className="font-semibold text-foreground mb-0.5">⚡ Last chance — 48hrs only</div>
                    <div className="text-muted-foreground text-[10px] mb-2">Get 30% off before it's gone. Only 12 spots left.</div>
                    <button className="w-full py-1.5 bg-blue-600 text-white rounded text-[10px] font-semibold">Shop Now</button>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
                    Approve
                  </button>
                  <button className="flex-1 py-2.5 border border-border rounded-xl text-sm hover:bg-background transition-colors">
                    Request changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 border-b border-border">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7">
              <h2 className="text-3xl font-semibold mb-4">Ready to see it in action?</h2>
              <p className="text-muted-foreground mb-8 max-w-md leading-relaxed">
                Join 500+ brands using Ad-gentic to run smarter campaigns.
              </p>
              <Link to="/sign-up"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                Get started free
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="lg:col-span-5 flex flex-col gap-3">
              {[
                'No credit card required',
                'Free 14-day trial — full access',
                'Cancel anytime, no lock-in',
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:border-foreground/20 transition-colors">
                  <CheckIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">{text}</span>
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
