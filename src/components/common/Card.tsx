import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'flat' | 'gradient' | 'glass';
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'default',
  interactive = false,
  ...props
}) => {
  const variantStyles = {
    default: 'bg-white dark:bg-surface-900 border border-surface-200/80 dark:border-surface-800 shadow-soft',
    flat: 'bg-surface-50 dark:bg-surface-800/60 border border-transparent',
    gradient: 'bg-gradient-to-br from-brand-600 via-brand-700 to-emerald-800 text-white shadow-elevated',
    glass: 'bg-white/80 dark:bg-surface-900/80 backdrop-blur-md border border-white/20 dark:border-surface-800/80 shadow-soft',
  }[variant];

  return (
    <div
      className={cn(
        'rounded-2xl p-5 transition-all duration-200',
        variantStyles,
        interactive && 'cursor-pointer hover:border-brand-500/40 hover:shadow-md active:scale-[0.99]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
