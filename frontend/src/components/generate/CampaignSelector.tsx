// CampaignSelector — gen-* styled dropdown for switching campaigns
import { useState, useRef, useEffect } from 'react';
import type { Campaign } from '../../types';

interface CampaignSelectorProps {
  campaigns: Campaign[];
  activeCampaignId: number | undefined;
  onSelect: (campaign: Campaign) => void;
  onCreateCampaign?: () => void;
  isLoading?: boolean;
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 5l3 3 3-3" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M6 2v8M2 6h8" />
    </svg>
  );
}

export function CampaignSelector({
  campaigns,
  activeCampaignId,
  onSelect,
  onCreateCampaign,
  isLoading,
}: CampaignSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = campaigns.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 40);
  }, [open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (c: Campaign) => {
    onSelect(c);
    setOpen(false);
    setSearch('');
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        disabled={isLoading}
        className="as-btn-ghost"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 8px',
          fontSize: 11,
          fontFamily: "'Geist Mono', monospace",
          letterSpacing: '0.06em',
        }}
      >
        <span style={{ textTransform: 'uppercase', color: 'var(--as-ink-2)' }}>
          {isLoading ? 'LOADING…' : 'SWITCH'}
        </span>
        <span style={{ color: 'var(--as-ink-3)', transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 0.15s', display: 'flex' }}>
          <ChevronIcon />
        </span>
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          right: 0,
          width: 260,
          background: 'var(--as-bg)',
          border: '1px solid var(--as-ink)',
          zIndex: 40,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        }}>
          {/* Search */}
          <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--as-rule)' }}>
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="SEARCH…"
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                outline: 'none',
                fontFamily: "'Geist Mono', monospace",
                fontSize: 11,
                letterSpacing: '0.06em',
                color: 'var(--as-ink)',
                textTransform: 'uppercase',
              }}
            />
          </div>

          {/* Campaign list */}
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{
                padding: '12px 12px',
                fontFamily: "'Geist Mono', monospace",
                fontSize: 10,
                color: 'var(--as-ink-3)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}>
                NO CAMPAIGNS FOUND
              </div>
            ) : filtered.map((c, i) => (
              <button
                key={c.id}
                onClick={() => handleSelect(c)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '10px 12px',
                  borderTop: i === 0 ? 'none' : '1px solid var(--as-rule)',
                  background: activeCampaignId === c.id ? 'var(--as-paper)' : 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                }}
              >
                <span style={{
                  fontFamily: "'Geist Mono', monospace",
                  fontSize: 9.5,
                  letterSpacing: '0.06em',
                  color: 'var(--as-ink-3)',
                  textTransform: 'uppercase',
                  flexShrink: 0,
                }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span style={{
                  fontSize: 13,
                  color: 'var(--as-ink)',
                  flex: 1,
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {c.name}
                </span>
                {activeCampaignId === c.id && (
                  <span style={{
                    fontFamily: "'Geist Mono', monospace",
                    fontSize: 9,
                    color: 'var(--as-accent)',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    flexShrink: 0,
                  }}>
                    ACTIVE
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* New campaign */}
          {onCreateCampaign && (
            <div style={{ borderTop: '1px solid var(--as-rule)' }}>
              <button
                onClick={(e) => { e.stopPropagation(); setOpen(false); onCreateCampaign(); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '10px 12px',
                  background: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                  color: 'var(--as-ink-2)',
                }}
              >
                <PlusIcon />
                <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  NEW CAMPAIGN
                </span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
