import { apiUrl } from './config';
import type { Consumer, ConsumerUploadResponse } from '../types';

export type { Consumer, ConsumerUploadResponse };

/**
 * Fetch paginated consumers from the API.
 */
export async function fetchConsumers(
    skip = 0,
    limit = 100,
): Promise<Consumer[]> {
    const res = await fetch(apiUrl(`/consumers/?skip=${skip}&limit=${limit}`));
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
        body: form,
    });

    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || 'CSV upload failed.');
    }

    return (await res.json()) as ConsumerUploadResponse;
}
