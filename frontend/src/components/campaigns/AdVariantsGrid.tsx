import { useState } from 'react';
import { CheckCircle2Icon, XIcon } from 'lucide-react';
import type { AdVariant } from '../../types';
import { useGroupedVariants } from '../../hooks/useGroupedVariants';
import { VariantGroupSection } from '../shared/VariantGroupSection';
import { AdVariantCard } from '../generate/AdVariantCard';

interface AdVariantsGridProps {
  variants: AdVariant[];
  onApprove?: (variantId: number) => void;
  onUnapprove?: (variantId: number) => void;
}

export function AdVariantsGrid({ variants, onApprove, onUnapprove }: AdVariantsGridProps) {
  const groups = useGroupedVariants(variants);
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
    <div>
      <div className="cmp-variants-bar">
        <div className="cmp-variants-bar-left">
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={allSelected}
              onChange={selectAll}
              className="cmp-check"
            />
          </label>
          <span>
            {selectedIds.size > 0
              ? `${selectedIds.size} variant${selectedIds.size > 1 ? 's' : ''} selected`
              : 'Select variants to approve'}
          </span>
        </div>

        <div className="cmp-variants-bar-actions">
          {onApprove && (
            <button
              type="button"
              onClick={handleApproveSelected}
              disabled={unapprovedSelected.length === 0}
              className="as-btn-solid"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', fontSize: 12 }}
            >
              <CheckCircle2Icon size={13} />
              {allSelected ? 'Approve All' : 'Approve Selected'}
            </button>
          )}
          {selectedIds.size > 0 && (
            <button
              type="button"
              onClick={clearSelection}
              className="as-icon-btn"
              aria-label="Clear selection"
            >
              <XIcon size={14} />
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {groups.map((group) => {
          const approvedCount = group.variants.filter((v) => v.is_approved).length;
          return (
            <VariantGroupSection
              key={group.key}
              name={group.name}
              isGeneral={group.isGeneral}
              approvedCount={approvedCount}
              totalCount={group.variants.length}
            >
              <div className="gen-variants-grid">
                {group.variants.map((variant) => (
                  <div key={variant.id}>
                    <AdVariantCard
                      variant={variant}
                      isSelected={selectedIds.has(variant.id)}
                      onToggle={() => toggleSelect(variant.id)}
                    />
                    {(onApprove || onUnapprove) && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '8px 2px 0' }}>
                        {variant.is_approved && onUnapprove ? (
                          <button
                            type="button"
                            onClick={() => onUnapprove(variant.id)}
                            className="as-btn-ghost sm"
                          >
                            Unapprove
                          </button>
                        ) : !variant.is_approved && onApprove ? (
                          <button
                            type="button"
                            onClick={() => onApprove(variant.id)}
                            className="as-btn-solid"
                            style={{ padding: '5px 12px', fontSize: 12 }}
                          >
                            Approve
                          </button>
                        ) : null}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </VariantGroupSection>
          );
        })}
      </div>
    </div>
  );
}
