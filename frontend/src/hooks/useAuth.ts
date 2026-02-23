import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  signUp,
  signIn,
  fetchProfile,
  saveOnboarding,
  logout as logoutApi,
  getToken,
} from '../api/auth';
import type { OnboardingPayload } from '../api/auth';

export const PROFILE_KEY = ['auth', 'profile'] as const;

/** Fetch the current user's profile. Only enabled when a token exists. */
export function useProfile() {
  return useQuery({
    queryKey: PROFILE_KEY,
    queryFn: fetchProfile,
    enabled: !!getToken(),
    staleTime: 5 * 60 * 1000,       // 5 min
    retry: false,
  });
}

export function useSignUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ email, password, plan }: { email: string; password: string; plan?: string }) =>
      signUp(email, password, plan),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROFILE_KEY });
    },
  });
}

export function useSignIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      signIn(email, password),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROFILE_KEY });
    },
  });
}

export function useSaveOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: OnboardingPayload) => saveOnboarding(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROFILE_KEY });
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return () => {
    logoutApi();
    qc.removeQueries({ queryKey: PROFILE_KEY });
  };
}
