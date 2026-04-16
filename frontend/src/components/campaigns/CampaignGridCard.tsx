import { Link } from 'react-router-dom';
import type { CampaignListItem } from '../../lib/campaignsList';

export type CampaignItem = CampaignListItem;

const statusStyles = {
  active: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  completed: 'bg-muted text-muted-foreground',
  draft: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  paused: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
} as const;

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

export function CampaignGridCard({ campaign, isSelected, onToggleSelection }: CampaignGridCardProps) {
  return (
    <div className="relative">
      <div className="absolute top-3 left-3 z-10" onClick={(e) => e.preventDefault()}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelection(campaign.id)}
          className="w-4 h-4 rounded border-border text-blue-600 focus:ring-blue-500 cursor-pointer"
        />
      </div>
      <Link to={`/campaign/${campaign.id}`}>
        <div className={`bg-card border rounded-xl overflow-hidden hover:border-foreground/20 transition-colors cursor-pointer group ${isSelected ? 'border-blue-600/40' : 'border-border'}`}>
          <div className="flex h-full">
            <div className="w-28 flex-shrink-0 bg-muted relative">
              {campaign.thumbnail ? (
                <img src={campaign.thumbnail} alt={campaign.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1 p-4 flex flex-col min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <h3 className="font-medium text-foreground truncate" title={campaign.name}>
                    {campaign.name}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{campaign.product}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${statusStyles[campaign.status]}`}>
                  {campaign.status}
                </span>
              </div>
              <div className="mt-auto flex items-center gap-4 pt-3 border-t border-border">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate" title={campaign.objective}>
                    {campaign.objective}
                  </p>
                  <p className="text-xs text-muted-foreground">Goal</p>
                </div>
                <div className="flex-shrink-0 text-xs text-muted-foreground">{campaign.dateCreated}</div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
