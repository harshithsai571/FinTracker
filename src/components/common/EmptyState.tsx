import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl border border-dashed border-surface-300 dark:border-surface-700/80 bg-white/40 dark:bg-surface-900/40 my-4 ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-surface-500 dark:text-surface-400 mb-4 shadow-inner">
        {icon}
      </div>
      <h4 className="text-base font-bold text-surface-900 dark:text-surface-100 mb-1.5">
        {title}
      </h4>
      <p className="text-xs sm:text-sm text-surface-500 dark:text-surface-400 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
