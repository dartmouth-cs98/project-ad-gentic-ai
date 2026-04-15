import { apiUrl, TOKEN_KEY, USER_KEY, CLIENT_ID_KEY, getToken, authHeaders } from './config';
import type {
  TokenResponse,
  UserProfile,
  OnboardingPayload,
  SignUpResponse,
  VerifyEmailResponse,
  ResendVerificationResponse,
  RequestPasswordResetResponse,
  ResetPasswordResponse,
} from '../types';

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

function getApiErrorMessage(body: unknown, fallback: string): string {
  if (!body || typeof body !== 'object') return fallback;
  const detail = (body as { detail?: unknown }).detail;
  if (typeof detail === 'string' && detail.trim()) return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as { msg?: string } | undefined;
    if (first?.msg?.toLowerCase().includes('valid email')) {
      return 'Please enter a valid email address.';
    }
    if (first?.msg) return first.msg;
  }
  return fallback;
}

export async function signUp(
  email: string,
  password: string,
  plan = 'basic',
): Promise<SignUpResponse> {
  const res = await fetch(apiUrl('/auth/signup'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, plan }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = getApiErrorMessage(body, 'Sign up failed.');
    throw new Error(
      res.status === 409
        ? 'An account with this email already exists. Try signing in.'
        : message,
    );
  }

  return (await res.json()) as SignUpResponse;
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
    throw new Error(getApiErrorMessage(body, 'Sign in failed.'));
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

export async function verifyEmail(email: string, code: string): Promise<VerifyEmailResponse> {
  const res = await fetch(apiUrl('/auth/verify-email'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(getApiErrorMessage(body, 'Email verification failed.'));
  }
  const data = (await res.json()) as VerifyEmailResponse;
  storeSession(data.access_token, data.email, data.client_id);
  return data;
}

export async function resendVerification(email: string): Promise<ResendVerificationResponse> {
  const res = await fetch(apiUrl('/auth/resend-verification'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(getApiErrorMessage(body, 'Failed to resend verification email.'));
  }
  return (await res.json()) as ResendVerificationResponse;
}

export async function requestPasswordReset(email: string): Promise<RequestPasswordResetResponse> {
  const res = await fetch(apiUrl('/auth/request-password-reset'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(getApiErrorMessage(body, 'Failed to request password reset.'));
  }
  return (await res.json()) as RequestPasswordResetResponse;
}

export async function resetPassword(
  email: string,
  code: string,
  newPassword: string,
): Promise<ResetPasswordResponse> {
  const res = await fetch(apiUrl('/auth/reset-password'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code, new_password: newPassword }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(getApiErrorMessage(body, 'Failed to reset password.'));
  }
  return (await res.json()) as ResetPasswordResponse;
}

export function logout() {
  clearSession();
}
