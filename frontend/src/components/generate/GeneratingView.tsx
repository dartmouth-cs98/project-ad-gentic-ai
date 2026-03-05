import { BrainIcon, UsersIcon } from 'lucide-react';
import type { PersonaGroup } from './types';
import { progressMessages } from './mockData';

interface GeneratingViewProps {
  progressIdx: number;
  personaGroups: PersonaGroup[];
}

export function GeneratingView({ progressIdx, personaGroups }: GeneratingViewProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 fade-up">
      <div className="mb-10 text-center">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
          <BrainIcon className="w-6 h-6 text-blue-600 progress-pulse" />
        </div>
        <p className="text-lg font-semibold text-slate-900 mb-1">
          Creating Your Ads
        </p>
        <p className="text-sm text-blue-600 font-medium progress-pulse" key={progressIdx}>
          {progressMessages[progressIdx]}
        </p>
      </div>
      <div className="w-full max-w-2xl space-y-4">
        {personaGroups.map((group, i) => (
          <div
            key={group.id}
            className="deal-in"
            style={{ animationDelay: `${i * 400}ms` }}
          >
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm overflow-hidden relative">
              <div
                className={`absolute inset-0 ${group.colorBg} color-fill`}
                style={{
                  animationDelay: `${i * 400 + 600}ms`,
                  animationFillMode: 'forwards',
                  opacity: 0.5,
                }}
              />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl ${group.color} flex items-center justify-center`}>
                    <UsersIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="h-4 w-36 shimmer-bg rounded mb-1.5" />
                    <div className="h-3 w-48 shimmer-bg rounded" />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {Array.from({ length: group.variants.length }).map((_, j) => (
                    <div
                      key={j}
                      className="deal-in"
                      style={{ animationDelay: `${i * 400 + 800 + j * 150}ms` }}
                    >
                      <div className="aspect-[4/3] shimmer-bg rounded-lg" />
                      <div className="mt-2 h-3 w-full shimmer-bg rounded" />
                      <div className="mt-1 h-2.5 w-2/3 shimmer-bg rounded" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
