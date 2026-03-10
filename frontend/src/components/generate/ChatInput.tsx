import { useRef, useEffect, useCallback } from 'react';
import { SendIcon, MessageSquareIcon, XIcon } from 'lucide-react';
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

export function ChatInput({
  value,
  onChange,
  onSend,
  phase,
  disabled,
  selectedVariantCount = 0,
  onClearSelection,
}: ChatInputProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, []);

  useEffect(() => {
    if (phase === 'idle') {
      inputRef.current?.focus();
    }
  }, [phase]);

  useEffect(() => {
    autoResize();
  }, [value, autoResize]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <>
      {/* Revision context bar */}
      {selectedVariantCount > 0 && phase === 'results' && (
        <div className="px-3 pt-2 flex-shrink-0">
          <div className="flex items-center gap-2 px-2.5 py-1.5 bg-blue-600/10 border border-blue-600/20 rounded-lg text-xs text-blue-600 dark:text-blue-400">
            <MessageSquareIcon className="w-3 h-3 flex-shrink-0" />
            <span className="font-medium truncate">
              Revising {selectedVariantCount} variant{selectedVariantCount > 1 ? 's' : ''}
            </span>
            <button
              onClick={onClearSelection}
              className="ml-auto p-0.5 rounded hover:bg-blue-600/10"
            >
              <XIcon className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="p-3 border-t border-border flex-shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={value}
            onChange={(e) => { onChange(e.target.value); autoResize(); }}
            onKeyDown={handleKeyDown}
            placeholder={
              phase === 'idle'
                ? 'Describe what you want to advertise...'
                : 'Tell me what to change...'
            }
            className="flex-1 px-3 py-2.5 bg-muted border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20 focus:bg-background transition-all resize-none"
            rows={1}
            disabled={disabled || phase === 'generating'}
          />
          <button
            onClick={onSend}
            disabled={!value.trim() || disabled || phase === 'generating'}
            className="flex-shrink-0 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            <SendIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}
