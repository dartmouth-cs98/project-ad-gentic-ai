import React, { forwardRef } from 'react';
interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}
const variantStyles = {
  default: 'bg-white border border-slate-200',
  glass: 'bg-white/[0.08] backdrop-blur-xl border border-white/[0.12]',
  elevated: 'bg-white shadow-xl shadow-slate-200/50'
};
const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8'
};
export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
  { variant = 'default', padding = 'md', className = '', children, ...props },
  ref) =>
  {
    return (
      <div
        ref={ref}
        className={`
          rounded-2xl
          ${variantStyles[variant]}
          ${paddingStyles[padding]}
          ${className}
        `}
        {...props}>

        {children}
      </div>);

  }
);
Card.displayName = 'Card';