import { apiUrl } from '../api/config';

const TOKEN_KEY = 'adgentic_token';
const CURRENT_USER_KEY = 'adgentic_current_user';
const CURRENT_CLIENT_ID_KEY = 'adgentic_client_id';

export interface User {
  email: string;
  client_id: number;
}

// ---------- Auth API calls ----------

export async function signUp(
  email: string,
  password: string,
  plan: string = 'basic'
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(apiUrl('/auth/signup'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, plan }),
    });

    if (res.status === 409) {
      return {
        success: false,
        error: 'An account with this email already exists. Try signing in.',
      };
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { success: false, error: body.detail || 'Sign up failed.' };
    }

    const data = await res.json();
    _storeSession(data.access_token, data.email, data.client_id);
    return { success: true };
  } catch {
    return { success: false, error: 'Could not reach the server. Please try again.' };
  }
}

export async function signIn(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(apiUrl('/auth/signin'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { success: false, error: body.detail || 'Sign in failed.' };
    }

    const data = await res.json();
    _storeSession(data.access_token, data.email, data.client_id);
    return { success: true };
  } catch {
    return { success: false, error: 'Could not reach the server. Please try again.' };
  }
}

export async function saveOnboarding(
  onboardingData: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  const token = getToken();
  if (!token) return { success: false, error: 'Not authenticated.' };

  try {
    const res = await fetch(apiUrl('/auth/onboarding'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(onboardingData),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { success: false, error: body.detail || 'Failed to save onboarding data.' };
    }

    return { success: true };
  } catch {
    return { success: false, error: 'Could not reach the server. Please try again.' };
  }
}

// ---------- Session helpers ----------

function _storeSession(token: string, email: string, clientId: number) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(CURRENT_USER_KEY, email);
  localStorage.setItem(CURRENT_CLIENT_ID_KEY, String(clientId));
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getCurrentUser(): string | null {
  return localStorage.getItem(CURRENT_USER_KEY);
}

export function signOut() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(CURRENT_USER_KEY);
  localStorage.removeItem(CURRENT_CLIENT_ID_KEY);
}

// No-ops kept for import compatibility
export function seedDemoUser() {}
export function setCurrentUser(email: string) {
  localStorage.setItem(CURRENT_USER_KEY, email);
}
