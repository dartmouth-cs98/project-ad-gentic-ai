export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    borderRadius: {
      'none':  '0px',
      'sm':    '0.125rem',  // 2px
      DEFAULT: '0.25rem',   // 4px
      'md':    '0.25rem',   // 4px
      'lg':    '0.375rem',  // 6px  (buttons, inputs)
      'xl':    '0.375rem',  // 6px  (cards — down from 12px)
      '2xl':   '0.5rem',    // 8px  (chat bubbles, modals)
      '3xl':   '0.75rem',   // 12px (large modals)
      'full':  '9999px',
    },
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        border: 'var(--border)',
        ring: 'var(--ring)',
      },
    },
  },
}
