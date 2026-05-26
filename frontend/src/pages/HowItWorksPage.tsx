import '../landing.css';
import { Link } from 'react-router-dom';
import { LandingHeader } from '../components/landing/LandingHeader';
import { LandingFooter } from '../components/landing/LandingFooter';


function DiagImport() {
  const files = [
    { name: 'customers_q4.csv',      size: '2.4 MB', done: true },
    { name: 'purchase_history.csv',  size: '5.1 MB', done: true },
    { name: 'email_list.xlsx',       size: '890 KB',  done: false },
  ];
  return (
    <div className="lp-feature-visual">
      <div className="lp-diag-product">
        <div className="lp-diag-product-name">HydroFlask 32oz</div>
        <div className="lp-diag-product-sub">BPA-free · 24hr insulation · 3 colorways</div>
        <div className="lp-diag-swatches">
          {['#C8C8C8', '#A0A0A0', '#707070'].map((c, i) => (
            <div key={i} className="lp-diag-swatch" style={{ background: c }} />
          ))}
          <span style={{ fontSize: 10, color: 'var(--ink-2)', alignSelf: 'center', marginLeft: 4 }}>+2 images</span>
        </div>
      </div>
      <div className="lp-diag-label">CUSTOMER IMPORT · 3,200 ROWS</div>
      {files.map(({ name, size, done }) => (
        <div className="lp-diag-file-row" key={name}>
          <span className="lp-diag-file-name">{name}</span>
          <span className="lp-diag-file-meta">
            {size}
            <span className={`lp-diag-file-dot${done ? ' done' : ''}`} />
          </span>
        </div>
      ))}
    </div>
  );
}

function DiagPersonas() {
  const rows = [
    { label: 'Deal Seekers',    trait: 'Driven by discounts & urgency',   pct: 34 },
    { label: 'Brand Loyalists', trait: 'Value trust & consistency',        pct: 28 },
    { label: 'Researchers',     trait: 'Need data & comparisons',          pct: 22 },
    { label: 'Casual Browsers', trait: 'Need discovery & inspiration',     pct: 16 },
  ];
  return (
    <div className="lp-feature-visual">
      <div className="lp-diag-label">PERSONA ASSIGNMENT · 3,200 CONSUMERS</div>
      {rows.map(({ label, trait, pct }, i) => (
        <div className="lp-diag-row" key={label} style={{ alignItems: 'flex-start', paddingTop: 10, paddingBottom: 10 }}>
          <span className={`lp-diag-dot${i === 0 ? ' accent' : ''}`} style={{ marginTop: 3 }} />
          <span className="lp-diag-name" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 12, fontWeight: 500 }}>{label}</span>
            <span style={{ fontSize: 10, color: 'var(--ink-2)' }}>{trait}</span>
          </span>
          <span className="lp-diag-pct" style={{ width: 'auto', paddingTop: 2 }}>{pct}%</span>
        </div>
      ))}
    </div>
  );
}

