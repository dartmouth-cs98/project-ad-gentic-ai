import { createContext, useContext, ReactNode } from 'react';
import { useAssignPersonas, useConsumers, useUploadConsumersCsv } from '../hooks/useConsumers';
import type { Consumer, ConsumerUploadResponse } from '../types';
import type { UseMutationResult } from '@tanstack/react-query';

interface ConsumerContextType {
    consumers: Consumer[];
    loading: boolean;
    error: string | null;
    refetch: () => void;
    uploadCsv: UseMutationResult<ConsumerUploadResponse, Error, File>;
    assignPersonas: UseMutationResult<
        import('../api/consumers').PersonaProcessingSummary,
        Error,
        number[] | undefined
    >;
}

const ConsumerContext = createContext<ConsumerContextType | undefined>(
    undefined,
);

export function ConsumerProvider({ children }: { children: ReactNode }) {
    const { data: consumers = [], isLoading, error, refetch } = useConsumers(0, 1000);
    const uploadCsv = useUploadConsumersCsv();
    const assignPersonas = useAssignPersonas();

    return (
        <ConsumerContext.Provider
            value={{
                consumers,
                loading: isLoading,
                error: error ? (error as Error).message : null,
                refetch,
                uploadCsv,
                assignPersonas,
            }}
        >
            {children}
        </ConsumerContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useConsumerContext() {
    const ctx = useContext(ConsumerContext);
    if (!ctx)
        throw new Error(
            'useConsumerContext must be used within a ConsumerProvider',
        );
    return ctx;
}
