import React, { useState, createContext, useContext } from 'react';
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
  updateProfile: (updates: Partial<CompanyProfile>) => void;
}
const defaultProfile: CompanyProfile = {
  companyName: 'Acme Inc.',
  industry: 'SaaS',
  primaryProduct: 'Productivity Tool',
  plan: 'premium',
  userName: 'Alex Johnson',
  email: 'alex@acme.inc'
};
const CompanyContext = createContext<CompanyContextType | undefined>(undefined);
export function CompanyProvider({ children }: {children: ReactNode;}) {
  const [profile, setProfile] = useState<CompanyProfile>(defaultProfile);
  const updateProfile = (updates: Partial<CompanyProfile>) => {
    setProfile((prev) => ({
      ...prev,
      ...updates
    }));
  };
  return (
    <CompanyContext.Provider
      value={{
        profile,
        updateProfile
      }}>

      {children}
    </CompanyContext.Provider>);

}
export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
}