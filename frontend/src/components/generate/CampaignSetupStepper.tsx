// CampaignSetupStepper — guided flow for creating a campaign before generating ads.
//
// Normal mode (from Campaigns page / "New Campaign"): 3 steps
//   1. Pick Product  2. Campaign Details  3. Launch Settings → create + start
//
// Express mode (from Products page "Express" button): 2 steps
//   Product is already known → skip step 1, go straight to step 2 with a
//   direct "⚡ Generate" button — no step 3, defaults are used automatically.
//   This makes the two flows visually and functionally distinct.

import { useState, useEffect } from 'react';
import { useProducts } from '../../hooks/useProducts';
import { useCreateCampaign } from '../../hooks/useCampaigns';
import { CAMPAIGN_PLATFORM_OPTIONS } from '../../constants/campaigns';
import type { Product, Campaign } from '../../types';

// ─── Constants ───────────────────────────────────────────────────

type StepId = 1 | 2 | 3;

const GOAL_OPTIONS = [
  { id: 'awareness', label: 'Brand Awareness' },
  { id: 'leads', label: 'Lead Generation' },
  { id: 'sales', label: 'Direct Sales' },
  { id: 'engagement', label: 'Engagement' },
] as const;

const TONE_OPTIONS = [
  { id: 'bold', label: 'Bold' },
  { id: 'playful', label: 'Playful' },
  { id: 'formal', label: 'Formal' },
  { id: 'minimal', label: 'Minimal' },
] as const;

// ─── Internal state ──────────────────────────────────────────────

interface StepperState {
  selectedProduct: Product | null;
  campaignName: string;
  targetAudience: string;
  goal: string;
  platforms: string[];
  tone: string;
  expressMode: boolean;
}

// ─── Props ───────────────────────────────────────────────────────

export interface CampaignSetupStepperProps {
  businessClientId: number;
  initialProductId?: number;
  // Pre-enables express mode AND skips step 1 when initialProductId is also set
  initialExpressMode?: boolean;
  onComplete: (campaign: Campaign, expressMode: boolean) => void;
  onCancel: () => void;
}

// ─── Inline SVGs ─────────────────────────────────────────────────

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width={11} height={11}>
      <path d="M8 2L4 6l4 4" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width={11} height={11}>
      <path d="M4 2l4 4-4 4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={9} height={9}>
      <path d="M1.5 5l2.5 2.5L8.5 2" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width={12} height={12}>
      <circle cx="5.5" cy="5.5" r="4" />
      <path d="M9 9l3.5 3.5" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" width={18} height={18}>
      <rect x="2" y="2" width="16" height="16" />
      <path d="M2 13l4-4 3 3 3-3 6 5" />
      <circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ZapIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width={12} height={12}>
      <path d="M8 1L3 8h5l-2 5 6-7H7l1-5z" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width={13} height={13} style={{ animation: 'as-spin 0.8s linear infinite' }}>
      <circle cx="8" cy="8" r="6" strokeDasharray="18 8" />
    </svg>
  );
}

// ─── Component ───────────────────────────────────────────────────

