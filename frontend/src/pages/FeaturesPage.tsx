import '../landing.css';
import { Link } from 'react-router-dom';
import { LandingHeader } from '../components/landing/LandingHeader';
import { LandingFooter } from '../components/landing/LandingFooter';

function DiagSegmentation() {
  const rows = [
    { label: 'Deal Seekers',     pct: 34, accent: true },
    { label: 'Brand Loyalists',  pct: 28 },
    { label: 'Researchers',      pct: 22 },
    { label: 'Casual Browsers',  pct: 16 },
  ];
  return (
    <div className="lp-feature-visual">
      <div className="lp-diag-label">3,200 CONSUMERS · 4 PERSONAS DETECTED</div>
      {rows.map(({ label, pct, accent }) => (
        <div className="lp-diag-row" key={label}>
          <span className={`lp-diag-dot${accent ? ' accent' : ''}`} />
          <span className="lp-diag-name">{label}</span>
          <span className="lp-diag-bar">
            <span className="lp-diag-bar-fill" style={{ width: `${pct * 2.5}%` }} />
          </span>
          <span className="lp-diag-pct">{pct}%</span>
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
          Create ads for our running shoe targeting health-conscious commuters
        </div>
        <div className="lp-diag-bubble-ai">
          Commuter + Performance personas · 6 variants · aspirational tone. Approve?
        </div>
      </div>
      <div className="lp-diag-plan">
        <div className="lp-diag-plan-head">PLAN · APPROVED</div>
        {[
          { key: 'personas',  val: '2 groups' },
          { key: 'variants',  val: '6 total' },
          { key: 'formats',   val: 'video + static' },
          { key: 'platforms', val: 'Meta, TikTok, Google' },
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

function DiagPublishing() {
  const platforms = [
    { name: 'Meta',     status: 'LIVE',   live: true },
    { name: 'TikTok',   status: 'LIVE',   live: true },
    { name: 'Google',   status: 'PAUSED', live: false },
    { name: 'LinkedIn', status: 'PAUSED', live: false },
    { name: 'YouTube',  status: 'PAUSED', live: false },
  ];
  return (
    <div className="lp-feature-visual">
      <div className="lp-diag-label">SPRING CAMPAIGN · 6 VARIANTS PUBLISHED</div>
      {platforms.map(({ name, status, live }) => (
        <div className="lp-diag-platform-row" key={name}>
          <span className={`lp-diag-dot${live ? ' accent' : ''}`} />
          <span className="lp-diag-name">{name}</span>
          <span className={`lp-diag-status${live ? ' live' : ''}`}>{status}</span>
        </div>
      ))}
    </div>
  );
}

function DiagReview() {
  const approved = [true, true, false, true, true, false, true, false];
  return (
    <div className="lp-feature-visual">
      <div className="lp-diag-label">VARIANT REVIEW · 5 OF 8 APPROVED</div>
      <div className="lp-diag-thumb-grid">
        {approved.map((ok, i) => (
          <div key={i} className={`lp-diag-thumb${ok ? '' : ' pending'}`}>
            {ok && <div className="lp-diag-thumb-stripes" />}
            <div className="lp-diag-thumb-check">{ok ? '✓' : ''}</div>
          </div>
        ))}
      </div>
      <div className="lp-diag-publish-btn">PUBLISH 5 APPROVED VARIANTS →</div>
    </div>
  );
}

const FEATURES = [
  {
    num: '01',
    label: '— AUDIENCE INTELLIGENCE',
    title: 'Personas from your real customer data',
    body: 'Upload your consumer list once. Adgentic runs a clustering model over purchase patterns, traits, and engagement signals — and assigns every customer to a behavioral persona. No guesswork, no stock segments.',
    checks: [
      'Each persona gets its own motivators, tone, and CTA style',
      'Every customer assigned a per-persona confidence score',
      'Works across industries and list sizes',
    ],
    Diagram: DiagSegmentation,
    flip: false,
  },
  {
    num: '02',
    label: '— AI CAMPAIGN STRATEGIST',
    title: 'From brief to approved plan in three messages',
    body: 'Describe your campaign in plain language. The AI asks one or two clarifying questions, then produces a full structured plan — personas, variant counts, formats, tone, and CTA style — before a single asset is generated.',
    checks: [
      'Avg. 3 messages from brief to approved plan',
      'Plan covers personas, formats, platforms, and creative angle',
      'Revise mid-conversation before any generation runs',
    ],
    Diagram: DiagStrategist,
    flip: true,
  },
  {
    num: '03',
    label: '— MULTI-PLATFORM PUBLISHING',
    title: 'One click. Every platform. All paused.',
    body: 'Connect your ad accounts once. Adgentic builds the campaign structure automatically — ad sets per persona, one ad per variant — and publishes to every platform simultaneously, paused until you decide to go live.',
    checks: [
      'Meta, TikTok, Google, LinkedIn, YouTube, and more',
      'Campaign structure built automatically — ad sets and targeting pre-configured',
      'All variants publish paused — activate when you\'re ready',
    ],
    Diagram: DiagPublishing,
    flip: false,
  },
  {
    num: '04',
    label: '— REVIEW & APPROVE',
    title: 'Nothing ships without your sign-off',
    body: 'The AI does the heavy lifting, but every variant goes through your review before it goes live. Approve per-variant, not per-batch. Brand-safety moderation runs automatically in the background.',
    checks: [
      'Watch every generated video before publishing — no surprises',
      'Brand-safety moderation runs before your review queue',
      'Full re-generate access before and after approval',
    ],
    Diagram: DiagReview,
    flip: true,
  },
];

export function FeaturesPage() {
  return (
    <div className="landing-page">
      <LandingHeader />

      <main>
        {/* Hero */}
        <section className="lp-features-hero">
          <div className="lp-container">
            <div className="lp-features-hero-inner">
              <span className="lp-eyebrow lp-mono">— CAPABILITIES</span>
              <h1 className="lp-section-h2" style={{ fontSize: 'clamp(40px, 5vw, 68px)' }}>
                Everything from brief<br />to live campaign.
              </h1>
              <p className="lp-section-deck" style={{ maxWidth: 520, marginTop: 16 }}>
                Four capabilities that take you from raw customer data to persona-tested,
                platform-ready ad variants — without leaving a single tab.
              </p>
            </div>
          </div>
        </section>

        {/* Feature blocks */}
        <section>
          {FEATURES.map(({ num, label, title, body, checks, Diagram, flip }) => (
            <div key={num} className="lp-container">
              <div className={`lp-feature-block${flip ? ' flip' : ''}`}>
                {/* Copy */}
                <div>
                  <span className="lp-feature-label lp-mono">{num} {label}</span>
                  <h2 className="lp-feature-title">{title}</h2>
                  <p className="lp-feature-body">{body}</p>
                  <div className="lp-feature-checks">
                    {checks.map((c) => (
                      <div className="lp-feature-check" key={c}>
                        <span className="lp-feature-check-mark lp-mono">✓</span>
                        {c}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Visual */}
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
                  Brief to live campaign.<br />
                  <span className="lp-muted">In minutes, not days.</span>
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
