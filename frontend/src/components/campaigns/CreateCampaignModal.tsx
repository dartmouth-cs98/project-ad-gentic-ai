import { useState, useRef, useEffect, useCallback } from 'react';
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
import type { Product } from '../../types';
import { CAMPAIGN_PLATFORM_OPTIONS } from '../../constants/campaigns';

const regions = [
  { id: 'na', label: 'North America' },
  { id: 'eu', label: 'Europe' },
  { id: 'apac', label: 'Asia Pacific' },
  { id: 'global', label: 'Global' },
];

const inputClass = 'w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20 disabled:opacity-50';
const labelClass = 'block text-sm font-medium mb-1.5';

// ---------- Product Selector ----------

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
      <div>
        <label className={labelClass}>Product <span className="text-red-500">*</span></label>
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-600/10 border border-blue-600/20 rounded-lg">
          {selectedProduct.image_urls[0] ? (
            <img src={selectedProduct.image_urls[0]} alt={selectedProduct.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <ImageIcon className="w-4 h-4 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{selectedProduct.name}</p>
            {selectedProduct.description && (
              <p className="text-xs text-muted-foreground truncate">{selectedProduct.description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => !disabled && onSelect(null)}
            disabled={disabled}
            className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <label className={labelClass}>Product <span className="text-red-500">*</span></label>
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search your products..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          disabled={disabled}
          className={`${inputClass} pl-9 ${error ? 'border-red-500/50' : ''}`}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-card border border-border rounded-lg shadow-lg max-h-52 overflow-y-auto">
          {isLoading && (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
              <Loader2Icon className="w-4 h-4 animate-spin" /> Loading products...
            </div>
          )}
          {!isLoading && filtered.length === 0 && (
            <div className="flex flex-col items-center gap-1 px-4 py-4 text-center">
              <PackageIcon className="w-5 h-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {products.length === 0 ? 'No products yet. Add one on the Products page.' : 'No products match your search.'}
              </p>
            </div>
          )}
          {!isLoading && filtered.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => { onSelect(product); setQuery(''); setIsOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors text-left"
            >
              {product.image_urls[0] ? (
                <img src={product.image_urls[0]} alt={product.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <ImageIcon className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{product.name}</p>
                {product.description && (
                  <p className="text-xs text-muted-foreground truncate">{product.description}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Main Modal ----------

interface CreateCampaignModalProps {
  /** Positive business client id; parent must not render the modal until this is set. */
  businessClientId: number;
  onClose: () => void;
}

export function CreateCampaignModal({ businessClientId, onClose }: CreateCampaignModalProps) {
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
      },
      { onSuccess: onClose },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => !isCreating && onClose()} />

      <div className="relative w-full max-w-lg bg-card border border-border rounded-xl max-h-[90vh] overflow-y-auto text-foreground">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold">Create New Campaign</h2>
          <button onClick={onClose} disabled={isCreating} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className={labelClass}>Campaign Name <span className="text-red-500">*</span></label>
            <input
              className={inputClass}
              placeholder="e.g., Summer Sale 2026"
              value={newCampaign.name}
              onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
              disabled={isCreating}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <ProductSelector
            businessClientId={businessClientId}
            selectedProduct={selectedProduct}
            onSelect={(p) => { setSelectedProduct(p); setErrors((prev) => { const { product: _, ...rest } = prev; return rest; }); }}
            error={errors.product}
            disabled={isCreating}
          />

          <div>
            <label className={labelClass}>Target Audience <span className="text-red-500">*</span></label>
            <textarea
              className={`${inputClass} resize-none`}
              rows={3}
              placeholder="Describe who you want to reach..."
              value={newCampaign.targetAudience}
              onChange={(e) => setNewCampaign({ ...newCampaign, targetAudience: e.target.value })}
              disabled={isCreating}
            />
            {errors.targetAudience && <p className="text-xs text-red-500 mt-1">{errors.targetAudience}</p>}
          </div>

          <div>
            <label className={labelClass}>Campaign Goal</label>
            <select
              className={inputClass}
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
            {newCampaign.goal === 'other' && (
              <input
                className={`${inputClass} mt-2`}
                placeholder="Describe your specific goal..."
                value={customGoal}
                onChange={(e) => setCustomGoal(e.target.value)}
                disabled={isCreating}
              />
            )}
          </div>

          <div>
            <label className={labelClass}>Target Platforms</label>
            <div className="flex flex-wrap gap-2">
              {CAMPAIGN_PLATFORM_OPTIONS.map((platform) => (
                <button
                  key={platform.id}
                  type="button"
                  onClick={() => togglePlatform(platform.id)}
                  disabled={isCreating}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors disabled:opacity-50 ${
                    newCampaign.platforms.includes(platform.id)
                      ? 'border-blue-600 bg-blue-600/10 text-foreground'
                      : 'border-border text-muted-foreground hover:border-foreground/30'
                  }`}
                >
                  {newCampaign.platforms.includes(platform.id) && <CheckIcon className="w-3.5 h-3.5 text-blue-600" />}
                  {platform.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>Target Region</label>
            <select
              className={inputClass}
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
          <div className="mx-6 mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500">
            {(createMutation.error as Error).message}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} disabled={isCreating} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button
            onClick={handleCreateCampaign}
            disabled={isCreating}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isCreating ? <><Loader2Icon className="w-4 h-4 animate-spin" /> Creating...</> : <><PlusIcon className="w-4 h-4" /> Create Campaign</>}
          </button>
        </div>
      </div>
    </div>
  );
}
