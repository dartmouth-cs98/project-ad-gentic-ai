interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const sizes = {
    sm: { icon: 24, text: 'text-base' },
    md: { icon: 30, text: 'text-lg' },
    lg: { icon: 36, text: 'text-xl' },
  };

  const iconSize = sizes[size].icon;
  const textSize = sizes[size].text;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#818CF8" />
          </linearGradient>
        </defs>
        <rect x="14" y="8" width="18" height="24" rx="3" fill="url(#logoGradient)" opacity="0.2" />
        <rect x="11" y="10" width="18" height="24" rx="3" fill="url(#logoGradient)" opacity="0.5" />
        <rect x="8" y="12" width="18" height="24" rx="3" fill="url(#logoGradient)" />
        <path d="M17 19L14 28H16L16.5 26.5H19.5L20 28H22L19 19H17Z M17.2 24.5L18 22L18.8 24.5H17.2Z" fill="white" />
      </svg>

      {showText && (
        <span
          className={`font-serif italic font-bold tracking-tight ${textSize}`}
          style={{
            background: 'linear-gradient(135deg, #F59E0B 0%, #818CF8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            padding: '0 3px',
            margin: '0 -3px',
          }}
        >
          Ad-gentic
        </span>
      )}
    </div>
  );
}
