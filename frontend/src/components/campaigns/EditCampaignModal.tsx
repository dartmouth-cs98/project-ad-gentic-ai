import { useState } from 'react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { XIcon, Loader2Icon } from 'lucide-react';

// ---------- Types ----------

export interface EditFormData {
  name: string;
  status: string;
  goal: string;
  customGoal: string;
  targetAudience: string;
}

interface EditCampaignModalProps {
  initial: EditFormData;
  onClose: () => void;
  onSave: (data: EditFormData) => void;
  isSaving?: boolean;
  error?: string | null;
}

// ---------- Component ----------

export function EditCampaignModal({
  initial,
  onClose,
  onSave,
  isSaving = false,
  error = null,
}: EditCampaignModalProps) {
  const [form, setForm] = useState<EditFormData>(initial);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={() => !isSaving && onClose()}
      />
      <Card
        variant="elevated"
        padding="lg"
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900">
            Edit Campaign
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100"
            disabled={isSaving}
          >
            <XIcon className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="space-y-4">
          <Input
            label="Campaign Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
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
              value={form.goal}
              onChange={(e) => setForm({ ...form, goal: e.target.value })}
            />
            {form.goal === 'other' && (
              <div className="mt-2">
                <Textarea
                  label="Custom Goal"
                  placeholder="Describe your specific goal..."
                  rows={3}
                  value={form.customGoal}
                  onChange={(e) =>
                    setForm({ ...form, customGoal: e.target.value })
                  }
                />
              </div>
            )}
          </div>

          <Textarea
            label="Target Audience"
            rows={3}
            value={form.targetAudience}
            onChange={(e) =>
              setForm({ ...form, targetAudience: e.target.value })
            }
          />
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={() => onSave(form)}
            disabled={isSaving}
            leftIcon={isSaving ? <Loader2Icon className="w-4 h-4 animate-spin" /> : undefined}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
