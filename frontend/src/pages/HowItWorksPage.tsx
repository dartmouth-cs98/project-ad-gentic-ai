import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/ui/Logo';
import { ArrowRight, Sun, Moon, FileText, Menu, X, CheckIcon, Play } from 'lucide-react';
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
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 gap-8">
          <Link to="/" className="hover:opacity-75 transition-opacity"><Logo size="md" /></Link>

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
          style={{ background: 'radial-gradient(ellipse 60% 50% at 60% 0%, rgba(129,140,248,0.07) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 20% 80%, rgba(245,158,11,0.06) 0%, transparent 65%)' }}
        />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 tracking-tight leading-[1.05]">
            From customer data to{' '}
            <em className="font-serif italic" style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #818CF8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontStyle: 'italic' }}>live ads</em>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Five steps from raw data to persona-targeted video ads across your ad platforms.
          </p>
        </div>
      </section>

      {/* Step 1 */}
      <section className="border-b border-border">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-0">
          <div className="px-8 py-14 md:px-12 md:py-20 flex flex-col justify-center">
            <p className="font-mono text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-3">Step 1</p>
            <h2 className="text-2xl font-semibold mb-4">Add your product & import customers</h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Define the product you're advertising — name, description, and images. Then upload your customer list as a CSV. Ad-gentic maps your columns automatically and builds a consumer profile for each row.
            </p>
            <p className="font-mono text-xs text-muted-foreground">Accepts CSV · JSON · Excel — avg. setup 4 min</p>
          </div>
          <div className="bg-muted/30 px-8 py-14 md:px-12 md:py-20 flex items-center justify-center">
            <div className="w-full max-w-sm space-y-3">
              <div className="bg-background border border-border rounded p-4">
                <p className="text-[10px] font-mono text-muted-foreground mb-2">product</p>
                <p className="text-sm font-semibold">HydroFlask 32oz</p>
                <p className="text-xs text-muted-foreground mt-1">BPA-free, 24hr insulation, 3 colorways</p>
                <div className="flex gap-2 mt-3">
                  {['#E5E7EB', '#D1D5DB', '#9CA3AF'].map((c, i) => (
                    <div key={i} className="w-6 h-6 rounded border border-border" style={{ background: c }} />
                  ))}
                  <span className="text-[10px] text-muted-foreground self-center ml-1">+2 images</span>
                </div>
              </div>
              <div className="bg-background border border-border rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-mono text-muted-foreground">customer import</p>
                  <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400">3,200 rows</span>
                </div>
                <div className="space-y-1.5">
                  {[
                    { name: 'customers_q4.csv', size: '2.4 MB', done: true },
                    { name: 'purchase_history.csv', size: '5.1 MB', done: true },
                    { name: 'email_list.xlsx', size: '890 KB', done: false },
                  ].map(({ name, size, done }, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs text-foreground truncate max-w-[140px]">{name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground">{size}</span>
                        <div className={`w-1.5 h-1.5 rounded-full ${done ? 'bg-emerald-500' : 'bg-muted-foreground/40 animate-pulse'}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Step 2 */}
      <section className="border-b border-border bg-muted/20">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-0">
          <div className="bg-muted/30 px-8 py-14 md:px-12 md:py-20 flex items-center justify-center order-2 md:order-1">
            <div className="w-full max-w-sm">
              <p className="text-[10px] font-mono text-muted-foreground mb-3">persona assignment — 3,200 consumers</p>
              <div className="divide-y divide-border border-t border-b border-border">
                {[
                  { label: 'Deal Seekers', trait: 'Driven by discounts & urgency', pct: 34, color: 'bg-amber-500', textColor: 'text-amber-600 dark:text-amber-400', conf: 'high' },
                  { label: 'Brand Loyalists', trait: 'Value trust & consistency', pct: 28, color: 'bg-violet-500', textColor: 'text-violet-600 dark:text-violet-400', conf: 'high' },
                  { label: 'Researchers', trait: 'Need data & comparisons', pct: 22, color: 'bg-emerald-500', textColor: 'text-emerald-600 dark:text-emerald-400', conf: 'medium' },
                  { label: 'Casual Browsers', trait: 'Need discovery & inspiration', pct: 16, color: 'bg-rose-500', textColor: 'text-rose-600 dark:text-rose-400', conf: 'medium' },
                ].map(({ label, trait, pct, color, textColor, conf }, i) => (
                  <div key={i} className="py-3 grid grid-cols-[6px_1fr_auto] gap-x-3 items-start">
                    <div className={`w-1.5 rounded-full ${color} mt-0.5`} style={{ height: '2rem' }} />
                    <div className="min-w-0">
                      <span className="text-xs font-medium block">{label}</span>
                      <span className="text-[10px] text-muted-foreground">{trait}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`font-mono text-[10px] font-semibold ${textColor} block`}>{pct}%</span>
                      <span className="font-mono text-[10px] text-muted-foreground">{conf}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="px-8 py-14 md:px-12 md:py-20 flex flex-col justify-center order-1 md:order-2">
            <p className="font-mono text-[10px] font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wide mb-3">Step 2</p>
            <h2 className="text-2xl font-semibold mb-4">AI segments your audience into personas</h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              A Gaussian Mixture Model runs over your consumer data and assigns each customer to a behavioral persona — based on purchase patterns, traits, and engagement signals. Every persona gets its own motivators, pain points, and preferred ad tone.
            </p>
            <p className="font-mono text-xs text-muted-foreground">Trained on 2.4M+ ad interactions</p>
          </div>
        </div>
      </section>

      {/* Step 3 */}
      <section className="border-b border-border">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-0">
          <div className="px-8 py-14 md:px-12 md:py-20 flex flex-col justify-center">
            <p className="font-mono text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-3">Step 3</p>
            <h2 className="text-2xl font-semibold mb-4">Chat with the AI Strategist</h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Describe your campaign in plain language. The AI Strategist asks clarifying questions then outputs a structured plan: which personas to target, how many video variants per group, tone, CTA style, and a full creative brief — before a single frame is generated.
            </p>
            <p className="font-mono text-xs text-muted-foreground">Avg. 3 messages to a finalised plan</p>
          </div>
          <div className="bg-muted/30 px-8 py-14 md:px-12 md:py-20 flex items-center justify-center">
            <div className="bg-background rounded p-4 w-full max-w-sm border border-border">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
                <span className="text-xs font-medium">Campaign Strategist</span>
                <span className="font-mono text-[10px] text-muted-foreground">HydroFlask · draft</span>
              </div>
              <div className="space-y-3 mb-3">
                <div className="flex justify-end">
                  <div className="bg-primary text-primary-foreground px-3 py-2 rounded rounded-tr-none text-xs max-w-[85%]">
                    Create video ads for my HydroFlask targeting health-conscious buyers
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-muted text-foreground px-3 py-2 rounded rounded-tl-none text-xs max-w-[85%]">
                    Got it. I'll target Deal Seekers and Researchers — 4 variants each. Tone: aspirational. CTA: urgency. Ready to generate?
                  </div>
                </div>
              </div>
              <div className="border border-border rounded p-3 bg-muted/30">
                <p className="font-mono text-[10px] text-muted-foreground mb-2">plan · approved</p>
                <div className="flex flex-col gap-1">
                  {[
                    { label: 'personas', value: 'Deal Seekers · Researchers' },
                    { label: 'variants', value: '4 per group · 8 total' },
                    { label: 'tone', value: 'aspirational · urgency CTA' },
                    { label: 'format', value: 'Instagram Story · Facebook Feed' },
                  ].map((row) => (
                    <div key={row.label} className="flex items-baseline gap-2">
                      <span className="font-mono text-[10px] text-muted-foreground w-14 shrink-0">{row.label}</span>
                      <span className="text-[10px] font-medium">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Step 4 */}
      <section className="border-b border-border bg-muted/20">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-0">
          <div className="bg-muted/30 px-8 py-14 md:px-12 md:py-20 flex items-center justify-center order-2 md:order-1">
            <div className="w-full max-w-sm space-y-3">
              <p className="font-mono text-[10px] text-muted-foreground">generating 8 variants across 2 persona groups</p>
              {[
                { persona: 'Deal Seekers', done: 4, total: 4, color: 'bg-amber-500' },
                { persona: 'Researchers', done: 2, total: 4, color: 'bg-violet-500' },
              ].map(({ persona, done, total, color }) => (
                <div key={persona} className="bg-background border border-border rounded p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium">{persona}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">{done}/{total} done</span>
                  </div>
                  <div className="space-y-1.5">
                    {['Script', 'Moderate', 'Render', 'Upload'].map((step, i) => {
                      const stepDone = i < Math.ceil(done / total * 4);
                      return (
                        <div key={step} className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${stepDone ? color : 'bg-muted-foreground/30'}`} />
                          <span className={`font-mono text-[10px] ${stepDone ? 'text-foreground' : 'text-muted-foreground/50'}`}>{step}</span>
                          {stepDone && <div className="flex-1 h-px bg-border" />}
                          {stepDone && <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400">✓</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="px-8 py-14 md:px-12 md:py-20 flex flex-col justify-center order-1 md:order-2">
            <p className="font-mono text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-3">Step 4</p>
            <h2 className="text-2xl font-semibold mb-4">AI generates a video ad for each persona</h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              For each variant, the system generates a persona-specific script — dialogue, voiceover, music cues — then passes it through brand-safety moderation and renders an MP4. Each video is calibrated to your consumer's profile, not just the persona archetype.
            </p>
            <p className="font-mono text-xs text-muted-foreground">Script → Moderate → Render → Upload · ~2 min per variant</p>
          </div>
        </div>
      </section>

      {/* Step 5 */}
      <section className="border-b border-border">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-0">
          <div className="px-8 py-14 md:px-12 md:py-20 flex flex-col justify-center">
            <p className="font-mono text-[10px] font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wide mb-3">Step 5</p>
            <h2 className="text-2xl font-semibold mb-4">Review, approve & publish across platforms</h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Watch every generated video before anything goes live. Approve the variants you want to run, then publish in one click. Ad-gentic structures your campaign automatically — one Ad Set per persona, one Ad per variant — across every connected platform. All ads publish paused so you control when they launch.
            </p>
            <p className="font-mono text-xs text-muted-foreground">Meta · TikTok · YouTube · LinkedIn · Google Ads</p>
          </div>
          <div className="bg-muted/30 px-8 py-14 md:px-12 md:py-20 flex items-center justify-center">
            <div className="w-full max-w-sm space-y-3">
              <div className="bg-background border border-border rounded p-4">
                <p className="font-mono text-[10px] text-muted-foreground mb-3">variant review · 5 of 8 approved</p>
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
              <div className="bg-background border border-border rounded p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <p className="font-mono text-[10px] text-muted-foreground">Meta · connected</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-muted-foreground w-20">Campaign</span>
                    <span className="text-xs font-medium">HydroFlask Q1</span>
                    <span className="font-mono text-[10px] text-amber-600 dark:text-amber-400 ml-auto">PAUSED</span>
                  </div>
                  {[
                    { label: 'Ad Set', value: 'Deal Seekers · 3 ads' },
                    { label: 'Ad Set', value: 'Researchers · 2 ads' },
                  ].map((row, i) => (
                    <div key={i} className="flex items-center gap-2 pl-3 border-l border-border">
                      <span className="font-mono text-[10px] text-muted-foreground w-20">{row.label}</span>
                      <span className="text-xs text-muted-foreground">{row.value}</span>
                    </div>
                  ))}
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
              <h2 className="text-3xl font-semibold mb-4">Ready to run your first campaign?</h2>
              <p className="text-muted-foreground mb-8 max-w-md leading-relaxed">
                Import your customers, describe your goal, and have persona-targeted video ads live across your platforms in minutes.
              </p>
              <Link to="/sign-up"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded text-sm font-medium hover:bg-primary/90 transition-colors">
                Start your first campaign
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="lg:col-span-5 divide-y divide-border border-t border-b border-border">
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
