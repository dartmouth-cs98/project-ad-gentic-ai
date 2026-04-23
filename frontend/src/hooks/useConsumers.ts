import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchConsumers, uploadConsumersCsv, assignPersonas } from '../api/consumers';
import type { Consumer, ConsumerUploadResponse } from '../types';
import type { PersonaProcessingSummary } from '../api/consumers';
import { queryKeys } from '../api/queryKeys';

export const CONSUMERS_KEY = queryKeys.consumers.all;

/** 
 * Fetch consumers with pagination
 * @param skip - The number of consumers to skip
 * @param limit - The number of consumers to limit to
 * @returns A query result with the consumers
*/
export function useConsumers(skip = 0, limit = 100, enabled = true) {
    return useQuery<Consumer[]>({
        queryKey: queryKeys.consumers.list(skip, limit),
        queryFn: () => fetchConsumers(skip, limit),
        enabled,
        staleTime: 2 * 60 * 1000, // 2 min
    });
}

/** 
 * Upload a CSV file and invalidate the consumers cache on success.
 * @param file - The CSV file to upload
 * @returns A mutation result with the upload response
*/
export function useUploadConsumersCsv() {
    const queryClient = useQueryClient();
    return useMutation<ConsumerUploadResponse, Error, File>({
        mutationFn: (file: File) => uploadConsumersCsv(file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CONSUMERS_KEY });
        },
    });
}

/**
 * Run persona assignment for consumers.
 * If consumerIds is omitted, the backend will assign personas for all unassigned consumers.
 */
export function useAssignPersonas() {
    const queryClient = useQueryClient();
    return useMutation<PersonaProcessingSummary, Error, number[] | undefined>({
        mutationFn: (consumerIds) => assignPersonas(consumerIds),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CONSUMERS_KEY });
        },
    });
}
