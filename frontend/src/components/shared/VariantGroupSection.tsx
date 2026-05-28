// VariantGroupSection — gen-pg-* styled persona group header, collapsible
import { useState } from 'react';

interface VariantGroupSectionProps {
  name: string;
  isGeneral?: boolean;
  approvedCount: number;
  totalCount: number;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 12 12"
      width="11"
      height="11"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transition: 'transform 0.2s', transform: open ? 'rotate(90deg)' : 'none' }}
    >
      <path d="M4 3l4 3-4 3" />
    </svg>
  );
}

export function VariantGroupSection({
  name,
  isGeneral = false,
  approvedCount,
  totalCount,
  children,
  defaultExpanded = true,
}: VariantGroupSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const allApproved = totalCount > 0 && approvedCount === totalCount;

  return (
    <section className="gen-persona-group">
      <button
        type="button"
        className="gen-pg-head"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
      >
        {/* Avatar */}
        <div className="gen-pg-avatar" style={{ opacity: isGeneral ? 0.4 : 1 }}>
          {name[0]?.toUpperCase() ?? '?'}
        </div>

        {/* Name + sub */}
        <div className="gen-pg-meta">
          <div className="gen-pg-name">
            <span className="idx">{isGeneral ? 'GENERAL' : `P.0${name.slice(0, 1)}`}</span>
            <span className="name" style={{ color: isGeneral ? 'var(--as-ink-2)' : 'var(--as-ink)' }}>{name}</span>
          </div>
        </div>

        {/* Variant count */}
        <span className="gen-pg-count">{totalCount} VARIANT{totalCount !== 1 ? 'S' : ''}</span>

        {/* Approved badge */}
        <span style={{
          fontFamily: "'Geist Mono', monospace",
          fontSize: 10,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: allApproved ? 'var(--as-accent)' : 'var(--as-ink-3)',
        }}>
          {approvedCount}/{totalCount} APPROVED
        </span>

        {/* Chevron */}
        <span style={{ color: 'var(--as-ink-3)', display: 'flex', alignItems: 'center', marginLeft: 8 }}>
          <ChevronIcon open={expanded} />
        </span>
      </button>

      {expanded && <div>{children}</div>}
    </section>
  );
}
