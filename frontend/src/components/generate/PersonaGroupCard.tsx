import {
  UsersIcon,
  ChevronDownIcon,
  CheckIcon,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { VariantCard } from './VariantCard';
import type { PersonaGroup } from './types';

interface PersonaGroupCardProps {
  group: PersonaGroup;
  isExpanded: boolean;
  onToggle: (groupId: string) => void;
  selectedVariants: Set<string>;
  onVariantToggle: (variantId: string) => void;
  onGroupSelect: (group: PersonaGroup) => void;
  variantCols: number;
  animationDelay?: number;
}

export function PersonaGroupCard({
  group,
  isExpanded,
  onToggle,
  selectedVariants,
  onVariantToggle,
  onGroupSelect,
  variantCols,
  animationDelay = 0,
}: PersonaGroupCardProps) {
  const allSelected = group.variants.every((v) => selectedVariants.has(v.id));
  const someSelected = group.variants.some((v) => selectedVariants.has(v.id));

  return (
    <div
      className="fade-up bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div
        className="flex items-center gap-4 p-4 cursor-pointer"
        onClick={() => onToggle(group.id)}
      >
        <div
          onClick={(e) => {
            e.stopPropagation();
            onGroupSelect(group);
          }}
        >
          <div
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors cursor-pointer ${
              allSelected
                ? 'bg-blue-600 border-blue-600'
                : someSelected
                  ? 'border-blue-400 bg-blue-100'
                  : 'border-slate-300 hover:border-slate-400'
            }`}
          >
            {(allSelected || someSelected) && (
              <CheckIcon className="w-3 h-3 text-white" />
            )}
          </div>
        </div>
        <div className={`w-10 h-10 rounded-xl ${group.color} flex items-center justify-center flex-shrink-0`}>
          <UsersIcon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-semibold text-slate-900">{group.name}</h3>
            <span className="text-xs text-slate-400">{group.ageRange}</span>
          </div>
          <p className="text-xs text-slate-500 truncate">{group.description}</p>
        </div>
        <Badge variant="default" className="flex-shrink-0">
          {group.variants.length} variants
        </Badge>
        <ChevronDownIcon
          className={`w-5 h-5 text-slate-400 transition-transform duration-300 flex-shrink-0 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </div>
      <div
        className={`transition-all duration-300 overflow-hidden ${
          isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div
          className="px-4 pb-4 grid gap-3"
          style={{ gridTemplateColumns: `repeat(${variantCols}, minmax(0, 1fr))` }}
        >
          {group.variants.map((variant) => (
            <VariantCard
              key={variant.id}
              variant={variant}
              isSelected={selectedVariants.has(variant.id)}
              onToggle={onVariantToggle}
              groupColors={{ colorBg: group.colorBg, colorText: group.colorText }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
