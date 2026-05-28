// AdVariantCard — gen-vcard: ink-black media area, real video, stripes fallback, stats strip
import { memo } from 'react';
import type { AdVariant, AdVariantScript } from '../../types';

interface AdVariantCardProps {
  variant: AdVariant;
  isSelected: boolean;
  onToggle: (variantId: string) => void;
}

function parseScript(meta: string | null): AdVariantScript {
  if (!meta) return {};
  try {
    return JSON.parse(meta) as AdVariantScript;
  } catch {
    return {};
  }
}

// Spinner circle SVG (no lucide)
function SpinnerIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width={20} height={20} className="gen-spin">
      <circle cx="10" cy="10" r="8" strokeDasharray="25 10" />
    </svg>
  );
}

// Alert icon for failed state
function AlertIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" width={20} height={20}>
      <circle cx="10" cy="10" r="8" />
      <path d="M10 6v5M10 14.5v.5" />
    </svg>
  );
}

// Check icon for checkbox
function CheckIcon() {
  return (
    <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width={10} height={10}>
      <path d="M2 5l2.5 2.5L8 3" />
    </svg>
  );
}

export const AdVariantCard = memo(function AdVariantCard({ variant, isSelected, onToggle }: AdVariantCardProps) {
  const id = String(variant.id);
  const parsed = parseScript(variant.meta);
  const isCompleted = variant.status === 'completed';
  const isGenerating = variant.status === 'Generating';
  const isFailed = variant.status === 'failed';

  const scriptText = parsed.script ?? null;
  const hasVideo = isCompleted && !!variant.media_url;

  return (
    <article
      className={`gen-vcard${isSelected ? ' selected' : ''}`}
      onClick={() => onToggle(id)}
      style={{ background: 'transparent' }}
    >
      {/* Media area */}
      <div className="gen-vcard-media">
        {/* Diagonal stripes (show when no real video) */}
        {!hasVideo && <div className="gen-vcard-stripes" />}

        {hasVideo ? (
          <video
            src={variant.media_url!}
            className="gen-vcard-media video"
            controls
            preload="metadata"
            onClick={(e) => e.stopPropagation()}
          />
        ) : isGenerating ? (
          <div className="gen-vcard-generating">
            <SpinnerIcon />
            <span>RENDERING…</span>
          </div>
        ) : isFailed ? (
          <div className="gen-vcard-generating" style={{ color: 'rgba(255,100,100,0.7)' }}>
            <AlertIcon />
            <span>FAILED</span>
          </div>
        ) : (
          <div className="gen-vcard-play">
            <span className="gen-vcard-play-btn">▶</span>
          </div>
        )}

        {/* Bottom-left tag: format / version */}
        <span className="gen-vcard-tag">
          v{variant.version_number} · #{variant.id}
        </span>

        {/* Top-right status badge */}
        <span className="gen-vcard-tag-r">
          {isCompleted && variant.is_approved && <><span className="d" />APPROVED</>}
          {isCompleted && !variant.is_approved && <>PENDING</>}
          {isGenerating && <>COOKING</>}
          {isFailed && <>FAILED</>}
        </span>

        {/* Bottom-left checkbox */}
        <span className="gen-vcard-checkbox">
          <CheckIcon />
        </span>
      </div>

      {/* Footer */}
      <div className="gen-vcard-foot">
        <div className="gen-vcard-foot-top">
          <span className="gen-vcard-name">
            {isGenerating ? 'Generating…' : isFailed ? 'Generation failed' : `Variant #${variant.id}`}
          </span>
          <span className="gen-vcard-id">V_{String(variant.id).padStart(2, '0')}</span>
        </div>

        {scriptText && (
          <div className="gen-vcard-script">"{scriptText}"</div>
        )}
        {parsed.error && (
          <div className="gen-vcard-script" style={{ color: 'var(--as-accent)' }}>
            {parsed.error.slice(0, 120)}
          </div>
        )}

        {/* Stats strip */}
        <div className="gen-vcard-stats">
          <div className="gen-vstat">
            <span className="l">STATUS</span>
            <span className="v">{isCompleted ? 'DONE' : isGenerating ? 'GEN…' : 'ERR'}</span>
          </div>
          <div className="gen-vstat">
            <span className="l">VERSION</span>
            <span className="v">v{variant.version_number}</span>
          </div>
          <div className="gen-vstat">
            <span className="l">ID</span>
            <span className="v muted">#{variant.id}</span>
          </div>
        </div>

        {/* Fit bar (100% when approved, 50% generating, 0% failed) */}
        <span className="gen-vcard-bar">
          <span
            className="gen-vcard-bar-fill"
            style={{ width: isCompleted ? (variant.is_approved ? '100%' : '70%') : isGenerating ? '30%' : '0%' }}
          />
        </span>
      </div>
    </article>
  );
});
