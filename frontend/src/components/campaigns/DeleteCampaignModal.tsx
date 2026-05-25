// DeleteCampaignModal — as-modal-* styled, type-to-confirm
import { useState } from 'react';

interface DeleteCampaignModalProps {
  campaignName: string;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
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
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width={13} height={13} style={{ animation: 'as-spin 0.8s linear infinite' }}>
      <circle cx="8" cy="8" r="6" strokeDasharray="18 8" />
    </svg>
  );
}

export function DeleteCampaignModal({ campaignName, onClose, onConfirm, isLoading = false }: DeleteCampaignModalProps) {
  const [confirmation, setConfirmation] = useState('');
  const canDelete = confirmation === campaignName;

  return (
    <div className="as-modal-overlay" onClick={() => !isLoading && onClose()}>
      <div className="as-modal sm" onClick={(e) => e.stopPropagation()}>
        <div className="as-modal-head">
          <div>
            <div className="as-modal-eyebrow">— DESTRUCTIVE ACTION</div>
            <div className="as-modal-title">Delete Campaign</div>
          </div>
          <button className="as-modal-close" onClick={onClose} disabled={isLoading}>
            <XIcon />
          </button>
        </div>

        <div className="as-modal-body">
          <p style={{ fontSize: 14, color: 'var(--as-ink-2)', lineHeight: 1.55 }}>
            This permanently deletes <strong style={{ color: 'var(--as-ink)', fontWeight: 500 }}>{campaignName}</strong> and all generated ads. This cannot be undone.
          </p>

          <div className="as-field">
            <label className="as-field-label">
              Type <span style={{ color: 'var(--as-ink)', fontFamily: "'Geist Mono', monospace" }}>{campaignName}</span> to confirm
            </label>
            <input
              className="as-input"
              placeholder={campaignName}
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="as-modal-foot">
          <button
            className="as-btn-ghost"
            onClick={onClose}
            disabled={isLoading}
            style={{ padding: '8px 16px' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!canDelete || isLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '8px 18px',
              background: canDelete && !isLoading ? '#c44' : 'var(--as-rule)',
              color: canDelete && !isLoading ? '#fff' : 'var(--as-ink-3)',
              border: 'none',
              fontFamily: 'inherit',
              fontSize: 13,
              cursor: canDelete && !isLoading ? 'pointer' : 'not-allowed',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            {isLoading ? <><SpinnerIcon /> Deleting…</> : 'Delete Campaign'}
          </button>
        </div>
      </div>
    </div>
  );
}
