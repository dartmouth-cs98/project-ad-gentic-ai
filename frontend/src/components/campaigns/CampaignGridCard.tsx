import { Link } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

// ---------- Types ----------

export interface CampaignItem {
  id: string;
  name: string;
  product: string;
  status: 'active' | 'completed' | 'draft' | 'paused';
  reach: string;
  engagement: string;
  platform: string;
  objective: string;
  dateCreated: string;
  thumbnail?: string;
}

export const statusColors = {
  active: 'success',
  completed: 'default',
  draft: 'warning',
  paused: 'info',
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
            <div className="w-32 flex-shrink-0 relative bg-slate-100">
              {campaign.thumbnail ? (
                <img
                  src={campaign.thumbnail}
                  alt={campaign.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
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
