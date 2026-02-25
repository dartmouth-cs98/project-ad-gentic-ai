import { useState } from 'react';
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
} from 'lucide-react';
import { useCreateCampaign } from '../../hooks/useCampaigns';

const platforms = [
  { id: 'meta', label: 'Meta' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'linkedin', label: 'LinkedIn' },
];

const regions = [
  { id: 'na', label: 'North America' },
  { id: 'eu', label: 'Europe' },
  { id: 'apac', label: 'Asia Pacific' },
  { id: 'global', label: 'Global' },
];

interface CreateCampaignModalProps {
  businessClientId: number;
  onClose: () => void;
}

export function CreateCampaignModal({ businessClientId, onClose }: CreateCampaignModalProps) {
  const createMutation = useCreateCampaign();

  const [isAutofilling, setIsAutofilling] = useState(false);
  const [customGoal, setCustomGoal] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    product: '',
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
    if (!newCampaign.product) newErrors.product = 'Product/Service is required';
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
        product_context: newCampaign.product,
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

          <Input
            label="Product / Service *"
            placeholder="What are you advertising?"
            value={newCampaign.product}
            onChange={(e) =>
              setNewCampaign({ ...newCampaign, product: e.target.value })
            }
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
            leftIcon={isCreating ? undefined : <SparklesIcon className="w-4 h-4" />}
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
