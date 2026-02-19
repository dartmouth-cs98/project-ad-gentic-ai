import React, { forwardRef } from 'react';
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}
const variantStyles: Record<ButtonVariant, string> = {
  primary:
  'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 shadow-lg shadow-blue-500/25',
  secondary:
  'bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 active:bg-slate-100 shadow-sm',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 active:bg-slate-200',
  danger:
  'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 shadow-lg shadow-red-500/25'
};
const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl'
};
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
  {
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    className = '',
    disabled,
    children,
    ...props
  },
  ref) =>
  {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`
          inline-flex items-center justify-center gap-2 font-medium
          transition-all duration-200 ease-out
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `}
        {...props}>

        {isLoading ?
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4" />

            <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />

          </svg> :

        leftIcon
        }
        {children}
        {!isLoading && rightIcon}
      </button>);

  }
);
Button.displayName = 'Button';