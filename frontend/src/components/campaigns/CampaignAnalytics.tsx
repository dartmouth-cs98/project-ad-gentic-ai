import { Loader2Icon, BarChart3Icon } from 'lucide-react';
import type { MetricsSummary, CampaignMetricDay } from '../../api/metrics';

interface CampaignAnalyticsProps {
  data: MetricsSummary | null;
  isLoading?: boolean;
}

function fmt(n: number | null | undefined): string {
  if (n == null) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function fmtMoney(s: string | null | undefined): string {
  if (!s) return '—';
  const n = parseFloat(s);
  return isNaN(n) ? '—' : `$${n.toFixed(2)}`;
}

function fmtPct(s: string | null | undefined): string {
  if (!s) return '—';
  const n = parseFloat(s);
  return isNaN(n) ? '—' : `${n.toFixed(2)}%`;
}

function toPolylinePoints(
  values: number[],
  maxVal: number,
  svgW: number,
  svgH: number,
): string {
  if (values.length < 2 || maxVal === 0) return '';
  return values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * svgW;
      const y = svgH - 8 - ((v / maxVal) * (svgH - 16));
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="cmp-analytics-metric">
      <div className="l">{label}</div>
      <div className="v">{value}</div>
    </div>
  );
}

function DailyChart({ days }: { days: CampaignMetricDay[] }) {
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const impressions = sorted.map((d) => d.impressions ?? 0);
  const clicks = sorted.map((d) => d.clicks ?? 0);
  const maxImpressions = Math.max(...impressions, 1);
  const maxClicks = Math.max(...clicks, 1);
  const W = 800;
  const H = 180;

  const impPoints = toPolylinePoints(impressions, maxImpressions, W, H);
  const clickPoints = toPolylinePoints(clicks, maxClicks, W, H);

  const labelStep = Math.max(1, Math.floor(sorted.length / 5));
  const xLabels = sorted.filter((_, i) => i % labelStep === 0 || i === sorted.length - 1);

  return (
    <div className="cmp-analytics-chart">
      <div className="cmp-analytics-chart-head">
        <h3>Performance Over Time</h3>
        <div className="cmp-analytics-legend">
          <span><span className="dot imp" /> Impressions</span>
          <span><span className="dot clk" /> Clicks</span>
        </div>
      </div>

      <svg className="w-full h-48" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: 192 }}>
        <defs>
          <linearGradient id="cmpImpGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--as-accent)" stopOpacity="0.15" />
            <stop offset="100%" stopColor="var(--as-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="0" y1="45" x2={W} y2="45" stroke="var(--as-rule)" strokeWidth="1" />
        <line x1="0" y1="90" x2={W} y2="90" stroke="var(--as-rule)" strokeWidth="1" />
        <line x1="0" y1="135" x2={W} y2="135" stroke="var(--as-rule)" strokeWidth="1" />
        {impPoints && (
          <>
            <polyline
              points={`${impPoints} ${W},${H} 0,${H}`}
              fill="url(#cmpImpGrad)"
            />
            <polyline points={impPoints} fill="none" stroke="var(--as-accent)" strokeWidth="2.5" strokeLinejoin="round" />
          </>
        )}
        {clickPoints && (
          <polyline points={clickPoints} fill="none" stroke="var(--as-ink-2)" strokeWidth="2" strokeLinejoin="round" />
        )}
      </svg>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontFamily: "'Geist Mono', monospace", fontSize: 10, color: 'var(--as-ink-3)' }}>
        {xLabels.map((d) => (
          <span key={d.date}>
            {new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        ))}
      </div>
    </div>
  );
}

export function CampaignAnalytics({ data, isLoading }: CampaignAnalyticsProps) {
  if (isLoading) {
    return (
      <div className="prd-state" style={{ padding: '48px 0' }}>
        <Loader2Icon size={20} style={{ animation: 'as-spin 0.8s linear infinite' }} />
        <p>Loading metrics…</p>
      </div>
    );
  }

  if (!data || data.days.length === 0) {
    return (
      <div className="cmp-detail-empty">
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div style={{ width: 44, height: 44, border: '1px solid var(--as-rule)', background: 'var(--as-paper-2)', display: 'grid', placeItems: 'center', color: 'var(--as-ink-3)', flexShrink: 0 }}>
            <BarChart3Icon size={20} />
          </div>
          <div>
            <h2>No analytics data yet</h2>
            <p>
              Charts and performance metrics will appear here once this campaign is live on Meta and
              we receive the first day of Insights data.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const metricCards = [
    { label: 'Impressions', value: fmt(data.total_impressions) },
    { label: 'Reach', value: fmt(data.total_reach) },
    { label: 'Clicks', value: fmt(data.total_clicks) },
    { label: 'Spend', value: fmtMoney(data.total_spend) },
    { label: 'Avg CTR', value: fmtPct(data.avg_ctr) },
    { label: 'Avg CPC', value: fmtMoney(data.avg_cpc) },
    { label: 'Conversions', value: fmt(data.total_conversions) },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <DailyChart days={data.days} />

      <div className="cmp-analytics-grid">
        {metricCards.map((m) => (
          <MetricCard key={m.label} label={m.label} value={m.value} />
        ))}
      </div>

      {data.last_fetched_at && (
        <p className="cmp-analytics-sync">
          Last synced:{' '}
          {new Date(data.last_fetched_at).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      )}
    </div>
  );
}
