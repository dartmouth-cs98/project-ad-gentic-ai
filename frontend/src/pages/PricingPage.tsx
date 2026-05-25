import { useState } from 'react';
import '../landing.css';
import { Link } from 'react-router-dom';
import { LandingHeader } from '../components/landing/LandingHeader';
import { LandingFooter } from '../components/landing/LandingFooter';

const PLANS = [
  {
    id: 'basic',
    name: 'BASIC',
    monthlyPrice: null,
    annualPrice: null,
    desc: 'Try Adgentic with no commitment.',
    features: [
      '3 campaigns',
      '20 AI chats per month',
      '3 version histories per chat',
      '10 variant downloads per month',
      'Community support',
      'Basic analytics',
    ],
    cta: 'Get started free',
    ctaTo: '/sign-up',
    featured: false,
    solid: false,
  },
  {
    id: 'premium',
    name: 'PREMIUM',
    monthlyPrice: 99,
    annualPrice: 79,
    desc: 'Full access for teams that ship every week.',
    features: [
      'Everything in Basic',
      'Unlimited campaigns & chats',
      'Unlimited downloads',
      'Multi-platform publishing',
      'A/B testing',
      'Custom brand voice',
      'Advanced analytics',
      'Priority support',
    ],
    cta: 'Start 14-day trial',
    ctaTo: '/sign-up',
    featured: true,
    solid: true,
  },
  {
    id: 'enterprise',
    name: 'ENTERPRISE',
    monthlyPrice: null,
    annualPrice: null,
    desc: 'Custom contracts, SLAs, and dedicated support.',
    features: [
      'Everything in Premium',
      'Dedicated account manager',
      'Custom integrations',
      'SLA guarantee',
      'Team workspaces',
      'Custom AI training',
      'White-label options',
    ],
    cta: 'Contact sales',
    ctaTo: '/team#contact',
    featured: false,
    solid: false,
  },
];

const FAQS = [
  {
    q: 'Can I switch plans anytime?',
    a: 'Yes — upgrade or downgrade at any time. Changes apply to the next billing cycle.',
  },
  {
    q: 'Is there a free trial for Premium?',
    a: 'Yes. The Premium plan includes a 14-day free trial with full access to every feature.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'All major credit cards (Visa, Mastercard, Amex) and PayPal.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'No long-term contracts or cancellation fees. Cancel whenever you want.',
  },
  {
    q: 'Do you offer refunds?',
    a: 'We offer a 30-day money-back guarantee if you are not satisfied.',
  },
];

export function PricingPage() {
  const [annual, setAnnual] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="landing-page">
      <LandingHeader />

      <main>
        {/* Hero */}
        <section className="lp-features-hero" style={{ paddingBottom: 60 }}>
          <div className="lp-container">
            <span className="lp-eyebrow lp-mono">— PRICING</span>
            <h1 className="lp-section-h2" style={{ fontSize: 'clamp(40px, 5vw, 68px)' }}>
              Simple, transparent pricing.
            </h1>
            <p className="lp-section-deck" style={{ marginTop: 16 }}>
              Start free. Upgrade when you're ready to scale.
            </p>

            {/* Toggle */}
            <div className="lp-pricing-toggle">
              <button
                className={`lp-pricing-toggle-btn${!annual ? ' on' : ''}`}
                onClick={() => setAnnual(false)}
              >
                Monthly
              </button>
              <button
                className={`lp-pricing-toggle-btn${annual ? ' on' : ''}`}
                onClick={() => setAnnual(true)}
              >
                Annual
                <span className="lp-pricing-save">save 20%</span>
              </button>
            </div>
          </div>
        </section>

        {/* Plans */}
        <section style={{ padding: '0 0 120px' }}>
          <div className="lp-container">
            <div className="lp-pricing-grid">
              {PLANS.map((plan) => {
                const price = annual ? plan.annualPrice : plan.monthlyPrice;
                return (
                  <div key={plan.id} className={`lp-pricing-card${plan.featured ? ' featured' : ''}`}>
                    <span className="lp-pricing-plan-label">
                      {plan.name}
                      {plan.featured && <span className="lp-pricing-badge">POPULAR</span>}
                    </span>

                    <div className="lp-pricing-price-row">
                      {price !== null ? (
                        <>
                          <span className="lp-pricing-amount">${price}</span>
                          <span className="lp-pricing-period">/mo</span>
                        </>
                      ) : (
                        <span className="lp-pricing-amount" style={{ fontSize: 'clamp(28px, 3vw, 38px)' }}>
                          {plan.id === 'basic' ? 'Free' : 'Custom'}
                        </span>
                      )}
                    </div>

                    <p className="lp-pricing-desc">{plan.desc}</p>
                    <div className="lp-pricing-divider" />

                    <ul className="lp-pricing-features">
                      {plan.features.map((f) => (
                        <li key={f} className="lp-pricing-feature">
                          <span className="lp-pricing-check">✓</span>
                          {f}
                        </li>
                      ))}
                    </ul>

                    <div className="lp-pricing-cta-wrap">
                      <Link
                        to={plan.ctaTo}
                        className={`lp-pricing-cta${plan.solid ? ' solid' : ''}`}
                      >
                        {plan.cta}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section style={{ borderTop: '1px solid var(--rule)', padding: '80px 0 120px' }}>
          <div className="lp-container" style={{ maxWidth: 860 }}>
            <span className="lp-eyebrow lp-mono">— FAQ</span>
            <h2 className="lp-section-h2" style={{ fontSize: 'clamp(28px, 3.5vw, 44px)', marginBottom: 0 }}>
              Common questions.
            </h2>
            <div className="lp-faq-list">
              {FAQS.map((faq, i) => (
                <div key={i} className="lp-faq-item">
                  <button
                    className="lp-faq-q"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    {faq.q}
                    <span className={`lp-faq-icon${openFaq === i ? ' open' : ''}`}>+</span>
                  </button>
                  {openFaq === i && <p className="lp-faq-a">{faq.a}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="lp-cta-section" style={{ borderTop: '1px solid var(--rule)' }}>
          <div className="lp-container">
            <div className="lp-cta-grid">
              <div>
                <span className="lp-eyebrow lp-mono">— GET STARTED</span>
                <h2 className="lp-cta-head">
                  No card required.<br />
                  <span className="lp-muted">Cancel anytime.</span>
                </h2>
              </div>
              <div className="lp-cta-right">
                <Link to="/sign-up" className="lp-btn-solid lg">
                  Start free trial
                  <span className="lp-btn-arrow" aria-hidden="true">→</span>
                </Link>
                <ul className="lp-cta-meta lp-mono">
                  <li>· Full Premium access for 14 days</li>
                  <li>· Bring your own customer data</li>
                  <li>· Stop anytime, keep the work</li>
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
