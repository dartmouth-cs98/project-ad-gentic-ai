// LandingWork — 4 numbered feature rows with artifact previews, enter-on-view
import { useRef } from 'react';
import { useInView } from '../../hooks/useInView';

// ── Artifact preview mini-components ──────────────────────────────────────
function ArtifactPersona() {
  return (
    <div className="lp-art-persona">
      {['A', 'S', 'N', 'L'].map((c, i) => (
        <div key={i} className="lp-art-avatar" style={{ marginLeft: i ? -10 : 0 }}>
          {c}
        </div>
      ))}
      <div className="lp-art-bar">
        <span className="lp-art-fill" style={{ width: '78%' }} />
      </div>
    </div>
  );
}

function ArtifactScore() {
  const vals = [0.94, 0.71, 0.88, 0.62, 0.79, 0.83];
  return (
    <div className="lp-art-score">
      {vals.map((v, i) => (
        <div key={i} className="lp-art-score-row">
          <span className="lp-art-score-bar">
            <span className="lp-art-score-fill" style={{ width: `${v * 100}%` }} />
          </span>
          <span className="lp-mono lp-small">{v.toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}

function ArtifactSurface() {
  // 3×3 grid, accent cells at positions 1, 4, 7 to form a diagonal hint
  const accent = new Set([1, 4, 7]);
  return (
    <div className="lp-art-cells">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className={`lp-art-cell${accent.has(i) ? ' accent' : ''}`} />
      ))}
    </div>
  );
}

function ArtifactNumbers() {
  return (
    <div className="lp-art-numbers">
      <svg viewBox="0 0 120 60" preserveAspectRatio="none">
        <polyline
          points="0,50 20,46 40,40 60,38 80,30 100,22 120,12"
          fill="none" stroke="currentColor" strokeWidth="1.5"
        />
        <circle cx="120" cy="12" r="3" fill="currentColor" />
      </svg>
      <div className="lp-art-num">
        +3.2<span className="x">×</span>
      </div>
    </div>
  );
}

type ArtifactKind = 'persona' | 'score' | 'surface' | 'numbers';

function ArtifactPreview({ kind }: { kind: ArtifactKind }) {
  if (kind === 'persona') return <ArtifactPersona />;
  if (kind === 'score') return <ArtifactScore />;
  if (kind === 'surface') return <ArtifactSurface />;
  return <ArtifactNumbers />;
}

// ── Feature rows data ──────────────────────────────────────────────────────
const ITEMS: { idx: string; title: string; body: string; artifact: ArtifactKind }[] = [
  {
    idx: 'F.01',
    title: 'AI creative in seconds',
    body: 'Describe your product, angle, and target audience. Adgentic generates multiple ad variants — copy, format, and framing — ready to score and launch.',
    artifact: 'persona',
  },
  {
    idx: 'F.02',
    title: 'Score before you spend',
    body: 'Every variant is evaluated against your real audience personas before a dollar goes out. Only the work that passes the test ships.',
    artifact: 'score',
  },
  {
    idx: 'F.03',
    title: 'One surface, no handoffs',
    body: 'Brief, generate, score, publish, and measure in a single continuous workspace. No Figma, no agency back-and-forth, no re-exports.',
    artifact: 'surface',
  },
  {
    idx: 'F.04',
    title: 'Publish across platforms',
    body: 'Approved variants go live on Meta, Google, TikTok, LinkedIn, and more in one click. Performance data flows back automatically — every campaign trains the next one.',
    artifact: 'numbers',
  },
];

// ── Single work row with its own InView ref ────────────────────────────────
function WorkRow({ item, delay }: { item: typeof ITEMS[number]; delay: number }) {
  const ref = useRef<HTMLElement>(null);
  const seen = useInView(ref, 0.15);
  return (
    <article
      ref={ref}
      className={`lp-work-row${seen ? ' in' : ''}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="lp-work-idx lp-mono">{item.idx}</div>
      <div className="lp-work-body">
        <h3 className="lp-work-title">{item.title}</h3>
        <p className="lp-work-text">{item.body}</p>
      </div>
      <div className="lp-work-artifact">
        <ArtifactPreview kind={item.artifact} />
      </div>
    </article>
  );
}

// ── Section root ───────────────────────────────────────────────────────────
export function LandingWork() {
  return (
    <section className="lp-work-section" id="work">
      <div className="lp-container">
        <div className="lp-work-head">
          <span className="lp-eyebrow lp-mono">— 03 · WHAT YOU GET</span>
          <h2 className="lp-section-h2">Everything from brief to live campaign.</h2>
        </div>
        <div className="lp-work-list">
          {ITEMS.map((item, i) => (
            <WorkRow key={item.idx} item={item} delay={i * 80} />
          ))}
        </div>
      </div>
    </section>
  );
}
