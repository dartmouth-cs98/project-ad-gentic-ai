import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getSocialConnectionStatus,
  getOAuthConnectUrl,
  disconnectSocialPlatform,
} from '../api/social';

const SOCIAL_STATUS_KEY = ['social', 'status'];

export function useSocialConnectionStatus() {
  return useQuery({
    queryKey: SOCIAL_STATUS_KEY,
    queryFn: getSocialConnectionStatus,
  });
}

export function useConnectSocialPlatform() {
  return useMutation({
    mutationFn: async ({platform = 'instagram'} : { platform?: string }) => {
      const url = await getOAuthConnectUrl(platform);
      // Redirect the browser to Meta's OAuth dialog
      window.location.href = url;
    },
  });
}

export function useDisconnectSocialPlatform() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({platform}: { platform?: string }) => disconnectSocialPlatform(platform),
    onSuccess: () => qc.invalidateQueries({ queryKey: SOCIAL_STATUS_KEY }),
  });
}
