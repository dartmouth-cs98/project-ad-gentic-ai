import { apiUrl, authHeaders } from './config';
import type { ChatMessage, ChatMessagePayload } from '../types';

// ---------- API calls ----------

export async function fetchChatMessages(
  campaignId: number,
): Promise<ChatMessage[]> {
  const params = new URLSearchParams({
    campaign_id: String(campaignId),
  });

  const res = await fetch(apiUrl(`/chat-messages/?${params.toString()}`), {
    headers: authHeaders(),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || 'Failed to fetch chat messages.');
  }

  return (await res.json()) as ChatMessage[];
}

export async function createChatMessage(
  data: ChatMessagePayload,
): Promise<ChatMessage> {
  const res = await fetch(apiUrl('/chat-messages/'), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || 'Failed to send chat message.');
  }

  return (await res.json()) as ChatMessage;
}

// ---------- Chat completion (AI-powered) ----------

export interface ChatCompletionRequest {
  campaign_id: number;
  message: string;
  filter_context?: Record<string, unknown>;
  campaign_context?: Record<string, unknown>;
  previous_plan?: string;
}

export interface ChatCompletionResponse {
  user_message: ChatMessage;
  assistant_message: ChatMessage;
  message_type: 'message' | 'plan';
  plan_json: string | null;
}

export async function sendChatCompletion(
  data: ChatCompletionRequest,
): Promise<ChatCompletionResponse> {
  const res = await fetch(apiUrl('/chat/completions/'), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || 'Failed to get AI response.');
  }

  return (await res.json()) as ChatCompletionResponse;
}

export async function clearChatMessages(campaignId: number): Promise<void> {
  const params = new URLSearchParams({
    campaign_id: String(campaignId),
  });

  const res = await fetch(apiUrl(`/chat-messages/?${params.toString()}`), {
    method: 'DELETE',
    headers: authHeaders(),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || 'Failed to clear chat messages.');
  }
}
