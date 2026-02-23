import { useState, createContext, useContext, ReactNode } from 'react';
import { useUser } from './UserContext';

export interface CompanyProfile {
  companyName: string;
  industry: string;
  primaryProduct: string;
  plan: 'basic' | 'premium' | 'enterprise';
  userName: string;
  email: string;
  avatarUrl?: string;
}

interface CompanyContextType {
  profile: CompanyProfile;
  loading: boolean;
  updateProfile: (updates: Partial<CompanyProfile>) => void;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useUser();
  const [overrides, setOverrides] = useState<Partial<CompanyProfile>>({});

  const traits = (user?.traits ?? {}) as Record<string, string>;

  const profile: CompanyProfile = {
    companyName: user?.business_name || '',
    industry: traits.industry || '',
    primaryProduct: traits.product_description || '',
    plan: (user?.subscription_tier as CompanyProfile['plan']) || 'basic',
    userName: user?.business_name || user?.email || '',
    email: user?.email || '',
    ...overrides,
  };

  const updateProfile = (updates: Partial<CompanyProfile>) => {
    setOverrides((prev) => ({ ...prev, ...updates }));
  };

  return (
    <CompanyContext.Provider value={{ profile, loading, updateProfile }}>
      {children}
    </CompanyContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
}
