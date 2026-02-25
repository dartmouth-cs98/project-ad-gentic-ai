import { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { AlertTriangleIcon, Loader2Icon } from 'lucide-react';

interface DeleteCampaignModalProps {
  campaignName: string;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function DeleteCampaignModal({
  campaignName,
  onClose,
  onConfirm,
  isLoading = false,
}: DeleteCampaignModalProps) {
  const [confirmation, setConfirmation] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={() => !isLoading && onClose()}
      />

      <Card
        variant="elevated"
        padding="lg"
        className="relative w-full max-w-md"
      >
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangleIcon className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Delete Campaign?
          </h2>
          <p className="text-slate-500 text-sm">
            This action cannot be undone. This will permanently delete the
            campaign and all generated ads.
          </p>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Type <span className="font-bold">{campaignName}</span> to confirm
          </label>
          <Input
            placeholder={campaignName}
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            disabled={confirmation !== campaignName || isLoading}
            leftIcon={isLoading ? <Loader2Icon className="w-4 h-4 animate-spin" /> : undefined}
          >
            {isLoading ? 'Deleting...' : 'Delete Campaign'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
