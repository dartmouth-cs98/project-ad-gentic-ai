import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { AppIcon } from '../components/ui/AppIcon';
import { useCountUp } from '../hooks/useCountUp';


interface SparklineProps {
  points: number[];
  area?: boolean;
  down?: boolean;
  className?: string;
}

function Sparkline({ points, area = false, down = false, className = '' }: SparklineProps) {
  const W = 200;
  const H = area ? 38 : 26;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = Math.max(1, max - min);
  const coords = points.map((v, i) => {
    const x = (i / (points.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const line = coords.join(' ');
  const id = `sp-${Math.random().toString(36).slice(2, 7)}`;

  return (
    <svg
      className={`as-kpi-spark${down ? ' dn' : ''}${className ? ' ' + className : ''}`}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
    >
      {area && (
        <>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon
            points={`0,${H} ${line} ${W},${H}`}
            fill={`url(#${id})`}
          />
        </>
      )}
      <polyline points={line} fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}


function TableSpark({ points, down = false }: { points: number[]; down?: boolean }) {
  const W = 80;
  const H = 22;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = Math.max(1, max - min);
  const coords = points.map((v, i) => {
    const x = (i / (points.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 3) - 1.5;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{ width: W, height: H, color: down ? 'var(--as-ink-3)' : 'var(--as-accent)' }}
    >
      <polyline points={coords.join(' ')} fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}


function genSeries(days: number, base: number, noise: number, trend: number): number[] {
  return Array.from({ length: days }, (_, i) => {
    const t = i / (days - 1);
    return Math.max(0, base + trend * t * base + (Math.sin(i * 1.7) + Math.cos(i * 0.9 + 1.3)) * noise);
  });
}

const CHART_SERIES = ['meta', 'tiktok', 'youtube', 'linkedin'] as const;
type SeriesKey = typeof CHART_SERIES[number];
const SERIES_LABELS: Record<SeriesKey, string> = { meta: 'META', tiktok: 'TIKTOK', youtube: 'YOUTUBE', linkedin: 'LINKEDIN' };
const SERIES_OPACITY: Record<SeriesKey, number> = { meta: 1.0, tiktok: 0.75, youtube: 0.5, linkedin: 0.28 };
const DAYS = 30;

function PerformanceChart({ active }: { active: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 700, h: 240 });
  const [drawn, setDrawn] = useState(false);
  const [hover, setHover] = useState<number | null>(null);

  // Draw-in animation trigger
  useEffect(() => {
    if (!active) return;
    const id = setTimeout(() => setDrawn(true), 60);
    return () => clearTimeout(id);
  }, [active]);

  // ResizeObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: 240 }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const data = useMemo<Record<SeriesKey, number[]>>(() => ({
    meta:     genSeries(DAYS, 18, 4, 0.45),
    tiktok:   genSeries(DAYS, 12, 3, 0.7),
    youtube:  genSeries(DAYS, 8, 2, 0.2),
    linkedin: genSeries(DAYS, 5, 1.2, 0.05),
  }), []);

  const stacks = useMemo(() => {
    return Array.from({ length: DAYS }, (_, i) => {
      let cum = 0;
      const row: Record<string, number> = {};
      CHART_SERIES.forEach((s) => { cum += data[s][i]; row[s] = cum; });
      row.total = cum;
      return row;
    });
  }, [data]);

  const maxTotal = Math.max(...stacks.map((s) => s.total)) * 1.05;
  const { w: W, h: H } = size;
  const padL = 36, padR = 8, padT = 12, padB = 22;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const xAt = (i: number) => padL + (i / (DAYS - 1)) * plotW;
  const yAt = (v: number) => padT + plotH - (v / maxTotal) * plotH;

  const areaPath = (s: SeriesKey) => {
    const idx = CHART_SERIES.indexOf(s);
    const prev = idx > 0 ? CHART_SERIES[idx - 1] : null;
    const top = stacks.map((row, i) => `${xAt(i).toFixed(1)},${yAt(row[s]).toFixed(1)}`);
    const bot = stacks.map((row, i) => `${xAt(i).toFixed(1)},${yAt(prev ? row[prev] : 0).toFixed(1)}`).reverse();
    return `M ${top.join(' L ')} L ${bot.join(' L ')} Z`;
  };

  const linePath = (s: SeriesKey) =>
    stacks.map((row, i) => `${i ? 'L' : 'M'} ${xAt(i).toFixed(1)},${yAt(row[s]).toFixed(1)}`).join(' ');

  const gridYs = [0.25, 0.5, 0.75, 1.0].map((t) => padT + plotH * (1 - t));
  const totalImps = stacks.reduce((a, b) => a + b.total, 0);

  const dayLabel = (i: number) => {
    const d = new Date(2026, 4, 1 + i);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
  };

  const onMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const rel = Math.max(0, Math.min(1, (e.clientX - rect.left - padL) / plotW));
    setHover(Math.round(rel * (DAYS - 1)));
  };

  return (
    <div className="as-panel">
      <div className="as-panel-head">
        <span className="as-panel-title">Performance — Impressions</span>
        <span className="as-mono as-small as-muted">{(totalImps / 1000).toFixed(0)}K · 30d</span>
      </div>
      <div className="as-chart-wrap" ref={containerRef} style={{ position: 'relative' }}>
        <div className="as-chart-legend">
          {CHART_SERIES.map((s) => (
            <span key={s} className="as-legend-item">
              <span className="as-legend-dot" style={{ opacity: SERIES_OPACITY[s] }} />
              {SERIES_LABELS[s]}
            </span>
          ))}
        </div>
        <svg
          className="as-chart-svg"
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          onMouseMove={onMouseMove}
          onMouseLeave={() => setHover(null)}
        >
          {/* gridlines */}
          <g className="as-chart-grid">
            {gridYs.map((y, i) => <line key={i} x1={padL} y1={y} x2={W - padR} y2={y} />)}
          </g>
          {/* y-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((t, i) => (
            <text key={i} className="as-chart-axis" x={padL - 6} y={padT + plotH * (1 - t) + 3} textAnchor="end">
              {Math.round(maxTotal * t)}K
            </text>
          ))}
          {/* x-axis labels */}
          {[0, Math.floor(DAYS / 2), DAYS - 1].map((i) => (
            <text key={i} className="as-chart-axis"
              x={xAt(i)} y={H - 5}
              textAnchor={i === 0 ? 'start' : i === DAYS - 1 ? 'end' : 'middle'}>
              {dayLabel(i)}
            </text>
          ))}
          {/* stacked areas + draw-in clip */}
          <g style={{
            clipPath: drawn ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)',
            transition: 'clip-path 1.2s cubic-bezier(0.4,0,0.2,1)',
          }}>
            {[...CHART_SERIES].reverse().map((s) => (
              <path key={s} d={areaPath(s)}
                fill="currentColor" fillOpacity={SERIES_OPACITY[s] * 0.25} />
            ))}
            <path d={linePath(CHART_SERIES[CHART_SERIES.length - 1])}
              fill="none" stroke="currentColor" strokeWidth="1.5" />
          </g>
          {/* hover crosshair */}
          {hover !== null && (
            <>
              <line
                x1={xAt(hover)} y1={padT} x2={xAt(hover)} y2={padT + plotH}
                stroke="var(--as-ink)" strokeWidth="1" strokeDasharray="2 3" opacity="0.6"
              />
              <circle cx={xAt(hover)} cy={yAt(stacks[hover].total)} r="3" fill="currentColor" />
            </>
          )}
        </svg>
        {hover !== null && (
          <div className="as-chart-tooltip" style={{
            left: `${((xAt(hover) / W) * 100).toFixed(1)}%`,
            top: `${((yAt(stacks[hover].total) / H) * 100).toFixed(1)}%`,
          }}>
            <div className="as-chart-tooltip-date">{dayLabel(hover)}</div>
            {CHART_SERIES.map((s) => (
              <div key={s} className="as-chart-tooltip-row">
                <span>{SERIES_LABELS[s]}</span>
                <span>{Math.round(data[s][hover])}K</span>
              </div>
            ))}
            <div className="as-chart-tooltip-row as-chart-tooltip-total">
              <span>TOTAL</span>
              <span>{Math.round(stacks[hover].total)}K</span>
            </div>
          </div>
        )}
      </div>
      <div className="as-panel-foot">
        <span className="as-mono as-small">METHOD · IMPRESSIONS ACROSS 4 PLATFORMS</span>
        <a href="#" className="as-mono as-small" style={{ color: 'var(--as-ink)' }}>Open report ↗</a>
      </div>
    </div>
  );
}


interface ActivityItem {
  id: number;
  live: boolean;
  title: string;
  text: string;
  time: string;
  linkTo: string;
  linkLabel: string;
}

interface CampaignRow {
  id: string;
  name: string;
  status: 'active' | 'completed' | 'paused';
  metricLabel: string;
  metricValue: string;
  platform: string;
  trend: 'up' | 'down' | 'flat';
  trendValue: string;
  spark: number[];
}

const recentActivity: ActivityItem[] = [
  { id: 1, live: true,  title: 'Campaign launched',  text: 'Spring Reset · Aurora is now live across Meta and TikTok.', time: '02H AGO', linkTo: '/campaigns', linkLabel: 'SPRING RESET' },
  { id: 2, live: false, title: '12 new variants',    text: 'AI generated 12 new hooks for "Product Launch" targeting The Researcher.',  time: '05H AGO', linkTo: '/campaigns', linkLabel: 'PRODUCT LAUNCH' },
  { id: 3, live: false, title: 'Creative approved',  text: '3 video variants approved for the "Brand Awareness" campaign.',              time: '01D AGO', linkTo: '/campaigns', linkLabel: 'BRAND AWARENESS' },
  { id: 4, live: false, title: 'Scoring complete',   text: 'Late-Night persona scoring finished — 4 candidates above 0.85.',            time: '02D AGO', linkTo: '/campaigns', linkLabel: 'LATE-NIGHT Q1' },
];

const topCampaigns: CampaignRow[] = [
  { id: '1', name: 'Spring Reset · Aurora',    status: 'active',    metricLabel: 'CONV',  metricValue: '1,240', platform: 'META',     trend: 'up',   trendValue: '+12%',  spark: [40,42,44,48,52,56,58,62] },
  { id: '2', name: 'Late-Night Retarget',      status: 'active',    metricLabel: 'CTR',   metricValue: '4.8%',  platform: 'TIKTOK',   trend: 'up',   trendValue: '+0.6%', spark: [3.6,3.8,4.0,4.1,4.3,4.5,4.7,4.8] },
  { id: '3', name: 'Brand Awareness Q1',       status: 'completed', metricLabel: 'REACH', metricValue: '450K',  platform: 'YOUTUBE',  trend: 'down', trendValue: '-3%',   spark: [88,84,82,80,78,76,74,72] },
  { id: '4', name: 'Daypack Launch · Outdoor', status: 'active',    metricLabel: 'CTR',   metricValue: '2.9%',  platform: 'META',     trend: 'up',   trendValue: '+0.2%', spark: [2.4,2.5,2.6,2.7,2.7,2.8,2.9,2.9] },
  { id: '5', name: 'Commute Series · Test',    status: 'paused',    metricLabel: 'CONV',  metricValue: '186',   platform: 'LINKEDIN', trend: 'flat', trendValue: '—',     spark: [22,21,22,23,22,22,21,22] },
];

interface KpiDef {
  idx: string;
  label: string;
  target: number;
  kind: 'thousands' | 'money' | 'pct' | 'int';
  trend: string;
  up: boolean;
  spark: number[];
}

const kpiData: KpiDef[] = [
  { idx: 'K.01', label: 'TOTAL REACH',  target: 2_400_000, kind: 'thousands', trend: '+12%',  up: true,  spark: [12,14,15,17,18,17,19,22,21,24,26,28,27,29,32,34] },
  { idx: 'K.02', label: 'AD SPEND',     target: 12.4,      kind: 'money',     trend: '+18%',  up: true,  spark: [4,5,6,7,8,9,9,10,11,12,12,12] },
  { idx: 'K.03', label: 'AVG CTR',      target: 4.1,       kind: 'pct',       trend: '+0.3%', up: true,  spark: [3.4,3.5,3.6,3.5,3.7,3.8,3.9,3.9,4.0,4.0,4.1,4.1] },
  { idx: 'K.04', label: 'CONVERSIONS',  target: 3820,      kind: 'int',       trend: '-2%',   up: false, spark: [320,360,380,400,390,380,400,410,390,380,360,340] },
];

const personaSignals = [
  { initial: 'A', name: 'AURORA',     sub: 'F · 24 · URBAN',        fit: 0.94, dir: 'up'   as const, spark: [0.71,0.74,0.78,0.82,0.85,0.88,0.91,0.94] },
  { initial: 'S', name: 'SKEPTIC',    sub: 'M · 38 · SUBURBAN',     fit: 0.71, dir: 'flat' as const, spark: [0.68,0.70,0.69,0.71,0.70,0.72,0.71,0.71] },
  { initial: 'L', name: 'LATE-NIGHT', sub: 'F · 29 · METROPOLITAN', fit: 0.88, dir: 'up'   as const, spark: [0.74,0.76,0.78,0.80,0.83,0.85,0.87,0.88] },
  { initial: 'C', name: 'COMMUTE',    sub: 'M · 32 · URBAN',        fit: 0.79, dir: 'down' as const, spark: [0.85,0.83,0.82,0.81,0.80,0.79,0.78,0.79] },
  { initial: 'O', name: 'OUTDOOR',    sub: 'X · 26 · EXURBAN',      fit: 0.66, dir: 'up'   as const, spark: [0.58,0.60,0.62,0.63,0.65,0.65,0.66,0.66] },
];

const platforms = [
  { id: 'meta', label: 'Meta' }, { id: 'tiktok', label: 'TikTok' },
  { id: 'youtube', label: 'YouTube' }, { id: 'linkedin', label: 'LinkedIn' },
  { id: 'x', label: 'X' },
];
const regions = [
  { id: 'na', label: 'North America' }, { id: 'eu', label: 'Europe' },
  { id: 'apac', label: 'Asia Pacific' }, { id: 'global', label: 'Global' },
];
const GOALS = ['Brand awareness', 'Lead gen', 'Direct sales', 'Engagement', 'Other'] as const;


function formatKpi(n: number, kind: KpiDef['kind']): string {
  if (kind === 'pct')       return `${n.toFixed(1)}%`;
  if (kind === 'money')     return `$${n.toFixed(1)}K`;
  if (kind === 'thousands') {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
    return Math.round(n).toLocaleString();
  }
  return Math.round(n).toLocaleString();
}


function KpiCard({ kpi, hero, active }: { kpi: KpiDef; hero: boolean; active: boolean }) {
  const v = useCountUp(kpi.target, { active });

  return (
    <div className={`as-kpi${hero ? ' as-kpi-hero' : ''}`}>
      <div className="as-kpi-label">
        <span className="idx">{kpi.idx}</span>
        <span>{kpi.label}</span>
      </div>
      <div className="as-kpi-val as-tabular">{formatKpi(v, kpi.kind)}</div>
      <div className="as-kpi-row">
        <span className={`as-kpi-trend${kpi.up ? '' : ' dn'}`}>
          {kpi.up ? '▲' : '▼'} {kpi.trend}
          {hero && <span className="vs">VS PRIOR 30D</span>}
        </span>
        <Sparkline points={kpi.spark} area={hero} down={!kpi.up} />
      </div>
    </div>
  );
}


export function DashboardPage() {
  const navigate = useNavigate();
  const rawName   = localStorage.getItem('adgentic_last_name') ?? '';
  const firstName = rawName ? rawName.split(' ')[0] : 'there';

  const [timeRange, setTimeRange]         = useState('30D');
  const [showModal, setShowModal]         = useState(false);
  const [kpiActive, setKpiActive]         = useState(false);
  const [isAutofilling, setIsAutofilling] = useState(false);
  const [customGoal, setCustomGoal]       = useState('');
  const [errors, setErrors]               = useState<Record<string, string>>({});
  const [newCampaign, setNewCampaign]     = useState({
    name: '', product: '', targetAudience: '', goal: '', platforms: [] as string[], region: '',
  });

  // Trigger count-up on mount (one frame delay so layout is ready)
  useEffect(() => {
    const id = requestAnimationFrame(() => setKpiActive(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // ESC closes modal
  useEffect(() => {
    if (!showModal) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowModal(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showModal]);

  // Lock body scroll when modal open
  useEffect(() => {
    document.body.style.overflow = showModal ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showModal]);

  const togglePlatform = (id: string) =>
    setNewCampaign((c) => ({
      ...c,
      platforms: c.platforms.includes(id)
        ? c.platforms.filter((p) => p !== id)
        : [...c.platforms, id],
    }));

  const handleAutofill = () => {
    setIsAutofilling(true);
    setTimeout(() => {
      setNewCampaign((c) => ({ ...c, platforms: ['meta', 'tiktok'], region: 'na', goal: 'Direct sales', targetAudience: 'Tech-savvy millennials interested in productivity tools.' }));
      setIsAutofilling(false);
    }, 1100);
  };

  const handleCreate = () => {
    const errs: Record<string, string> = {};
    if (!newCampaign.name)           errs.name           = 'Campaign name is required';
    if (!newCampaign.product)        errs.product        = 'Product / service is required';
    if (!newCampaign.targetAudience) errs.targetAudience = 'Target audience is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setShowModal(false);
    navigate('/generate', { state: { campaignContext: { ...newCampaign, goal: newCampaign.goal === 'Other' ? customGoal : newCampaign.goal } } });
  };

  return (
    <AppShell
      timeRange={timeRange}
      onTimeRangeChange={setTimeRange}
      showNewCampaign
      onNewCampaign={() => setShowModal(true)}
    >
      <div className="as-canvas">

        {/* ── Page head ── */}
        <div className="as-page-head">
          <div>
            <span className="as-eyebrow">— DASHBOARD · {timeRange}</span>
            <h1>
              Welcome back, {firstName}.{' '}
              <span style={{ color: 'var(--as-ink-2)' }}>Two campaigns running today.</span>
            </h1>
          </div>
        </div>

        {/* ── KPI strip ── */}
        <div className="as-kpi-strip">
          <div className="as-kpi-strip-head">
            <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 10.5, letterSpacing: '0.08em', color: 'var(--as-ink-2)', textTransform: 'uppercase' }}>
              — ROLLING {timeRange} · 04 SIGNALS
            </span>
            <span className="as-live-mark">
              <span className="d" />
              LIVE
            </span>
          </div>
          <div className="as-kpi-strip-row">
            {kpiData.map((k, i) => (
              <KpiCard key={k.label} kpi={k} hero={i === 0} active={kpiActive} />
            ))}
          </div>
        </div>

        {/* ── Performance + Persona signal ── */}
        <div className="as-grid-2" style={{ marginBottom: 24 }}>
          <PerformanceChart active={kpiActive} />
          <PersonaSignalPanel active={kpiActive} />
        </div>

        {/* ── Activity + Campaigns ── */}
        <div className="as-grid-2 flip" style={{ marginBottom: 24 }}>
          <ActivityFeedPanel />
          <CampaignsTablePanel navigate={navigate} />
        </div>

      </div>

      {/* ── New Campaign Modal ── */}
      {showModal && (
        <div
          className="as-modal-overlay"
          onClick={() => setShowModal(false)}
          style={{ animation: 'as-modal-fadein 0.2s ease' }}
        >
          <div className="as-modal" onClick={(e) => e.stopPropagation()}>
            <div className="as-modal-head">
              <div>
                <div className="as-modal-eyebrow">— NEW · CAMPAIGN</div>
                <div className="as-modal-title">Brief</div>
              </div>
              <button className="as-modal-close" onClick={() => setShowModal(false)} aria-label="Close">
                <AppIcon name="x" size={14} />
              </button>
            </div>

            <div className="as-modal-body">
              {/* Auto-fill */}
              <button className="as-autofill-btn" onClick={handleAutofill} disabled={isAutofilling}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: 'var(--as-accent)', display: 'grid', placeItems: 'center', width: 16, height: 16 }}>
                    <AppIcon name={isAutofilling ? 'loader' : 'wand'} size={14} />
                  </span>
                  <div>
                    <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 10, letterSpacing: '0.08em', color: 'var(--as-ink-2)', textTransform: 'uppercase', marginBottom: 2 }}>AUTO-FILL</div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>Draft from workspace profile</div>
                  </div>
                </div>
                <AppIcon name="arrow" size={14} />
              </button>

              {/* Campaign name */}
              <div className="as-field">
                <label className="as-field-label">Campaign name <span className="as-field-required">*</span></label>
                <input className="as-input" placeholder="e.g. Spring Reset · Aurora"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })} />
                {errors.name && <span className="as-field-error">{errors.name}</span>}
              </div>

              {/* Product + Region */}
              <div className="as-field-row">
                <div className="as-field">
                  <label className="as-field-label">Product / service <span className="as-field-required">*</span></label>
                  <input className="as-input" placeholder="What are you advertising?"
                    value={newCampaign.product}
                    onChange={(e) => setNewCampaign({ ...newCampaign, product: e.target.value })} />
                  {errors.product && <span className="as-field-error">{errors.product}</span>}
                </div>
                <div className="as-field">
                  <label className="as-field-label">Region</label>
                  <select className="as-select" value={newCampaign.region}
                    onChange={(e) => setNewCampaign({ ...newCampaign, region: e.target.value })}>
                    <option value="">Select region</option>
                    {regions.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Target audience */}
              <div className="as-field">
                <label className="as-field-label">Target audience <span className="as-field-required">*</span></label>
                <textarea className="as-textarea" rows={3}
                  placeholder="Age, interests, behaviors, goals…"
                  value={newCampaign.targetAudience}
                  onChange={(e) => setNewCampaign({ ...newCampaign, targetAudience: e.target.value })} />
                {errors.targetAudience && <span className="as-field-error">{errors.targetAudience}</span>}
              </div>

              {/* Campaign goal — chips */}
              <div className="as-field">
                <label className="as-field-label">Campaign goal</label>
                <div className="as-chip-group">
                  {GOALS.map((g) => (
                    <button key={g} type="button"
                      className={`as-chip${newCampaign.goal === g ? ' on' : ''}`}
                      onClick={() => setNewCampaign({ ...newCampaign, goal: g })}>
                      {newCampaign.goal === g && (
                        <span style={{ display: 'grid', placeItems: 'center', width: 12, height: 12 }}>
                          <AppIcon name="check" size={12} />
                        </span>
                      )}
                      {g}
                    </button>
                  ))}
                </div>
                {newCampaign.goal === 'Other' && (
                  <input className="as-input" style={{ marginTop: 8 }}
                    placeholder="Describe your specific goal…"
                    value={customGoal}
                    onChange={(e) => setCustomGoal(e.target.value)} />
                )}
              </div>

              {/* Platforms — chips */}
              <div className="as-field">
                <label className="as-field-label">Platforms</label>
                <div className="as-chip-group">
                  {platforms.map((p) => (
                    <button key={p.id} type="button"
                      className={`as-chip${newCampaign.platforms.includes(p.id) ? ' on' : ''}`}
                      onClick={() => togglePlatform(p.id)}>
                      {newCampaign.platforms.includes(p.id) && (
                        <span style={{ display: 'grid', placeItems: 'center', width: 12, height: 12 }}>
                          <AppIcon name="check" size={12} />
                        </span>
                      )}
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="as-modal-foot">
              <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 10.5, color: 'var(--as-ink-2)', letterSpacing: '0.06em' }}>
                — ESC TO CANCEL
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="as-btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="as-btn-solid" onClick={handleCreate}>
                  <span style={{ display: 'grid', placeItems: 'center', width: 14, height: 14 }}>
                    <AppIcon name="sparkles" size={14} />
                  </span>
                  Create &amp; generate →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}


function PersonaSignalPanel({ active }: { active: boolean }) {
  return (
    <div className="as-panel">
      <div className="as-panel-head">
        <span className="as-panel-title">Persona signal</span>
        <span className="as-mono as-small as-muted">5 · ACTIVE</span>
      </div>
      <div className="as-persona-list">
        {personaSignals.map((p) => (
          <div key={p.name} className="as-persona-row">
            <div className="as-persona-avatar">{p.initial}</div>
            <div className="as-persona-meta">
              <div className="as-persona-name">{p.name}</div>
              <div className="as-persona-sub">{p.sub}</div>
            </div>
            {/* Trend mini-graph */}
            <svg viewBox="0 0 36 22" preserveAspectRatio="none" style={{ width: 36, height: 22 }}>
              <polyline
                points={p.spark.map((v, i) => `${(i / (p.spark.length - 1)) * 36},${22 - v * 20}`).join(' ')}
                fill="none"
                stroke={p.dir === 'down' ? 'var(--as-ink-3)' : 'var(--as-accent)'}
                strokeWidth="1.2"
              />
            </svg>
            <div>
              <div className="as-persona-fit as-tabular">{p.fit.toFixed(2)}</div>
              <span className="as-persona-fit-bar">
                <span
                  className={`as-persona-fit-fill${p.fit >= 0.85 ? ' high' : ''}`}
                  style={{ width: active ? `${p.fit * 100}%` : '0%', transition: 'width 1s ease' }}
                />
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="as-panel-foot">
        <span className="as-mono as-small">FIT · ROLLING 30D</span>
        <a href="#" className="as-mono as-small" style={{ color: 'var(--as-ink)' }}>All personas ↗</a>
      </div>
    </div>
  );
}


function ActivityFeedPanel() {
  return (
    <div className="as-panel">
      <div className="as-panel-head">
        <span className="as-panel-title">Activity</span>
        <span className="as-mono as-small as-muted">LIVE · {recentActivity.length} EVENTS</span>
      </div>
      <div className="as-activity-list">
        {recentActivity.map((a) => (
          <div key={a.id} className="as-activity-item">
            <div className={`as-activity-dot${a.live ? ' live' : ''}`} style={{ position: 'relative' }} />
            <div className="as-activity-content">
              <div className="as-activity-title">{a.title}</div>
              <div className="as-activity-text">{a.text}</div>
              <div className="as-activity-meta">
                <Link to={a.linkTo} className="as-activity-link">→ {a.linkLabel}</Link>
                <span>{a.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


function CampaignsTablePanel({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  return (
    <div className="as-panel">
      <div className="as-panel-head">
        <span className="as-panel-title">Top campaigns</span>
        <a href="#" className="as-mono as-small" style={{ color: 'var(--as-ink)' }}>View all ↗</a>
      </div>
      <table className="as-table">
        <thead>
          <tr>
            <th className="as-t-idx">#</th>
            <th>Campaign</th>
            <th>Platform</th>
            <th>Status</th>
            <th style={{ textAlign: 'right' }}>Metric</th>
            <th style={{ textAlign: 'right' }}>Trend</th>
            <th style={{ width: 90 }}>Δ 7d</th>
          </tr>
        </thead>
        <tbody>
          {topCampaigns.map((c, i) => (
            <tr key={c.id} onClick={() => navigate(`/campaigns`)}>
              <td className="as-t-idx">{String(i + 1).padStart(2, '0')}</td>
              <td className="as-t-name">{c.name}</td>
              <td className="as-t-platform">{c.platform}</td>
              <td>
                <span className={`as-t-status${c.status === 'active' ? ' active' : ''}`}>
                  <span className="d" />{c.status}
                </span>
              </td>
              <td>
                <div className="as-t-metric">{c.metricValue}</div>
                <div className="as-t-metric-label">{c.metricLabel}</div>
              </td>
              <td className={`as-t-trend ${c.trend === 'up' ? 'up' : c.trend === 'down' ? 'dn' : ''}`}>
                {c.trend === 'up' ? '▲ ' : c.trend === 'down' ? '▼ ' : '· '}{c.trendValue}
              </td>
              <td>
                <TableSpark points={c.spark} down={c.trend === 'down'} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
