import { apiUrl } from './config';

export interface HealthResponse {
    status: string;
}

/**
 * Fetches the backend health endpoint.
 * Returns the parsed JSON on success, or null if unreachable.
 */
export async function fetchHealth(): Promise<HealthResponse | null> {
    try {
        const res = await fetch(apiUrl('/health'), { signal: AbortSignal.timeout(5000) });
        if (!res.ok) return null;
        return (await res.json()) as HealthResponse;
    } catch {
        return null;
    }
}
