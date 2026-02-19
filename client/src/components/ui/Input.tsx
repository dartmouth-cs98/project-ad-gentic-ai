import React, { useState, forwardRef } from 'react';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, type, className = '', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    return (
      <div className="w-full">
        {label &&
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {label}
          </label>
        }
        <div className="relative">
          <input
            ref={ref}
            type={isPassword && showPassword ? 'text' : type}
            className={`
              w-full px-4 py-2.5 text-sm
              bg-white border rounded-xl
              transition-all duration-200
              placeholder:text-slate-400
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              ${error ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 hover:border-slate-300'}
              ${isPassword ? 'pr-10' : ''}
              ${className}
            `}
            {...props} />

          {isPassword &&
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            tabIndex={-1}>

              {showPassword ?
            <EyeOffIcon className="w-4 h-4" /> :

            <EyeIcon className="w-4 h-4" />
            }
            </button>
          }
        </div>
        {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
        {hint && !error &&
        <p className="mt-1.5 text-sm text-slate-500">{hint}</p>
        }
      </div>);

  }
);
Input.displayName = 'Input';