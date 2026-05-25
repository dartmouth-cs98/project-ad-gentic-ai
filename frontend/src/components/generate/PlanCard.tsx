// PlanCard — flat hairline design; keeps parsePlanContent JSON logic intact
import { useMemo } from 'react';

// ── Types ──────────────────────────────────────────────────────────

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
  steps: string[];
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
  resolved?: boolean;
  expressMode?: boolean;
}

// ── Helper ─────────────────────────────────────────────────────────

function parsePlanContent(content: string): { intro: string; plan: AdPlan | null } {
  const jsonMatch = content.match(/```json\s*(\{[\s\S]*?\})\s*```/);
  if (!jsonMatch) return { intro: content, plan: null };
  const intro = content.slice(0, jsonMatch.index).trim();
  try {
    return { intro, plan: JSON.parse(jsonMatch[1]) as AdPlan };
  } catch {
    return { intro: content, plan: null };
  }
}

// ── Component ──────────────────────────────────────────────────────

export function PlanCard({ content, onApprove, onDecline, resolved, expressMode }: PlanCardProps) {
  const { intro, plan } = useMemo(() => parsePlanContent(content), [content]);

  // Plain text fallback (no JSON plan)
  if (!plan) {
    return (
      <div className="gen-msg-body" style={{ whiteSpace: 'pre-wrap' }}>
        {content}
      </div>
    );
  }

  const personaCount = plan.persona_groups?.length ?? 0;
  const platformList = (plan.platforms ?? []).join(' · ');
  const formatList = (plan.formats ?? []).join(' · ');

  return (
    <>
      {intro && (
        <div className="gen-msg-body" style={{ marginBottom: 12, whiteSpace: 'pre-wrap' }}>
          {intro}
        </div>
      )}

      <div className="gen-plan-card">
        {/* Header row */}
        <div className="gen-plan-head">
          <span className="gen-plan-tag">— PLAN · {plan.product}</span>
          <span className="gen-plan-meta">
            {plan.total_variants} VARIANTS · {personaCount} PERSONAS
          </span>
        </div>

        {/* Product section */}
        <div className="gen-plan-sect">
          <div className="gen-plan-sect-h">PRODUCT</div>
          <div className="gen-plan-pair">
            <span className="k">Goal</span>
            <span>{plan.campaign_goal}</span>
          </div>
          {plan.product_description && (
            <div className="gen-plan-pair">
              <span className="k">Brief</span>
              <span>{plan.product_description}</span>
            </div>
          )}
          {plan.tone && (
            <div className="gen-plan-pair">
              <span className="k">Tone</span>
              <span>{plan.tone}</span>
            </div>
          )}
        </div>

        {/* Personas section */}
        {plan.persona_groups?.length > 0 && (
          <div className="gen-plan-sect">
            <div className="gen-plan-sect-h">PERSONAS</div>
            <ul>
              {plan.persona_groups.map((g, i) => (
                <li key={i}>
                  {g.name} · {g.variant_count} variants · {g.age_range}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Output section */}
        <div className="gen-plan-sect">
          <div className="gen-plan-sect-h">OUTPUT</div>
          {formatList && (
            <div className="gen-plan-pair">
              <span className="k">Format</span>
              <span>{formatList}</span>
            </div>
          )}
          {platformList && (
            <div className="gen-plan-pair">
              <span className="k">Platforms</span>
              <span>{platformList}</span>
            </div>
          )}
          {plan.cta_style && (
            <div className="gen-plan-pair">
              <span className="k">CTA</span>
              <span>{plan.cta_style}</span>
            </div>
          )}
        </div>

        {/* Action row */}
        {!resolved && (
          expressMode ? (
            <div className="gen-plan-express">
              <span style={{ fontSize: 13 }}>⚡</span>
              EXPRESS MODE — AUTO-APPROVING PLAN…
            </div>
          ) : (
            <div className="gen-plan-actions">
              <span className="gen-plan-hint">ENTER ⏎ TO APPROVE</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={onDecline}
                  className="as-btn-ghost"
                >
                  Revise
                </button>
                <button
                  onClick={onApprove}
                  className="as-btn-solid"
                >
                  Approve plan
                </button>
              </div>
            </div>
          )
        )}

        {resolved && (
          <div className="gen-plan-actions">
            <span className="gen-plan-hint" style={{ color: 'var(--as-ink-3)' }}>
              ✓ APPROVED
            </span>
          </div>
        )}
      </div>
    </>
  );
}
