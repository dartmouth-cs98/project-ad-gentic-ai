import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useCreateCampaign } from '../../hooks/useCampaigns';
import { useProducts } from '../../hooks/useProducts';
import type { Product, Campaign } from '../../types';
import { CAMPAIGN_PLATFORM_OPTIONS } from '../../constants/campaigns';

const regions = [
  { id: 'na', label: 'North America' },
  { id: 'eu', label: 'Europe' },
  { id: 'apac', label: 'Asia Pacific' },
  { id: 'global', label: 'Global' },
];

function XIcon() {
  return (
    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" width={11} height={11}>
      <path d="M2 2l8 8M10 2L2 10" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      width={13} height={13} style={{ animation: 'as-spin 0.8s linear infinite' }}>
      <circle cx="8" cy="8" r="6" strokeDasharray="18 8" />
    </svg>
  );
}

function SearchSvg() {
  return (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width={12} height={12}>
      <circle cx="5.5" cy="5.5" r="4" />
      <path d="M9 9l3.5 3.5" />
    </svg>
  );
}

function PackageSvg() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width={18} height={18}>
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}

function CheckSvg() {
  return (
    <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" width={10} height={10}>
      <path d="M2 5l2.5 2.5L8 3" />
    </svg>
  );
}


function ProductSelector({
  businessClientId,
  selectedProduct,
  onSelect,
  error,
  disabled,
}: {
  businessClientId: number;
  selectedProduct: Product | null;
  onSelect: (product: Product | null) => void;
  error?: string;
  disabled?: boolean;
}) {
  const { data: products = [], isLoading } = useProducts(businessClientId);
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      (p.description ?? '').toLowerCase().includes(query.toLowerCase()),
  );

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (selectedProduct) {
    return (
      <div className="as-field">
        <label className="as-field-label">
          Product <span className="as-field-required">*</span>
        </label>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px',
          background: 'var(--as-paper)',
          border: '1px solid var(--as-rule)',
        }}>
          {selectedProduct.image_urls[0] ? (
            <img src={selectedProduct.image_urls[0]} alt={selectedProduct.name}
              style={{ width: 32, height: 32, objectFit: 'cover', flexShrink: 0 }} />
          ) : (
            <div style={{ width: 32, height: 32, background: 'var(--as-paper-2)', display: 'grid', placeItems: 'center', flexShrink: 0, color: 'var(--as-ink-3)' }}>
              <PackageSvg />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--as-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedProduct.name}
            </div>
            {selectedProduct.description && (
              <div style={{ fontSize: 11, color: 'var(--as-ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                {selectedProduct.description}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => !disabled && onSelect(null)}
            disabled={disabled}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--as-ink-3)', display: 'grid', placeItems: 'center', padding: 4 }}
          >
            <XIcon />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="as-field" style={{ position: 'relative' }}>
      <label className="as-field-label">
        Product <span className="as-field-required">*</span>
      </label>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--as-ink-3)', pointerEvents: 'none' }}>
          <SearchSvg />
        </span>
        <input
          type="text"
          className="as-input"
          placeholder="Search your products…"
          style={{ paddingLeft: 32, borderColor: error ? 'rgba(200,60,60,0.5)' : undefined }}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          disabled={disabled}
        />
      </div>
      {error && <div className="as-field-error">{error}</div>}

      {isOpen && (
        <div style={{
          position: 'absolute',
          zIndex: 100,
          top: '100%',
          left: 0,
          right: 0,
          marginTop: 2,
          background: 'var(--as-bg)',
          border: '1px solid var(--as-rule-strong)',
          maxHeight: 200,
          overflowY: 'auto',
        }}>
          {isLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', fontSize: 13, color: 'var(--as-ink-3)' }}>
              <SpinnerIcon /> Loading products…
            </div>
          )}
          {!isLoading && filtered.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '16px 14px', textAlign: 'center', color: 'var(--as-ink-3)' }}>
              <PackageSvg />
              <span style={{ fontSize: 12 }}>
                {products.length === 0 ? 'No products yet. Add one on the Products page.' : 'No products match your search.'}
              </span>
            </div>
          )}
          {!isLoading && filtered.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => { onSelect(product); setQuery(''); setIsOpen(false); }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                background: 'none',
                border: 'none',
                borderBottom: '1px solid var(--as-rule)',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'inherit',
                transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--as-paper)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
            >
              {product.image_urls[0] ? (
                <img src={product.image_urls[0]} alt={product.name}
                  style={{ width: 28, height: 28, objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 28, height: 28, background: 'var(--as-paper-2)', display: 'grid', placeItems: 'center', flexShrink: 0, color: 'var(--as-ink-3)' }}>
                  <PackageSvg />
                </div>
              )}
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--as-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {product.name}
                </div>
                {product.description && (
                  <div style={{ fontSize: 11, color: 'var(--as-ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
                    {product.description}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


interface CreateCampaignModalProps {
  businessClientId: number;
  onClose: () => void;
  onCreated?: (campaign: Campaign) => void;
}

export function CreateCampaignModal({ businessClientId, onClose, onCreated }: CreateCampaignModalProps) {
  const createMutation = useCreateCampaign();
  const autofillTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [customGoal, setCustomGoal] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    targetAudience: '',
    goal: '',
    platforms: [] as string[],
    region: '',
  });

  const isCreating = createMutation.isPending;

  useEffect(() => {
    return () => {
      if (autofillTimeoutRef.current !== null) {
        clearTimeout(autofillTimeoutRef.current);
        autofillTimeoutRef.current = null;
      }
    };
  }, []);

  const togglePlatform = (platformId: string) => {
    setNewCampaign({
      ...newCampaign,
      platforms: newCampaign.platforms.includes(platformId)
        ? newCampaign.platforms.filter((p) => p !== platformId)
        : [...newCampaign.platforms, platformId],
    });
  };

  const handleCreate = () => {
    const newErrors: Record<string, string> = {};
    if (!newCampaign.name) newErrors.name = 'Campaign name is required';
    if (!selectedProduct) newErrors.product = 'Please select a product';
    if (!newCampaign.targetAudience) newErrors.targetAudience = 'Target audience is required';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    createMutation.mutate(
      {
        business_client_id: businessClientId,
        name: newCampaign.name,
        product_context: selectedProduct!.name,
        product_ids: JSON.stringify([selectedProduct!.id]),
        target_audience: newCampaign.targetAudience,
        goal: newCampaign.goal === 'other' ? customGoal || 'other' : newCampaign.goal || null,
        platforms: JSON.stringify(newCampaign.platforms),
      },
      {
        onSuccess: (campaign) => {
          onClose();
          onCreated?.(campaign);
        },
      },
    );
  };

  const modal = (
    <div className="as-modal-overlay" onClick={() => !isCreating && onClose()}>
      <div
        role="dialog"
        aria-labelledby="create-campaign-title"
        className="as-modal"
        style={{ width: 'min(600px, 100%)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="as-modal-head">
          <div>
            <div className="as-modal-eyebrow">— NEW</div>
            <div className="as-modal-title" id="create-campaign-title">Create Campaign</div>
          </div>
          <button className="as-modal-close" onClick={onClose} disabled={isCreating}>
            <XIcon />
          </button>
        </div>

        <div className="as-modal-body">
          {/* Campaign name */}
          <div className="as-field">
            <label className="as-field-label">
              Campaign Name <span className="as-field-required">*</span>
            </label>
            <input
              className="as-input"
              placeholder="e.g., Summer Sale 2026"
              value={newCampaign.name}
              onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
              disabled={isCreating}
            />
            {errors.name && <div className="as-field-error">{errors.name}</div>}
          </div>

          {/* Product */}
          <ProductSelector
            businessClientId={businessClientId}
            selectedProduct={selectedProduct}
            onSelect={(p) => {
              setSelectedProduct(p);
              setErrors((prev) => { const { product: _, ...rest } = prev; return rest; });
            }}
            error={errors.product}
            disabled={isCreating}
          />

          {/* Target audience */}
          <div className="as-field">
            <label className="as-field-label">
              Target Audience <span className="as-field-required">*</span>
            </label>
            <textarea
              className="as-textarea"
              rows={3}
              placeholder="Describe who you want to reach…"
              value={newCampaign.targetAudience}
              onChange={(e) => setNewCampaign({ ...newCampaign, targetAudience: e.target.value })}
              disabled={isCreating}
            />
            {errors.targetAudience && <div className="as-field-error">{errors.targetAudience}</div>}
          </div>

          {/* Campaign goal */}
          <div className="as-field">
            <label className="as-field-label">Campaign Goal</label>
            <div className="as-select-wrap">
              <select
                className="as-select"
                value={newCampaign.goal}
                onChange={(e) => setNewCampaign({ ...newCampaign, goal: e.target.value })}
                disabled={isCreating}
              >
                <option value="">Select goal</option>
                <option value="awareness">Brand Awareness</option>
                <option value="leads">Lead Generation</option>
                <option value="sales">Direct Sales</option>
                <option value="engagement">Engagement</option>
                <option value="other">Other</option>
              </select>
            </div>
            {newCampaign.goal === 'other' && (
              <input
                className="as-input"
                style={{ marginTop: 8 }}
                placeholder="Describe your specific goal…"
                value={customGoal}
                onChange={(e) => setCustomGoal(e.target.value)}
                disabled={isCreating}
              />
            )}
          </div>

          {/* Target platforms */}
          <div className="as-field">
            <label className="as-field-label">Target Platforms</label>
            <div className="as-chip-group">
              {CAMPAIGN_PLATFORM_OPTIONS.map((platform) => (
                <button
                  key={platform.id}
                  type="button"
                  onClick={() => togglePlatform(platform.id)}
                  disabled={isCreating}
                  className={`as-chip${newCampaign.platforms.includes(platform.id) ? ' on' : ''}`}
                >
                  {newCampaign.platforms.includes(platform.id) && <CheckSvg />}
                  {platform.label}
                </button>
              ))}
            </div>
          </div>

          {/* Region */}
          <div className="as-field">
            <label className="as-field-label">Target Region</label>
            <div className="as-select-wrap">
              <select
                className="as-select"
                value={newCampaign.region}
                onChange={(e) => setNewCampaign({ ...newCampaign, region: e.target.value })}
                disabled={isCreating}
              >
                <option value="">Select region</option>
                {regions.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
            </div>
          </div>

          {createMutation.isError && (
            <p style={{ fontSize: 13, color: '#c44', margin: 0 }} role="alert">
              {(createMutation.error as Error).message}
            </p>
          )}
        </div>

        <div className="as-modal-foot">
          <button
            className="as-btn-ghost"
            onClick={onClose}
            disabled={isCreating}
            style={{ padding: '8px 16px' }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="as-btn-solid"
            onClick={handleCreate}
            disabled={isCreating}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 18px' }}
          >
            {isCreating ? <><SpinnerIcon /> Creating…</> : 'Create Campaign'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
