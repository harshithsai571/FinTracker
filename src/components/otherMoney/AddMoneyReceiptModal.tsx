import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useFinance } from '../../context/FinanceContext';
import { MoneyReceipt } from '../../types/otherMoney';
import { getTodayString, getCurrentTimeString } from '../../utils/dates';

interface AddMoneyReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSourceId?: string;
  initialReceipt?: MoneyReceipt | null;
}

export const AddMoneyReceiptModal: React.FC<AddMoneyReceiptModalProps> = ({
  isOpen,
  onClose,
  defaultSourceId,
  initialReceipt,
}) => {
  const { moneySources, addMoneyReceipt, updateMoneyReceipt } = useFinance();

  const [sourceId, setSourceId] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [date, setDate] = useState(getTodayString());
  const [time, setTime] = useState(getCurrentTimeString());
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError('');
      if (initialReceipt) {
        setSourceId(initialReceipt.sourceId);
        setAmountStr(initialReceipt.amount.toString());
        setDate(initialReceipt.date);
        setTime(initialReceipt.time || getCurrentTimeString());
        setNote(initialReceipt.note || '');
      } else {
        setSourceId(defaultSourceId || (moneySources[0]?.id || ''));
        setAmountStr('');
        setDate(getTodayString());
        setTime(getCurrentTimeString());
        setNote('');
      }
    }
  }, [isOpen, defaultSourceId, initialReceipt, moneySources]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amountStr);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than zero.');
      return;
    }

    if (!sourceId) {
      setError('Please select a money source.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (initialReceipt) {
        await updateMoneyReceipt(initialReceipt.id, {
          sourceId,
          amount: Math.round(parsedAmount * 100) / 100,
          date,
          time,
          note: note.trim(),
        });
      } else {
        await addMoneyReceipt({
          sourceId,
          amount: Math.round(parsedAmount * 100) / 100,
          date,
          time,
          note: note.trim(),
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save received money.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialReceipt ? 'Edit Received Money' : 'Record Received Money'}
      description="Add funds received from family, scholarships, or external sources"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl">
            {error}
          </div>
        )}

        {/* Source Selector */}
        <div>
          <label className="text-xs font-semibold text-surface-600 dark:text-surface-300 block mb-1">
            Money Source
          </label>
          <select
            value={sourceId}
            onChange={e => setSourceId(e.target.value)}
            required
            className="w-full h-11 px-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-xs font-semibold text-surface-800 dark:text-surface-200 focus:ring-2 focus:ring-brand-500 outline-none"
          >
            {moneySources.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Amount Input */}
        <div className="text-center py-2">
          <label className="text-xs font-semibold text-surface-500 dark:text-surface-400 block mb-1">
            Amount Received
          </label>
          <div className="relative inline-flex items-center justify-center">
            <span className="text-3xl sm:text-4xl font-black text-surface-400 dark:text-surface-500 mr-1.5 select-none">
              ₹
            </span>
            <input
              type="number"
              step="any"
              min="0"
              placeholder="0"
              value={amountStr}
              onChange={e => setAmountStr(e.target.value)}
              autoFocus
              required
              className="text-3xl sm:text-4xl font-extrabold text-surface-900 dark:text-white bg-transparent outline-none w-48 sm:w-56 text-center placeholder:text-surface-300 dark:placeholder:text-surface-700 border-b-2 border-surface-200 dark:border-surface-700 focus:border-brand-500 transition-colors pb-1"
            />
          </div>
        </div>

        {/* Date and Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-surface-600 dark:text-surface-300 block mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
              className="w-full h-10 px-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-xs font-semibold text-surface-800 dark:text-surface-200 focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-surface-600 dark:text-surface-300 block mb-1">
              Time
            </label>
            <input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-xs font-semibold text-surface-800 dark:text-surface-200 focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="text-xs font-semibold text-surface-600 dark:text-surface-300 block mb-1">
            Note (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Monthly money, Exam fee support, Birthday gift"
            value={note}
            onChange={e => setNote(e.target.value)}
            className="w-full h-10 px-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-xs text-surface-800 dark:text-surface-200 placeholder:text-surface-400 focus:ring-2 focus:ring-brand-500 outline-none"
          />
        </div>

        {/* Submit button */}
        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full font-bold shadow-md bg-emerald-600 hover:bg-emerald-700"
            isLoading={isSubmitting}
          >
            {initialReceipt ? 'Update Received Money' : 'Save Received Money'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
