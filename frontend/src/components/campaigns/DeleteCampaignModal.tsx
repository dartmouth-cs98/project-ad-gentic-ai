// DeleteCampaignModal — as-modal-* styled, multi-campaign support
import { createPortal } from 'react-dom';

interface DeleteCampaignModalProps {
  campaignNames: string[];
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  error?: string | null;
}

const PER_CAMPAIGN_DELETED_ITEMS = [
  'Campaign record and settings',
  'Chat messages',
  'Ad variants and generated ads',
  'Campaign metrics',
  'Consumer analytics events',
] as const;

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

export function DeleteCampaignModal({
  campaignNames,
  onClose,
  onConfirm,
  isLoading = false,
  error = null,
}: DeleteCampaignModalProps) {
  const count = campaignNames.length;
  const isPlural = count !== 1;

  const modal = (
    <div className="as-modal-overlay" onClick={() => !isLoading && onClose()}>
      <div
        role="alertdialog"
        aria-labelledby="delete-campaign-title"
        className="as-modal sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="as-modal-head">
          <div>
            <div className="as-modal-eyebrow">— DESTRUCTIVE ACTION</div>
            <div className="as-modal-title" id="delete-campaign-title">
              {isPlural ? `Delete ${count} Campaigns` : 'Delete Campaign'}
            </div>
          </div>
          <button className="as-modal-close" onClick={onClose} disabled={isLoading}>
            <XIcon />
          </button>
        </div>

        <div className="as-modal-body">
          <p style={{ fontSize: 14, color: 'var(--as-ink-2)', lineHeight: 1.55, marginBottom: 14 }}>
            This action cannot be undone.{' '}
            {isPlural
              ? 'The following campaigns will be permanently deleted:'
              : 'The following will be permanently deleted for this campaign:'}
          </p>

          <div style={{
            border: '1px solid rgba(200,60,60,0.35)',
            background: 'rgba(200,60,60,0.06)',
            padding: '10px 14px',
            maxHeight: 'min(50vh, 18rem)',
            overflowY: 'auto',
          }}>
            {isPlural ? (
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--as-ink)', lineHeight: 1.7 }}>
                {campaignNames.map((name, i) => (
                  <li key={i} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</li>
                ))}
              </ul>
            ) : (
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--as-ink)', lineHeight: 1.7 }}>
                <li>The campaign — <strong>{campaignNames[0]}</strong></li>
                {PER_CAMPAIGN_DELETED_ITEMS.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
            {isPlural && (
              <>
                <p style={{ fontSize: 13, color: 'var(--as-ink)', marginTop: 10, marginBottom: 6 }}>
                  For each campaign, this also removes:
                </p>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--as-ink)', lineHeight: 1.7 }}>
                  {PER_CAMPAIGN_DELETED_ITEMS.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {error && (
            <p style={{ fontSize: 13, color: '#c44', marginTop: 10 }} role="alert">{error}</p>
          )}
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
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '8px 18px',
              background: isLoading ? 'var(--as-rule)' : '#c44',
              color: isLoading ? 'var(--as-ink-3)' : '#fff',
              border: 'none',
              fontFamily: 'inherit',
              fontSize: 13,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            {isLoading
              ? <><SpinnerIcon /> Deleting…</>
              : isPlural ? `Delete ${count} Campaigns` : 'Delete Campaign'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
