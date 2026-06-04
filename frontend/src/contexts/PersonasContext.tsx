import { createContext, useContext, useState, ReactNode } from 'react';
import { usePersonas, useAssignPersonas } from '../hooks/usePersonas';
import type { Persona, PersonaProcessingSummary, AssignPersonasRequest } from '../types';
import type { UseMutationResult } from '@tanstack/react-query';

interface PersonasContextType {
    personas: Persona[];
    personasLoading: boolean;
    personasError: string | null;
    selectedPersonaId: string | null;
    setSelectedPersonaId: (id: string | null) => void;
    assignPersonas: UseMutationResult<PersonaProcessingSummary, Error, AssignPersonasRequest>;
}

const PersonasContext = createContext<PersonasContextType | undefined>(undefined);

export function PersonasProvider({ children }: { children: ReactNode }) {
    const { data: personas = [], isLoading: personasLoading, error } = usePersonas();
    const assignPersonasMutation = useAssignPersonas();
    const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);

    return (
        <PersonasContext.Provider
            value={{
                personas,
                personasLoading,
                personasError: error ? (error as Error).message : null,
                selectedPersonaId,
                setSelectedPersonaId,
                assignPersonas: assignPersonasMutation,
            }}
        >
            {children}
        </PersonasContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePersonasContext() {
    const ctx = useContext(PersonasContext);
    if (!ctx) throw new Error('usePersonasContext must be used within a PersonasProvider');
    return ctx;
}
