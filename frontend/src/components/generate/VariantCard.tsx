import {
  SparklesIcon,
  CheckIcon,
  ImageIcon,
  VideoIcon,
  LayoutIcon,
} from 'lucide-react';
import type { Variant, AdFormat } from './types';
import { formatBadgeColors } from './mockData';

const formatIcons: Record<AdFormat, React.ElementType> = {
  image: ImageIcon,
  video: VideoIcon,
  carousel: LayoutIcon,
};

interface VariantCardProps {
  variant: Variant;
  isSelected: boolean;
  onToggle: (variantId: string) => void;
  groupColors: { colorBg: string; colorText: string };
}

export function VariantCard({ variant, isSelected, onToggle, groupColors }: VariantCardProps) {
  const FormatIcon = formatIcons[variant.format];
  const fColors = formatBadgeColors[variant.format];

  return (
    <div
      className={`rounded-xl border overflow-hidden transition-all cursor-pointer ${
        isSelected
          ? 'border-blue-500 ring-1 ring-blue-500 shadow-md'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
      }`}
      onClick={() => onToggle(variant.id)}
    >
      <div className="relative aspect-[16/10] bg-slate-100">
        <img
          src={variant.image}
          alt={variant.headline}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded-full text-[10px] text-white font-bold flex items-center gap-1">
          <SparklesIcon className="w-2.5 h-2.5 text-amber-400" />
          {variant.score}%
        </div>
        <div
          className={`absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize flex items-center gap-1 ${fColors.bg} ${fColors.text}`}
        >
          <FormatIcon className="w-2.5 h-2.5" />
          {variant.format}
        </div>
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
      <div className="p-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${groupColors.colorBg} ${groupColors.colorText}`}>
            {variant.subProfile}
          </span>
        </div>
        <h4 className="text-sm font-semibold text-slate-900 leading-snug mb-1 line-clamp-2">
          {variant.headline}
        </h4>
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
          {variant.description}
        </p>
      </div>
    </div>
  );
}
