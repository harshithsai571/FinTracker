import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Account, AccountType } from '../../types/account';
import { useFinance } from '../../context/FinanceContext';
import { Building2, CircleDollarSign, Smartphone, Wallet, MoreHorizontal, Check } from 'lucide-react';
import { cn } from '../../utils/cn';

interface AccountFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAccount?: Account | null;
}

const ACCOUNT_TYPES: { id: AccountType; label: string; description: string; icon: any }[] = [
  { id: 'cash', label: 'Cash in Hand', description: 'Physical cash & wallet', icon: CircleDollarSign },
  { id: 'bank', label: 'Bank Account', description: 'Savings, current, salary', icon: Building2 },
  { id: 'upi', label: 'UPI / Digital', description: 'GPay, PhonePe, UPI apps', icon: Smartphone },
  { id: 'wallet', label: 'Prepaid Wallet', description: 'Paytm Wallet, Amazon Pay', icon: Wallet },
  { id: 'other', label: 'Other', description: 'Credit line, investments, etc.', icon: MoreHorizontal },
];

const COLOR_OPTIONS = [
  '#10b981', // emerald
  '#2563eb', // blue
  '#6366f1', // indigo
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f59e0b', // amber
  '#0d9488', // teal
  '#ef4444', // red
  '#64748b', // slate
];

export const AccountFormModal: React.FC<AccountFormModalProps> = ({
  isOpen,
  onClose,
  initialAccount,
}) => {
  const { addAccount, updateAccount } = useFinance();

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('bank');
  const [openingBalanceStr, setOpeningBalanceStr] = useState('0');
  const [color, setColor] = useState('#2563eb');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError('');
      if (initialAccount) {
        setName(initialAccount.name);
        setType(initialAccount.type);
        setOpeningBalanceStr(initialAccount.openingBalance.toString());
        setColor(initialAccount.color || '#2563eb');
        setNote(initialAccount.note || '');
      } else {
        setName('');
        setType('bank');
        setOpeningBalanceStr('0');
        setColor('#2563eb');
        setNote('');
      }
    }
  }, [isOpen, initialAccount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Please enter an account name.');
      return;
    }

    const openingBalance = parseFloat(openingBalanceStr);
    if (isNaN(openingBalance) || openingBalance < 0) {
      setError('Please enter a valid non-negative opening balance.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (initialAccount) {
        await updateAccount(initialAccount.id, {
          name: trimmedName,
          type,
          openingBalance,
          color,
          note: note.trim() || undefined,
        });
      } else {
        await addAccount({
          name: trimmedName,
          type,
          openingBalance,
          color,
          note: note.trim() || undefined,
          isArchived: false,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialAccount ? 'Edit Account' : 'Add New Account'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl">
            {error}
          </div>
        )}

        {/* Account Name */}
        <div>
          <label className="text-xs font-semibold text-surface-700 dark:text-surface-300 block mb-1">
            Account Name
          </label>
          <input
            type="text"
            placeholder="e.g. Cash in Hand, HDFC Salary, Google Pay UPI"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            autoFocus
            maxLength={60}
            className="w-full h-11 px-3.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm font-semibold text-surface-900 dark:text-white placeholder:text-surface-400 focus:ring-2 focus:ring-brand-500 outline-none"
          />
        </div>

        {/* Account Type Selection */}
        <div>
          <label className="text-xs font-semibold text-surface-700 dark:text-surface-300 block mb-1.5">
            Account Type
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ACCOUNT_TYPES.map(item => {
              const Icon = item.icon;
              const isSelected = type === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setType(item.id)}
                  className={cn(
                    'flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all',
                    isSelected
                      ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-950/60 text-brand-900 dark:text-brand-100 ring-1 ring-brand-500'
                      : 'border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:border-surface-300'
                  )}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                      isSelected
                        ? 'bg-brand-500 text-white shadow-xs'
                        : 'bg-surface-100 dark:bg-surface-700 text-surface-500 dark:text-surface-400'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">{item.label}</p>
                    <p className="text-[10px] text-surface-500 dark:text-surface-400 truncate">{item.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Opening Balance */}
        <div>
          <label className="text-xs font-semibold text-surface-700 dark:text-surface-300 block mb-1">
            Opening Balance (Initial amount in account)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-2.5 text-sm font-bold text-surface-400 select-none">
              ₹
            </span>
            <input
              type="number"
              step="any"
              min="0"
              placeholder="0"
              value={openingBalanceStr}
              onChange={e => setOpeningBalanceStr(e.target.value)}
              className="w-full h-11 pl-8 pr-3.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm font-bold text-surface-900 dark:text-white placeholder:text-surface-400 focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>
          <p className="text-[10px] text-surface-400 mt-1">
            Opening balance sets the baseline. Future transactions and transfers will calculate current balance automatically.
          </p>
        </div>

        {/* Color Palette */}
        <div>
          <label className="text-xs font-semibold text-surface-700 dark:text-surface-300 block mb-1.5">
            Color Accent
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {COLOR_OPTIONS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                style={{ backgroundColor: c }}
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-white transition-transform shadow-xs',
                  color === c ? 'scale-110 ring-2 ring-offset-2 ring-surface-400' : 'hover:scale-105'
                )}
              >
                {color === c && <Check className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
        </div>

        {/* Optional Note */}
        <div>
          <label className="text-xs font-semibold text-surface-700 dark:text-surface-300 block mb-1">
            Note / Details (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Account number, purpose, or bank branch"
            value={note}
            onChange={e => setNote(e.target.value)}
            maxLength={100}
            className="w-full h-10 px-3.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-xs text-surface-900 dark:text-white placeholder:text-surface-400 focus:ring-2 focus:ring-brand-500 outline-none"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full font-bold shadow-md"
            isLoading={isSubmitting}
          >
            {initialAccount ? 'Save Changes' : 'Create Account'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
