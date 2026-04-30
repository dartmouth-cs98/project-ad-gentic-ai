import { ChevronRightIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

function toTitleCase(segment: string) {
  return segment
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function Breadcrumbs() {
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground">
      <Link to="/dashboard" className="hover:text-foreground transition-colors">
        Dashboard
      </Link>
      {segments.map((segment, idx) => {
        const isLast = idx === segments.length - 1;
        const href = `/${segments.slice(0, idx + 1).join('/')}`;

        if (idx === 0 && segment === 'dashboard') {
          return null;
        }

        return (
          <span key={href} className="flex items-center gap-1">
            <ChevronRightIcon className="w-3.5 h-3.5" />
            {isLast ? (
              <span className="text-foreground font-medium">{toTitleCase(segment)}</span>
            ) : (
              <Link to={href} className="hover:text-foreground transition-colors">
                {toTitleCase(segment)}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
