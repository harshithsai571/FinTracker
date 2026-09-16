import React from 'react';
import { Sparkles, RefreshCw, X } from 'lucide-react';
import { Button } from '../common/Button';

interface UpdateNotificationPromptProps {
  needRefresh: boolean;
  onUpdate: () => void;
  onDismiss: () => void;
}

export const UpdateNotificationPrompt: React.FC<UpdateNotificationPromptProps> = ({
  needRefresh,
  onUpdate,
  onDismiss,
}) => {
  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 left-4 sm:left-auto sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-surface-900 dark:bg-surface-800 text-white p-5 rounded-2xl shadow-elevated border border-surface-700/80 flex flex-col gap-3.5 backdrop-blur-lg">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center shrink-0 border border-brand-500/30">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold leading-tight">
                New FinTracker version available
              </h4>
              <p className="text-xs text-surface-300 mt-0.5">
                We've added improvements and fixes. Your financial data is securely preserved.
              </p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="text-surface-400 hover:text-surface-200 transition-colors p-1"
            aria-label="Dismiss update alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2.5 pt-1">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1 bg-surface-800 hover:bg-surface-700 text-surface-200 border-surface-600"
            onClick={onDismiss}
          >
            Later
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="flex-1 bg-brand-500 hover:bg-brand-600 text-surface-950 font-bold"
            onClick={onUpdate}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Update now
          </Button>
        </div>
      </div>
    </div>
  );
};
