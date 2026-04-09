import { forwardRef, SelectHTMLAttributes } from 'react';
import { ChevronDownIcon } from 'lucide-react';
interface SelectOption {
  value: string;
  label: string;
}
interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-foreground mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={`
              w-full px-4 py-2.5 text-sm text-foreground appearance-none
              bg-muted border rounded-xl
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              ${error ? 'border-red-400 focus:ring-red-500' : 'border-border hover:border-foreground/30'}
              ${className}
            `}
            {...props}>
            {placeholder && <option value="" disabled>{placeholder}</option>}
            {options.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>
        {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';
