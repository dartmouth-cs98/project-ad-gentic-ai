import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  PlayCircleIcon,
  DownloadIcon,
  MoreVerticalIcon,
  BarChart3Icon,
} from 'lucide-react';

export interface AdVariant {
  id: string;
  label: string;
  persona: string;
  personaColors: string;
  headline: string;
  ctr: string;
  image: string;
}

interface AdVariantsGridProps {
  variants: AdVariant[];
}

export function AdVariantsGrid({ variants }: AdVariantsGridProps) {
  return (
    <div className="grid grid-cols-3 gap-6">
      {variants.map((variant) => (
        <Card
          key={variant.id}
          variant="elevated"
          padding="none"
          className="overflow-hidden group"
        >
          <div className="relative aspect-video bg-slate-100">
            <img
              src={variant.image}
              alt={`${variant.label} - ${variant.persona}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 backdrop-blur-md rounded text-xs text-white font-medium">
              {variant.label}
            </div>
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button size="sm" variant="secondary">
                <PlayCircleIcon className="w-4 h-4" /> Preview
              </Button>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <Badge
                variant="info"
                className={`border ${variant.personaColors}`}
              >
                {variant.persona}
              </Badge>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <BarChart3Icon className="w-3 h-3" />
                <span>{variant.ctr} CTR</span>
              </div>
            </div>
            <h3 className="font-medium text-slate-900 mb-4 line-clamp-2 text-sm leading-relaxed">
              {variant.headline}
            </h3>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                className="flex-1 text-xs"
              >
                <DownloadIcon className="w-3 h-3 mr-1" /> Download
              </Button>
              <Button size="sm" variant="ghost" className="px-2">
                <MoreVerticalIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
