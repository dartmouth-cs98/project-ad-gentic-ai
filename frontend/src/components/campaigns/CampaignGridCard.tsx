// CampaignGridCard — cmp-card horizontal card with thumbnail + meta
import { Link } from 'react-router-dom';
import type { CampaignListItem } from '../../lib/campaignsList';

export type CampaignItem = CampaignListItem & { thumbnail?: string };

// Kept for CampaignDetailPage Badge variant mapping
export const statusColors = {
  active: 'success',
  completed: 'default',
  draft: 'warning',
  paused: 'info',
} as const;

function CheckIcon() {
  return (
    <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={9} height={9}>
      <path d="M1.5 5l2.5 2.5L8.5 2" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" width={22} height={22}>
      <rect x="2" y="2" width="16" height="16" />
      <path d="M2 13l4-4 3 3 3-3 6 5" />
      <circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

interface CampaignGridCardProps {
  campaign: CampaignItem;
  isSelected: boolean;
  onToggleSelection: (id: string) => void;
}

export function CampaignGridCard({ campaign, isSelected, onToggleSelection }: CampaignGridCardProps) {
  return (
    <div className={`cmp-card${isSelected ? ' selected' : ''}`}>
      {/* Selection checkbox overlay */}
      <span
        className="cmp-card-check"
        onClick={(e) => { e.preventDefault(); onToggleSelection(campaign.id); }}
        role="checkbox"
        aria-checked={isSelected}
        tabIndex={0}
        onKeyDown={(e) => e.key === ' ' && onToggleSelection(campaign.id)}
      >
        {isSelected && <CheckIcon />}
      </span>

      {/* Thumbnail */}
      <div className="cmp-card-thumb">
        <div className="cmp-card-stripes" />
        {campaign.thumbnail ? (
          <img src={campaign.thumbnail} alt={campaign.name} />
        ) : (
          <div className="cmp-card-thumb-empty">
            <ImageIcon />
          </div>
        )}
      </div>

      {/* Content — wrapped in Link for navigation */}
      <Link to={`/campaign/${campaign.id}`} className="cmp-card-body" style={{ textDecoration: 'none' }}>
        <div className="cmp-card-top">
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="cmp-card-name">{campaign.name}</div>
            <div className="cmp-card-product">{campaign.product}</div>
          </div>
          <span className={`cmp-status ${campaign.status}`}>
            <span className="d" />
            {campaign.status}
          </span>
        </div>

        <div className="cmp-card-foot">
          <span className="cmp-card-goal">{campaign.objective}</span>
          <span className="cmp-card-date">{campaign.dateCreated}</span>
        </div>
      </Link>
    </div>
  );
}
