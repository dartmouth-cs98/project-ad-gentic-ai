import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { EditIcon, TrashIcon } from 'lucide-react';
import type { CampaignItem } from './CampaignGridCard';
import { statusColors } from './CampaignGridCard';

interface CampaignTableProps {
  campaigns: CampaignItem[];
  selectedCampaigns: string[];
  onToggleSelection: (id: string) => void;
  onToggleSelectAll: () => void;
  onDeleteClick: (campaignId: string, campaignName: string) => void;
}

export function CampaignTable({
  campaigns,
  selectedCampaigns,
  onToggleSelection,
  onToggleSelectAll,
  onDeleteClick,
}: CampaignTableProps) {
  const navigate = useNavigate();

  return (
    <Card variant="elevated" padding="none" className="overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-4 py-3 w-10">
              <input
                type="checkbox"
                checked={
                  selectedCampaigns.length === campaigns.length &&
                  campaigns.length > 0
                }
                onChange={onToggleSelectAll}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </th>
            <th className="px-4 py-3 font-semibold text-slate-900">Name</th>
            <th className="px-4 py-3 font-semibold text-slate-900">Status</th>
            <th className="px-4 py-3 font-semibold text-slate-900">Product</th>
            <th className="px-4 py-3 font-semibold text-slate-900">Reach</th>
            <th className="px-4 py-3 font-semibold text-slate-900">Engagement</th>
            <th className="px-4 py-3 font-semibold text-slate-900">Date Created</th>
            <th className="px-4 py-3 font-semibold text-slate-900 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {campaigns.map((campaign) => (
            <tr
              key={campaign.id}
              className={`hover:bg-slate-50 transition-colors ${
                selectedCampaigns.includes(campaign.id) ? 'bg-blue-50/50' : ''
              }`}
            >
              <td className="px-4 py-4">
                <input
                  type="checkbox"
                  checked={selectedCampaigns.includes(campaign.id)}
                  onChange={() => onToggleSelection(campaign.id)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </td>
              <td className="px-4 py-4">
                <Link
                  to={`/campaign/${campaign.id}`}
                  className="font-medium text-slate-900 hover:text-blue-600"
                >
                  {campaign.name}
                </Link>
              </td>
              <td className="px-4 py-4">
                <Badge variant={statusColors[campaign.status]}>
                  {campaign.status}
                </Badge>
              </td>
              <td className="px-4 py-4 text-slate-600">{campaign.product}</td>
              <td className="px-4 py-4 font-medium text-slate-900">{campaign.reach}</td>
              <td className="px-4 py-4 font-medium text-slate-900">{campaign.engagement}</td>
              <td className="px-4 py-4 text-slate-500">{campaign.dateCreated}</td>
              <td className="px-4 py-4 text-right">
                <div className="flex items-center justify-end gap-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-9 px-3"
                    onClick={() => navigate(`/campaign/${campaign.id}`)}
                    leftIcon={<EditIcon className="w-3.5 h-3.5" />}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 px-3 text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => onDeleteClick(campaign.id, campaign.name)}
                    leftIcon={<TrashIcon className="w-3.5 h-3.5" />}
                  >
                    Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
