import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchChatMessages,
  createChatMessage,
  clearChatMessages,
  sendChatCompletion,
} from '../api/chat';
import type { ChatCompletionRequest, ChatCompletionResponse } from '../api/chat';
import type { ChatMessage, ChatMessagePayload } from '../types';

export const CHAT_MESSAGES_KEY = ['chatMessages'] as const;
let optimisticMessageId = -1;

function getNextOptimisticId(): number {
  optimisticMessageId -= 1;
  return optimisticMessageId;
}

/** Fetch all chat messages for a campaign. */
export function useChatMessages(campaignId: number | undefined) {
  return useQuery({
    queryKey: [...CHAT_MESSAGES_KEY, campaignId],
    queryFn: () => fetchChatMessages(campaignId!),
    enabled: !!campaignId,
    staleTime: 30_000,
  });
}

/** Send a new chat message. Optimistically appends to cache. */
export function useSendChatMessage() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: ChatMessagePayload) => createChatMessage(data),

    onMutate: async (data) => {
      const key = [...CHAT_MESSAGES_KEY, data.campaign_id];

      // Cancel any in-flight refetches so they don't overwrite our optimistic update
      await qc.cancelQueries({ queryKey: key });

      const previous = qc.getQueryData<ChatMessage[]>(key);

      // Optimistic message with a temporary negative id
      const optimistic: ChatMessage = {
        id: getNextOptimisticId(),
        campaign_id: data.campaign_id,
        business_client_id: 0,
        role: data.role,
        message_type: data.message_type ?? 'message',
        content: data.content,
        version_ref: data.version_ref ?? null,
        timestamp: new Date().toISOString(),
      };

      qc.setQueryData<ChatMessage[]>(key, (old = []) => [...old, optimistic]);

      return { previous, key };
    },

    onError: (_err, _data, context) => {
      // Roll back to previous cache state
      if (context?.previous) {
        qc.setQueryData(context.key, context.previous);
      }
    },

    onSettled: (_data, _err, variables) => {
      // Refetch to reconcile optimistic data with server state
      qc.invalidateQueries({
        queryKey: [...CHAT_MESSAGES_KEY, variables.campaign_id],
      });
    },
  });
}

/** Send a message to the AI and get a response. Both are persisted server-side. */
export function useChatCompletion() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: ChatCompletionRequest) => sendChatCompletion(data),

    onMutate: async (data) => {
      const key = [...CHAT_MESSAGES_KEY, data.campaign_id];
      await qc.cancelQueries({ queryKey: key });

      const previous = qc.getQueryData<ChatMessage[]>(key);

      // Optimistically append the user message
      const optimisticUser: ChatMessage = {
        id: getNextOptimisticId(),
        campaign_id: data.campaign_id,
        business_client_id: 0,
        role: 'user',
        message_type: 'message',
        content: data.message,
        version_ref: null,
        timestamp: new Date().toISOString(),
      };

      qc.setQueryData<ChatMessage[]>(key, (old = []) => [...old, optimisticUser]);

      return { previous, key };
    },

    onSuccess: (_response: ChatCompletionResponse, variables) => {
      const key = [...CHAT_MESSAGES_KEY, variables.campaign_id];

      // Replace optimistic data with the real user + assistant messages from server
      qc.invalidateQueries({ queryKey: key });
    },

    onError: (_err, _data, context) => {
      if (context?.previous) {
        qc.setQueryData(context.key, context.previous);
      }
    },
  });
}

/** Clear all chat messages for a campaign. */
export function useClearChatMessages() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (campaignId: number) => clearChatMessages(campaignId),
    onSuccess: (_data, campaignId) => {
      qc.setQueryData([...CHAT_MESSAGES_KEY, campaignId], []);
      qc.invalidateQueries({
        queryKey: [...CHAT_MESSAGES_KEY, campaignId],
      });
    },
  });
}
