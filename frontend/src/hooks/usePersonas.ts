import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assignPersonas, fetchPersonas } from '../api/personas';
import type { AssignPersonasRequest, Persona, PersonaProcessingSummary } from '../types';
import type { UseMutationResult } from '@tanstack/react-query';
import { queryKeys } from '../api/queryKeys';

export const PERSONAS_KEY = queryKeys.personas.all;

/** Fetch all available personas */
export function usePersonas(enabled = true) {
    return useQuery<Persona[]>({
        queryKey: PERSONAS_KEY,
        queryFn: fetchPersonas,
        enabled,
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
            queryClient.invalidateQueries({ queryKey: queryKeys.consumers.all });
        },
    });
}
