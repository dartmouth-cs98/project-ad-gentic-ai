import { useRef, useEffect } from 'react';
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

  // Expose ref for external focus calls
  useEffect(() => {
    // Auto-focus on mount for idle phase
    if (phase === 'idle') {
      inputRef.current?.focus();
    }
  }, [phase]);

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
          <div className="flex items-center gap-2 px-2.5 py-1.5 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
            <MessageSquareIcon className="w-3 h-3 flex-shrink-0" />
            <span className="font-medium truncate">
              Revising {selectedVariantCount} variant{selectedVariantCount > 1 ? 's' : ''}
            </span>
            <button
              onClick={onClearSelection}
              className="ml-auto p-0.5 rounded hover:bg-blue-100"
            >
              <XIcon className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="p-3 border-t border-slate-100 flex-shrink-0">
        <div className="relative">
          <textarea
            ref={inputRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              phase === 'idle'
                ? 'Describe what you want to advertise...'
                : 'Tell me what to change...'
            }
            className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none"
            rows={1}
            disabled={disabled || phase === 'generating'}
          />
          <button
            onClick={onSend}
            disabled={!value.trim() || disabled || phase === 'generating'}
            className="absolute right-2 bottom-2 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            <SendIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </>
  );
}
