import { Card } from '../ui/Card';
import { BrainIcon } from 'lucide-react';

// ---------- Types ----------

export interface AnalyticsMetric {
  label: string;
  value: string;
  change: string;
  positive: boolean;
}

export interface PersonaPerf {
  name: string;
  convRate: string;
  impressions: string;
  color: 'teal' | 'orange' | 'blue';
}

interface CampaignAnalyticsProps {
  metrics: AnalyticsMetric[];
  personas: PersonaPerf[];
}

// ---------- Color helpers ----------

const personaBg: Record<PersonaPerf['color'], string> = {
  teal: 'bg-teal-50',
  orange: 'bg-orange-50',
  blue: 'bg-blue-50',
};
const personaIcon: Record<PersonaPerf['color'], string> = {
  teal: 'text-teal-600',
  orange: 'text-orange-600',
  blue: 'text-blue-600',
};
const personaBar: Record<PersonaPerf['color'], string> = {
  teal: 'bg-teal-500',
  orange: 'bg-orange-500',
  blue: 'bg-blue-500',
};

// ---------- Component ----------

export function CampaignAnalytics({
  metrics,
  personas,
}: CampaignAnalyticsProps) {
  return (
    <div className="space-y-8">
      {/* Performance Chart */}
      <Card variant="elevated" padding="lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-slate-900">
            Performance Over Time
          </h3>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />{' '}
              Impressions
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />{' '}
              Clicks
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />{' '}
              Conversions
            </span>
          </div>
        </div>
        <svg
          className="w-full h-48"
          viewBox="0 0 800 180"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient
              id="impressionsGrad"
              x1="0"
              x2="0"
              y1="0"
              y2="1"
            >
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="clicksGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Grid lines */}
          <line x1="0" y1="45" x2="800" y2="45" stroke="#e2e8f0" strokeWidth="1" />
          <line x1="0" y1="90" x2="800" y2="90" stroke="#e2e8f0" strokeWidth="1" />
          <line x1="0" y1="135" x2="800" y2="135" stroke="#e2e8f0" strokeWidth="1" />
          {/* Impressions area */}
          <path
            d="M0 140 C100 120, 200 100, 300 80 S500 50, 600 40 S700 30, 800 20 V180 H0Z"
            fill="url(#impressionsGrad)"
          />
          <path
            d="M0 140 C100 120, 200 100, 300 80 S500 50, 600 40 S700 30, 800 20"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2.5"
          />
          {/* Clicks line */}
          <path
            d="M0 160 C100 150, 200 140, 300 120 S500 100, 600 90 S700 85, 800 70"
            fill="url(#clicksGrad)"
          />
          <path
            d="M0 160 C100 150, 200 140, 300 120 S500 100, 600 90 S700 85, 800 70"
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
          />
          {/* Conversions line */}
          <path
            d="M0 170 C100 165, 200 158, 300 150 S500 135, 600 125 S700 120, 800 110"
            fill="none"
            stroke="#8b5cf6"
            strokeWidth="2"
            strokeDasharray="6 3"
          />
        </svg>
        <div className="flex justify-between mt-2 text-xs text-slate-400">
          <span>Feb 11</span>
          <span>Feb 14</span>
          <span>Feb 17</span>
          <span>Feb 20</span>
          <span>Feb 23</span>
          <span>Today</span>
        </div>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.label} variant="elevated" padding="md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">{metric.label}</span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  metric.positive
                    ? 'text-emerald-700 bg-emerald-50'
                    : 'text-red-600 bg-red-50'
                }`}
              >
                {metric.change}
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{metric.value}</p>
          </Card>
        ))}
      </div>

      {/* Persona Performance */}
      <div>
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <BrainIcon className="w-5 h-5 text-slate-400" />
          Persona Performance
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {personas.map((persona) => (
            <Card key={persona.name} variant="elevated" padding="md">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${personaBg[persona.color]}`}
                >
                  <BrainIcon
                    className={`w-5 h-5 ${personaIcon[persona.color]}`}
                  />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">
                    {persona.name}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {persona.impressions} impressions
                  </p>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">
                  {persona.convRate}
                </span>
                <span className="text-xs text-slate-500">conv. rate</span>
              </div>
              <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${personaBar[persona.color]}`}
                  style={{
                    width: `${parseFloat(persona.convRate) * 15}%`,
                  }}
                />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
