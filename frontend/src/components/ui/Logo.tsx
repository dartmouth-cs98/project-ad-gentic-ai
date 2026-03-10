interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const sizes = {
    sm: { icon: 24, text: 'text-sm' },
    md: { icon: 30, text: 'text-base' },
    lg: { icon: 36, text: 'text-lg' },
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
        <rect x="14" y="8" width="18" height="24" rx="3" fill="currentColor" opacity="0.2" />
        <rect x="11" y="10" width="18" height="24" rx="3" fill="currentColor" opacity="0.5" />
        <rect x="8" y="12" width="18" height="24" rx="3" fill="currentColor" />
        <path d="M17 19L14 28H16L16.5 26.5H19.5L20 28H22L19 19H17Z M17.2 24.5L18 22L18.8 24.5H17.2Z" className="fill-white dark:fill-black" />
      </svg>

      {showText && (
        <span className={`font-semibold tracking-tight ${textSize}`}>
          Ad-gentic
        </span>
      )}
    </div>
  );
}
