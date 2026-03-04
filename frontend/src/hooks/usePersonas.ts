import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assignPersonas, fetchPersonas } from '../api/personas';
import type { AssignPersonasRequest, Persona, PersonaProcessingSummary } from '../types';
import type { UseMutationResult } from '@tanstack/react-query';

export const PERSONAS_KEY = ['personas'] as const;

/** Fetch all available personas */
export function usePersonas() {
    return useQuery<Persona[]>({
        queryKey: PERSONAS_KEY,
        queryFn: fetchPersonas,
        staleTime: 10 * 60 * 1000,
    });
}

/** Trigger LLM persona assignment. Invalidates consumers on success so the table refreshes. */
export function useAssignPersonas(): UseMutationResult<
    PersonaProcessingSummary,
    Error,
    AssignPersonasRequest
> {
    const queryClient = useQueryClient();
    return useMutation<PersonaProcessingSummary, Error, AssignPersonasRequest>({
        mutationFn: assignPersonas,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['consumers'] });
        },
    });
}
