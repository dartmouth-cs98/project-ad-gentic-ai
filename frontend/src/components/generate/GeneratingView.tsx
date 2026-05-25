// GeneratingView — big numeral progress meter with 4-phase grid and live log
import { useEffect, useRef, useState } from 'react';

interface GeneratingViewProps {
  progressIdx: number; // 0-2 from parent interval; used to set phase slot
  variantCount?: number;
}

const PHASES = [
  { idx: 'G.01', label: 'Drafting hooks',    statFn: (p: number) => `${Math.min(6, Math.ceil(p * 6))} / 6 PROMPTS` },
  { idx: 'G.02', label: 'Rendering frames',  statFn: (p: number) => `FRAME ${Math.round(p * 120)} / 120` },
  { idx: 'G.03', label: 'Scoring personas',  statFn: () => 'AGAINST 3 PERSONAS' },
  { idx: 'G.04', label: 'Finalizing',        statFn: () => 'PACKING ASSETS' },
];

// Log lines keyed by rough progress thresholds
const LOG_LINES: Array<{ t: string; s: string; text: string; kind: 'ok' | 'work' }> = [
  { t: '11:42:01', s: '✓', text: 'persona-aware hooks drafted · 6/6', kind: 'ok' },
  { t: '11:42:08', s: '✓', text: 'storyboards locked · 6/6', kind: 'ok' },
  { t: '11:42:12', s: '⋯', text: 'rendering V_01 — frame 120/120', kind: 'work' },
  { t: '11:42:18', s: '✓', text: 'V_01 render complete', kind: 'ok' },
  { t: '11:42:22', s: '⋯', text: 'rendering V_02 — frame 96/120', kind: 'work' },
  { t: '11:42:28', s: '⋯', text: 'rendering V_03 — frame 24/120', kind: 'work' },
  { t: '11:42:33', s: '✓', text: 'persona fit · Aurora · 0.94', kind: 'ok' },
  { t: '11:42:36', s: '⋯', text: 'persona fit · Skeptic — scoring', kind: 'work' },
];

export function GeneratingView({ progressIdx, variantCount = 6 }: GeneratingViewProps) {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const DURATION = 11000; // 11s to reach ~100%

  // Smooth 0→100% animation independent of progressIdx ticks
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setProgress(1);
      return;
    }
    startRef.current = performance.now();
    const loop = (now: number) => {
      const t = Math.min(1, (now - startRef.current) / DURATION);
      setProgress(t);
      if (t < 1) rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const pct = Math.round(progress * 100);
  // Active phase: clamp progressIdx (0-2) into 4 phase slots, advance with progress too
  const phaseIdx = Math.min(3, Math.max(progressIdx, Math.floor(progress * 4)));
  const elapsed = Math.floor(progress * 110);
  const remaining = Math.max(0, Math.ceil((1 - progress) * 110));
  const visibleLogs = LOG_LINES.slice(0, Math.max(2, Math.ceil(progress * LOG_LINES.length)));

  return (
    <div className="gen-progress">
      {/* Head */}
      <div className="gen-progress-head">
        <span className="l">— GENERATING · v{Math.max(1, variantCount - 5)} · {variantCount} VARIANTS</span>
        <span className="r">
          <span className="d" />
          LIVE
        </span>
      </div>

      {/* Big percentage */}
      <div className="gen-pct-row">
        <span className="gen-pct-num">
          {pct}<span className="gen-pct-sym">%</span>
        </span>
        <div className="gen-pct-meta">
          <span>ELAPSED</span>
          <span className="big">{elapsed}s</span>
          <span style={{ marginTop: 4 }}>EST. REMAINING</span>
          <span className="big">{remaining}s</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="gen-bar-track">
        <div className="gen-bar-fill" style={{ width: `${pct}%` }} />
      </div>

      {/* Phase grid */}
      <div className="gen-phases">
        {PHASES.map((ph, i) => {
          const state = i < phaseIdx ? 'done' : i === phaseIdx ? 'on' : 'pending';
          return (
            <div key={ph.idx} className={`gen-phase ${state}`}>
              <span className="idx">{ph.idx}</span>
              <span className="label">{ph.label}</span>
              <span className="stat">
                {state === 'done' ? '✓ DONE' : state === 'on' ? ph.statFn(progress) : '— WAITING'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Live log */}
      <div className="gen-log" aria-live="polite">
        {visibleLogs.map((line, i) => (
          <div key={i} className={`gen-log-line ${line.kind}`}>
            <span className="t">{line.t}</span>
            <span className="s">{line.s}</span>
            <span>{line.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
