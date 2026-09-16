import React from 'react';
import { cn } from '../../utils/cn';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'brand' | 'success' | 'danger' | 'warning' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'sm',
  className,
}) => {
  const sizeStyles = {
    sm: 'text-[11px] font-semibold px-2 py-0.5 rounded-md',
    md: 'text-xs font-semibold px-2.5 py-1 rounded-lg',
  }[size];

  const variantStyles = {
    brand: 'bg-brand-50 text-brand-700 dark:bg-brand-950/80 dark:text-brand-300 border border-brand-200/60 dark:border-brand-800/50',
    success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50',
    danger: 'bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/50',
    warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/50',
    info: 'bg-sky-50 text-sky-700 dark:bg-sky-950/80 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/50',
    neutral: 'bg-surface-100 text-surface-700 dark:bg-surface-800 dark:text-surface-300 border border-surface-200 dark:border-surface-700',
  }[variant];

  return (
    <span className={cn('inline-flex items-center gap-1 leading-none', sizeStyles, variantStyles, className)}>
      {children}
    </span>
  );
};
