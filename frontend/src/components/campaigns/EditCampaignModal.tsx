import { useState } from 'react';
import { createPortal } from 'react-dom';


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

function SpinnerIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      width={13} height={13} style={{ animation: 'as-spin 0.8s linear infinite' }}>
      <circle cx="8" cy="8" r="6" strokeDasharray="18 8" />
    </svg>
  );
}


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
        className="as-modal"
        style={{ width: 'min(560px, 100%)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="as-modal-head">
          <div>
            <div className="as-modal-eyebrow">— CAMPAIGN</div>
            <div className="as-modal-title" id="edit-campaign-title">Edit Campaign</div>
          </div>
          <button className="as-modal-close" onClick={onClose} disabled={isSaving}>
            <XIcon />
          </button>
        </div>

        <div className="as-modal-body">
          <div className="as-field">
            <label className="as-field-label">
              Campaign Name <span className="as-field-required">*</span>
            </label>
            <input
              className="as-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              disabled={isSaving}
            />
          </div>

          <div className="as-field">
            <label className="as-field-label">Campaign Goal</label>
            <div className="as-select-wrap">
              <select
                className="as-select"
                value={form.goal}
                onChange={(e) => setForm({ ...form, goal: e.target.value })}
                disabled={isSaving}
              >
                <option value="">Select goal</option>
                <option value="awareness">Brand Awareness</option>
                <option value="leads">Lead Generation</option>
                <option value="sales">Direct Sales</option>
                <option value="engagement">Engagement</option>
                <option value="other">Other</option>
              </select>
            </div>
            {form.goal === 'other' && (
              <textarea
                className="as-textarea"
                style={{ marginTop: 8 }}
                placeholder="Describe your specific goal…"
                value={form.customGoal}
                onChange={(e) => setForm({ ...form, customGoal: e.target.value })}
                disabled={isSaving}
              />
            )}
          </div>

          <div className="as-field">
            <label className="as-field-label">Target Audience</label>
            <textarea
              className="as-textarea"
              rows={3}
              value={form.targetAudience}
              onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
              disabled={isSaving}
            />
          </div>

          {error && (
            <p style={{ fontSize: 13, color: '#c44', margin: 0 }} role="alert">{error}</p>
          )}
        </div>

        <div className="as-modal-foot">
          <button
            className="as-btn-ghost"
            onClick={onClose}
            disabled={isSaving}
            style={{ padding: '8px 16px' }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="as-btn-solid"
            onClick={() => onSave(form)}
            disabled={isSaving}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 18px' }}
          >
            {isSaving ? <><SpinnerIcon /> Saving…</> : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
