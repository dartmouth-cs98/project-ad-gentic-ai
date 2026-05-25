import type { PreferencesSaveStatus } from '../../hooks/usePersistedCampaignPreferences';

interface PreferencesSaveIndicatorProps {
  status: PreferencesSaveStatus;
  className?: string;
}

export function PreferencesSaveIndicator({ status, className = '' }: PreferencesSaveIndicatorProps) {
  if (status === 'idle') return null;

  const label =
    status === 'saving'
      ? 'Saving…'
      : status === 'saved'
        ? 'Saved'
        : "Couldn't save";

  const toneClass =
    status === 'error'
      ? 'text-red-500'
      : status === 'saved'
        ? 'text-emerald-600 dark:text-emerald-400'
        : 'text-muted-foreground';

  return (
    <span
      className={`text-[10px] font-medium tabular-nums ${toneClass} ${className}`}
      aria-live="polite"
    >
      {label}
    </span>
  );
}
