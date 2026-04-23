export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed';

/** Icons supported by the campaign detail hero KPI strip (mapped to visuals in the UI). */
export type CampaignHeroIcon = 'users' | 'pointer' | 'chart' | 'globe';

/** One hero KPI card when `Campaign.analytics_summary` is present (from API). */
export interface CampaignHeroKpi {
    icon: CampaignHeroIcon;
    /** Small pill top-right; omit when null */
    badge: string | null;
    /** Visual style for the badge pill */
    badgeStyle: 'positive' | 'neutral' | 'muted';
    value: string;
    label: string;
}

/** One row in the analytics metrics grid (matches `CampaignAnalytics` metric shape). */
export interface CampaignAnalyticsMetricRow {
    label: string;
    value: string;
    change: string;
    positive: boolean;
}

/** One persona row under analytics (matches `CampaignAnalytics` persona shape). */
export interface CampaignPersonaPerfRow {
    name: string;
    convRate: string;
    impressions: string;
    color: 'teal' | 'orange' | 'blue';
}

/**
 * Live campaign analytics from the API. When absent, the detail page shows an empty state
 * instead of placeholder KPIs. Populate from the backend when metrics are available.
 */
export interface CampaignAnalyticsSummary {
    hero: CampaignHeroKpi[];
    metrics: CampaignAnalyticsMetricRow[];
    personas: CampaignPersonaPerfRow[];
}

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
    /** When set with a valid shape, the hero strip and analytics tab use live data. */
    analytics_summary?: CampaignAnalyticsSummary | null;
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
