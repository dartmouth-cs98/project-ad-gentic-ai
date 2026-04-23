import { apiUrl, authHeaders } from './config';

export interface ConnectStatusResponse {
  platform: string;
  connected: boolean;
  platform_account_id: string | null;
  connected_at: string | null;
}

export async function getSocialConnectionStatus(): Promise<ConnectStatusResponse[]> {
  const res = await fetch(apiUrl('/social-auth/status'), {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch social connection status');
  return res.json();
}

export async function getOAuthConnectUrl(platform = 'instagram'): Promise<string> {
  const res = await fetch(apiUrl(`/social-auth/connect?platform=${platform}`), {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to get OAuth URL');
  const data = await res.json();
  return data.url;
}

export async function disconnectSocialPlatform(platform = 'instagram'): Promise<void> {
  const res = await fetch(apiUrl(`/social-auth/disconnect?platform=${platform}`), {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to disconnect platform');
}
