import { apiUrl, authHeaders } from './config';
import type { Consumer, ConsumerUploadResponse } from '../types';

export interface PersonaProcessingSummary {
    processed: number;
    failed: number;
    skipped: number;
    low_confidence: number;
    errors: string[];
}

export type { Consumer, ConsumerUploadResponse };

/**
 * Fetch paginated consumers from the API.
 */
export async function fetchConsumers(
    skip = 0,
    limit = 100,
): Promise<Consumer[]> {
    const res = await fetch(apiUrl(`/consumers/?skip=${skip}&limit=${limit}`), {
        headers: authHeaders(),
    });
    if (!res.ok) {
        throw new Error('Failed to fetch consumers.');
    }
    return (await res.json()) as Consumer[];
}

/**
 * Upload a CSV file to bulk-create consumers.
 */
export async function uploadConsumersCsv(
    file: File,
): Promise<ConsumerUploadResponse> {
    const form = new FormData();
    form.append('file', file);

    const res = await fetch(apiUrl('/consumers/upload-csv'), {
        method: 'POST',
        headers: authHeaders(false),
        body: form,
    });

    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || 'CSV upload failed.');
    }

    return (await res.json()) as ConsumerUploadResponse;
}

/**
 * Trigger persona assignment for consumers.
 * If consumerIds is omitted, the backend will process all unassigned consumers.
 */
export async function assignPersonas(
    consumerIds?: number[],
): Promise<PersonaProcessingSummary> {
    const res = await fetch(apiUrl('/consumers/assign-personas'), {
        method: 'POST',
        headers: {
            ...authHeaders(),
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            consumer_ids: consumerIds ?? null,
        }),
    });

    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || 'Failed to assign personas.');
    }

    return (await res.json()) as PersonaProcessingSummary;
}
