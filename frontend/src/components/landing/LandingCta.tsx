// LandingCta — two-column CTA: headline left, action + meta right
import { Link } from 'react-router-dom';

export function LandingCta() {
  return (
    <section className="lp-cta-section" id="pricing">
      <div className="lp-container">
        <div className="lp-cta-grid">
          <div className="lp-cta-left">
            <span className="lp-eyebrow lp-mono">— 05 · GET STARTED</span>
            <h2 className="lp-cta-head">
              Your next campaign shouldn't<br />
              take a week to launch.{' '}
              <span className="lp-muted">It won't.</span>
            </h2>
          </div>

          <div className="lp-cta-right">
            <Link to="/sign-up" className="lp-btn-solid lg">
              Start a 14-day trial
              <span className="lp-btn-arrow" aria-hidden="true">→</span>
            </Link>
            <ul className="lp-cta-meta lp-mono">
              <li>· No card required</li>
              <li>· Bring your own data</li>
              <li>· Stop anytime, keep the work</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
