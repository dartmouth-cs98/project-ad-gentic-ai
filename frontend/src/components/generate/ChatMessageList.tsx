// ChatMessageList — Swiss editorial style: mono role labels, ink-fill user bubbles, typing dots
import { useEffect, useRef } from 'react';
import { PlanCard } from './PlanCard';
import type { ChatMessage } from '../../types';

interface ChatMessageListProps {
  messages: ChatMessage[];
  isGenerating: boolean;
  userName: string;
  onApprovePlan?: (message: ChatMessage) => void;
  onDeclinePlan?: (message: ChatMessage) => void;
  expressMode?: boolean;
  disabled?: boolean;
}

// Format a Date or ISO string as HH:MM
function fmtTime(ts?: string | Date): string {
  if (!ts) return '';
  const d = typeof ts === 'string' ? new Date(ts) : ts;
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function ChatMessageList({
  messages,
  isGenerating,
  onApprovePlan,
  onDeclinePlan,
  expressMode,
  disabled,
}: ChatMessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const isPlanResolved = (planMsg: ChatMessage): boolean => {
    const idx = messages.indexOf(planMsg);
    return messages.slice(idx + 1).some((m) => m.message_type === 'plan_response');
  };

  if (disabled) {
    return (
      <div className="gen-chat-messages">
        <div className="gen-chat-hint">
          <div className="gen-chat-hint-arrow">→</div>
          <div>
            <div style={{
              fontFamily: "'Geist Mono', monospace",
              fontSize: 10,
              letterSpacing: '0.08em',
              color: 'var(--as-ink-2)',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}>
              — STRATEGIST · IDLE
            </div>
            <div style={{ fontSize: 14, color: 'var(--as-ink-2)', lineHeight: 1.55 }}>
              Pick a campaign on the right and I'll pull its product context and start drafting.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gen-chat-messages">
      {messages.map((msg) => {
        // ── Plan message ──
        if (msg.message_type === 'plan' && msg.role === 'assistant') {
          return (
            <div key={msg.id} className="gen-msg">
              <div className="gen-msg-head">
                <span>— STRATEGIST</span>
                <span>{fmtTime((msg as any).created_at)}</span>
              </div>
              <div className="gen-msg-body" style={{ marginBottom: 8 }}>
                Here's the plan I'd run. Approve to generate variants, or tell me what to change.
              </div>
              <PlanCard
                content={msg.content}
                onApprove={() => onApprovePlan?.(msg)}
                onDecline={() => onDeclinePlan?.(msg)}
                resolved={isPlanResolved(msg)}
                expressMode={expressMode}
              />
            </div>
          );
        }

        // ── User message ──
        if (msg.role === 'user') {
          return (
            <div key={msg.id} className="gen-msg user">
              <div className="gen-msg-head">
                <span>YOU</span>
                <span>{fmtTime((msg as any).created_at)}</span>
              </div>
              <div className="gen-msg-body">{msg.content}</div>
            </div>
          );
        }

        // ── Assistant message ──
        return (
          <div key={msg.id} className="gen-msg">
            <div className="gen-msg-head">
              <span>— STRATEGIST</span>
              <span>{fmtTime((msg as any).created_at)}</span>
            </div>
            <div className="gen-msg-body">{msg.content}</div>
          </div>
        );
      })}

      {isGenerating && (
        <div className="gen-msg">
          <div className="gen-msg-head">
            <span>— STRATEGIST</span>
            <span>THINKING…</span>
          </div>
          <div className="gen-typing">
            <span />
            <span />
            <span />
          </div>
        </div>
      )}

      <div ref={endRef} />
    </div>
  );
}
