import { useMemo } from 'react';

// ─── Types ──────────────────────────────────────────────────────

interface PersonaGroup {
  name: string;
  description: string;
  age_range: string;
  variant_count: number;
}

interface AdPlan {
  product: string;
  product_description: string;
  campaign_goal: string;
  persona_groups: PersonaGroup[];
  total_variants: number;
  formats: string[];
  tone: string;
  platforms: string[];
  budget_tier: string;
  cta_style: string;
  brief: string;
}

interface PlanCardProps {
  content: string;
  onApprove: () => void;
  onDecline: () => void;
  /** True when this plan has already been approved or declined. */
  resolved?: boolean;
}

// ─── Helpers ────────────────────────────────────────────────────

function parsePlanContent(content: string): { intro: string; plan: AdPlan | null } {
  const jsonMatch = content.match(/```json\s*(\{[\s\S]*?\})\s*```/);
  if (!jsonMatch) return { intro: content, plan: null };

  const intro = content.slice(0, jsonMatch.index).trim();

  try {
    const plan = JSON.parse(jsonMatch[1]) as AdPlan;
    return { intro, plan };
  } catch {
    return { intro: content, plan: null };
  }
}

// ─── Component ──────────────────────────────────────────────────

export function PlanCard({ content, onApprove, onDecline, resolved }: PlanCardProps) {
  const { intro, plan } = useMemo(() => parsePlanContent(content), [content]);

  if (!plan) {
    return (
      <div className="max-w-[85%] rounded-2xl px-4 py-3 text-base leading-relaxed bg-slate-50 border border-slate-100 text-slate-700 whitespace-pre-wrap">
        {content}
      </div>
    );
  }

  return (
    <div className="max-w-[90%] space-y-3">
      {intro && (
        <div className="rounded-2xl px-4 py-3 text-base leading-relaxed bg-slate-50 border border-slate-100 text-slate-700">
          {intro}
        </div>
      )}

      <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50/80 to-slate-50 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-blue-100 bg-blue-50/60">
          <h4 className="text-base font-semibold text-slate-800">{plan.product}</h4>
          <p className="text-sm text-slate-500 mt-0.5">{plan.campaign_goal}</p>
        </div>

        <div className="px-4 py-3 space-y-2">
          {/* Persona groups */}
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
            Persona Groups
          </p>
          <div className="space-y-2">
            {plan.persona_groups.map((group, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-medium flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <div>
                  <span className="text-sm font-medium text-slate-700">{group.name}</span>
                  <span className="text-slate-400 mx-1.5">&middot;</span>
                  <span className="text-sm text-slate-500">{group.age_range}</span>
                  <span className="text-slate-400 mx-1.5">&middot;</span>
                  <span className="text-sm text-slate-500">{group.variant_count} variants</span>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <p className="text-sm text-slate-500 pt-1">
            <span className="font-semibold text-blue-600">{plan.total_variants}</span> total variants
          </p>
        </div>

        {/* Action buttons */}
        {!resolved && (
          <div className="px-4 py-3 border-t border-blue-100 bg-blue-50/40 flex items-center gap-2">
            <button
              onClick={onApprove}
              className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Approve Plan
            </button>
            <button
              onClick={onDecline}
              className="px-3 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              Decline
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
