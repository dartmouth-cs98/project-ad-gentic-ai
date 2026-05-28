const UPLOAD_MESSAGES = ['Reading your file...', 'Saving to database...'];
const ASSIGN_MESSAGES = ['Matching profiles...', 'Finalizing segments...'];

export type UploadPhase = 'uploading' | 'assigning' | 'complete';

interface Props {
  phase: UploadPhase;
  progressIdx: number;
  uploadedCount?: number;
  personaCount?: number;
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" width={18} height={18}>
      <path d="M10 14V6M7 9l3-3 3 3" />
      <rect x="3" y="14" width="14" height="3" rx="0" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" width={18} height={18}>
      <circle cx="8" cy="7" r="3" />
      <path d="M2 17c0-3 2.5-5 6-5s6 2 6 5" />
      <circle cx="15" cy="7" r="2.5" />
      <path d="M15 12c2.5 0 4 1.5 4 4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width={18} height={18}>
      <path d="M4 10l4.5 4.5L16 6" />
    </svg>
  );
}

export function UploadProgressView({ phase, progressIdx, uploadedCount, personaCount }: Props) {
  if (phase === 'complete') {
    return (
      <div className="cust-progress">
        <div className="cust-progress-icon ok"><CheckIcon /></div>
        <div className="cust-progress-title">Upload complete</div>
        {uploadedCount !== undefined && personaCount !== undefined && (
          <div className="cust-progress-msg" style={{ color: '#10b981' }}>
            {uploadedCount.toLocaleString()} customers · {personaCount} persona{personaCount !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    );
  }

  const Icon = phase === 'uploading' ? UploadIcon : UsersIcon;
  const messages = phase === 'uploading' ? UPLOAD_MESSAGES : ASSIGN_MESSAGES;
  const label = phase === 'uploading' ? 'Uploading Data' : 'Sorting Customers';

  return (
    <div className="cust-progress">
      <div className="cust-progress-icon"><Icon /></div>
      <div className="cust-progress-title">{label}</div>
      <div className="cust-progress-msg">{messages[Math.min(progressIdx, messages.length - 1)]}</div>
      <div className="cust-progress-skels">
        {[0, 1, 2].map((i) => (
          <div key={i} className="cust-skel" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );
}
