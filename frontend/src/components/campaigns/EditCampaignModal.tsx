import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2Icon } from 'lucide-react';

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

function XIcon() {
  return (
    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" width={11} height={11}>
      <path d="M2 2l8 8M10 2L2 10" />
    </svg>
  );
}

const GOAL_OPTIONS = [
  { value: 'awareness', label: 'Brand Awareness' },
  { value: 'leads', label: 'Lead Generation' },
  { value: 'sales', label: 'Direct Sales' },
  { value: 'engagement', label: 'Engagement' },
  { value: 'other', label: 'Other' },
];

export function EditCampaignModal({
  initial,
  onClose,
  onSave,
  isSaving = false,
  error = null,
}: EditCampaignModalProps) {
  const [form, setForm] = useState<EditFormData>(initial);

  const modal = (
    <div className="as-modal-overlay" onClick={() => !isSaving && onClose()}>
      <div
        role="dialog"
        aria-labelledby="edit-campaign-title"
        className="as-modal sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="as-modal-head">
          <div>
            <div className="as-modal-eyebrow">— CAMPAIGN</div>
            <div className="as-modal-title" id="edit-campaign-title">Edit Campaign</div>
          </div>
          <button type="button" className="as-modal-close" onClick={onClose} disabled={isSaving}>
            <XIcon />
          </button>
        </div>

        <div className="as-modal-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="stg-label" htmlFor="edit-campaign-name">Campaign Name</label>
              <input
                id="edit-campaign-name"
                className="stg-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div>
              <label className="stg-label" htmlFor="edit-campaign-goal">Campaign Goal</label>
              <select
                id="edit-campaign-goal"
                className="stg-input"
                value={form.goal}
                onChange={(e) => setForm({ ...form, goal: e.target.value })}
              >
                {GOAL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {form.goal === 'other' && (
              <div>
                <label className="stg-label" htmlFor="edit-campaign-custom-goal">Custom Goal</label>
                <textarea
                  id="edit-campaign-custom-goal"
                  className="stg-input stg-textarea"
                  placeholder="Describe your specific goal…"
                  rows={3}
                  value={form.customGoal}
                  onChange={(e) => setForm({ ...form, customGoal: e.target.value })}
                />
              </div>
            )}

            <div>
              <label className="stg-label" htmlFor="edit-campaign-audience">Target Audience</label>
              <textarea
                id="edit-campaign-audience"
                className="stg-input stg-textarea"
                rows={3}
                value={form.targetAudience}
                onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
              />
            </div>
          </div>

          {error && (
            <div className="stg-toast err" style={{ marginTop: 16 }}>{error}</div>
          )}
        </div>

        <div className="as-modal-foot">
          <button type="button" className="as-btn-ghost" onClick={onClose} disabled={isSaving} style={{ padding: '8px 16px' }}>
            Cancel
          </button>
          <button
            type="button"
            className="as-btn-solid"
            onClick={() => onSave(form)}
            disabled={isSaving}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 18px' }}
          >
            {isSaving && <Loader2Icon size={13} style={{ animation: 'as-spin 0.8s linear infinite' }} />}
            {isSaving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
