import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/ui/Logo';
import { ArrowRight, Sun, Moon, FileText, Upload, Menu, X, CheckIcon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export function HowItWorksPage() {
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
                className={`text-sm transition-colors ${link.label === 'How It Works' ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}>
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
            Four steps to ads that <span className="text-blue-600">connect</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From raw customer data to live, optimized campaigns — here's exactly how it works.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background border-b border-border">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Step 1: Upload */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="grid md:grid-cols-2">
              <div className="p-8 md:p-12 flex flex-col justify-center">
                <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-3">Step 1</p>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Upload your data</h2>
                <p className="text-muted-foreground mb-6">
                  Upload your customer data via CSV or connect your CRM directly.
                  We handle data cleaning and formatting automatically.
                </p>
                <span className="text-xs text-blue-600 bg-blue-500/10 border border-blue-500/20 rounded-full px-3 py-1 w-fit">Average setup time: 4 minutes</span>
              </div>
              <div className="bg-muted/30 p-8 md:p-12 flex items-center justify-center border-t md:border-t-0 md:border-l border-border">
                <div className="w-full max-w-sm">
                  {/* Drop zone */}
                  <div className="bg-card rounded-xl border-2 border-dashed border-border p-6 flex flex-col items-center text-center mb-4">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
                      <Upload className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground mb-1">Drag & drop files here</p>
                    <p className="text-xs text-muted-foreground">CSV, JSON, or Excel</p>
                  </div>
                  {/* File list */}
                  <div className="space-y-2">
                    {[
                      { name: 'customers_q4.csv', size: '2.4 MB', done: true },
                      { name: 'purchase_history.csv', size: '5.1 MB', done: true },
                      { name: 'email_list.xlsx', size: '890 KB', done: false },
                    ].map(({ name, size, done }, i) => (
                      <div key={i} className="flex items-center justify-between bg-card border border-border rounded-xl px-3 py-2">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-xs text-foreground font-medium truncate max-w-[140px]">{name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{size}</span>
                          <div className={`w-2 h-2 rounded-full ${done ? 'bg-blue-600' : 'bg-muted-foreground/40 animate-pulse'}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: AI Builds Segments */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="grid md:grid-cols-2">
              <div className="p-8 md:p-12 flex flex-col justify-center order-2 md:order-1">
                <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-3">Step 2</p>
                <h2 className="text-2xl font-semibold text-foreground mb-4">AI builds your audience segments</h2>
                <p className="text-muted-foreground mb-6">
                  The AI analyzes your data and groups customers into distinct segments based on
                  real buying behavior — each one gets its own tailored ad angle.
                </p>
                <span className="text-xs text-blue-600 bg-blue-500/10 border border-blue-500/20 rounded-full px-3 py-1 w-fit">Trained on 2.4M+ ad interactions</span>
              </div>
              <div className="bg-muted/30 p-8 md:p-12 flex items-center justify-center order-1 md:order-2 border-b md:border-b-0 md:border-l border-border">
                <div className="w-full max-w-sm space-y-3">
                  {[
                    { initial: 'D', label: 'Deal Seekers', trait: 'Driven by discounts & urgency', pct: 34 },
                    { initial: 'L', label: 'Brand Loyalists', trait: 'Value trust & consistency', pct: 28 },
                    { initial: 'R', label: 'Researchers', trait: 'Need data & comparisons', pct: 22 },
                    { initial: 'C', label: 'Casual Browsers', trait: 'Need discovery & inspiration', pct: 16 },
                  ].map(({ initial, label, trait, pct }, i) => (
                    <div key={i} className="bg-card border border-border rounded-xl px-4 py-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center text-xs font-semibold text-foreground">
                            {initial}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{label}</p>
                            <p className="text-xs text-muted-foreground">{trait}</p>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-blue-600">{pct}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1">
                        <div className="bg-blue-600 h-1 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Generate & Iterate */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="grid md:grid-cols-2">
              <div className="p-8 md:p-12 flex flex-col justify-center">
                <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-3">Step 3</p>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Generate & iterate</h2>
                <p className="text-muted-foreground mb-6">
                  Chat with the AI to refine your ads. Request changes to tone,
                  imagery, or copy and see updates instantly.
                </p>
                <span className="text-xs text-blue-600 bg-blue-500/10 border border-blue-500/20 rounded-full px-3 py-1 w-fit">Average: 3 iterations to final draft</span>
              </div>
              <div className="bg-muted/30 p-8 md:p-12 flex items-center justify-center border-t md:border-t-0 md:border-l border-border">
                <div className="bg-card rounded-xl p-4 w-full max-w-sm border border-border">
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
                    <span className="text-xs font-medium text-foreground">Ad Chat</span>
                    <span className="text-xs text-muted-foreground">Deal Seekers · Draft 3</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-end">
                      <div className="bg-blue-600 text-white px-3 py-2 rounded-xl rounded-tr-none text-xs max-w-[80%]">
                        Make it more urgent — limited time offer
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="bg-muted text-foreground px-3 py-2 rounded-xl rounded-tl-none text-xs max-w-[80%]">
                        Updated! Added countdown language and "only 12 left" scarcity hook.
                      </div>
                    </div>
                    <div className="bg-muted border border-border rounded-xl p-3">
                      <p className="text-xs font-semibold text-foreground mb-1">⚡ Last chance — 48hrs only</p>
                      <p className="text-xs text-muted-foreground mb-2">Get 30% off before it's gone. Only 12 spots left.</p>
                      <div className="h-2 bg-blue-600/20 rounded-full">
                        <div className="h-2 bg-blue-600 rounded-full w-3/4" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Quality score: 9.4 / 10</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4: Deploy & Measure */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="grid md:grid-cols-2">
              <div className="p-8 md:p-12 flex flex-col justify-center order-2 md:order-1">
                <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-3">Step 4</p>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Deploy & measure</h2>
                <p className="text-muted-foreground mb-6">
                  Launch campaigns across all platforms with one click. Track
                  performance in real-time from a single dashboard.
                </p>
                <span className="text-xs text-blue-600 bg-blue-500/10 border border-blue-500/20 rounded-full px-3 py-1 w-fit">Results visible in under 60 seconds</span>
              </div>
              <div className="bg-muted/30 p-8 md:p-12 flex items-center justify-center order-1 md:order-2 border-b md:border-b-0 md:border-l border-border">
                <div className="bg-card rounded-xl p-5 w-full max-w-sm border border-border">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-medium text-foreground">Campaign Performance</span>
                    <span className="text-xs text-blue-600 font-semibold">+124% CTR</span>
                  </div>
                  {/* Bar chart */}
                  <div className="flex items-end gap-1.5 h-28 mb-2">
                    {[22, 35, 28, 45, 38, 55, 42, 62, 58, 75, 68, 90].map((h, i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-t ${i >= 8 ? 'bg-blue-600' : 'bg-muted-foreground/25'}`}
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground border-t border-border pt-2 mb-4">
                    {['Jan', 'Feb', 'Mar', 'Apr'].map(m => (
                      <span key={m}>{m}</span>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-2 border-t border-border pt-3">
                    {[
                      { label: 'CTR', value: '4.8%', up: true },
                      { label: 'Conversions', value: '1,240', up: true },
                      { label: 'CPC', value: '$0.42', up: false },
                    ].map(({ label, value, up }) => (
                      <div key={label} className="text-center">
                        <p className={`text-xs font-semibold ${up ? 'text-blue-600' : 'text-foreground'}`}>{value}</p>
                        <p className="text-[10px] text-muted-foreground">{label}</p>
                      </div>
                    ))}
                  </div>
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
              <h2 className="text-3xl font-semibold mb-4">Ready to get started?</h2>
              <p className="text-muted-foreground mb-8 max-w-md leading-relaxed">
                Launch your first campaign in minutes.
              </p>
              <Link to="/sign-up"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                Start your first campaign
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
