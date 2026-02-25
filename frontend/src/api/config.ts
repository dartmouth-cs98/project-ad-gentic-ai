export const ENV = (import.meta.env.VITE_ENV as string) || 'local';
export const isLocal = ENV === 'local';
export const isProduction = ENV === 'production';

// Base URL used for all API calls
export const API_BASE_URL: string = isLocal
    ? '/api'
    : (import.meta.env.VITE_API_URL as string) || '/api';

export function apiUrl(path: string): string {
    return `${API_BASE_URL}${path}`;
}

// ---------- Token helpers ----------

export const TOKEN_KEY = 'adgentic_token';
export const USER_KEY = 'adgentic_current_user';
export const CLIENT_ID_KEY = 'adgentic_client_id';

export function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

// ---------- Auth header ----------

export function authHeaders(isJson = true): HeadersInit {
    const token = getToken();
    const headers: Record<string, string> = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    if (isJson) {
        headers['Content-Type'] = 'application/json';
    }
    return headers;
}