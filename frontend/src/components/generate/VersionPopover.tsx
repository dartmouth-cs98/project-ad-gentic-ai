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
        className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted hover:bg-muted/80 transition-colors text-xs font-semibold text-foreground"
      >
        <ClockIcon className="w-3 h-3 text-muted-foreground" />
        {activeVersion.label}
        <ChevronDownIcon className="w-3 h-3 text-muted-foreground" />
      </button>
      {showPopover && (
        <div className="absolute right-0 top-full mt-1.5 w-56 bg-card rounded-xl border border-border shadow-lg z-30 py-1.5">
          <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Version History
          </div>
          {versions.map((v) => (
            <button
              key={v.id}
              onClick={() => handleSelect(v)}
              className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-muted transition-colors ${
                activeVersion.id === v.id ? 'bg-blue-600/10' : ''
              }`}
            >
              <div>
                <span
                  className={`text-sm font-semibold ${
                    activeVersion.id === v.id ? 'text-blue-600 dark:text-blue-400' : 'text-foreground'
                  }`}
                >
                  {v.label}
                </span>
                <p className="text-[10px] text-muted-foreground">{v.timestamp}</p>
              </div>
              <span className="text-[10px] text-muted-foreground">
                {v.variantCount} variants
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
