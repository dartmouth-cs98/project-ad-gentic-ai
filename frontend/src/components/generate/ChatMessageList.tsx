import { useEffect, useRef } from 'react';
import { PlanCard } from './PlanCard';
import type { ChatMessage } from '../../types';

interface ChatMessageListProps {
  messages: ChatMessage[];
  isGenerating: boolean;
  userName: string;
  onApprovePlan?: (message: ChatMessage) => void;
  onDeclinePlan?: (message: ChatMessage) => void;
}

export function ChatMessageList({
  messages,
  isGenerating,
  userName,
  onApprovePlan,
  onDeclinePlan,
}: ChatMessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const isPlanResolved = (planMsg: ChatMessage): boolean => {
    const planIdx = messages.indexOf(planMsg);
    return messages.slice(planIdx + 1).some(
      (m) => m.message_type === 'plan_response',
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((msg) => {
        // ─── Plan messages → render PlanCard ────────────────
        if (msg.message_type === 'plan' && msg.role === 'assistant') {
          return (
            <div key={msg.id} className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold bg-blue-600 text-white">
                A
              </div>
              <PlanCard
                content={msg.content}
                onApprove={() => onApprovePlan?.(msg)}
                onDecline={() => onDeclinePlan?.(msg)}
                resolved={isPlanResolved(msg)}
              />
            </div>
          );
        }

        // ─── Regular messages ───────────────────────────────
        return (
          <div
            key={msg.id}
            className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium ${
                msg.role === 'assistant'
                  ? 'bg-blue-600 text-white'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {msg.role === 'assistant' ? 'A' : userName.charAt(0)}
            </div>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'assistant'
                  ? 'bg-muted border border-border text-foreground'
                  : 'bg-blue-600 text-white'
              }`}
            >
              {msg.content}
            </div>
          </div>
        );
      })}
      {isGenerating && (
        <div className="flex gap-2.5">
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 text-xs font-semibold text-white">
            A
          </div>
          <div className="bg-muted border border-border rounded-2xl px-4 py-3 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full typing-dot" />
            <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full typing-dot" style={{ animationDelay: '0.2s' }} />
            <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full typing-dot" style={{ animationDelay: '0.4s' }} />
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
