import { Upload, Users, CheckCircle2 } from 'lucide-react';

const UPLOAD_MESSAGES = ['Reading your file...', 'Saving to database...'];
const ASSIGN_MESSAGES = ['Matching profiles...', 'Finalizing segments...'];

export type UploadPhase = 'uploading' | 'assigning' | 'complete';

interface Props {
  phase: UploadPhase;
  progressIdx: number;
  uploadedCount?: number;
  personaCount?: number;
}

export function UploadProgressView({ phase, progressIdx, uploadedCount, personaCount }: Props) {
  if (phase === 'complete') {
    return (
      <div className="flex flex-col items-center justify-center py-8 fade-up text-center">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
        </div>
        <p className="text-base font-semibold text-foreground mb-1">Complete</p>
        {uploadedCount !== undefined && personaCount !== undefined && (
          <p className="text-sm text-muted-foreground">
            {uploadedCount.toLocaleString()} customers across {personaCount} persona{personaCount !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    );
  }

  const Icon = phase === 'uploading' ? Upload : Users;
  const messages = phase === 'uploading' ? UPLOAD_MESSAGES : ASSIGN_MESSAGES;
  const label = phase === 'uploading' ? 'Uploading Data' : 'Sorting Customers';

  return (
    <div className="flex flex-col items-center justify-center py-8 fade-up text-center">
      <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-6 h-6 text-blue-600 progress-pulse" />
      </div>
      <p className="text-base font-semibold text-foreground mb-1">{label}</p>
      <p className="text-sm text-blue-600 dark:text-blue-400 font-medium progress-pulse" key={progressIdx}>
        {messages[Math.min(progressIdx, messages.length - 1)]}
      </p>
      <div className="w-full mt-6 space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="deal-in" style={{ animationDelay: `${i * 150}ms` }}>
            <div className="h-10 shimmer-bg rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
