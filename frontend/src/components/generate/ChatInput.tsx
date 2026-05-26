// ChatInput — gen-composer: autosizing textarea, square send button, toolbar row
import { useRef, useEffect, useCallback } from 'react';
import type { Phase } from './types';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  phase: Phase;
  disabled?: boolean;
  selectedVariantCount?: number;
  onClearSelection?: () => void;
}

// Arrow-right SVG (no lucide dependency in hot path)
function ArrowIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 7h10M8 3l4 4-4 4" />
    </svg>
  );
}

// Wand SVG for AUTO-DRAFT button
function WandIcon() {
  return (
    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <path d="M2 10L8 4M6 2l2 2M9 1l1 1M7 3l1 1" />
    </svg>
  );
}

export function ChatInput({
  value,
  onChange,
  onSend,
  phase,
  disabled,
  selectedVariantCount = 0,
  onClearSelection,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, []);

  useEffect(() => {
    if (phase === 'idle') textareaRef.current?.focus();
  }, [phase]);

  useEffect(() => {
    autoResize();
  }, [value, autoResize]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled && phase !== 'generating') onSend();
    }
  };

  // Revision context strip (shown when variants are selected in results phase)
  const showRevisionStrip = selectedVariantCount > 0 && phase === 'results';

  return (
    <div className="gen-composer">
      {showRevisionStrip && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '7px 14px',
          borderBottom: '1px solid var(--as-rule)',
          fontFamily: "'Geist Mono', monospace",
          fontSize: 10,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--as-ink-2)',
          background: 'var(--as-paper)',
        }}>
          <span style={{ flex: 1 }}>
            Revising {selectedVariantCount} variant{selectedVariantCount > 1 ? 's' : ''}
          </span>
          <button
            onClick={onClearSelection}
            style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--as-ink-3)', lineHeight: 1, padding: 2 }}
            aria-label="Clear selection"
          >
            ✕
          </button>
        </div>
      )}

      <div className="gen-composer-bar">
        <textarea
          ref={textareaRef}
          className="gen-composer-textarea"
          placeholder={phase === 'idle' ? 'Brief the strategist…' : 'Tell me what to change…'}
          value={value}
          onChange={(e) => { onChange(e.target.value); autoResize(); }}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={disabled || phase === 'generating'}
        />
        <button
          className="gen-send-btn"
          onClick={onSend}
          disabled={!value.trim() || disabled || phase === 'generating'}
          aria-label="Send message"
        >
          <ArrowIcon />
        </button>
      </div>

      <div className="gen-composer-toolbar">
        <div className="gen-composer-toolbar-left">
          <button className="gen-tool-btn">
            <WandIcon />
            AUTO-DRAFT
          </button>
          <button className="gen-tool-btn">/PERSONA</button>
          <button className="gen-tool-btn">/EXAMPLE</button>
        </div>
        <span>
          {value.trim() ? `${value.length} CHARS · ⏎ TO SEND` : '⌘ K FOR COMMANDS'}
        </span>
      </div>
    </div>
  );
}
