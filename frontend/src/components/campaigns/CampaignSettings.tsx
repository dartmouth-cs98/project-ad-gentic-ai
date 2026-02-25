import { useState } from 'react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { CheckIcon, Loader2Icon } from 'lucide-react';

// ---------- Constants ----------

const settingsPlatforms = [
  { id: 'meta', label: 'Meta (Facebook/Instagram)' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'google', label: 'Google Ads' },
];

// ---------- Types ----------

export interface SettingsFormData {
  name: string;
  status: string;
  platforms: string[];
  budget: string;
  startDate: string;
  endDate: string;
}

interface CampaignSettingsProps {
  initial: SettingsFormData;
  onSave?: (data: SettingsFormData) => void;
  isSaving?: boolean;
  error?: string | null;
}

// ---------- Component ----------

export function CampaignSettings({ initial, onSave, isSaving = false, error = null }: CampaignSettingsProps) {
  const [form, setForm] = useState<SettingsFormData>(initial);

  const togglePlatform = (platformId: string) => {
    setForm({
      ...form,
      platforms: form.platforms.includes(platformId)
        ? form.platforms.filter((p) => p !== platformId)
        : [...form.platforms, platformId],
    });
  };

  return (
    <Card variant="elevated" padding="lg" className="max-w-2xl">
      <h3 className="font-semibold text-slate-900 mb-6">Campaign Settings</h3>
      <div className="space-y-6">
        <Input
          label="Campaign Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Status
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setForm({ ...form, status: 'active' })}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                form.status === 'active'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setForm({ ...form, status: 'paused' })}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                form.status === 'paused'
                  ? 'border-amber-500 bg-amber-50 text-amber-700'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              Paused
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Target Platforms
          </label>
          <div className="flex flex-wrap gap-2">
            {settingsPlatforms.map((platform) => (
              <button
                key={platform.id}
                type="button"
                onClick={() => togglePlatform(platform.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-all ${
                  form.platforms.includes(platform.id)
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                {form.platforms.includes(platform.id) && (
                  <CheckIcon className="w-3.5 h-3.5" />
                )}
                {platform.label}
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Daily Budget ($)"
          type="number"
          value={form.budget}
          onChange={(e) => setForm({ ...form, budget: e.target.value })}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Start Date"
            type="date"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
          />
          <Input
            label="End Date"
            type="date"
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="pt-4 border-t border-slate-100">
          <Button
            onClick={() => onSave?.(form)}
            disabled={isSaving}
            leftIcon={isSaving ? <Loader2Icon className="w-4 h-4 animate-spin" /> : undefined}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
