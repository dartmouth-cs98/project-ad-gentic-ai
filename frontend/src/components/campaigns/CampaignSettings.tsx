import { useState } from 'react';
import { CheckIcon, Loader2Icon } from 'lucide-react';
import { CAMPAIGN_PLATFORM_OPTIONS } from '../../constants/campaigns';

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
    <div className="stg-section" style={{ maxWidth: 640 }}>
      <div className="stg-section-head">Campaign Settings</div>
      <div className="stg-section-sub">Update campaign name, status, platforms, and schedule.</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <label className="stg-label" htmlFor="cmp-settings-name">Campaign Name</label>
          <input
            id="cmp-settings-name"
            className="stg-input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div>
          <label className="stg-label">Status</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(['active', 'paused'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setForm({ ...form, status })}
                className={`as-pill${form.status === status ? ' on' : ''}`}
                style={{ border: '1px solid var(--as-rule)', textTransform: 'capitalize' }}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="stg-label">Target Platforms</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {CAMPAIGN_PLATFORM_OPTIONS.map((platform) => {
              const selected = form.platforms.includes(platform.id);
              return (
                <button
                  key={platform.id}
                  type="button"
                  onClick={() => togglePlatform(platform.id)}
                  className={`as-pill${selected ? ' on' : ''}`}
                  style={{ border: '1px solid var(--as-rule)', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  {selected && <CheckIcon size={12} />}
                  {platform.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="stg-label" htmlFor="cmp-settings-budget">Daily Budget ($)</label>
          <input
            id="cmp-settings-budget"
            className="stg-input"
            type="number"
            value={form.budget}
            onChange={(e) => setForm({ ...form, budget: e.target.value })}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label className="stg-label" htmlFor="cmp-settings-start">Start Date</label>
            <input
              id="cmp-settings-start"
              className="stg-input"
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
          </div>
          <div>
            <label className="stg-label" htmlFor="cmp-settings-end">End Date</label>
            <input
              id="cmp-settings-end"
              className="stg-input"
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
          </div>
        </div>

        {error && (
          <div className="stg-toast err">{error}</div>
        )}

        <div style={{ paddingTop: 8, borderTop: '1px solid var(--as-rule)' }}>
          <button
            type="button"
            className="as-btn-solid"
            onClick={() => onSave?.(form)}
            disabled={isSaving}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 18px' }}
          >
            {isSaving && <Loader2Icon size={14} style={{ animation: 'as-spin 0.8s linear infinite' }} />}
            {isSaving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
