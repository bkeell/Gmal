import React from 'react';
import { cn } from '../../lib/utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  icon,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none gap-2 cursor-pointer shadow-xs';

  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 focus:ring-2 focus:ring-indigo-500/20',
    secondary: 'bg-slate-800 text-white hover:bg-slate-900 focus:ring-2 focus:ring-slate-400/20',
    outline: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 focus:ring-2 focus:ring-slate-300/20',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-200 focus:ring-2 focus:ring-rose-500/20',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200 focus:ring-2 focus:ring-emerald-500/20',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 shadow-none',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-5 py-2.5',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
};
