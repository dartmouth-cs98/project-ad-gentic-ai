import { apiUrl, authHeaders } from './config';
import type { AssignPersonasRequest, Persona, PersonaProcessingSummary } from '../types';

export type { Persona };

/** Fetch all available personas. */
export async function fetchPersonas(): Promise<Persona[]> {
    const res = await fetch(apiUrl('/personas/'), {
        headers: authHeaders(),
    });
    if (!res.ok) {
        throw new Error('Failed to fetch personas.');
    }
    return (await res.json()) as Persona[];
}

/** Trigger LLM persona assignment for unassigned (or specified) consumers. */
export async function assignPersonas(
    body: AssignPersonasRequest = {},
): Promise<PersonaProcessingSummary> {
    const res = await fetch(apiUrl('/consumers/assign-personas'), {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail?.detail || 'Persona assignment failed.');
    }
    return (await res.json()) as PersonaProcessingSummary;
}
