import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { CategoryIcon } from '../common/CategoryIcon';
import { Transaction, TransactionType, PaymentMethod } from '../../types/transaction';
import { useFinance } from '../../context/FinanceContext';
import { getTodayString, getCurrentTimeString } from '../../utils/dates';
import { formatCurrency } from '../../utils/currency';
import { cn } from '../../utils/cn';

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTransaction?: Transaction | null;
}

export const TransactionFormModal: React.FC<TransactionFormModalProps> = ({
  isOpen,
  onClose,
  initialTransaction,
}) => {
  const { categories, moneySources, sourceSummaries, addTransaction, updateTransaction } = useFinance();

  const [type, setType] = useState<TransactionType>('expense');
  const [amountStr, setAmountStr] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [sourceId, setSourceId] = useState<string>(''); // empty string = Main Money
  const [date, setDate] = useState<string>(getTodayString());
  const [time, setTime] = useState<string>(getCurrentTimeString());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [description, setDescription] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Initialize or reset form
  useEffect(() => {
    if (isOpen) {
      setError('');
      if (initialTransaction) {
        setType(initialTransaction.type);
        setAmountStr(initialTransaction.amount.toString());
        setCategoryId(initialTransaction.categoryId);
        setSourceId(initialTransaction.sourceId || '');
        setDate(initialTransaction.date);
        setTime(initialTransaction.time || getCurrentTimeString());
        setPaymentMethod(initialTransaction.paymentMethod);
        setDescription(initialTransaction.description || '');
      } else {
        setType('expense');
        setAmountStr('');
        // Pick first matching category
        const firstCat = categories.find(c => c.type === 'expense' || c.type === 'both');
        setCategoryId(firstCat ? firstCat.id : '');
        setSourceId('');
        setDate(getTodayString());
        setTime(getCurrentTimeString());
        setPaymentMethod('upi');
        setDescription('');
      }
    }
  }, [isOpen, initialTransaction, categories]);

  // When type changes, auto-select a matching category if current selection is invalid
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const selectedCat = categories.find(c => c.id === categoryId);
    if (!selectedCat || (selectedCat.type !== 'both' && selectedCat.type !== newType)) {
      const match = categories.find(c => c.type === newType || c.type === 'both');
      if (match) setCategoryId(match.id);
    }
    // If switching to income, clear paidFrom source
    if (newType === 'income') {
      setSourceId('');
    }
  };

  const filteredCategories = categories.filter(
    c => c.type === 'both' || c.type === type
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amountStr);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than zero.');
      return;
    }

    if (!categoryId) {
      setError('Please select a category for this transaction.');
      return;
    }

    if (!date) {
      setError('Please specify a valid date.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (initialTransaction) {
        await updateTransaction(initialTransaction.id, {
          amount: Math.round(parsedAmount * 100) / 100,
          type,
          categoryId,
          sourceId: type === 'expense' && sourceId ? sourceId : null,
          date,
          time,
          paymentMethod,
          description: description.trim(),
        });
      } else {
        await addTransaction({
          amount: Math.round(parsedAmount * 100) / 100,
          type,
          categoryId,
          sourceId: type === 'expense' && sourceId ? sourceId : null,
          date,
          time,
          paymentMethod,
          description: description.trim(),
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save transaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Payment methods list
  const paymentMethods: { id: PaymentMethod; label: string }[] = [
    { id: 'upi', label: 'UPI' },
    { id: 'cash', label: 'Cash' },
    { id: 'card', label: 'Card' },
    { id: 'bank', label: 'Bank' },
    { id: 'other', label: 'Other' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialTransaction ? 'Edit Transaction' : 'New Transaction'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl">
            {error}
          </div>
        )}

        {/* Type Toggle: Expense / Income */}
        <div className="flex bg-surface-100 dark:bg-surface-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => handleTypeChange('expense')}
            className={cn(
              'flex-1 py-2 text-xs font-bold rounded-lg transition-all',
              type === 'expense'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-surface-600 dark:text-surface-300 hover:text-surface-900'
            )}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('income')}
            className={cn(
              'flex-1 py-2 text-xs font-bold rounded-lg transition-all',
              type === 'income'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-surface-600 dark:text-surface-300 hover:text-surface-900'
            )}
          >
            Income
          </button>
        </div>

        {/* Large Amount Input */}
        <div className="text-center py-2">
          <label className="text-xs font-semibold text-surface-500 dark:text-surface-400 block mb-1">
            Amount
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

        {/* Paid From (Optional Other Money Linking for Expenses) */}
        {type === 'expense' && moneySources.length > 0 && (
          <div>
            <label className="text-xs font-semibold text-surface-600 dark:text-surface-300 block mb-1.5">
              Paid From (Money Source)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSourceId('')}
                className={cn(
                  'p-2 text-left rounded-xl border text-xs font-semibold transition-all',
                  sourceId === ''
                    ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-950/60 text-brand-900 dark:text-brand-100 ring-1 ring-brand-500'
                    : 'border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:border-surface-300'
                )}
              >
                <p className="font-bold">Main Money</p>
                <p className="text-[10px] text-surface-500 dark:text-surface-400 font-normal">Regular funds</p>
              </button>

              {sourceSummaries.map(({ source, remaining }) => (
                <button
                  key={source.id}
                  type="button"
                  onClick={() => setSourceId(source.id)}
                  className={cn(
                    'p-2 text-left rounded-xl border text-xs font-semibold transition-all',
                    sourceId === source.id
                      ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-950/60 text-brand-900 dark:text-brand-100 ring-1 ring-brand-500'
                      : 'border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:border-surface-300'
                  )}
                >
                  <p className="font-bold truncate">{source.name}</p>
                  <p className="text-[10px] text-brand-600 dark:text-brand-400 font-semibold">
                    {formatCurrency(remaining)} left
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Category Picker Grid */}
        <div>
          <label className="text-xs font-semibold text-surface-600 dark:text-surface-300 block mb-1.5">
            Category
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-40 overflow-y-auto p-1 border border-surface-200/80 dark:border-surface-800 rounded-xl bg-surface-50/50 dark:bg-surface-900/50">
            {filteredCategories.map(cat => {
              const isSelected = categoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className={cn(
                    'flex flex-col items-center justify-center p-2 rounded-xl transition-all text-center',
                    isSelected
                      ? 'bg-white dark:bg-surface-800 shadow-sm ring-2 ring-brand-500 text-brand-700 dark:text-brand-300'
                      : 'hover:bg-white/80 dark:hover:bg-surface-800/60 text-surface-600 dark:text-surface-400'
                  )}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center mb-1 text-white shrink-0 shadow-xs"
                    style={{ backgroundColor: cat.color || '#10b981' }}
                  >
                    <CategoryIcon name={cat.icon} size={16} />
                  </div>
                  <span className="text-[10px] font-semibold truncate w-full leading-tight">
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date and Time Row */}
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

        {/* Payment Method Selector */}
        <div>
          <label className="text-xs font-semibold text-surface-600 dark:text-surface-300 block mb-1.5">
            Payment Method
          </label>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {paymentMethods.map(pm => (
              <button
                key={pm.id}
                type="button"
                onClick={() => setPaymentMethod(pm.id)}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 border transition-all',
                  paymentMethod === pm.id
                    ? 'bg-surface-900 dark:bg-white text-white dark:text-surface-900 border-transparent shadow-xs'
                    : 'bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:border-surface-300'
                )}
              >
                {pm.label}
              </button>
            ))}
          </div>
        </div>

        {/* Description / Note */}
        <div>
          <label className="text-xs font-semibold text-surface-600 dark:text-surface-300 block mb-1">
            Note (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Lunch at college canteen, Metro card recharge"
            value={description}
            onChange={e => setDescription(e.target.value)}
            maxLength={120}
            className="w-full h-10 px-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-xs text-surface-800 dark:text-surface-200 placeholder:text-surface-400 focus:ring-2 focus:ring-brand-500 outline-none"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <Button
            type="submit"
            variant={type === 'income' ? 'success' : 'primary'}
            size="lg"
            className="w-full font-bold shadow-md"
            isLoading={isSubmitting}
          >
            {initialTransaction ? 'Update Transaction' : `Save ${type === 'income' ? 'Income' : 'Expense'}`}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
