// Inline SVG icons for the app shell (Rail + Topbar).
// Named AppIcon to avoid collision with any future lucide re-exports.

interface IconProps {
  name: IconName;
  size?: number;
}

export type IconName =
  | 'dashboard'
  | 'package'
  | 'folder'
  | 'sparkles'
  | 'database'
  | 'users'
  | 'settings'
  | 'logout'
  | 'sun'
  | 'moon'
  | 'plus'
  | 'arrow'
  | 'check'
  | 'x'
  | 'wand'
  | 'loader'
  | 'chevron-down';

export function AppIcon({ name, size = 18 }: IconProps) {
  const s = {
    width: size,
    height: size,
    viewBox: '0 0 24 24' as const,
    fill: 'none' as const,
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    display: 'block' as const,
  };

  switch (name) {
    case 'dashboard':
      return (
        <svg {...s}>
          <rect x="3" y="3" width="7" height="9" />
          <rect x="14" y="3" width="7" height="5" />
          <rect x="14" y="12" width="7" height="9" />
          <rect x="3" y="16" width="7" height="5" />
        </svg>
      );
    case 'package':
      return (
        <svg {...s}>
          <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
          <path d="M4 7.5L12 12l8-4.5" />
          <path d="M12 12v9" />
        </svg>
      );
    case 'folder':
      return (
        <svg {...s}>
          <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
        </svg>
      );
    case 'sparkles':
      return (
        <svg {...s}>
          <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z" />
          <path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14z" />
        </svg>
      );
    case 'database':
      return (
        <svg {...s}>
          <ellipse cx="12" cy="5" rx="8" ry="3" />
          <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
          <path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
        </svg>
      );
    case 'users':
      return (
        <svg {...s}>
          <circle cx="9" cy="9" r="3.2" />
          <path d="M3 19c0-3.3 2.7-6 6-6s6 2.7 6 6" />
          <circle cx="17" cy="8" r="2.4" />
          <path d="M15.5 13.4c.5-.2 1-.4 1.5-.4 2.8 0 5 2.2 5 5" />
        </svg>
      );
    case 'settings':
      return (
        <svg {...s}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.6 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.6-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9c.4 0 .8.1 1.1.4a2 2 0 010 3.2A1.7 1.7 0 0019.4 15z" />
        </svg>
      );
    case 'logout':
      return (
        <svg {...s}>
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
          <path d="M16 17l5-5-5-5" />
          <path d="M21 12H9" />
        </svg>
      );
    case 'sun':
      return (
        <svg {...s}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      );
    case 'moon':
      return (
        <svg {...s}>
          <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
        </svg>
      );
    case 'plus':
      return (
        <svg {...s}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case 'arrow':
      return (
        <svg {...s}>
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      );
    case 'check':
      return (
        <svg {...s}>
          <path d="M5 12l4 4 10-10" />
        </svg>
      );
    case 'x':
      return (
        <svg {...s}>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      );
    case 'wand':
      return (
        <svg {...s}>
          <path d="M15 3l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2zM4 20l11-11M16 8l-2-2" />
        </svg>
      );
    case 'loader':
      return (
        <svg {...s}>
          <path d="M12 2v4M12 18v4M4.9 4.9l2.9 2.9M16.2 16.2l2.9 2.9M2 12h4M18 12h4M4.9 19.1l2.9-2.9M16.2 7.8l2.9-2.9" />
        </svg>
      );
    case 'chevron-down':
      return (
        <svg {...s}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      );
    default:
      return null;
  }
}
