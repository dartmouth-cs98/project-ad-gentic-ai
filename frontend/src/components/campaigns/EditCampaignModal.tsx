import { useState } from 'react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { XIcon } from 'lucide-react';

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
}

// ---------- Component ----------

export function EditCampaignModal({
  initial,
  onClose,
  onSave,
}: EditCampaignModalProps) {
  const [form, setForm] = useState<EditFormData>(initial);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
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

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave(form)}>Save Changes</Button>
        </div>
      </Card>
    </div>
  );
}
