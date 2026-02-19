import React, { forwardRef } from 'react';
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label &&
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {label}
          </label>
        }
        <textarea
          ref={ref}
          className={`
            w-full px-4 py-3 text-sm
            bg-white border rounded-xl
            transition-all duration-200
            placeholder:text-slate-400
            resize-none
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            ${error ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 hover:border-slate-300'}
            ${className}
          `}
          {...props} />

        {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
        {hint && !error &&
        <p className="mt-1.5 text-sm text-slate-500">{hint}</p>
        }
      </div>);

  }
);
Textarea.displayName = 'Textarea';