import '../landing.css';
import { Link } from 'react-router-dom';
import { LandingHeader } from '../components/landing/LandingHeader';
import { LandingFooter } from '../components/landing/LandingFooter';

const TEAM = [
  {
    name: 'Isaac Cheon',
    initials: 'IC',
    role: 'Co-founder',
    bio: "Obsessed with building products that actually change how people think about marketing. Believes the best ads don't feel like ads.",
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
    bio: "Sees the big picture without losing sight of the details. Relentlessly focused on what it takes to build something people actually need.",
  },
];

const VALUES = [
  {
    num: '01',
    title: 'Ship things that matter',
    body: 'We build for impact, not optics. Every feature has to earn its place by making something meaningfully better.',
  },
  {
    num: '02',
    title: 'Honest by default',
    body: 'With advertisers, with users, with each other. The best products are built on trust, and trust starts with honesty.',
  },
  {
    num: '03',
    title: 'Move fast, stay sharp',
    body: 'Speed without thought is noise. We move quickly because we think clearly — not instead of it.',
  },
];

export function TeamPage() {
  return (
    <div className="landing-page">
      <LandingHeader />

      <main>
        {/* Hero */}
        <section className="lp-features-hero" style={{ paddingBottom: 80 }}>
          <div className="lp-container">
            <div className="lp-features-hero-inner">
              <span className="lp-eyebrow lp-mono">— THE TEAM</span>
              <h1 className="lp-section-h2" style={{ fontSize: 'clamp(40px, 5vw, 68px)' }}>
                Five builders.<br />
                <span style={{ color: 'var(--ink-2)' }}>One obsession.</span>
              </h1>
              <p className="lp-section-deck" style={{ maxWidth: 520, marginTop: 16 }}>
                We got tired of watching brands burn budgets on campaigns that miss. We think advertising can be smarter, more honest, and actually effective — so we're building it.
              </p>
            </div>
          </div>
        </section>

        {/* Team grid */}
        <section style={{ borderTop: '1px solid var(--rule)', padding: '80px 0' }}>
          <div className="lp-container">
            <div className="lp-team-grid">
              {TEAM.map(({ name, initials, role, bio }) => (
                <div key={name} className="lp-team-card">
                  <div className="lp-team-monogram lp-mono">{initials}</div>
                  <div>
                    <div className="lp-team-name">{name}</div>
                    <div className="lp-team-role lp-mono lp-muted">{role}</div>
                  </div>
                  <p className="lp-team-bio">{bio}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mission quote */}
        <section style={{ borderTop: '1px solid var(--rule)', padding: '100px 0' }}>
          <div className="lp-container">
            <div className="lp-team-mission">
              <div className="lp-team-mission-left">
                <span className="lp-eyebrow lp-mono">— OUR MISSION</span>
                <p style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.65, maxWidth: 300 }}>
                  We started Adgentic because we watched brands burn money on campaigns that didn't understand their audience. The tools existed to do better — they just weren't being used right. We're fixing that.
                </p>
              </div>
              <blockquote className="lp-team-quote">
                "Advertising should work for everyone —<br />
                not just the brands with the biggest budgets."
              </blockquote>
            </div>
          </div>
        </section>

        {/* Values */}
        <section style={{ borderTop: '1px solid var(--rule)', padding: '80px 0 100px' }}>
          <div className="lp-container">
            <span className="lp-eyebrow lp-mono">— WHAT WE BELIEVE</span>
            <div className="lp-team-values">
              {VALUES.map(({ num, title, body }) => (
                <div key={num} className="lp-team-value">
                  <span className="lp-team-value-num lp-mono">{num}</span>
                  <h3 className="lp-team-value-title">{title}</h3>
                  <p className="lp-team-value-body">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section
          className="lp-cta-section"
          style={{ borderTop: '1px solid var(--rule)' }}
          id="contact"
        >
          <div className="lp-container">
            <div className="lp-cta-grid">
              <div>
                <span className="lp-eyebrow lp-mono">— GET IN TOUCH</span>
                <h2 className="lp-cta-head">
                  Want to help<br />
                  <span className="lp-muted">build this?</span>
                </h2>
              </div>
              <div className="lp-cta-right">
                <Link to="/sign-up" className="lp-btn-solid lg">
                  Start for free
                  <span className="lp-btn-arrow" aria-hidden="true">→</span>
                </Link>
                <ul className="lp-cta-meta lp-mono">
                  <li>· We're always looking for builders</li>
                  <li>· Drop us a note via the app</li>
                  <li>· No long-term contracts</li>
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
