import { useState, useEffect } from 'react';
import { ClockIcon, ChevronDownIcon } from 'lucide-react';
import type { Version } from './types';

interface VersionPopoverProps {
  activeVersion: Version;
  versions: Version[];
  onSelect: (version: Version) => void;
}

export function VersionPopover({ activeVersion, versions, onSelect }: VersionPopoverProps) {
  const [showPopover, setShowPopover] = useState(false);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-version-popover]')) {
        setShowPopover(false);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const handleSelect = (version: Version) => {
    onSelect(version);
    setShowPopover(false);
  };

  return (
    <div className="relative" data-version-popover>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowPopover(!showPopover);
        }}
        className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 transition-colors text-xs font-semibold text-slate-700"
      >
        <ClockIcon className="w-3 h-3 text-slate-400" />
        {activeVersion.label}
        <ChevronDownIcon className="w-3 h-3 text-slate-400" />
      </button>
      {showPopover && (
        <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-xl border border-slate-200 shadow-xl z-30 py-1.5">
          <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Version History
          </div>
          {versions.map((v) => (
            <button
              key={v.id}
              onClick={() => handleSelect(v)}
              className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors ${
                activeVersion.id === v.id ? 'bg-blue-50' : ''
              }`}
            >
              <div>
                <span
                  className={`text-sm font-semibold ${
                    activeVersion.id === v.id ? 'text-blue-700' : 'text-slate-900'
                  }`}
                >
                  {v.label}
                </span>
                <p className="text-[10px] text-slate-400">{v.timestamp}</p>
              </div>
              <span className="text-[10px] text-slate-400">
                {v.variantCount} variants
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
