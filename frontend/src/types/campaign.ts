export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed';

/** Shape returned by GET /campaigns and GET /campaigns/:id */
export interface Campaign {
    id: number;
    business_client_id: number;
    name: string;
    status: CampaignStatus;
    budget_total: string | null;
    start_date: string | null;
    end_date: string | null;
    goal: string | null;
    target_audience: string | null;
    product_context: string | null;
    created_at: string;
    updated_at: string;
    product_ids: string | null;
    brief: string | null;
}

/** Payload for POST /campaigns */
export interface CreateCampaignPayload {
    business_client_id: number;
    name: string;
    status?: CampaignStatus;
    budget_total?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    goal?: string | null;
    target_audience?: string | null;
    product_context?: string | null;
    product_ids?: string | null;
}

/** Payload for PUT /campaigns/:id */
export interface UpdateCampaignPayload {
    name?: string;
    status?: CampaignStatus;
    budget_total?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    goal?: string | null;
    target_audience?: string | null;
    product_context?: string | null;
    product_ids?: string | null;
    brief?: string | null;
}
