import { BrainIcon } from 'lucide-react';
import { progressMessages } from './mockData';

interface GeneratingViewProps {
  progressIdx: number;
  variantCount?: number;
}

export function GeneratingView({ progressIdx, variantCount = 6 }: GeneratingViewProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 fade-up">
      <div className="mb-10 text-center">
        <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center mx-auto mb-4">
          <BrainIcon className="w-6 h-6 text-blue-600 progress-pulse" />
        </div>
        <p className="text-lg font-semibold text-foreground mb-1">
          Creating Your Ads
        </p>
        <p className="text-sm text-blue-600 dark:text-blue-400 font-medium progress-pulse" key={progressIdx}>
          {progressMessages[progressIdx]}
        </p>
      </div>
      <div className="w-full max-w-2xl grid grid-cols-3 gap-4">
        {Array.from({ length: variantCount }).map((_, i) => (
          <div
            key={i}
            className="deal-in"
            style={{ animationDelay: `${i * 200}ms` }}
          >
            <div className="bg-card rounded-2xl border border-border p-4 overflow-hidden">
              <div className="aspect-[9/16] max-h-[180px] shimmer-bg rounded-lg mb-3" />
              <div className="h-3 w-full shimmer-bg rounded mb-2" />
              <div className="h-2.5 w-2/3 shimmer-bg rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
