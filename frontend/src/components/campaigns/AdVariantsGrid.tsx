import { useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { FilmIcon, FileTextIcon, CheckCircle2Icon, XIcon } from 'lucide-react';
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
  onApprove?: (variantId: number) => void;
  onUnapprove?: (variantId: number) => void;
}

export function AdVariantsGrid({ variants, onApprove, onUnapprove }: AdVariantsGridProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    const unselected = variants.filter((v) => !selectedIds.has(v.id));
    if (unselected.length > 0) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        unselected.forEach((v) => next.add(v.id));
        return next;
      });
    } else {
      setSelectedIds(new Set());
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleApproveSelected = () => {
    if (!onApprove) return;
    variants
      .filter((v) => selectedIds.has(v.id) && !v.is_approved)
      .forEach((v) => onApprove(v.id));
    clearSelection();
  };

  const allSelected = variants.length > 0 && selectedIds.size === variants.length;
  const unapprovedSelected = variants.filter((v) => selectedIds.has(v.id) && !v.is_approved);

  return (
    <div className="space-y-4">
      {/* Action bar — always visible */}
      <div className="flex items-center justify-between px-1 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={selectAll}
              className="w-3.5 h-3.5 rounded accent-blue-600"
            />
          </label>
          <span className="text-sm text-muted-foreground">
            {selectedIds.size > 0
              ? `${selectedIds.size} variant${selectedIds.size > 1 ? 's' : ''} selected`
              : 'Select variants to approve'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {onApprove && (
            <button
              onClick={handleApproveSelected}
              disabled={unapprovedSelected.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed enabled:hover:bg-emerald-700"
            >
              <CheckCircle2Icon className="w-3.5 h-3.5" />
              {allSelected ? 'Approve All' : 'Approve Selected'}
            </button>
          )}
          {selectedIds.size > 0 && (
            <button
              onClick={clearSelection}
              className="p-1 rounded hover:bg-muted transition-colors"
              aria-label="Clear selection"
            >
              <XIcon className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {variants.map((variant) => {
          const script = parseScript(variant.meta);
          const isSelected = selectedIds.has(variant.id);

          return (
            <Card
              key={variant.id}
              variant="elevated"
              padding="none"
              className={`overflow-hidden cursor-pointer transition-all ${
                isSelected ? 'ring-2 ring-blue-500' : 'hover:ring-1 hover:ring-border'
              }`}
              onClick={() => toggleSelect(variant.id)}
            >
              <div className="relative w-full aspect-video bg-black">
                {variant.media_url ? (
                  <video
                    src={variant.media_url}
                    className="w-full h-full object-contain object-center bg-black"
                    controls
                    preload="metadata"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-400">
                    <FilmIcon className="w-8 h-8" />
                    <p className="text-sm">No video URL available</p>
                  </div>
                )}

                {/* Approval badge */}
                <div className="absolute top-3 left-3">
                  <Badge variant={variant.is_approved ? 'success' : 'warning'}>
                    {variant.is_approved ? 'Approved' : 'Pending Approval'}
                  </Badge>
                </div>

                {/* Selection checkbox */}
                <div
                  className="absolute top-3 right-3 z-10"
                  onClick={(e) => { e.stopPropagation(); toggleSelect(variant.id); }}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-blue-500 border-blue-500'
                      : 'bg-black/40 border-white/60 hover:border-white'
                  }`}>
                    {isSelected && <CheckCircle2Icon className="w-3 h-3 text-white" />}
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">
                    Variant #{variant.id}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">v{variant.version_number}</span>
                    {/* Inline approve/unapprove toggle */}
                    {variant.is_approved && onUnapprove ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); onUnapprove(variant.id); }}
                        className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                      >
                        Unapprove
                      </button>
                    ) : !variant.is_approved && onApprove ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); onApprove(variant.id); }}
                        className="text-xs text-emerald-600 hover:text-emerald-700 underline underline-offset-2 transition-colors"
                      >
                        Approve
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  Generated {new Date(variant.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>

                {script && (
                  <div className="flex items-start gap-2 rounded-lg bg-muted/50 border border-border p-3">
                    <FileTextIcon className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p className="text-xs leading-relaxed text-muted-foreground line-clamp-3">
                      {script}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
