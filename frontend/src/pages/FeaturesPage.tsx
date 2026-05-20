import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/ui/Logo';
import { Sun, Moon, CheckIcon, Menu, X, ArrowRight, Play } from 'lucide-react';
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
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 gap-8">
          <Link to="/" className="hover:opacity-75 transition-opacity"><Logo size="md" /></Link>

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
        <div className="pointer-events-none absolute inset-0 -z-0" style={{ background: 'radial-gradient(ellipse 60% 50% at 60% 0%, rgba(129,140,248,0.07) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 20% 80%, rgba(245,158,11,0.06) 0%, transparent 65%)' }} />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 tracking-tight leading-[1.05]">
            What Ad-gentic{' '}
            <em className="font-serif italic" style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #818CF8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontStyle: 'italic', padding: '0 3px', margin: '0 -3px' }}>does</em>
          </h1>
          <p className="text-lg text-muted-foreground">
            Four capabilities that take you from customer data to live, persona-targeted video campaigns.
          </p>
        </div>
      </section>

      {/* Feature grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-b border-border">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-6">

          {/* Audience Segmentation */}
          <div className="bg-card border border-border rounded overflow-hidden flex flex-col">
            <div className="h-1 w-full bg-amber-400 dark:bg-amber-500" />
            <div className="p-8 flex flex-col flex-1">
              <h2 className="text-xl font-semibold mb-2">Audience segmentation</h2>
              <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                A Gaussian Mixture Model runs over your uploaded consumer data and assigns each customer
                to a behavioral persona — deal-seekers, brand loyalists, researchers, and more — based
                on purchase patterns, traits, and engagement signals.
              </p>
              <ul className="space-y-2 mb-6">
                {[
                  'Each persona gets its own motivators, pain points, and ad tone',
                  'Every consumer assigned a per-persona confidence score',
                  'Works across industries and customer list sizes',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckIcon className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              {/* Mini mockup */}
              <div className="mt-auto border-t border-border pt-5">
                <p className="font-mono text-[10px] text-muted-foreground mb-2">3,200 consumers · 4 personas detected</p>
                <div className="divide-y divide-border">
                  {[
                    { label: 'Deal Seekers', pct: 34, color: 'bg-amber-500' },
                    { label: 'Brand Loyalists', pct: 28, color: 'bg-violet-500' },
                    { label: 'Researchers', pct: 22, color: 'bg-emerald-500' },
                    { label: 'Casual Browsers', pct: 16, color: 'bg-rose-500' },
                  ].map(({ label, pct, color }, i) => (
                    <div key={i} className="flex items-center gap-3 py-2">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${color}`} />
                      <span className="text-xs flex-1">{label}</span>
                      <div className="w-24 h-1 bg-border rounded-full overflow-hidden">
                        <div className={`h-full ${color}`} style={{ width: `${pct * 2.5}%` }} />
                      </div>
                      <span className="font-mono text-[10px] text-muted-foreground w-6 text-right">{pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* AI Strategist */}
          <div className="bg-card border border-border rounded overflow-hidden flex flex-col">
            <div className="h-1 w-full bg-violet-400 dark:bg-violet-500" />
            <div className="p-8 flex flex-col flex-1">
              <h2 className="text-xl font-semibold mb-2">AI Campaign Strategist</h2>
              <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                Describe your campaign in plain language. The AI Strategist asks one or two clarifying
                questions, then produces a structured plan — personas, variant counts, tone, CTA style,
                and a full creative brief — before a single frame is generated.
              </p>
              <ul className="space-y-2 mb-6">
                {[
                  'Avg. 3 messages from brief to approved plan',
                  'Plan covers personas, formats, tone, and CTA style',
                  'Revise mid-conversation before anything is generated',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckIcon className="w-3.5 h-3.5 text-violet-500 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              {/* Mini mockup */}
              <div className="mt-auto border-t border-border pt-5 space-y-2">
                <div className="flex justify-end">
                  <div className="bg-primary text-primary-foreground px-3 py-1.5 rounded rounded-tr-none text-xs max-w-[80%]">
                    Create ads for my HydroFlask targeting health-conscious buyers
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-muted text-foreground px-3 py-1.5 rounded rounded-tl-none text-xs max-w-[80%]">
                    Deal Seekers + Researchers · 4 variants each · aspirational tone. Approve?
                  </div>
                </div>
                <div className="border border-border rounded p-2.5 bg-background">
                  <p className="font-mono text-[10px] text-muted-foreground mb-1.5">plan · approved</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                    {[
                      { label: 'personas', value: '2 groups' },
                      { label: 'variants', value: '8 total' },
                      { label: 'tone', value: 'aspirational' },
                      { label: 'cta', value: 'urgency' },
                    ].map((row) => (
                      <div key={row.label} className="flex items-baseline gap-1.5">
                        <span className="font-mono text-[10px] text-muted-foreground">{row.label}</span>
                        <span className="text-[10px] font-medium">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Multi-platform Publishing */}
          <div className="bg-card border border-border rounded overflow-hidden flex flex-col">
            <div className="h-1 w-full bg-emerald-400 dark:bg-emerald-500" />
            <div className="p-8 flex flex-col flex-1">
              <h2 className="text-xl font-semibold mb-2">Multi-platform publishing</h2>
              <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                Connect your ad accounts once. Ad-gentic structures your campaign automatically —
                one Ad Set per persona, one Ad per variant — and publishes to every platform simultaneously,
                all paused so you control when they go live.
              </p>
              <ul className="space-y-2 mb-6">
                {[
                  'Meta, TikTok, Instagram, YouTube, and Google',
                  'Campaign structure built automatically — Ad Sets, targeting, all set',
                  'All ads publish paused — activate when you\'re ready',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckIcon className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              {/* Mini mockup */}
              <div className="mt-auto border-t border-border pt-5">
                <p className="font-mono text-[10px] text-muted-foreground mb-2">HydroFlask Q1 · 5 variants published</p>
                <div className="divide-y divide-border">
                  {['Meta', 'TikTok', 'Instagram', 'YouTube', 'Google'].map((platform) => (
                    <div key={platform} className="flex items-center gap-3 py-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span className="text-xs flex-1">{platform}</span>
                      <span className="font-mono text-[10px] text-amber-600 dark:text-amber-400">PAUSED</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Review & Approve */}
          <div className="bg-card border border-border rounded overflow-hidden flex flex-col">
            <div className="h-1 w-full bg-amber-400 dark:bg-amber-500" />
            <div className="p-8 flex flex-col flex-1">
              <h2 className="text-xl font-semibold mb-2">Review & approve</h2>
              <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                The AI does the heavy lifting, but nothing goes live without your sign-off.
                Watch every generated video before publishing. Approve per-variant — not per-batch —
                then publish in one click.
              </p>
              <ul className="space-y-2 mb-6">
                {[
                  'Watch every video before it publishes — no surprises',
                  'Brand-safety moderation runs automatically before review',
                  'Full re-generate access before and after approval',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckIcon className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              {/* Mini mockup */}
              <div className="mt-auto border-t border-border pt-5">
                <p className="font-mono text-[10px] text-muted-foreground mb-2">variant review · 5 of 8 approved</p>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[true, true, false, true, true, false, true, false].map((approved, i) => (
                    <div key={i} className={`aspect-video rounded border flex items-center justify-center ${approved ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' : 'border-border bg-muted/40'}`}>
                      {approved
                        ? <CheckIcon className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        : <Play className="w-3 h-3 text-muted-foreground/50" />}
                    </div>
                  ))}
                </div>
                <button className="w-full py-2 bg-primary text-primary-foreground rounded text-xs font-medium">
                  Publish 5 approved variants
                </button>
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
                Import your customers, describe your goal, and have persona-targeted video ads live across your platforms in minutes.
              </p>
              <Link to="/sign-up"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded text-sm font-medium hover:bg-primary/90 transition-colors">
                Get started free
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="lg:col-span-5 flex flex-col divide-y divide-border border-t border-b border-border">
              {[
                { text: 'No credit card required', sub: 'Start immediately' },
                { text: 'Free 14-day trial — full access', sub: 'Every feature unlocked' },
                { text: 'Cancel anytime, no lock-in', sub: 'No contracts' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 py-4 pl-4 border-l-2 border-emerald-400 dark:border-emerald-500">
                  <CheckIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div>
                    <span className="text-sm font-medium block">{item.text}</span>
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
