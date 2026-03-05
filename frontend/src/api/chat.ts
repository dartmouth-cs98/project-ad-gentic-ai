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
