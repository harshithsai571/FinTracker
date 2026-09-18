import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { CategoryIcon } from '../common/CategoryIcon';
import { Transaction, TransactionType, PaymentMethod, SplitItem } from '../../types/transaction';
import { useFinance } from '../../context/FinanceContext';
import { getTodayString, getCurrentTimeString } from '../../utils/dates';
import { formatCurrency } from '../../utils/currency';
import { cn } from '../../utils/cn';
import { ArrowRightLeft, Split, Plus, Trash2, RotateCcw, Wallet, Building2, Smartphone, CircleDollarSign } from 'lucide-react';

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
  const {
    categories,
    moneySources,
    sourceSummaries,
    activeAccounts,
    transactions,
    addTransaction,
    updateTransaction,
  } = useFinance();

  const [type, setType] = useState<TransactionType>('expense');
  const [amountStr, setAmountStr] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');
  const [sourceId, setSourceId] = useState<string>(''); // empty string = Main Money
  const [date, setDate] = useState<string>(getTodayString());
  const [time, setTime] = useState<string>(getCurrentTimeString());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [description, setDescription] = useState<string>('');
  const [linkedTransactionId, setLinkedTransactionId] = useState<string>('');

  // Split transaction state
  const [isSplit, setIsSplit] = useState<boolean>(false);
  const [splits, setSplits] = useState<SplitItem[]>([]);

  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Initialize or reset form
  useEffect(() => {
    if (isOpen) {
      setError('');
      if (initialTransaction) {
        setType(initialTransaction.type);
        setAmountStr(initialTransaction.amount.toString());
        setCategoryId(initialTransaction.categoryId || '');
        setAccountId(initialTransaction.accountId || '');
        setToAccountId(initialTransaction.toAccountId || '');
        setSourceId(initialTransaction.sourceId || '');
        setDate(initialTransaction.date);
        setTime(initialTransaction.time || getCurrentTimeString());
        setPaymentMethod(initialTransaction.paymentMethod || 'upi');
        setDescription(initialTransaction.description || '');
        setLinkedTransactionId(initialTransaction.linkedTransactionId || '');

        if (initialTransaction.splits && initialTransaction.splits.length > 0) {
          setIsSplit(true);
          setSplits(initialTransaction.splits);
        } else {
          setIsSplit(false);
          setSplits([]);
        }
      } else {
        setType('expense');
        setAmountStr('');
        const firstCat = categories.find(c => c.type === 'expense' || c.type === 'both');
        setCategoryId(firstCat ? firstCat.id : '');
        // Default to first active account if available
        setAccountId(activeAccounts.length > 0 ? activeAccounts[0].id : '');
        setToAccountId(activeAccounts.length > 1 ? activeAccounts[1].id : '');
        setSourceId('');
        setDate(getTodayString());
        setTime(getCurrentTimeString());
        setPaymentMethod('upi');
        setDescription('');
        setLinkedTransactionId('');
        setIsSplit(false);
        setSplits([]);
      }
    }
  }, [isOpen, initialTransaction, categories, activeAccounts]);

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setError('');

    if (newType !== 'expense') {
      setIsSplit(false);
    }

    if (newType === 'income' || newType === 'expense' || newType === 'refund') {
      const selectedCat = categories.find(c => c.id === categoryId);
      const targetCatType = newType === 'refund' ? 'expense' : newType;
      if (!selectedCat || (selectedCat.type !== 'both' && selectedCat.type !== targetCatType)) {
        const match = categories.find(c => c.type === targetCatType || c.type === 'both');
        if (match) setCategoryId(match.id);
      }
    }

    if (newType !== 'expense') {
      setSourceId('');
    }
  };

  const filteredCategories = categories.filter(c => {
    if (type === 'income') return c.type === 'income' || c.type === 'both';
    if (type === 'refund') return c.type === 'expense' || c.type === 'both';
    return c.type === 'expense' || c.type === 'both';
  });

  // Split management helpers
  const handleToggleSplit = () => {
    if (!isSplit) {
      const parsedAmount = parseFloat(amountStr) || 0;
      const firstCat = categories.find(c => c.type === 'expense' || c.type === 'both');
      const catId = categoryId || (firstCat ? firstCat.id : '');
      const catName = categories.find(c => c.id === catId)?.name || 'General';

      setIsSplit(true);
      setSplits([
        {
          categoryId: catId,
          categoryName: catName,
          amount: parsedAmount > 0 ? parsedAmount : 0,
        },
      ]);
    } else {
      setIsSplit(false);
      setSplits([]);
    }
  };

  const handleAddSplit = () => {
    const firstCat = categories.find(c => c.type === 'expense' || c.type === 'both');
    const total = parseFloat(amountStr) || 0;
    const currentAllocated = splits.reduce((s, item) => s + (item.amount || 0), 0);
    const remaining = Math.max(0, Math.round((total - currentAllocated) * 100) / 100);

    setSplits([
      ...splits,
      {
        categoryId: firstCat ? firstCat.id : '',
        categoryName: firstCat ? firstCat.name : '',
        amount: remaining,
      },
    ]);
  };

  const handleUpdateSplit = (index: number, field: keyof SplitItem, value: any) => {
    setSplits(prev => {
      const updated = [...prev];
      if (field === 'categoryId') {
        const cat = categories.find(c => c.id === value);
        updated[index] = {
          ...updated[index],
          categoryId: value,
          categoryName: cat?.name || '',
        };
      } else if (field === 'amount') {
        updated[index] = {
          ...updated[index],
          amount: parseFloat(value) || 0,
        };
      } else {
        updated[index] = {
          ...updated[index],
          [field]: value,
        };
      }
      return updated;
    });
  };

  const handleRemoveSplit = (index: number) => {
    setSplits(prev => prev.filter((_, i) => i !== index));
  };

  // Split total calculations
  const totalAmount = parseFloat(amountStr) || 0;
  const splitTotal = splits.reduce((sum, s) => sum + (s.amount || 0), 0);
  const splitRemaining = Math.round((totalAmount - splitTotal) * 100) / 100;

  // Recent expenses for linking refunds
  const recentExpenses = transactions
    .filter(t => t.type === 'expense')
    .slice(0, 10);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amountStr);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than zero.');
      return;
    }

    if (!date) {
      setError('Please specify a valid date.');
      return;
    }

    // Type-specific validations
    if (type === 'transfer') {
      if (!accountId || !toAccountId) {
        setError('Please select both "From Account" and "To Account".');
        return;
      }
      if (accountId === toAccountId) {
        setError('From and To accounts cannot be the same.');
        return;
      }
    } else {
      // Non-transfer validations
      if (isSplit && type === 'expense') {
        if (splits.length < 2) {
          setError('A split transaction must have at least 2 split category allocations.');
          return;
        }
        for (let i = 0; i < splits.length; i++) {
          if (!splits[i].categoryId) {
            setError(`Please select a category for split #${i + 1}.`);
            return;
          }
          if (splits[i].amount <= 0) {
            setError(`Split #${i + 1} must have an amount greater than 0.`);
            return;
          }
        }
        if (Math.abs(splitTotal - parsedAmount) > 0.01) {
          setError(`Split amounts sum (${formatCurrency(splitTotal)}) must match total expense (${formatCurrency(parsedAmount)}). Remaining: ${formatCurrency(splitRemaining)}`);
          return;
        }
      } else {
        if (!categoryId) {
          setError('Please select a category for this transaction.');
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        amount: Math.round(parsedAmount * 100) / 100,
        type,
        date,
        time,
        paymentMethod,
        description: description.trim(),
        accountId: accountId || undefined,
      };

      if (type === 'transfer') {
        payload.accountId = accountId;
        payload.toAccountId = toAccountId;
        payload.categoryId = undefined;
        payload.splits = undefined;
        payload.sourceId = undefined;
      } else {
        payload.categoryId = isSplit && splits.length > 0 ? splits[0].categoryId : categoryId;
        payload.splits = isSplit && type === 'expense' ? splits : undefined;
        payload.sourceId = type === 'expense' && sourceId ? sourceId : undefined;
        if (type === 'refund') {
          payload.linkedTransactionId = linkedTransactionId || undefined;
        }
      }

      if (initialTransaction) {
        await updateTransaction(initialTransaction.id, payload);
      } else {
        await addTransaction(payload);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save transaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const paymentMethods: { id: PaymentMethod; label: string }[] = [
    { id: 'upi', label: 'UPI' },
    { id: 'cash', label: 'Cash' },
    { id: 'card', label: 'Card' },
    { id: 'bank', label: 'Bank' },
    { id: 'other', label: 'Other' },
  ];

  const getAccountTypeIcon = (accType: string) => {
    switch (accType) {
      case 'cash': return <CircleDollarSign className="w-3.5 h-3.5" />;
      case 'bank': return <Building2 className="w-3.5 h-3.5" />;
      case 'upi': return <Smartphone className="w-3.5 h-3.5" />;
      default: return <Wallet className="w-3.5 h-3.5" />;
    }
  };

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

        {/* 4-Way Type Selector: Expense / Income / Transfer / Refund */}
        <div className="grid grid-cols-4 gap-1 bg-surface-100 dark:bg-surface-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => handleTypeChange('expense')}
            className={cn(
              'py-2 text-[11px] sm:text-xs font-bold rounded-lg transition-all text-center',
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
              'py-2 text-[11px] sm:text-xs font-bold rounded-lg transition-all text-center',
              type === 'income'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-surface-600 dark:text-surface-300 hover:text-surface-900'
            )}
          >
            Income
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('transfer')}
            className={cn(
              'py-2 text-[11px] sm:text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1',
              type === 'transfer'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-surface-600 dark:text-surface-300 hover:text-surface-900'
            )}
          >
            <ArrowRightLeft className="w-3 h-3" />
            <span>Transfer</span>
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('refund')}
            className={cn(
              'py-2 text-[11px] sm:text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1',
              type === 'refund'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-surface-600 dark:text-surface-300 hover:text-surface-900'
            )}
          >
            <RotateCcw className="w-3 h-3" />
            <span>Refund</span>
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

        {/* Transfer Account Selectors */}
        {type === 'transfer' ? (
          <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-900 dark:text-blue-200 mb-1">
              <ArrowRightLeft className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Inter-Account Transfer (Does not affect Net Worth)</span>
            </div>

            {activeAccounts.length === 0 ? (
              <p className="text-xs text-rose-600 dark:text-rose-400">
                No active accounts found. Please add accounts in the Accounts section first to make transfers.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-surface-600 dark:text-surface-300 block mb-1">
                    From Account (Withdrawal)
                  </label>
                  <select
                    value={accountId}
                    onChange={e => setAccountId(e.target.value)}
                    required
                    className="w-full h-10 px-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-xs font-semibold text-surface-800 dark:text-surface-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select source account</option>
                    {activeAccounts.map(acc => (
                      <option key={acc.id} value={acc.id} disabled={acc.id === toAccountId}>
                        {acc.name} ({acc.type.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-surface-600 dark:text-surface-300 block mb-1">
                    To Account (Deposit)
                  </label>
                  <select
                    value={toAccountId}
                    onChange={e => setToAccountId(e.target.value)}
                    required
                    className="w-full h-10 px-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-xs font-semibold text-surface-800 dark:text-surface-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select destination account</option>
                    {activeAccounts.map(acc => (
                      <option key={acc.id} value={acc.id} disabled={acc.id === accountId}>
                        {acc.name} ({acc.type.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Account Selector for Expense, Income, Refund */
          <div>
            <label className="text-xs font-semibold text-surface-600 dark:text-surface-300 block mb-1.5">
              {type === 'income'
                ? 'Deposit To Account'
                : type === 'refund'
                ? 'Received Into Account'
                : 'Paid From Account'}
            </label>
            {activeAccounts.length > 0 ? (
              <div className="flex gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setAccountId('')}
                  className={cn(
                    'px-3 py-2 rounded-xl text-xs font-semibold shrink-0 border transition-all flex items-center gap-1.5',
                    accountId === ''
                      ? 'border-brand-500 bg-brand-50/80 dark:bg-brand-950/60 text-brand-900 dark:text-brand-100 ring-1 ring-brand-500'
                      : 'border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:border-surface-300'
                  )}
                >
                  <Wallet className="w-3.5 h-3.5 text-surface-400" />
                  <span>Unassigned</span>
                </button>
                {activeAccounts.map(acc => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => setAccountId(acc.id)}
                    className={cn(
                      'px-3 py-2 rounded-xl text-xs font-semibold shrink-0 border transition-all flex items-center gap-1.5',
                      accountId === acc.id
                        ? 'border-brand-500 bg-brand-50/80 dark:bg-brand-950/60 text-brand-900 dark:text-brand-100 ring-1 ring-brand-500'
                        : 'border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:border-surface-300'
                    )}
                  >
                    <span style={{ color: acc.color }}>{getAccountTypeIcon(acc.type)}</span>
                    <span className="truncate max-w-[120px]">{acc.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-surface-400 italic">
                No accounts created yet. This transaction will be recorded as Unassigned.
              </p>
            )}
          </div>
        )}

        {/* Refund Linked Expense Selector */}
        {type === 'refund' && recentExpenses.length > 0 && (
          <div className="p-3 bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/60 dark:border-teal-900/40 rounded-2xl">
            <label className="text-[11px] font-semibold text-teal-900 dark:text-teal-200 block mb-1">
              Link to Original Expense (Optional)
            </label>
            <select
              value={linkedTransactionId}
              onChange={e => setLinkedTransactionId(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-xs text-surface-800 dark:text-surface-200 outline-none"
            >
              <option value="">None (Independent refund)</option>
              {recentExpenses.map(tx => (
                <option key={tx.id} value={tx.id}>
                  {tx.date} — {tx.description || categories.find(c => c.id === tx.categoryId)?.name || 'Expense'} ({formatCurrency(tx.amount)})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Paid From (Optional Other Money Linking for Expenses) */}
        {type === 'expense' && moneySources.length > 0 && (
          <div>
            <label className="text-xs font-semibold text-surface-600 dark:text-surface-300 block mb-1.5">
              Paid From External Money Source (Optional)
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
                <p className="font-bold">None (Personal)</p>
                <p className="text-[10px] text-surface-500 dark:text-surface-400 font-normal">Own money</p>
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

        {/* Split Transaction Toggle for Expense */}
        {type === 'expense' && (
          <div className="flex items-center justify-between p-2.5 bg-surface-50 dark:bg-surface-800/60 rounded-xl border border-surface-200/70 dark:border-surface-700/60">
            <div className="flex items-center gap-2">
              <Split className="w-4 h-4 text-brand-500" />
              <div>
                <span className="text-xs font-bold text-surface-800 dark:text-surface-200 block">
                  Split into Multiple Categories
                </span>
                <span className="text-[10px] text-surface-400">
                  Allocate this bill among multiple spending categories
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleSplit}
              className={cn(
                'px-3 py-1 text-xs font-bold rounded-lg border transition-all',
                isSplit
                  ? 'bg-brand-600 text-white border-transparent shadow-xs'
                  : 'bg-white dark:bg-surface-700 text-surface-600 dark:text-surface-300 border-surface-300 dark:border-surface-600'
              )}
            >
              {isSplit ? 'Enabled' : 'Enable'}
            </button>
          </div>
        )}

        {/* Split Transaction Allocation Section */}
        {type === 'expense' && isSplit && (
          <div className="p-3.5 bg-surface-50 dark:bg-surface-800/40 border border-brand-200 dark:border-brand-900/60 rounded-2xl space-y-3">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-surface-700 dark:text-surface-300">Category Splits</span>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-surface-500">Allocated: {formatCurrency(splitTotal)}</span>
                <span className={cn(
                  'font-bold',
                  Math.abs(splitRemaining) < 0.01 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                )}>
                  {Math.abs(splitRemaining) < 0.01 ? 'Balanced' : `Remaining: ${formatCurrency(splitRemaining)}`}
                </span>
              </div>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {splits.map((split, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-white dark:bg-surface-800 p-2 rounded-xl border border-surface-200 dark:border-surface-700">
                  <select
                    value={split.categoryId}
                    onChange={e => handleUpdateSplit(idx, 'categoryId', e.target.value)}
                    className="flex-1 h-8 px-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-transparent text-xs font-semibold text-surface-800 dark:text-surface-200 outline-none"
                  >
                    <option value="">Category</option>
                    {filteredCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>

                  <div className="relative w-24">
                    <span className="absolute left-2 top-1.5 text-xs text-surface-400">₹</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="0"
                      value={split.amount || ''}
                      onChange={e => handleUpdateSplit(idx, 'amount', e.target.value)}
                      className="w-full h-8 pl-5 pr-1 text-xs font-bold rounded-lg border border-surface-200 dark:border-surface-700 bg-transparent text-surface-800 dark:text-surface-200 outline-none"
                    />
                  </div>

                  <input
                    type="text"
                    placeholder="Note (opt)"
                    value={split.note || ''}
                    onChange={e => handleUpdateSplit(idx, 'note', e.target.value)}
                    className="w-24 h-8 px-2 text-[11px] rounded-lg border border-surface-200 dark:border-surface-700 bg-transparent text-surface-800 dark:text-surface-200 outline-none"
                  />

                  {splits.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSplit(idx)}
                      className="p-1.5 text-surface-400 hover:text-rose-500 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={handleAddSplit}
              className="w-full text-xs"
            >
              Add Split Allocation
            </Button>
          </div>
        )}

        {/* Category Picker Grid (Shown for non-split, non-transfer transactions) */}
        {type !== 'transfer' && !isSplit && (
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
        )}

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

        {/* Payment Method Selector (For non-transfer) */}
        {type !== 'transfer' && (
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
        )}

        {/* Description / Note */}
        <div>
          <label className="text-xs font-semibold text-surface-600 dark:text-surface-300 block mb-1">
            Note (Optional)
          </label>
          <input
            type="text"
            placeholder={
              type === 'transfer'
                ? 'e.g. ATM withdrawal, Bank transfer'
                : type === 'refund'
                ? 'e.g. Amazon item returned'
                : 'e.g. Lunch with friends, Groceries'
            }
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
            variant={
              type === 'income' ? 'success' : type === 'transfer' ? 'primary' : type === 'refund' ? 'secondary' : 'danger'
            }
            size="lg"
            className={cn(
              'w-full font-bold shadow-md',
              type === 'transfer' && 'bg-blue-600 hover:bg-blue-700 text-white',
              type === 'refund' && 'bg-teal-600 hover:bg-teal-700 text-white'
            )}
            isLoading={isSubmitting}
          >
            {initialTransaction
              ? 'Update Transaction'
              : type === 'transfer'
              ? 'Confirm Transfer'
              : type === 'refund'
              ? 'Save Refund'
              : type === 'income'
              ? 'Save Income'
              : 'Save Expense'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
