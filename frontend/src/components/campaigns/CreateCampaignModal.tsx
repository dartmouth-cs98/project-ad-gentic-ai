import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  XIcon,
  CheckIcon,
  Loader2Icon,
  PlusIcon,
  SearchIcon,
  PackageIcon,
  ImageIcon,
} from 'lucide-react';
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

const GOAL_OPTIONS = [
  { value: 'awareness', label: 'Brand Awareness' },
  { value: 'leads', label: 'Lead Generation' },
  { value: 'sales', label: 'Direct Sales' },
  { value: 'engagement', label: 'Engagement' },
  { value: 'other', label: 'Other' },
];

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
        <div className="cmp-product-selected">
          {selectedProduct.image_urls[0] ? (
            <img src={selectedProduct.image_urls[0]} alt={selectedProduct.name} />
          ) : (
            <div className="cmp-product-selected-thumb">
              <ImageIcon size={16} />
            </div>
          )}
          <div className="cmp-product-selected-meta">
            <div className="cmp-product-selected-name">{selectedProduct.name}</div>
            {selectedProduct.description && (
              <div className="cmp-product-selected-desc">{selectedProduct.description}</div>
            )}
          </div>
          <button
            type="button"
            onClick={() => !disabled && onSelect(null)}
            disabled={disabled}
            className="as-modal-close"
            aria-label="Clear product"
          >
            <XIcon size={14} />
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
      <div className="cmp-product-search-wrap">
        <SearchIcon size={14} />
        <input
          type="text"
          className={`as-input${error ? ' as-input-error' : ''}`}
          placeholder="Search your products…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          disabled={disabled}
        />
      </div>
      {error && <span className="as-field-error">{error}</span>}

      {isOpen && (
        <div className="cmp-product-dropdown">
          {isLoading && (
            <div className="cmp-product-empty" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Loader2Icon size={14} style={{ animation: 'as-spin 0.8s linear infinite' }} />
              Loading products…
            </div>
          )}
          {!isLoading && filtered.length === 0 && (
            <div className="cmp-product-empty">
              <PackageIcon size={18} style={{ margin: '0 auto 8px', display: 'block', color: 'var(--as-ink-3)' }} />
              {products.length === 0 ? 'No products yet. Add one on the Products page.' : 'No products match your search.'}
            </div>
          )}
          {!isLoading && filtered.map((product) => (
            <button
              key={product.id}
              type="button"
              className="cmp-product-option"
              onClick={() => { onSelect(product); setQuery(''); setIsOpen(false); }}
            >
              {product.image_urls[0] ? (
                <img src={product.image_urls[0]} alt={product.name} />
              ) : (
                <div className="cmp-product-selected-thumb" style={{ width: 32, height: 32 }}>
                  <ImageIcon size={14} />
                </div>
              )}
              <div className="cmp-product-selected-meta">
                <div className="cmp-product-selected-name">{product.name}</div>
                {product.description && (
                  <div className="cmp-product-selected-desc">{product.description}</div>
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

  const togglePlatform = (platformId: string) => {
    setNewCampaign({
      ...newCampaign,
      platforms: newCampaign.platforms.includes(platformId)
        ? newCampaign.platforms.filter((p) => p !== platformId)
        : [...newCampaign.platforms, platformId],
    });
  };

  const handleCreateCampaign = () => {
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
        onClick={(e) => e.stopPropagation()}
      >
        <div className="as-modal-head">
          <div>
            <div className="as-modal-eyebrow">— NEW · CAMPAIGN</div>
            <div className="as-modal-title" id="create-campaign-title">Create Campaign</div>
          </div>
          <button type="button" className="as-modal-close" onClick={onClose} disabled={isCreating} aria-label="Close">
            <XIcon size={14} />
          </button>
        </div>

        <div className="as-modal-body">
          <div className="as-field">
            <label className="as-field-label" htmlFor="create-campaign-name">
              Campaign name <span className="as-field-required">*</span>
            </label>
            <input
              id="create-campaign-name"
              className="as-input"
              placeholder="e.g. Summer Sale 2026"
              value={newCampaign.name}
              onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
              disabled={isCreating}
            />
            {errors.name && <span className="as-field-error">{errors.name}</span>}
          </div>

          <ProductSelector
            businessClientId={businessClientId}
            selectedProduct={selectedProduct}
            onSelect={(p) => {
              setSelectedProduct(p);
              setErrors((prev) => {
                const { product: _, ...rest } = prev;
                return rest;
              });
            }}
            error={errors.product}
            disabled={isCreating}
          />

          <div className="as-field">
            <label className="as-field-label" htmlFor="create-campaign-audience">
              Target audience <span className="as-field-required">*</span>
            </label>
            <textarea
              id="create-campaign-audience"
              className="as-textarea"
              rows={3}
              placeholder="Describe who you want to reach…"
              value={newCampaign.targetAudience}
              onChange={(e) => setNewCampaign({ ...newCampaign, targetAudience: e.target.value })}
              disabled={isCreating}
            />
            {errors.targetAudience && <span className="as-field-error">{errors.targetAudience}</span>}
          </div>

          <div className="as-field">
            <label className="as-field-label">Campaign goal</label>
            <div className="as-chip-group">
              {GOAL_OPTIONS.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  className={`as-chip${newCampaign.goal === g.value ? ' on' : ''}`}
                  onClick={() => {
                    if (newCampaign.goal === g.value) {
                      setNewCampaign({ ...newCampaign, goal: '' });
                      if (g.value === 'other') setCustomGoal('');
                    } else {
                      setNewCampaign({ ...newCampaign, goal: g.value });
                    }
                  }}
                  disabled={isCreating}
                >
                  {newCampaign.goal === g.value && <CheckIcon size={12} />}
                  {g.label}
                </button>
              ))}
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

          <div className="as-field">
            <label className="as-field-label">Target platforms</label>
            <div className="as-chip-group">
              {CAMPAIGN_PLATFORM_OPTIONS.map((platform) => (
                <button
                  key={platform.id}
                  type="button"
                  className={`as-chip${newCampaign.platforms.includes(platform.id) ? ' on' : ''}`}
                  onClick={() => togglePlatform(platform.id)}
                  disabled={isCreating}
                >
                  {newCampaign.platforms.includes(platform.id) && <CheckIcon size={12} />}
                  {platform.label}
                </button>
              ))}
            </div>
          </div>

          <div className="as-field">
            <label className="as-field-label" htmlFor="create-campaign-region">Target region</label>
            <select
              id="create-campaign-region"
              className="as-select"
              value={newCampaign.region}
              onChange={(e) => setNewCampaign({ ...newCampaign, region: e.target.value })}
              disabled={isCreating}
            >
              <option value="">Select region</option>
              {regions.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </div>

          {createMutation.isError && (
            <div className="stg-toast err">{(createMutation.error as Error).message}</div>
          )}
        </div>

        <div className="as-modal-foot">
          <button type="button" className="as-btn-ghost" onClick={onClose} disabled={isCreating} style={{ padding: '8px 16px' }}>
            Cancel
          </button>
          <button
            type="button"
            className="as-btn-solid"
            onClick={handleCreateCampaign}
            disabled={isCreating}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 18px' }}
          >
            {isCreating ? (
              <>
                <Loader2Icon size={14} style={{ animation: 'as-spin 0.8s linear infinite' }} />
                Creating…
              </>
            ) : (
              <>
                <PlusIcon size={14} />
                Create Campaign
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
