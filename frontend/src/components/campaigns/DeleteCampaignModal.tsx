import { useState } from 'react';
import { AlertTriangleIcon, Loader2Icon, XIcon } from 'lucide-react';

interface DeleteCampaignModalProps {
  campaignName: string;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function DeleteCampaignModal({ campaignName, onClose, onConfirm, isLoading = false }: DeleteCampaignModalProps) {
  const [confirmation, setConfirmation] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => !isLoading && onClose()} />

      <div className="relative w-full max-w-md bg-card border border-border rounded-xl p-6">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
        >
          <XIcon className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-11 h-11 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangleIcon className="w-5 h-5 text-red-500" />
          </div>
          <h2 className="text-lg font-semibold mb-1">Delete Campaign?</h2>
          <p className="text-sm text-muted-foreground">
            This action cannot be undone. This will permanently delete the campaign and all generated ads.
          </p>
        </div>

        <div className="space-y-1.5 mb-6">
          <label className="block text-sm font-medium">
            Type <span className="font-semibold">{campaignName}</span> to confirm
          </label>
          <input
            placeholder={campaignName}
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={confirmation !== campaignName || isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-40"
          >
            {isLoading && <Loader2Icon className="w-4 h-4 animate-spin" />}
            {isLoading ? 'Deleting...' : 'Delete Campaign'}
          </button>
        </div>
      </div>
    </div>
  );
}
