import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useFinance } from '../../context/FinanceContext';
import { MoneySource } from '../../types/otherMoney';

interface AddMoneySourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSource?: MoneySource | null;
}

const PRESET_COLORS = [
  '#3b82f6', '#10b981', '#ec4899', '#8b5cf6',
  '#f59e0b', '#06b6d4', '#6366f1', '#14b8a6',
];

export const AddMoneySourceModal: React.FC<AddMoneySourceModalProps> = ({
  isOpen,
  onClose,
  initialSource,
}) => {
  const { addMoneySource, updateMoneySource } = useFinance();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError('');
      if (initialSource) {
        setName(initialSource.name);
        setDescription(initialSource.description || '');
        setColor(initialSource.color || '#3b82f6');
      } else {
        setName('');
        setDescription('');
        setColor('#3b82f6');
      }
    }
  }, [isOpen, initialSource]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a source name (e.g. "Grandpa", "Internship").');
      return;
    }

    setIsSubmitting(true);
    try {
      if (initialSource) {
        await updateMoneySource(initialSource.id, {
          name: name.trim(),
          description: description.trim(),
          color,
        });
      } else {
        await addMoneySource({
          name: name.trim(),
          description: description.trim(),
          color,
          icon: 'Landmark',
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save source.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialSource ? 'Edit Money Source' : 'New Money Source'}
      description="Create a separate source to track external money transfers and expenses"
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl">
            {error}
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-surface-600 dark:text-surface-300 block mb-1">
            Source Name
          </label>
          <input
            type="text"
            placeholder="e.g. Dad's Money, Trust Stipend"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            autoFocus
            className="w-full h-11 px-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-xs font-semibold text-surface-800 dark:text-surface-200 placeholder:text-surface-400 focus:ring-2 focus:ring-brand-500 outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-surface-600 dark:text-surface-300 block mb-1">
            Description (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Monthly allowance for hostel and food"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full h-10 px-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-xs text-surface-800 dark:text-surface-200 placeholder:text-surface-400 focus:ring-2 focus:ring-brand-500 outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-surface-600 dark:text-surface-300 block mb-1.5">
            Color Accent
          </label>
          <div className="flex gap-2">
            {PRESET_COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full transition-transform ${
                  color === c ? 'scale-125 ring-2 ring-offset-2 ring-brand-500 shadow-sm' : 'hover:scale-110'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full font-bold shadow-md"
            isLoading={isSubmitting}
          >
            {initialSource ? 'Update Source' : 'Create Source'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
