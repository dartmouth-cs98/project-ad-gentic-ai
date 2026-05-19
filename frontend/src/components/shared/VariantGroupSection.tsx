import { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon, UsersIcon } from 'lucide-react';

interface VariantGroupSectionProps {
  /** Persona name (real groups) or "General" (catch-all bucket). */
  name: string;
  /** Renders the catch-all bucket with muted styling. */
  isGeneral?: boolean;
  /** Approved count for the badge — pass to display "X of N approved". */
  approvedCount: number;
  /** Total variants in this group. */
  totalCount: number;
  /** Variant cards / grid for this group. */
  children: React.ReactNode;
  /** Whether the section starts expanded. Default: true. */
  defaultExpanded?: boolean;
}

/**
 * Collapsible section header used to group ad variants by persona. Stays
 * expanded by default so users see content without clicking; the chevron
 * lets them collapse a group to focus on others.
 *
 * Visual-only — selection model stays global at the parent level.
 */
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
    <section className="space-y-3">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg hover:bg-muted/60 transition-colors"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2 min-w-0">
          {expanded ? (
            <ChevronDownIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          ) : (
            <ChevronRightIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          )}
          <UsersIcon
            className={`w-4 h-4 flex-shrink-0 ${
              isGeneral ? 'text-muted-foreground' : 'text-blue-600'
            }`}
          />
          <h3
            className={`text-sm font-semibold truncate ${
              isGeneral ? 'text-muted-foreground' : 'text-foreground'
            }`}
          >
            {name}
          </h3>
          <span className="text-xs text-muted-foreground flex-shrink-0">
            · {totalCount} variant{totalCount === 1 ? '' : 's'}
          </span>
        </div>

        <span
          className={`text-xs font-medium flex-shrink-0 px-2 py-0.5 rounded-full ${
            allApproved
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          {approvedCount} of {totalCount} approved
        </span>
      </button>

      {expanded && <div>{children}</div>}
    </section>
  );
}
