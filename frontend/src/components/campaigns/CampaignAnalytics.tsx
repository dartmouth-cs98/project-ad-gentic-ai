import { Loader2Icon, BarChart3Icon } from 'lucide-react';
import { Card } from '../ui/Card';
import type { MetricsSummary, CampaignMetricDay } from '../../api/metrics';

interface CampaignAnalyticsProps {
  data: MetricsSummary | null;
  isLoading?: boolean;
}

// ---------- Helpers ----------

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

// Build an SVG polyline points string from an array of values.
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
    <Card variant="elevated" padding="md">
      <p className="text-sm text-slate-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </Card>
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
    <Card variant="elevated" padding="lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-slate-900">Performance Over Time</h3>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Impressions
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Clicks
          </span>
        </div>
      </div>

      <svg className="w-full h-48" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="impGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="0" y1="45" x2={W} y2="45" stroke="#e2e8f0" strokeWidth="1" />
        <line x1="0" y1="90" x2={W} y2="90" stroke="#e2e8f0" strokeWidth="1" />
        <line x1="0" y1="135" x2={W} y2="135" stroke="#e2e8f0" strokeWidth="1" />
        {impPoints && (
          <>
            <polyline
              points={`${impPoints} ${W},${H} 0,${H}`}
              fill="url(#impGrad)"
            />
            <polyline points={impPoints} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinejoin="round" />
          </>
        )}
        {clickPoints && (
          <polyline points={clickPoints} fill="none" stroke="#10b981" strokeWidth="2" strokeLinejoin="round" />
        )}
      </svg>

      <div className="flex justify-between mt-2 text-xs text-slate-400">
        {xLabels.map((d) => (
          <span key={d.date}>
            {new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        ))}
      </div>
    </Card>
  );
}

// ---------- Component ----------

export function CampaignAnalytics({ data, isLoading }: CampaignAnalyticsProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2Icon className="w-6 h-6 animate-spin mr-2" />
        <span className="text-sm">Loading metrics…</span>
      </div>
    );
  }

  if (!data || data.days.length === 0) {
    return (
      <Card variant="elevated" padding="lg">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
            <BarChart3Icon className="w-6 h-6 text-slate-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">No analytics data yet</h2>
            <p className="text-sm text-slate-500 mt-1">
              Charts and performance metrics will appear here once this campaign is live on Meta and
              we receive the first day of Insights data.
            </p>
          </div>
        </div>
      </Card>
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
    <div className="space-y-8">
      <DailyChart days={data.days} />

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
        {metricCards.map((m) => (
          <MetricCard key={m.label} label={m.label} value={m.value} />
        ))}
      </div>

      {data.last_fetched_at && (
        <p className="text-xs text-slate-400">
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
