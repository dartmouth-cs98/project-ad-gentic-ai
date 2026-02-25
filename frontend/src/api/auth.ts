import { apiUrl, TOKEN_KEY, USER_KEY, CLIENT_ID_KEY, getToken, authHeaders } from './config';
import type { TokenResponse, UserProfile, OnboardingPayload } from '../types';

export type { TokenResponse, UserProfile, OnboardingPayload };

// ---------- Token helpers ----------

export { getToken };

export function storeSession(token: string, email: string, clientId: number) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, email);
  localStorage.setItem(CLIENT_ID_KEY, String(clientId));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(CLIENT_ID_KEY);
}

// ---------- Auth header ----------


// ---------- API calls ----------

export async function signUp(
  email: string,
  password: string,
  plan = 'basic',
): Promise<TokenResponse> {
  const res = await fetch(apiUrl('/auth/signup'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, plan }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      res.status === 409
        ? 'An account with this email already exists. Try signing in.'
        : body.detail || 'Sign up failed.',
    );
  }

  const data: TokenResponse = await res.json();
  storeSession(data.access_token, data.email, data.client_id);
  return data;
}

export async function signIn(
  email: string,
  password: string,
): Promise<TokenResponse> {
  const res = await fetch(apiUrl('/auth/signin'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || 'Sign in failed.');
  }

  const data: TokenResponse = await res.json();
  storeSession(data.access_token, data.email, data.client_id);
  return data;
}

export async function fetchProfile(): Promise<UserProfile> {
  const res = await fetch(apiUrl('/auth/me'), {
    headers: authHeaders(),
  });

  if (!res.ok) {
    throw new Error('Failed to fetch profile.');
  }

  return (await res.json()) as UserProfile;
}

export async function saveOnboarding(
  data: OnboardingPayload,
): Promise<void> {
  const res = await fetch(apiUrl('/auth/onboarding'), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || 'Failed to save onboarding data.');
  }
}

export function logout() {
  clearSession();
}
