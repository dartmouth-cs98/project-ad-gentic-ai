import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { FilmIcon, FileTextIcon } from 'lucide-react';
import type { AdVariant } from '../../types';

function parseScript(meta: string | null): string | null {
  if (!meta) return null;
  try {
    const parsed = JSON.parse(meta) as { script?: string };
    return parsed.script ?? null;
  } catch {
    return null;
  }
}

interface AdVariantsGridProps {
  variants: AdVariant[];
}

export function AdVariantsGrid({ variants }: AdVariantsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {variants.map((variant) => {
        const script = parseScript(variant.meta);
        return (
          <Card
            key={variant.id}
            variant="elevated"
            padding="none"
            className="overflow-hidden"
          >
            <div className="relative w-full aspect-video bg-black">
              {variant.media_url ? (
                <video
                  src={variant.media_url}
                  className="w-full h-full object-contain object-center bg-black"
                  controls
                  preload="metadata"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-400">
                  <FilmIcon className="w-8 h-8" />
                  <p className="text-sm">No video URL available</p>
                </div>
              )}
              <div className="absolute top-3 left-3">
                <Badge variant="success">
                  Approved
                </Badge>
              </div>
            </div>

            <div className="p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">
                  Variant #{variant.id}
                </h3>
                <span className="text-xs text-slate-500">
                  v{variant.version_number}
                </span>
              </div>

              <div className="text-xs text-slate-500">
                Generated {new Date(variant.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>

              {script && (
                <div className="flex items-start gap-2 rounded-lg bg-slate-50 border border-slate-100 p-3">
                  <FileTextIcon className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs leading-relaxed text-slate-600 line-clamp-3">
                    {script}
                  </p>
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
