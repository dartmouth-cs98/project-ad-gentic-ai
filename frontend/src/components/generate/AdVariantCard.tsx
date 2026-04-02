import { CheckIcon, LoaderIcon, AlertCircleIcon, VideoIcon, FileTextIcon } from 'lucide-react';
import type { AdVariant, AdVariantScript } from '../../types';

interface AdVariantCardProps {
  variant: AdVariant;
  isSelected: boolean;
  onToggle: (variantId: string) => void;
}

const statusConfig = {
  Generating: { label: 'Generating', bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', icon: LoaderIcon, animate: true },
  completed: { label: 'Completed', bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', icon: CheckIcon, animate: false },
  failed: { label: 'Failed', bg: 'bg-red-500/10', text: 'text-red-500', icon: AlertCircleIcon, animate: false },
} as const;

function parseScript(meta: string | null): AdVariantScript {
  if (!meta) return {};
  try {
    return JSON.parse(meta) as AdVariantScript;
  } catch {
    return {};
  }
}

export function AdVariantCard({ variant, isSelected, onToggle }: AdVariantCardProps) {
  const id = String(variant.id);
  const config = statusConfig[variant.status] ?? statusConfig.Generating;
  const StatusIcon = config.icon;
  const parsed = parseScript(variant.meta);

  return (
    <div
      className={`rounded-xl border overflow-hidden transition-all cursor-pointer fade-up ${
        isSelected
          ? 'border-blue-500 ring-1 ring-blue-500 shadow-md'
          : 'border-border hover:border-foreground/30 hover:shadow-sm'
      }`}
      onClick={() => onToggle(id)}
    >
      {/* Media area */}
      <div className="relative aspect-[9/16] max-h-[280px] bg-[#0a0a0a]">
        {variant.status === 'completed' && variant.media_url ? (
          <video
            src={variant.media_url}
            className="w-full h-full object-contain object-center"
            controls
            preload="metadata"
            onClick={(e) => e.stopPropagation()}
          />
        ) : variant.status === 'Generating' ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3">
            <LoaderIcon className="w-8 h-8 text-amber-400 animate-spin" />
            <span className="text-xs text-muted-foreground">Generating video...</span>
          </div>
        ) : variant.status === 'failed' ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3">
            <AlertCircleIcon className="w-8 h-8 text-red-400" />
            <span className="text-xs text-red-400">Generation failed</span>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <VideoIcon className="w-8 h-8 text-muted-foreground/40" />
          </div>
        )}

        {/* Status badge */}
        <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 ${config.bg} ${config.text}`}>
          <StatusIcon className={`w-2.5 h-2.5 ${config.animate ? 'animate-spin' : ''}`} />
          {config.label}
        </div>

        {/* Selection checkbox */}
        <div className="absolute top-2 left-2">
          <div
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
              isSelected
                ? 'bg-blue-600 border-blue-600'
                : 'border-white/80 bg-black/20 backdrop-blur-sm'
            }`}
          >
            {isSelected && <CheckIcon className="w-3 h-3 text-white" />}
          </div>
        </div>
      </div>

      {/* Info area */}
      <div className="p-3 bg-card">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-muted text-muted-foreground">
            v{variant.version_number}
          </span>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-600/10 text-blue-600 dark:text-blue-400">
            ID #{variant.id}
          </span>
        </div>

        {parsed.script ? (
          <div className="flex items-start gap-1.5">
            <FileTextIcon className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-xs text-foreground line-clamp-4 leading-relaxed">
              {parsed.script}
            </p>
          </div>
        ) : parsed.error ? (
          <p className="text-xs text-red-500 line-clamp-3">
            Error: {parsed.error.slice(0, 150)}...
          </p>
        ) : (
          <p className="text-xs text-muted-foreground italic">No script yet</p>
        )}
      </div>
    </div>
  );
}
