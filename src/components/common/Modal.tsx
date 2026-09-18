import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
  className,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-4xl',
  }[maxWidth];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-surface-950/60 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card / Bottom Sheet on mobile */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative w-full bg-white dark:bg-surface-900 rounded-t-3xl sm:rounded-2xl border-t sm:border border-surface-200 dark:border-surface-800 shadow-elevated p-6 pb-[max(1.5rem,env(safe-area-inset-bottom,1.5rem))] z-10 max-h-[92vh] flex flex-col transition-all animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200',
          maxWidthClass,
          className
        )}
      >
        {/* Mobile pull indicator */}
        <div className="w-12 h-1.5 bg-surface-300 dark:bg-surface-700 rounded-full mx-auto mb-3 sm:hidden shrink-0" />

        <div className="flex items-center justify-between pb-3 border-b border-surface-100 dark:border-surface-800 shrink-0">
          <div>
            {title && (
              <h3 className="text-lg font-bold text-surface-900 dark:text-surface-100 tracking-tight">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 mt-4 overscroll-contain pr-1">
          {children}
        </div>
      </div>
    </div>
  );
};
