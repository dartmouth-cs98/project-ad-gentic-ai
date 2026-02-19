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