function DiagStrategist() {
  return (
    <div className="lp-feature-visual">
      <div className="lp-diag-label">CAMPAIGN BRIEF · IN PROGRESS</div>
      <div className="lp-diag-chat">
        <div className="lp-diag-bubble-user">
          Create video ads for HydroFlask targeting health-conscious buyers
        </div>
        <div className="lp-diag-bubble-ai">
          Deal Seekers + Researchers · 4 variants each · aspirational tone. Approve?
        </div>
      </div>
      <div className="lp-diag-plan">
        <div className="lp-diag-plan-head">PLAN · APPROVED</div>
        {[
          { key: 'personas',  val: 'Deal Seekers · Researchers' },
          { key: 'variants',  val: '4 per group · 8 total' },
          { key: 'tone',      val: 'aspirational · urgency CTA' },
          { key: 'formats',   val: 'Story · Feed · Display' },
        ].map(({ key, val }) => (
          <div className="lp-diag-plan-row" key={key}>
            <span className="lp-diag-plan-key">{key}</span>
            <span>{val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DiagGenerate() {
  const groups = [
    { label: 'Deal Seekers',    steps: ['Script', 'Moderate', 'Render', 'Upload'], done: 4 },
    { label: 'Researchers',     steps: ['Script', 'Moderate', 'Render', 'Upload'], done: 2 },
  ];
  return (
    <div className="lp-feature-visual">
      <div className="lp-diag-label">GENERATING 8 VARIANTS · 2 GROUPS</div>
      {groups.map(({ label, steps, done }, gi) => (
        <div key={label} style={{ marginBottom: gi === 0 ? 14 : 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 500 }}>{label}</span>
            <span className="lp-mono lp-small lp-muted">{done}/{steps.length} done</span>
          </div>
          <div className="lp-diag-pipeline">
            {steps.map((step, i) => {
              const state = i < done ? 'done' : i === done ? 'active' : 'pending';
              return (
                <div className="lp-diag-pipeline-step" key={step}>
                  <span className={`lp-diag-pipeline-dot${state === 'done' ? ' done' : state === 'active' ? ' active' : ''}`} />
                  <span className={`lp-diag-pipeline-label ${state === 'pending' ? 'pending' : 'done'}`}>{step}</span>
                  <span className={`lp-diag-pipeline-check${state === 'done' ? ' done' : ''}`}>
                    {state === 'done' ? '✓' : state === 'active' ? '···' : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function DiagPublish() {
  const approved = [true, true, false, true, true, false, true, false];
  return (
    <div className="lp-feature-visual">
      <div className="lp-diag-label">VARIANT REVIEW · 5 OF 8 APPROVED</div>
      <div className="lp-diag-thumb-grid" style={{ marginBottom: 14 }}>
        {approved.map((ok, i) => (
          <div key={i} className={`lp-diag-thumb${ok ? '' : ' pending'}`}>
            {ok && <div className="lp-diag-thumb-stripes" />}
            <div className="lp-diag-thumb-check">{ok ? '✓' : ''}</div>
          </div>
        ))}
      </div>
      <div className="lp-diag-publish-btn" style={{ marginBottom: 14 }}>
        PUBLISH 5 APPROVED VARIANTS →
      </div>
      <div className="lp-diag-label" style={{ marginBottom: 8, marginTop: 4 }}>CAMPAIGN STRUCTURE · META</div>
      <div className="lp-diag-tree">
        <div className="lp-diag-tree-row">
          <span className="lp-diag-tree-key">campaign</span>
          <span className="lp-diag-tree-val">HydroFlask Q1</span>
          <span className="lp-diag-tree-badge">PAUSED</span>
        </div>
        <div className="lp-diag-tree-indent">
          {[
            { key: 'ad set', val: 'Deal Seekers · 3 ads' },
            { key: 'ad set', val: 'Researchers · 2 ads' },
          ].map((row, i) => (
            <div className="lp-diag-tree-row" key={i}>
              <span className="lp-diag-tree-key">{row.key}</span>
              <span className="lp-diag-tree-val lp-muted">{row.val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


const STEPS = [
  {
    num: '01',
    label: '— ADD YOUR PRODUCT',
    title: 'Define your product and import customers',
    body: 'Enter your product name, description, and images. Then upload your customer list as a CSV. Adgentic maps your columns automatically and builds a consumer profile for every row.',
    note: 'Accepts CSV · JSON · Excel — avg. setup 4 min',
    Diagram: DiagImport,
    flip: false,
  },
  {
    num: '02',
    label: '— AUDIENCE INTELLIGENCE',
    title: 'AI segments your audience into personas',
    body: 'A clustering model runs over your consumer data and assigns each customer to a behavioral persona — based on purchase patterns, traits, and engagement signals. Every persona gets its own motivators, pain points, and preferred ad tone.',
    note: 'Trained on 2.4M+ ad interactions',
    Diagram: DiagPersonas,
    flip: true,
  },
  {
    num: '03',
    label: '— CAMPAIGN STRATEGY',
    title: 'Brief the AI Strategist in plain language',
    body: 'Describe your campaign. The AI asks one or two clarifying questions, then outputs a structured plan — which personas to target, variant counts, tone, CTA style, and formats — before anything is generated.',
    note: 'Avg. 3 messages from brief to approved plan',
    Diagram: DiagStrategist,
    flip: false,
  },
  {
    num: '04',
    label: '— CREATIVE GENERATION',
    title: 'AI generates a video ad for each persona',
    body: 'For each variant, the system writes a persona-specific script, runs brand-safety moderation, then renders an MP4. Each video is calibrated to your consumer\'s profile — not just the persona archetype.',
    note: 'Script → Moderate → Render → Upload · ~2 min per variant',
    Diagram: DiagGenerate,
    flip: true,
  },
  {
    num: '05',
    label: '— PUBLISH',
    title: 'Review, approve and publish across platforms',
    body: 'Watch every generated video before anything goes live. Approve the variants you want, then publish in one click. Adgentic builds the campaign structure automatically — one ad set per persona, one ad per variant — across every connected platform. All ads publish paused.',
    note: 'Meta · TikTok · YouTube · LinkedIn · Google Ads',
    Diagram: DiagPublish,
    flip: false,
  },
];


export function HowItWorksPage() {
  return (
    <div className="landing-page">
      <LandingHeader />

      <main>
        {/* Hero */}
        <section className="lp-features-hero">
          <div className="lp-container">
            <div className="lp-features-hero-inner">
              <span className="lp-eyebrow lp-mono">— THE PROCESS</span>
              <h1 className="lp-section-h2" style={{ fontSize: 'clamp(40px, 5vw, 68px)' }}>
                From customer data<br />to live ads.
              </h1>
              <p className="lp-section-deck" style={{ maxWidth: 520, marginTop: 16 }}>
                Five steps from raw customer data to persona-targeted ad variants
                running across your platforms — no agency, no handoffs, no re-exports.
              </p>
            </div>
          </div>
        </section>

        {/* Steps */}
        <section>
          {STEPS.map(({ num, label, title, body, note, Diagram, flip }) => (
            <div key={num} className="lp-container">
              <div className={`lp-feature-block${flip ? ' flip' : ''}`}>
                <div>
                  <span className="lp-hiw-step-num">{num} {label}</span>
                  <h2 className="lp-feature-title">{title}</h2>
                  <p className="lp-feature-body">{body}</p>
                  <p className="lp-hiw-note">{note}</p>
                </div>
                <Diagram />
              </div>
            </div>
          ))}
        </section>

        {/* CTA */}
        <section className="lp-cta-section">
          <div className="lp-container">
            <div className="lp-cta-grid">
              <div>
                <span className="lp-eyebrow lp-mono">— GET STARTED</span>
                <h2 className="lp-cta-head">
                  Ready to run<br />
                  <span className="lp-muted">your first campaign?</span>
                </h2>
              </div>
              <div className="lp-cta-right">
                <Link to="/sign-up" className="lp-btn-solid lg">
                  Start free trial
                  <span className="lp-btn-arrow" aria-hidden="true">→</span>
                </Link>
                <ul className="lp-cta-meta lp-mono">
                  <li>· No card required</li>
                  <li>· Bring your own customer data</li>
                  <li>· Cancel anytime</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
