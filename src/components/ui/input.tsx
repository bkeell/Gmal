import React from 'react';
import { cn } from '../../lib/utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  prefixIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, prefixIcon, id, ...props }, ref) => {
    const inputId = id || (label ? `input-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs sm:text-sm font-semibold text-slate-700">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {prefixIcon && (
            <div className="absolute right-3 text-slate-400 pointer-events-none flex items-center">
              {prefixIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all duration-150',
              prefixIcon ? 'pr-10' : '',
              error ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500' : '',
              className
            )}
            {...props}
          />
        </div>
        {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
        {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
