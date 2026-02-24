import { Link } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

// ---------- Types ----------

export interface CampaignItem {
  id: string;
  name: string;
  product: string;
  status: 'active' | 'completed' | 'draft';
  reach: string;
  engagement: string;
  platform: string;
  objective: string;
  dateCreated: string;
  thumbnail: string;
}

export const statusColors = {
  active: 'success',
  completed: 'default',
  draft: 'warning',
} as const;

// ---------- Component ----------

interface CampaignGridCardProps {
  campaign: CampaignItem;
  isSelected: boolean;
  onToggleSelection: (id: string) => void;
}

export function CampaignGridCard({
  campaign,
  isSelected,
  onToggleSelection,
}: CampaignGridCardProps) {
  return (
    <div className="relative">
      {/* Selection checkbox */}
      <div
        className="absolute top-3 left-3 z-10"
        onClick={(e) => e.preventDefault()}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelection(campaign.id)}
          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
        />
      </div>
      <Link to={`/campaign/${campaign.id}`}>
        <Card
          variant="elevated"
          padding="none"
          className="overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group"
        >
          <div className="flex h-full">
            <div className="w-32 flex-shrink-0 relative">
              <img
                src={campaign.thumbnail}
                alt={campaign.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </div>
            <div className="flex-1 p-4 flex flex-col">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3
                    className="font-semibold text-slate-900 truncate max-w-[200px]"
                    title={campaign.name}
                  >
                    {campaign.name}
                  </h3>
                  <p className="text-sm text-slate-500 line-clamp-1">
                    {campaign.product}
                  </p>
                </div>
                <Badge variant={statusColors[campaign.status]}>
                  {campaign.status}
                </Badge>
              </div>
              <div className="mt-auto flex items-center gap-4 pt-4 border-t border-slate-100">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {campaign.reach}
                  </p>
                  <p className="text-xs text-slate-500">Reach</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {campaign.engagement}
                  </p>
                  <p className="text-xs text-slate-500">Eng.</p>
                </div>
                <div className="ml-auto text-xs text-slate-400">
                  {campaign.dateCreated}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </Link>
    </div>
  );
}
