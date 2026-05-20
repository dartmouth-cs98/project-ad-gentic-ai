import { createPortal } from 'react-dom';
import { AlertTriangleIcon, Loader2Icon, XIcon } from 'lucide-react';

interface DeleteCampaignModalProps {
  /** Names of campaigns that will be deleted (one or many). */
  campaignNames: string[];
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  error?: string | null;
}

const PER_CAMPAIGN_DELETED_ITEMS = [
  'Campaign record and settings',
  'Chat messages',
  'Ad variants and generated ads',
  'Campaign metrics',
  'Consumer analytics events',
] as const;

export function DeleteCampaignModal({
  campaignNames,
  onClose,
  onConfirm,
  isLoading = false,
  error = null,
}: DeleteCampaignModalProps) {
  const count = campaignNames.length;
  const isPlural = count !== 1;

  const modal = (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
        onClick={() => !isLoading && onClose()}
        aria-hidden
      />

      <div
        role="alertdialog"
        aria-labelledby="delete-campaign-title"
        aria-describedby="delete-campaign-description"
        className="relative w-full max-w-md bg-card border border-border rounded-xl p-6 shadow-xl"
      >
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          aria-label="Close"
        >
          <XIcon className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center text-center mb-4">
          <div className="w-11 h-11 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangleIcon className="w-5 h-5 text-red-500" />
          </div>
          <h2 id="delete-campaign-title" className="text-lg font-semibold text-foreground">
            {isPlural ? `Delete ${count} campaigns?` : `Delete "${campaignNames[0]}"?`}
          </h2>
        </div>

        <div
          id="delete-campaign-description"
          className="mb-6 w-full rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-left max-h-[min(50vh,20rem)] overflow-y-auto"
        >
          <p className="text-sm font-medium text-foreground">
            This action cannot be undone.
            {isPlural
              ? ' The following campaigns will be permanently deleted:'
              : ' The following will be permanently deleted for this campaign:'}
          </p>
          {isPlural ? (
            <ul className="mt-3 text-sm font-medium text-foreground space-y-1 list-disc list-inside">
              {campaignNames.map((name, index) => (
                <li key={`${index}-${name}`} className="truncate" title={name}>
                  {name}
                </li>
              ))}
            </ul>
          ) : (
            <ul className="mt-3 text-sm text-foreground space-y-1 list-disc list-inside">
              <li>The campaign</li>
              {PER_CAMPAIGN_DELETED_ITEMS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
          {isPlural && (
            <>
              <p className="mt-4 text-sm text-foreground">For each campaign, this also removes:</p>
              <ul className="mt-2 text-sm text-foreground space-y-1 list-disc list-inside">
                {PER_CAMPAIGN_DELETED_ITEMS.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </>
          )}
        </div>

        {error && (
          <p className="mb-4 text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-40"
          >
            {isLoading && <Loader2Icon className="w-4 h-4 animate-spin" />}
            {isLoading
              ? 'Deleting...'
              : isPlural
                ? `Delete ${count} campaigns`
                : 'Delete Campaign'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
