// LandingHero — copy left, three satellite panels with fly-in + scroll parallax + ambient drift
import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useInView } from '../../hooks/useInView';
import { useAmbient } from '../../hooks/useAmbient';

interface DriftVec { x: number; y: number; }

// Each Comp receives only ambient drift — position/entry handled by wrapper

function SatMetric({ drift }: { drift: DriftVec }) {
  return (
    <div className="lp-sat lp-sat-metric" style={{ transform: `translate(${drift.x}px, ${drift.y}px)` }}>
      <div className="lp-sat-head">
        <span className="lp-mono">CTR · 7d</span>
        <span className="lp-dot live" />
      </div>
      <div className="lp-metric-big">
        <span>+312<span className="lp-pct-sym">%</span></span>
      </div>
      <svg className="lp-spark" viewBox="0 0 120 30" preserveAspectRatio="none">
        <polyline
          points="0,24 12,22 24,20 36,18 48,15 60,16 72,12 84,8 96,9 108,5 120,3"
          fill="none" stroke="currentColor" strokeWidth="1.5"
        />
      </svg>
    </div>
  );
}

function SatPersona({ drift }: { drift: DriftVec }) {
  return (
    <div className="lp-sat lp-sat-persona" style={{ transform: `translate(${drift.x}px, ${drift.y}px)` }}>
      <div className="lp-persona-avatar"><span>C</span></div>
      <div className="lp-persona-info">
        <div className="lp-persona-name">COMMUTER</div>
        <div className="lp-persona-meta lp-mono">F · 28 · URBAN</div>
      </div>
      <div className="lp-persona-score">
        <span className="lp-mono lp-small">FIT</span>
        <span className="big">0.94</span>
      </div>
    </div>
  );
}

function SatGraph({ drift }: { drift: DriftVec }) {
  return (
    <div className="lp-sat lp-sat-graph" style={{ transform: `translate(${drift.x}px, ${drift.y}px)` }}>
      <div className="lp-graph-head">
        <span className="lp-mono lp-small">SENTIMENT</span>
        <span className="lp-mono lp-small lp-muted">90d</span>
      </div>
      <svg className="lp-graph-svg" viewBox="0 0 200 70" preserveAspectRatio="none">
        <line x1="0" y1="35" x2="200" y2="35" stroke="currentColor" strokeOpacity="0.15" strokeDasharray="2 4" />
        <polyline
          points="0,50 20,46 40,48 60,40 80,42 100,32 120,28 140,22 160,18 180,12 200,10"
          fill="none" stroke="currentColor" strokeWidth="1.5"
        />
        <circle cx="200" cy="10" r="3" fill="currentColor" />
      </svg>
      <div className="lp-graph-foot lp-mono lp-small">
        <span>+0.62 NET</span>
        <span className="lp-up">▲ 0.14</span>
      </div>
    </div>
  );
}

// Panel config: tighter cluster, shifted toward page center
// parallaxFactor: px of upward travel per px of scrollY
const PANELS = [
  { Comp: SatMetric,  restX: -90, restY: -155, driftPhase: 0.0, parallaxFactor: 0.13 },
  { Comp: SatPersona, restX:  20, restY:   -5, driftPhase: 1.7, parallaxFactor: 0.07 },
  { Comp: SatGraph,   restX: -55, restY:  130, driftPhase: 3.4, parallaxFactor: 0.17 },
] as const;

// Entry spring: appears when panels fly from center to rest
const ENTRY_SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)';
// How long (ms) the spring lasts before we drop the transition for raw scroll/drift
const ENTRY_DURATION = 1100;

export function LandingHero() {
  const ref = useRef<HTMLElement>(null);
  const seen = useInView(ref, 0.1);
  const t = useAmbient(true);

  // After the fly-in completes, drop the CSS transition so scroll/drift are instant
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    if (!seen || entered) return;
    const id = setTimeout(() => setEntered(true), ENTRY_DURATION + PANELS.length * 130);
    return () => clearTimeout(id);
  }, [seen]);

  // Scroll-driven parallax — RAF-throttled
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(() => { setScrollY(window.scrollY); raf = 0; });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);

  return (
    <section ref={ref} className="lp-hero-section" id="top">
      <div className="lp-container lp-hero-grid">

        {/* ── Copy ── */}
        <div className={`lp-hero-copy${seen ? ' in' : ''}`}>
          <span className="lp-eyebrow lp-mono">— 01 · AI-POWERED AD GENERATION</span>
          <h1 className="lp-hero-headline">
            <span className="lp-hl-row">Generate, score,</span>
            <span className="lp-hl-row">launch — fast.</span>
          </h1>
          <p className="lp-hero-deck">
            Adgentic turns a brief into scored, persona-tested ad variants in seconds.
            Brief your campaign, generate creative against real audience data,
            and publish to any platform — all in one surface.
          </p>
          <div className="lp-hero-actions">
            <Link to="/sign-up" className="lp-btn-solid">
              Start a campaign
              <span className="lp-btn-arrow" aria-hidden="true">→</span>
            </Link>
            <a href="#approach" className="lp-btn-link">
              SEE HOW IT WORKS ↘
            </a>
          </div>
        </div>

        {/* ── Satellite panels ── */}
        <div className="lp-hero-side">
          {PANELS.map(({ Comp, restX, restY, driftPhase, parallaxFactor }, i) => {
            // Ambient drift (gentle oscillation)
            const amp = seen ? 6 : 0;
            const drift: DriftVec = {
              x: Math.sin(t * 0.55 + driftPhase) * amp,
              y: Math.cos(t * 0.45 + driftPhase * 0.7) * amp,
            };

            // Position: fly from (0,0) → (restX, restY) on entry
            // After entry, scroll parallax shifts panels upward at different rates
            const px = seen ? restX : 0;
            const py = seen ? restY - scrollY * parallaxFactor : 0;

            // Apply spring transition only during the fly-in window; then go instant
            const useTransition = seen && !entered;
            const delay = i * 130;
            const transition = useTransition
              ? `opacity 0.5s ease ${delay}ms, transform ${ENTRY_DURATION}ms ${ENTRY_SPRING} ${delay}ms`
              : 'none';

            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '30%',
                  opacity: seen ? 1 : 0,
                  transform: `translate(${px}px, ${py}px)`,
                  transition,
                  willChange: 'transform, opacity',
                }}
              >
                <Comp drift={drift} />
              </div>
            );
          })}
        </div>
      </div>

      <div className="lp-reg tl"><span className="lp-mono">01 / HERO</span></div>
      <div className="lp-reg tr"><span className="lp-mono">ADGENTIC · 2026</span></div>
      <div className="lp-reg br"><span className="lp-mono">SCROLL ↓</span></div>
    </section>
  );
}
