import { useState, useRef, useEffect } from 'react';
import {
  FolderIcon,
  ChevronDownIcon,
  SearchIcon,
  XIcon,
  PlusIcon,
} from 'lucide-react';
import type { Campaign } from '../../types';

interface CampaignSelectorProps {
  campaigns: Campaign[];
  activeCampaignId: number | undefined;
  onSelect: (campaign: Campaign) => void;
  isLoading?: boolean;
}

export function CampaignSelector({
  campaigns,
  activeCampaignId,
  onSelect,
  isLoading,
}: CampaignSelectorProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const activeCampaign = campaigns.find((c) => c.id === activeCampaignId);

  const filteredCampaigns = campaigns.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    if (showDropdown) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [showDropdown]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-campaign-dropdown]')) {
        setShowDropdown(false);
        setSearch('');
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const handleSelect = (campaign: Campaign) => {
    onSelect(campaign);
    setShowDropdown(false);
    setSearch('');
  };

  return (
    <div className="max-w-[280px]">
      <div className="relative" data-campaign-dropdown>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowDropdown(!showDropdown);
          }}
          disabled={isLoading}
          className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors text-left"
        >
          <div className="flex items-center gap-2 min-w-0">
            <FolderIcon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="text-xs font-medium text-slate-700 truncate">
              {isLoading ? 'Loading...' : activeCampaign?.name ?? 'Select a campaign'}
            </span>
          </div>
          <ChevronDownIcon
            className={`w-3.5 h-3.5 text-slate-400 flex-shrink-0 transition-transform ${
              showDropdown ? 'rotate-180' : ''
            }`}
          />
        </button>

        {showDropdown && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl border border-slate-200 shadow-xl z-30 py-1.5 overflow-hidden">
            {/* Search */}
            <div className="px-2.5 pb-1.5 pt-0.5">
              <div className="relative">
                <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search campaigns..."
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  onClick={(e) => e.stopPropagation()}
                />
                {search && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearch('');
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-slate-200 transition-colors"
                  >
                    <XIcon className="w-3 h-3 text-slate-400" />
                  </button>
                )}
              </div>
            </div>
            <div className="border-t border-slate-100" />
            <div className="max-h-48 overflow-y-auto">
              {filteredCampaigns.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-slate-400">
                  No campaigns found
                </div>
              ) : (
                filteredCampaigns.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelect(c)}
                    className={`w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors ${
                      activeCampaignId === c.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <p
                      className={`text-sm font-medium truncate ${
                        activeCampaignId === c.id ? 'text-blue-700' : 'text-slate-900'
                      }`}
                    >
                      {c.name}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {c.status} · {c.created_at}
                    </p>
                  </button>
                ))
              )}
            </div>
            <div className="border-t border-slate-100 mt-0.5 pt-0.5">
              <button className="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors flex items-center gap-2 text-blue-600">
                <PlusIcon className="w-3.5 h-3.5" />
                <span className="text-sm font-medium">New Campaign</span>
              </button>
            </div>
          </div>
        )}
      </div>
      <p className="text-[10px] text-slate-400 mt-1 ml-0.5">
        Chat is tied to this campaign
      </p>
    </div>
  );
}
