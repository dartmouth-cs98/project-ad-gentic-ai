import { createContext, useContext, ReactNode } from 'react';
import { useProfile, useLogout } from '../hooks/useAuth';
import type { UserProfile } from '../api/auth';

interface UserContextType {
  /** The authenticated user's profile, or null when logged out / loading. */
  user: UserProfile | null;
  /** True while the initial profile fetch is in flight. */
  loading: boolean;
  /** Sign the user out and clear cached data. */
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const { data: user = null, isLoading } = useProfile();
  const logout = useLogout();

  return (
    <UserContext.Provider value={{ user, loading: isLoading, logout }}>
      {children}
    </UserContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within a UserProvider');
  return ctx;
}
