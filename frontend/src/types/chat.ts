export type ChatRole = 'user' | 'assistant' | 'system';
export type ChatMessageType = 'message' | 'plan' | 'plan_response';

/** Shape returned by GET /chat-messages */
export interface ChatMessage {
    id: number;
    campaign_id: number;
    business_client_id: number;
    role: ChatRole;
    message_type: ChatMessageType;
    content: string;
    version_ref: number | null;
    timestamp: string;
}

/** Payload for POST /chat-messages */
export interface ChatMessagePayload {
    campaign_id: number;
    role: ChatRole;
    message_type?: ChatMessageType;
    content: string;
    version_ref?: number | null;
}
