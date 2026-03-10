import { useState, useRef, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import {
  XIcon,
  CheckIcon,
  Loader2Icon,
  SparklesIcon,
  PlusIcon,
  SearchIcon,
  PackageIcon,
  ImageIcon,
} from 'lucide-react';
import { useCreateCampaign } from '../../hooks/useCampaigns';
import { useProducts } from '../../hooks/useProducts';
import type { Product } from '../../types';

const platforms = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'X', label: 'Twitter' },
];

const regions = [
  { id: 'na', label: 'North America' },
  { id: 'eu', label: 'Europe' },
  { id: 'apac', label: 'Asia Pacific' },
  { id: 'global', label: 'Global' },
];

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

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // If a product is selected, show a chip instead of the search input
  if (selectedProduct) {
    return (
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Product *
        </label>
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl">
          {selectedProduct.image_url ? (
            <img
              src={selectedProduct.image_url}
              alt={selectedProduct.name}
              className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
              <ImageIcon className="w-4 h-4 text-slate-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">
              {selectedProduct.name}
            </p>
            {selectedProduct.description && (
              <p className="text-xs text-slate-500 truncate">
                {selectedProduct.description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => !disabled && onSelect(null)}
            disabled={disabled}
            className="p-1 rounded-lg hover:bg-blue-100 transition-colors text-slate-500 hover:text-slate-700"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        Product *
      </label>
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search your products..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          disabled={disabled}
          className={`
            w-full pl-9 pr-4 py-2.5 bg-white border rounded-xl text-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-red-300' : 'border-slate-200'}
          `}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
          {isLoading && (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-slate-500">
              <Loader2Icon className="w-4 h-4 animate-spin" />
              Loading products...
            </div>
          )}

          {!isLoading && filtered.length === 0 && (
            <div className="flex flex-col items-center gap-1 px-4 py-4 text-center">
              <PackageIcon className="w-5 h-5 text-slate-300" />
              <p className="text-sm text-slate-500">
                {products.length === 0
                  ? 'No products yet. Add one on the Products page.'
                  : 'No products match your search.'}
              </p>
            </div>
          )}

          {!isLoading &&
            filtered.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => {
                  onSelect(product);
                  setQuery('');
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left"
              >
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <ImageIcon className="w-4 h-4 text-slate-400" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {product.name}
                  </p>
                  {product.description && (
                    <p className="text-xs text-slate-500 truncate">
                      {product.description}
                    </p>
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
  businessClientId: number;
  onClose: () => void;
}

export function CreateCampaignModal({ businessClientId, onClose }: CreateCampaignModalProps) {
  const createMutation = useCreateCampaign();

  const [isAutofilling, setIsAutofilling] = useState(false);
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

  const toggleNewCampaignPlatform = (platformId: string) => {
    setNewCampaign({
      ...newCampaign,
      platforms: newCampaign.platforms.includes(platformId)
        ? newCampaign.platforms.filter((p) => p !== platformId)
        : [...newCampaign.platforms, platformId],
    });
  };

  const handleAutofill = () => {
    setIsAutofilling(true);
    setTimeout(() => {
      setNewCampaign({
        ...newCampaign,
        platforms: ['meta', 'tiktok'],
        region: 'na',
        goal: 'sales',
        targetAudience: 'Tech-savvy millennials interested in productivity tools.',
      });
      setIsAutofilling(false);
    }, 1500);
  };

  const handleCreateCampaign = () => {
    const newErrors: Record<string, string> = {};
    if (!newCampaign.name) newErrors.name = 'Campaign name is required';
    if (!selectedProduct) newErrors.product = 'Please select a product';
    if (!newCampaign.targetAudience)
      newErrors.targetAudience = 'Target audience is required';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

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
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={() => !isCreating && onClose()}
      />

      <Card
        variant="elevated"
        padding="lg"
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900">
            Create New Campaign
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
            disabled={isCreating}
          >
            <XIcon className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleAutofill}
            disabled={isAutofilling || isCreating}
            className="w-full flex items-center justify-center gap-2 p-3 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors font-medium mb-4 disabled:opacity-50"
          >
            {isAutofilling ? (
              <>
                <Loader2Icon className="w-4 h-4 animate-spin" />
                Auto-filling details...
              </>
            ) : (
              <>
                <SparklesIcon className="w-4 h-4" />
                Auto-fill from profile
              </>
            )}
          </button>

          <Input
            label="Campaign Name *"
            placeholder="e.g., Summer Sale 2026"
            value={newCampaign.name}
            onChange={(e) =>
              setNewCampaign({ ...newCampaign, name: e.target.value })
            }
            error={errors.name}
            disabled={isCreating}
          />

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

          <Textarea
            label="Target Audience *"
            placeholder="Describe who you want to reach..."
            rows={3}
            value={newCampaign.targetAudience}
            onChange={(e) =>
              setNewCampaign({ ...newCampaign, targetAudience: e.target.value })
            }
            error={errors.targetAudience}
            disabled={isCreating}
          />

          <div>
            <Select
              label="Campaign Goal"
              options={[
                { value: 'awareness', label: 'Brand Awareness' },
                { value: 'leads', label: 'Lead Generation' },
                { value: 'sales', label: 'Direct Sales' },
                { value: 'engagement', label: 'Engagement' },
                { value: 'other', label: 'Other' },
              ]}
              placeholder="Select goal"
              value={newCampaign.goal}
              onChange={(e) =>
                setNewCampaign({ ...newCampaign, goal: e.target.value })
              }
              disabled={isCreating}
            />

            {newCampaign.goal === 'other' && (
              <div className="mt-2">
                <Input
                  label="Custom Goal"
                  placeholder="Describe your specific goal..."
                  value={customGoal}
                  onChange={(e) => setCustomGoal(e.target.value)}
                  disabled={isCreating}
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Target Platforms
            </label>
            <div className="flex flex-wrap gap-2">
              {platforms.map((platform) => (
                <button
                  key={platform.id}
                  type="button"
                  onClick={() => toggleNewCampaignPlatform(platform.id)}
                  disabled={isCreating}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-all
                    ${
                      newCampaign.platforms.includes(platform.id)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }
                    ${isCreating ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {newCampaign.platforms.includes(platform.id) && (
                    <CheckIcon className="w-3.5 h-3.5" />
                  )}
                  {platform.label}
                </button>
              ))}
            </div>
          </div>

          <Select
            label="Target Region"
            options={regions.map((r) => ({ value: r.id, label: r.label }))}
            placeholder="Select region"
            value={newCampaign.region}
            onChange={(e) =>
              setNewCampaign({ ...newCampaign, region: e.target.value })
            }
            disabled={isCreating}
          />
        </div>

        {createMutation.isError && (
          <p className="mt-4 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
            {(createMutation.error as Error).message}
          </p>
        )}

        <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-slate-100">
          <Button variant="ghost" onClick={onClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateCampaign}
            leftIcon={isCreating ? undefined : <PlusIcon className="w-4 h-4" />}
            isLoading={isCreating}
            disabled={isCreating}
          >
            {isCreating ? 'Creating...' : 'Create Campaign'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