export function CampaignSetupStepper({
  businessClientId,
  initialProductId,
  initialExpressMode = false,
  onComplete,
  onCancel,
}: CampaignSetupStepperProps) {
  const { data: products = [], isLoading: productsLoading } = useProducts(businessClientId);
  const createCampaign = useCreateCampaign();

  // Express mode: true when the user clicked "Express" on a product card
  // In express mode we skip step 1 (product is already known) and step 3 (defaults used)
  const isExpress = initialExpressMode && !!initialProductId;

  // Skip step 1 whenever a product is already known (both express and regular from product card)
  const [step, setStep] = useState<StepId>(initialProductId ? 2 : 1);
  const [productSearch, setProductSearch] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [state, setState] = useState<StepperState>({
    selectedProduct: null,
    campaignName: '',
    targetAudience: '',
    goal: '',
    platforms: ['instagram', 'tiktok'],
    tone: 'bold',
    expressMode: initialExpressMode,
  });

  // Auto-select the pre-linked product once the products query resolves
  useEffect(() => {
    if (!initialProductId || state.selectedProduct) return;
    const found = products.find((p) => p.id === initialProductId);
    if (found) setState((s) => ({ ...s, selectedProduct: found }));
  }, [products, initialProductId]);

  // ─── Filtered product list ────────────────────────────────────

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.description ?? '').toLowerCase().includes(productSearch.toLowerCase()),
  );

  // ─── Navigation helpers ───────────────────────────────────────

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!state.campaignName.trim()) newErrors.name = 'Campaign name is required';
    if (!state.targetAudience.trim()) newErrors.audience = 'Target audience is required';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return false; }
    setErrors({});
    return true;
  };

  const goNext = () => {
    if (step === 2 && !validateStep2()) return;
    setStep((s) => Math.min(3, s + 1) as StepId);
  };

  const goBack = () => {
    // Express mode has no step 1 — back = cancel
    if (isExpress && step === 2) { onCancel(); return; }
    setStep((s) => Math.max(1, s - 1) as StepId);
  };

  // ─── Submit ───────────────────────────────────────────────────

  const handleLaunch = () => {
    if (!validateStep2()) return;
    createCampaign.mutate(
      {
        business_client_id: businessClientId,
        name: state.campaignName,
        product_context: state.selectedProduct?.name ?? '',
        product_ids: state.selectedProduct ? JSON.stringify([state.selectedProduct.id]) : null,
        target_audience: state.targetAudience,
        goal: state.goal || null,
      },
      { onSuccess: (campaign) => onComplete(campaign, state.expressMode) },
    );
  };

  // In express mode, "Next" on step 2 goes straight to launch (skips step 3)
  const handleStep2Next = () => {
    if (isExpress) { handleLaunch(); return; }
    goNext();
  };

  // ─── Progress steps config ────────────────────────────────────

  // Express shows 2 visible steps; normal shows 3
  const STEPS: { id: StepId; label: string }[] = isExpress
    ? [{ id: 2, label: 'DETAILS' }, { id: 3, label: 'LAUNCH' }]  // step 3 never rendered but tracks "done"
    : [{ id: 1, label: 'PRODUCT' }, { id: 2, label: 'DETAILS' }, { id: 3, label: 'LAUNCH' }];

  // ─── Render ───────────────────────────────────────────────────

  return (
    <div className="gen-stepper">

      {/* Express badge */}
      {isExpress && (
        <div className="gen-stepper-express-badge">
          <ZapIcon /> Express Mode — 2 steps
        </div>
      )}

      {/* Progress indicator */}
      <div className="gen-stepper-progress">
        {STEPS.map((s, idx) => {
          const isDone = step > s.id;
          const isActive = step === s.id;
          return (
            <div key={s.id} className="gen-stepper-step">
              <div className={`gen-stepper-dot${isDone ? ' done' : isActive ? ' active' : ''}`}>
                {isDone ? <CheckIcon /> : <span>{isExpress ? idx + 1 : s.id}</span>}
              </div>
              <span className={`gen-stepper-label${isActive ? ' active' : ''}`}>{s.label}</span>
              {idx < STEPS.length - 1 && (
                <div className={`gen-stepper-connector${isDone ? ' done' : ''}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* ══ Step 1 — Pick a Product (normal mode only) ══ */}
      {step === 1 && (
        <div>
          <h2 className="gen-stepper-h">Pick a product</h2>
          <p className="gen-stepper-sub">Choose what you're advertising. Skip if you'd rather describe it in chat.</p>

          <div className="gen-stepper-search-wrap">
            <SearchIcon />
            <input
              className="gen-stepper-search"
              placeholder="Search products…"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
            />
          </div>

          <div className="gen-stepper-prod-list">
            {productsLoading && (
              <div className="gen-stepper-empty">
                <SpinnerIcon /> Loading…
              </div>
            )}
            {!productsLoading && filteredProducts.length === 0 && (
              <div className="gen-stepper-empty">
                {products.length === 0
                  ? 'No products yet — skip and describe your product in chat.'
                  : 'No products match your search.'}
              </div>
            )}
            {filteredProducts.map((product) => {
              const isSelected = state.selectedProduct?.id === product.id;
              return (
                <button
                  key={product.id}
                  className={`gen-stepper-prod-row${isSelected ? ' selected' : ''}`}
                  onClick={() => setState((s) => ({ ...s, selectedProduct: isSelected ? null : product }))}
                >
                  {product.image_urls[0] ? (
                    <img src={product.image_urls[0]} alt={product.name} className="gen-stepper-prod-img" />
                  ) : (
                    <div className="gen-stepper-prod-img-empty"><ImageIcon /></div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="gen-stepper-prod-name">{product.name}</div>
                    {product.description && (
                      <div className="gen-stepper-prod-desc">{product.description}</div>
                    )}
                  </div>
                  {isSelected && <div className="gen-stepper-prod-check"><CheckIcon /></div>}
                </button>
              );
            })}
          </div>

          <div className="gen-stepper-nav">
            <button className="gen-stepper-nav-back" onClick={onCancel}>Cancel</button>
            <div style={{ flex: 1 }} />
            <button
              className="gen-stepper-nav-skip"
              onClick={() => { setState((s) => ({ ...s, selectedProduct: null })); setStep(2); }}
            >
              Skip for now
            </button>
            <button className="gen-stepper-nav-next" onClick={goNext}>
              Next <ArrowRightIcon />
            </button>
          </div>
        </div>
      )}

      {/* ══ Step 2 — Campaign Details ══ */}
      {step === 2 && (
        <div>
          <h2 className="gen-stepper-h">{isExpress ? 'Quick details' : 'Campaign details'}</h2>
          <p className="gen-stepper-sub">
            {isExpress
              ? 'Name your campaign and describe your audience — we\'ll generate ads immediately.'
              : 'Name your campaign and describe who you want to reach.'}
          </p>

          {/* Selected product chip */}
          {state.selectedProduct && (
            <div className="gen-stepper-product-chip">
              {state.selectedProduct.image_urls[0] ? (
                <img src={state.selectedProduct.image_urls[0]} alt={state.selectedProduct.name} className="gen-stepper-product-thumb" />
              ) : (
                <div className="gen-stepper-product-thumb-empty"><ImageIcon /></div>
              )}
              <div>
                <div className="gen-stepper-product-label">Product</div>
                <div className="gen-stepper-product-name">{state.selectedProduct.name}</div>
              </div>
            </div>
          )}

          <div className="gen-stepper-field">
            <label className="gen-stepper-field-label">Campaign Name <span className="req">*</span></label>
            <input
              className={`gen-stepper-input${errors.name ? ' err' : ''}`}
              placeholder="e.g., Summer Sale 2026"
              value={state.campaignName}
              onChange={(e) => {
                setState((s) => ({ ...s, campaignName: e.target.value }));
                if (errors.name) setErrors((p) => ({ ...p, name: '' }));
              }}
            />
            {errors.name && <div className="gen-stepper-field-err">{errors.name}</div>}
          </div>

          <div className="gen-stepper-field">
            <label className="gen-stepper-field-label">Target Audience <span className="req">*</span></label>
            <textarea
              className={`gen-stepper-input gen-stepper-textarea${errors.audience ? ' err' : ''}`}
              placeholder="e.g., Tech-savvy millennials who care about productivity…"
              value={state.targetAudience}
              onChange={(e) => {
                setState((s) => ({ ...s, targetAudience: e.target.value }));
                if (errors.audience) setErrors((p) => ({ ...p, audience: '' }));
              }}
            />
            {errors.audience && <div className="gen-stepper-field-err">{errors.audience}</div>}
          </div>

          <div className="gen-stepper-field">
            <label className="gen-stepper-field-label">Campaign Goal</label>
            <div className="gen-stepper-pills">
              {GOAL_OPTIONS.map((g) => (
                <button
                  key={g.id}
                  className={`gen-stepper-pill${state.goal === g.id ? ' on' : ''}`}
                  onClick={() => setState((s) => ({ ...s, goal: s.goal === g.id ? '' : g.id }))}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* API error */}
          {createCampaign.isError && (
            <div className="gen-stepper-api-err">
              {(createCampaign.error as Error).message}
            </div>
          )}

          <div className="gen-stepper-nav">
            <button className="gen-stepper-nav-back" onClick={goBack}>
              <ArrowLeftIcon /> {isExpress ? 'Cancel' : 'Back'}
            </button>
            <div style={{ flex: 1 }} />
            {isExpress ? (
              /* Express: launch directly from step 2 */
              <button
                className="gen-stepper-nav-next accent"
                onClick={handleStep2Next}
                disabled={createCampaign.isPending}
              >
                {createCampaign.isPending ? <><SpinnerIcon /> Creating…</> : <><ZapIcon /> Generate Ads</>}
              </button>
            ) : (
              <button className="gen-stepper-nav-next" onClick={goNext}>
                Next <ArrowRightIcon />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ══ Step 3 — Launch Settings (normal mode only) ══ */}
      {step === 3 && (
        <div>
          <h2 className="gen-stepper-h">Customize & launch</h2>
          <p className="gen-stepper-sub">Fine-tune how the AI generates your ads. Everything here is optional.</p>

          {/* Express mode toggle */}
          <div className="gen-stepper-express-row">
            <div className="gen-stepper-express-left">
              <div className="gen-stepper-express-icon"><ZapIcon /></div>
              <div>
                <div className="gen-stepper-express-title">Express Mode</div>
                <div className="gen-stepper-express-desc">Skip plan review — generate ads immediately</div>
              </div>
            </div>
            <button
              role="switch"
              aria-checked={state.expressMode}
              className={`gen-stepper-toggle${state.expressMode ? ' on' : ''}`}
              onClick={() => setState((s) => ({ ...s, expressMode: !s.expressMode }))}
            >
              <span className="gen-stepper-toggle-thumb" />
            </button>
          </div>

          {/* Platforms */}
          <div className="gen-stepper-field">
            <label className="gen-stepper-field-label">Platforms</label>
            <div className="gen-stepper-pills">
              {CAMPAIGN_PLATFORM_OPTIONS.map((p) => {
                const active = state.platforms.includes(p.id);
                return (
                  <button
                    key={p.id}
                    className={`gen-stepper-pill${active ? ' on' : ''}`}
                    onClick={() => setState((s) => ({
                      ...s,
                      platforms: active ? s.platforms.filter((x) => x !== p.id) : [...s.platforms, p.id],
                    }))}
                  >
                    {active && <CheckIcon />} {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tone */}
          <div className="gen-stepper-field">
            <label className="gen-stepper-field-label">Ad Tone</label>
            <div className="gen-stepper-pills">
              {TONE_OPTIONS.map((t) => (
                <button
                  key={t.id}
                  className={`gen-stepper-pill${state.tone === t.id ? ' on' : ''}`}
                  onClick={() => setState((s) => ({ ...s, tone: t.id }))}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {createCampaign.isError && (
            <div className="gen-stepper-api-err">
              {(createCampaign.error as Error).message}
            </div>
          )}

          <div className="gen-stepper-nav">
            <button className="gen-stepper-nav-back" onClick={goBack}>
              <ArrowLeftIcon /> Back
            </button>
            <div style={{ flex: 1 }} />
            <button
              className="gen-stepper-nav-next accent"
              onClick={handleLaunch}
              disabled={createCampaign.isPending}
            >
              {createCampaign.isPending ? <><SpinnerIcon /> Creating…</> : <><ZapIcon /> Generate Ads</>}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
