import { Link, useNavigate } from 'react-router-dom';
import { EditIcon, TrashIcon } from 'lucide-react';
import type { CampaignItem } from './CampaignGridCard';

const statusStyles = {
  active: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  completed: 'bg-muted text-muted-foreground',
  draft: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  paused: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
} as const;

interface CampaignTableProps {
  campaigns: CampaignItem[];
  selectedCampaigns: string[];
  onToggleSelection: (id: string) => void;
  onToggleSelectAll: () => void;
  onDeleteClick: (campaignId: string, campaignName: string) => void;
}

export function CampaignTable({ campaigns, selectedCampaigns, onToggleSelection, onToggleSelectAll, onDeleteClick }: CampaignTableProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-card border border-border rounded overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border">
          <tr>
            <th className="px-4 py-3 w-10">
              <input
                type="checkbox"
                checked={selectedCampaigns.length === campaigns.length && campaigns.length > 0}
                onChange={onToggleSelectAll}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
              />
            </th>
            <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Name</th>
            <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
            <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Product</th>
            <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Goal</th>
            <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Created</th>
            <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {campaigns.map((campaign) => (
            <tr
              key={campaign.id}
              className={`transition-colors ${selectedCampaigns.includes(campaign.id) ? 'bg-muted/50' : 'hover:bg-muted/30'}`}
            >
              <td className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedCampaigns.includes(campaign.id)}
                  onChange={() => onToggleSelection(campaign.id)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                />
              </td>
              <td className="px-4 py-3">
                <Link to={`/campaign/${campaign.id}`} className="font-medium hover:text-foreground transition-colors">
                  {campaign.name}
                </Link>
              </td>
              <td className="px-4 py-3">
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusStyles[campaign.status]}`}>
                  {campaign.status}
                </span>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{campaign.product}</td>
              <td className="px-4 py-3 text-muted-foreground max-w-[12rem] truncate" title={campaign.objective}>
                {campaign.objective}
              </td>
              <td className="px-4 py-3 text-muted-foreground">{campaign.dateCreated}</td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => navigate(`/campaign/${campaign.id}`)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs border border-border rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <EditIcon className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => onDeleteClick(campaign.id, campaign.name)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs border border-red-500/20 rounded hover:bg-red-500/10 transition-colors text-red-500"
                  >
                    <TrashIcon className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
