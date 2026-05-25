// LandingApproach — 220vh pinned scroll section, 3 sequential workflow phases
import { useRef } from 'react';
import { useScrollProgress } from '../../hooks/useScrollProgress';

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

// ── Phase bar ──────────────────────────────────────────────────────────────
function PhaseBar({ phase }: { phase: number }) {
  const labels = ['01 GENERATE', '02 SCORE', '03 LAUNCH'];
  return (
    <div className="lp-phasebar">
      {labels.map((l, i) => (
        <div key={i} className={`lp-phase lp-mono${phase >= i && phase < i + 1 ? ' on' : ''}`}>
          {l}
        </div>
      ))}
      <div className="lp-phase-track">
        <span className="lp-phase-fill" style={{ width: `${clamp(phase / 3, 0, 1) * 100}%` }} />
      </div>
    </div>
  );
}

// ── Typewriter helper ──────────────────────────────────────────────────────
function TypewriterLine({ text, progress }: { text: string; progress: number }) {
  const n = Math.floor(clamp(progress, 0, 1) * text.length);
  return (
    <span>
      {text.slice(0, n)}
      {progress > 0 && progress < 1 && <span className="lp-caret">▍</span>}
    </span>
  );
}

// ── Phase 0: Generate ──────────────────────────────────────────────────────
function GeneratePhase({ progress }: { progress: number }) {
  const lineProgress = clamp(progress * 1.6, 0, 1);
  const variantStart = 0.45;
  return (
    <div className="lp-ph-grid">
      <div className="lp-ph-left">
        <div className="lp-mono lp-small lp-muted">BRIEF · CAMPAIGN PROMPT</div>
        <div className="lp-prompt-box">
          <TypewriterLine
            text="Create 6 ad variants for our new running shoe — performance angle, urban commuter persona, retarget recent site visitors."
            progress={lineProgress}
          />
        </div>
        <div className="lp-ph-controls">
          <span className="lp-chip">Commuter</span>
          <span className="lp-chip">Runner</span>
          <span className="lp-chip">Retarget</span>
          <span className="lp-chip plus">+3</span>
        </div>
        <div className="lp-ph-go lp-mono">
          {progress < variantStart ? 'GENERATING ...' : '6 VARIANTS · 11s'}
          <span className="lp-ph-go-arrow">→</span>
        </div>
      </div>
      <div className="lp-ph-right">
        <div className="lp-variant-grid">
          {Array.from({ length: 6 }).map((_, i) => {
            const start = variantStart + i * 0.07;
            const local = clamp((progress - start) / 0.12, 0, 1);
            return (
              <div
                key={i}
                className="lp-variant-thumb"
                style={{
                  opacity: local,
                  transform: `translateY(${(1 - local) * 16}px) scale(${0.95 + 0.05 * local})`,
                }}
              >
                <div className="lp-thumb-stripes" />
                <div className="lp-thumb-foot">
                  <span className="lp-mono lp-small">V_{String(i + 1).padStart(2, '0')}</span>
                  <span className="lp-dot ok" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Phase 1: Score ─────────────────────────────────────────────────────────
function ScorePhase({ progress }: { progress: number }) {
  const personas = ['COMMUTER', 'RUNNER', 'RETARGET'];
  const scores = [
    [0.94, 0.71, 0.88],
    [0.86, 0.62, 0.79],
    [0.91, 0.48, 0.93],
    [0.77, 0.83, 0.65],
    [0.88, 0.55, 0.81],
    [0.72, 0.69, 0.74],
  ];
  return (
    <div className="lp-ph-grid">
      <div className="lp-ph-left compact">
        <div className="lp-mono lp-small lp-muted">VARIANTS · 6</div>
        <div className="lp-variant-stack">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="lp-stack-item">
              <span className="lp-mono lp-small">V_{String(i + 1).padStart(2, '0')}</span>
              <span className="lp-stack-bar">
                <span className="lp-stack-fill" style={{ width: `${50 + i * 7}%` }} />
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="lp-ph-right">
        <table className="lp-score-table">
          <thead>
            <tr>
              <th className="lp-mono lp-small lp-muted">VARIANT</th>
              {personas.map((p, i) => {
                const local = clamp((progress - i * 0.15) / 0.2, 0, 1);
                return (
                  <th key={p} className="lp-mono lp-small" style={{ opacity: local }}>
                    <span className="lp-th-name">{p}</span>
                  </th>
                );
              })}
              <th className="lp-mono lp-small lp-muted">CHOSEN</th>
            </tr>
          </thead>
          <tbody>
            {scores.map((row, ri) => {
              const max = Math.max(...row);
              return (
                <tr key={ri}>
                  <td className="lp-mono lp-small">V_{String(ri + 1).padStart(2, '0')}</td>
                  {row.map((s, ci) => {
                    const local = clamp((progress - 0.05 - ci * 0.15 - ri * 0.02) / 0.18, 0, 1);
                    const isMax = s === max;
                    return (
                      <td key={ci} className="lp-score-cell" style={{ opacity: local }}>
                        <span className="lp-score-bar">
                          <span className="lp-score-fill" style={{ width: `${s * 100 * local}%` }} />
                        </span>
                        <span className={`lp-mono lp-small${isMax ? ' lp-score-num-best' : ''}`}>
                          {s.toFixed(2)}
                        </span>
                      </td>
                    );
                  })}
                  <td className="lp-chosen lp-mono lp-small">
                    {progress > 0.7 && (ri === 0 || ri === 2 || ri === 4) ? '●' : ''}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Phase 2: Launch ────────────────────────────────────────────────────────
function LaunchPhase({ progress }: { progress: number }) {
  const f = clamp(progress * 1.4, 0, 1);
  const tick = (target: number) => (target * f).toFixed(2);
  const tickInt = (target: number) => Math.floor(target * f).toLocaleString();

  // Build live-graph polyline from partial data
  const xCoords = [0,12,28,40,52,68,82,98,118,132,148,160,178,196,210,228,244,262,280,296,318,336,348,358];
  const cutoff = clamp(progress * 1.6, 0, 1);
  const pts = xCoords
    .map((x, i) => {
      if (i / (xCoords.length - 1) > cutoff) return null;
      const phaseY = 130 - i * 4 - Math.sin(i * 0.6) * 8;
      return `${x},${phaseY}`;
    })
    .filter(Boolean)
    .join(' ');

  const lastX = pts ? pts.split(' ').slice(-1)[0]?.split(',')[0] ?? '0' : '0';

  return (
    <div className="lp-ph-grid">
      <div className="lp-ph-left">
        <div className="lp-mono lp-small lp-muted">LIVE · NORTH AMERICA</div>
        <div className="lp-kpi-list">
          <div className="lp-kpi">
            <div className="lp-mono lp-small lp-muted">IMPRESSIONS · 24H</div>
            <div className="lp-kpi-val">{tickInt(184320)}</div>
            <div className="lp-mono lp-small lp-up">▲ 12.4% vs prev</div>
          </div>
          <div className="lp-kpi">
            <div className="lp-mono lp-small lp-muted">CTR</div>
            <div className="lp-kpi-val">
              {tick(4.62)}<span className="lp-kpi-sym">%</span>
            </div>
            <div className="lp-mono lp-small lp-up">▲ 3.1× baseline</div>
          </div>
          <div className="lp-kpi">
            <div className="lp-mono lp-small lp-muted">CPA</div>
            <div className="lp-kpi-val">${tick(8.40)}</div>
            <div className="lp-mono lp-small lp-dn">▼ $4.20 vs prev</div>
          </div>
        </div>
      </div>
      <div className="lp-ph-right">
        <div className="lp-live-panel">
          <div className="lp-live-head">
            <span className="lp-live-pill">
              <span className="lp-live-dot" />
              LIVE
            </span>
            <span className="lp-mono lp-small lp-muted">DELIVERY · 96.1% PACING</span>
          </div>
          <svg className="lp-live-graph" viewBox="0 0 360 160" preserveAspectRatio="none">
            <defs>
              <linearGradient id="lpLiveFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[40, 80, 120].map((y) => (
              <line key={y} x1="0" y1={y} x2="360" y2={y} stroke="currentColor" strokeOpacity="0.08" />
            ))}
            {pts && (
              <>
                <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="1.5" />
                <polygon
                  points={`0,160 ${pts} ${lastX},160`}
                  fill="url(#lpLiveFill)"
                />
              </>
            )}
          </svg>
          <div className="lp-live-foot">
            {['06:00', '12:00', '18:00', '00:00'].map((t) => (
              <span key={t} className="lp-mono lp-small">{t}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Section root ───────────────────────────────────────────────────────────
export function LandingApproach() {
  const ref = useRef<HTMLElement>(null);
  const rawP = useScrollProgress(ref);

  // Track high-water mark for the "stay on end state during backscroll" behaviour.
  // Reset when rawP drops back below 0.02 (user scrolled above the section start)
  // so the next forward pass replays from the beginning.
  const maxP = useRef(0);
  if (rawP < 0.02) {
    maxP.current = 0;
  } else {
    maxP.current = Math.max(maxP.current, rawP);
  }
  const p = maxP.current >= 0.88 ? Math.max(rawP, maxP.current) : rawP;

  const inner = clamp((p - 0.10) / 0.80, 0, 1);
  const phase = inner * 3; // 0..3
  const phaseIdx = Math.min(Math.floor(phase), 2);
  const phaseProg = phase - phaseIdx;

  const phaseProgress = (i: number) =>
    phaseIdx === i ? phaseProg : phaseIdx > i ? 1 : 0;

  return (
    <section ref={ref} className="lp-approach-section" id="approach">
      <div className="lp-approach-pin">
        <div className="lp-container lp-approach-inner">
          <div className="lp-approach-head">
            <span className="lp-eyebrow lp-mono">— 02 · THE WORKFLOW</span>
            <h2 className="lp-section-h2">
              Three moves.{' '}
              <span className="lp-muted">Generate, score, launch.</span>
            </h2>
            <p className="lp-section-deck">
              Brief a campaign, get six AI-generated variants scored against your real
              audience personas, and publish the winners across channels — in minutes, not days.
            </p>
          </div>

          <PhaseBar phase={phase} />

          <div className="lp-phase-stage">
            {/* Each phase frame is absolutely positioned, crossfading via opacity */}
            <div
              className="lp-phase-frame"
              style={{ opacity: phaseIdx === 0 ? 1 : 0, pointerEvents: phaseIdx === 0 ? 'auto' : 'none' }}
            >
              <GeneratePhase progress={phaseProgress(0)} />
            </div>
            <div
              className="lp-phase-frame"
              style={{ opacity: phaseIdx === 1 ? 1 : 0, pointerEvents: phaseIdx === 1 ? 'auto' : 'none' }}
            >
              <ScorePhase progress={phaseProgress(1)} />
            </div>
            <div
              className="lp-phase-frame"
              style={{ opacity: phaseIdx === 2 ? 1 : 0, pointerEvents: phaseIdx === 2 ? 'auto' : 'none' }}
            >
              <LaunchPhase progress={phaseProgress(2)} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
