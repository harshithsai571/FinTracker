import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = true,
  isLoading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm">
      <div className="flex flex-col items-center text-center pt-2">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
          isDestructive ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400' : 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
        }`}>
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-surface-900 dark:text-surface-100 mb-2">
          {title}
        </h3>
        <p className="text-sm text-surface-500 dark:text-surface-400 mb-6 leading-relaxed">
          {message}
        </p>

        <div className="flex items-center gap-3 w-full">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={isDestructive ? 'danger' : 'primary'}
            className="flex-1"
            onClick={() => {
              onConfirm();
            }}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
