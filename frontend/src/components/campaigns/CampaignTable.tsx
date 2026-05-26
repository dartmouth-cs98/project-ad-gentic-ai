// CampaignTable — cmp-table styled with gen-* aesthetic
import { Link, useNavigate } from 'react-router-dom';
import type { CampaignItem } from './CampaignGridCard';

interface CampaignTableProps {
  campaigns: CampaignItem[];
  selectedCampaigns: string[];
  onToggleSelection: (id: string) => void;
  onToggleSelectAll: () => void;
  onDeleteClick: (campaignId: string, campaignName: string) => void;
}

export function CampaignTable({ campaigns, selectedCampaigns, onToggleSelection, onToggleSelectAll, onDeleteClick }: CampaignTableProps) {
  const navigate = useNavigate();
  const allSelected = selectedCampaigns.length === campaigns.length && campaigns.length > 0;

  return (
    <div className="cmp-table-wrap">
      <table className="cmp-table">
        <thead>
          <tr>
            <th style={{ width: 40, padding: '9px 14px' }}>
              <input
                type="checkbox"
                className="cmp-check"
                checked={allSelected}
                onChange={onToggleSelectAll}
              />
            </th>
            <th>Name</th>
            <th>Status</th>
            <th>Product</th>
            <th>Goal</th>
            <th>Created</th>
            <th className="r">Actions</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((c) => {
            const selected = selectedCampaigns.includes(c.id);
            return (
              <tr key={c.id} className={selected ? 'selected' : ''}>
                <td style={{ padding: '11px 14px' }}>
                  <input
                    type="checkbox"
                    className="cmp-check"
                    checked={selected}
                    onChange={() => onToggleSelection(c.id)}
                  />
                </td>
                <td className="name">
                  <Link to={`/campaign/${c.id}`}>{c.name}</Link>
                </td>
                <td>
                  <span className={`cmp-status ${c.status}`}>
                    <span className="d" />
                    {c.status}
                  </span>
                </td>
                <td>{c.product}</td>
                <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.objective}
                </td>
                <td>{c.dateCreated}</td>
                <td className="r">
                  <div className="cmp-row-actions">
                    <button className="cmp-row-btn" onClick={() => navigate(`/campaign/${c.id}`)}>
                      Edit
                    </button>
                    <button className="cmp-row-btn danger" onClick={() => onDeleteClick(c.id, c.name)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
