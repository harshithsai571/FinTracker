import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Search,
  Filter,
  ArrowUpDown,
  X,
  PlusCircle,
  Calendar,
  SlidersHorizontal,
  RotateCcw,
  Check,
  ChevronDown
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { TransactionItem } from '../components/transactions/TransactionItem';
import { groupTransactionsByDate, getTodayString } from '../utils/dates';
import { formatCurrency } from '../utils/currency';
import { Transaction, TransactionType } from '../types/transaction';
import { Button } from '../components/common/Button';
import { cn } from '../utils/cn';

interface ContextType {
  onSelectTransaction: (tx: Transaction) => void;
  onOpenAddModal: () => void;
}

type DatePreset = 'all' | 'today' | 'this_week' | 'this_month' | 'last_month' | 'custom';
type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest';

export const TransactionsPage: React.FC = () => {
  const { onSelectTransaction, onOpenAddModal } = useOutletContext<ContextType>();
  const { transactions, categories, moneySources, accounts } = useFinance();

  // Search & Filters State
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<TransactionType | 'all'>('all');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Filter drawer/panel toggle
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Mappings for efficient lookups
  const catMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);
  const sourceMap = useMemo(() => new Map(moneySources.map(s => [s.id, s])), [moneySources]);
  const accountMap = useMemo(() => new Map(accounts.map(a => [a.id, a])), [accounts]);

  // Filtering & Sorting
  const filteredTransactions = useMemo(() => {
    let result = [...transactions];

    // 1. Search Query
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(tx => {
        const catName = catMap.get(tx.categoryId || '')?.name?.toLowerCase() || '';
        const desc = (tx.description || '').toLowerCase();
        const method = (tx.paymentMethod || '').toLowerCase();
        const amt = tx.amount.toString();
        const date = tx.date;
        const accName = accountMap.get(tx.accountId || '')?.name?.toLowerCase() || '';
        const toAccName = accountMap.get(tx.toAccountId || '')?.name?.toLowerCase() || '';

        // Check splits if any
        let splitMatch = false;
        if (tx.splits && tx.splits.length > 0) {
          splitMatch = tx.splits.some(
            s =>
              (s.categoryName && s.categoryName.toLowerCase().includes(q)) ||
              (s.note && s.note.toLowerCase().includes(q))
          );
        }

        return (
          catName.includes(q) ||
          desc.includes(q) ||
          method.includes(q) ||
          amt.includes(q) ||
          date.includes(q) ||
          accName.includes(q) ||
          toAccName.includes(q) ||
          splitMatch
        );
      });
    }

    // 2. Type Filter
    if (selectedType !== 'all') {
      result = result.filter(tx => tx.type === selectedType);
    }

    // 3. Account Filter
    if (selectedAccountId !== 'all') {
      if (selectedAccountId === 'unassigned') {
        result = result.filter(tx => !tx.accountId && !tx.toAccountId);
      } else {
        result = result.filter(
          tx => tx.accountId === selectedAccountId || tx.toAccountId === selectedAccountId
        );
      }
    }

    // 4. Category Filter
    if (selectedCategoryId !== 'all') {
      result = result.filter(tx => {
        if (tx.categoryId === selectedCategoryId) return true;
        if (tx.splits && tx.splits.some(s => s.categoryId === selectedCategoryId)) return true;
        return false;
      });
    }

    // 5. Date Filter (Preset or Custom)
    if (datePreset !== 'all') {
      const today = getTodayString();
      const now = new Date();

      if (datePreset === 'today') {
        result = result.filter(tx => tx.date === today);
      } else if (datePreset === 'this_week') {
        const startOfWeek = new Date(now);
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
        startOfWeek.setDate(diff);
        const startStr = startOfWeek.toISOString().split('T')[0];
        result = result.filter(tx => tx.date >= startStr && tx.date <= today);
      } else if (datePreset === 'this_month') {
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        result = result.filter(tx => tx.date.startsWith(currentMonth));
      } else if (datePreset === 'last_month') {
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;
        result = result.filter(tx => tx.date.startsWith(lastMonth));
      } else if (datePreset === 'custom') {
        if (customStartDate) {
          result = result.filter(tx => tx.date >= customStartDate);
        }
        if (customEndDate) {
          result = result.filter(tx => tx.date <= customEndDate);
        }
      }
    }

    // 6. Amount Range Filter
    const min = parseFloat(minAmount);
    if (!isNaN(min) && min >= 0) {
      result = result.filter(tx => tx.amount >= min);
    }
    const max = parseFloat(maxAmount);
    if (!isNaN(max) && max >= 0) {
      result = result.filter(tx => tx.amount <= max);
    }

    // 7. Sorting
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        const dtA = `${a.date}T${a.time || '00:00'}`;
        const dtB = `${b.date}T${b.time || '00:00'}`;
        return dtB.localeCompare(dtA);
      }
      if (sortBy === 'oldest') {
        const dtA = `${a.date}T${a.time || '00:00'}`;
        const dtB = `${b.date}T${b.time || '00:00'}`;
        return dtA.localeCompare(dtB);
      }
      if (sortBy === 'highest') {
        return b.amount - a.amount;
      }
      if (sortBy === 'lowest') {
        return a.amount - b.amount;
      }
      return 0;
    });

    return result;
  }, [
    transactions,
    search,
    selectedType,
    selectedAccountId,
    selectedCategoryId,
    datePreset,
    customStartDate,
    customEndDate,
    minAmount,
    maxAmount,
    sortBy,
    catMap,
    accountMap,
  ]);

  // Group by date
  const groupedTransactions = useMemo(() => {
    return groupTransactionsByDate(filteredTransactions);
  }, [filteredTransactions]);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedType !== 'all') count++;
    if (selectedAccountId !== 'all') count++;
    if (selectedCategoryId !== 'all') count++;
    if (datePreset !== 'all') count++;
    if (minAmount) count++;
    if (maxAmount) count++;
    return count;
  }, [selectedType, selectedAccountId, selectedCategoryId, datePreset, minAmount, maxAmount]);

  const hasAnyFilterOrSearch = activeFilterCount > 0 || search || sortBy !== 'newest';

  const clearAllFilters = () => {
    setSearch('');
    setSelectedType('all');
    setSelectedAccountId('all');
    setSelectedCategoryId('all');
    setDatePreset('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setMinAmount('');
    setMaxAmount('');
    setSortBy('newest');
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300 pb-16">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-surface-900 dark:text-white tracking-tight">
            Transactions
          </h2>
          <p className="text-xs text-surface-500 dark:text-surface-400">
            {filteredTransactions.length}{' '}
            {filteredTransactions.length === 1 ? 'transaction' : 'transactions'} found
          </p>
        </div>
        <button
          onClick={onOpenAddModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
        >
          <span>+ Add</span>
        </button>
      </div>

      {/* Main Search and Quick Action Bar */}
      <div className="bg-white dark:bg-surface-900 p-3.5 rounded-2xl border border-surface-200/80 dark:border-surface-800 shadow-soft space-y-3">
        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-surface-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search payee, note, account, category, ₹ amount..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 bg-surface-50 dark:bg-surface-800/80 border border-surface-200 dark:border-surface-700 rounded-xl text-xs text-surface-800 dark:text-surface-200 placeholder:text-surface-400 focus:ring-2 focus:ring-brand-500 outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick Filter Row: 4 Types + Filters Toggle Button + Sort */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Type Chips */}
          <div className="flex bg-surface-100 dark:bg-surface-800 p-1 rounded-xl overflow-x-auto">
            {(['all', 'expense', 'income', 'transfer', 'refund'] as const).map(t => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs capitalize font-bold transition-all shrink-0',
                  selectedType === t
                    ? 'bg-white dark:bg-surface-700 text-surface-900 dark:text-white shadow-xs'
                    : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white'
                )}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* Advanced Filters Button */}
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all',
                activeFilterCount > 0 || showAdvancedFilters
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300'
                  : 'border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:border-surface-300'
              )}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-brand-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortOption)}
              className="h-8 px-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-xs text-surface-700 dark:text-surface-300 font-semibold outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Amount</option>
              <option value="lowest">Lowest Amount</option>
            </select>
          </div>
        </div>

        {/* Expandable Advanced Filter Panel */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-surface-200/80 dark:border-surface-800 space-y-3.5 animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Account Filter */}
              <div>
                <label className="text-[11px] font-bold text-surface-600 dark:text-surface-400 block mb-1">
                  Account
                </label>
                <select
                  value={selectedAccountId}
                  onChange={e => setSelectedAccountId(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-xs font-semibold text-surface-800 dark:text-surface-200 outline-none"
                >
                  <option value="all">All Accounts</option>
                  <option value="unassigned">Unassigned Only</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.type.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="text-[11px] font-bold text-surface-600 dark:text-surface-400 block mb-1">
                  Category
                </label>
                <select
                  value={selectedCategoryId}
                  onChange={e => setSelectedCategoryId(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-xs font-semibold text-surface-800 dark:text-surface-200 outline-none"
                >
                  <option value="all">All Categories</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Preset Filter */}
              <div>
                <label className="text-[11px] font-bold text-surface-600 dark:text-surface-400 block mb-1">
                  Date Period
                </label>
                <select
                  value={datePreset}
                  onChange={e => setDatePreset(e.target.value as DatePreset)}
                  className="w-full h-9 px-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-xs font-semibold text-surface-800 dark:text-surface-200 outline-none"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="this_week">This Week</option>
                  <option value="this_month">This Month</option>
                  <option value="last_month">Last Month</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>
            </div>

            {/* Custom Date Range (Shown when preset is 'custom') */}
            {datePreset === 'custom' && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-surface-50 dark:bg-surface-800/60 rounded-xl border border-surface-200 dark:border-surface-700">
                <div>
                  <label className="text-[11px] font-semibold text-surface-500 block mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={e => setCustomStartDate(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-xs text-surface-800 dark:text-surface-200 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-surface-500 block mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={e => setCustomEndDate(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-xs text-surface-800 dark:text-surface-200 outline-none"
                  />
                </div>
              </div>
            )}

            {/* Amount Range Filter */}
            <div>
              <label className="text-[11px] font-bold text-surface-600 dark:text-surface-400 block mb-1">
                Amount Range (₹)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="Min Amount"
                  value={minAmount}
                  onChange={e => setMinAmount(e.target.value)}
                  min="0"
                  className="w-full h-9 px-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-xs text-surface-800 dark:text-surface-200 placeholder:text-surface-400 outline-none"
                />
                <input
                  type="number"
                  placeholder="Max Amount"
                  value={maxAmount}
                  onChange={e => setMaxAmount(e.target.value)}
                  min="0"
                  className="w-full h-9 px-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-xs text-surface-800 dark:text-surface-200 placeholder:text-surface-400 outline-none"
                />
              </div>
            </div>

            {/* Clear All Filters Button */}
            {hasAnyFilterOrSearch && (
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear All Filters</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Active Filter Badges */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            {selectedType !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-100 dark:bg-surface-800 text-[11px] font-semibold text-surface-700 dark:text-surface-300">
                Type: {selectedType}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-rose-500"
                  onClick={() => setSelectedType('all')}
                />
              </span>
            )}
            {selectedAccountId !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-100 dark:bg-surface-800 text-[11px] font-semibold text-surface-700 dark:text-surface-300">
                Account: {selectedAccountId === 'unassigned' ? 'Unassigned' : accountMap.get(selectedAccountId)?.name || 'Account'}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-rose-500"
                  onClick={() => setSelectedAccountId('all')}
                />
              </span>
            )}
            {selectedCategoryId !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-100 dark:bg-surface-800 text-[11px] font-semibold text-surface-700 dark:text-surface-300">
                Category: {catMap.get(selectedCategoryId)?.name || 'Category'}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-rose-500"
                  onClick={() => setSelectedCategoryId('all')}
                />
              </span>
            )}
            {datePreset !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-100 dark:bg-surface-800 text-[11px] font-semibold text-surface-700 dark:text-surface-300">
                Date: {datePreset.replace('_', ' ')}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-rose-500"
                  onClick={() => setDatePreset('all')}
                />
              </span>
            )}
            {(minAmount || maxAmount) && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-100 dark:bg-surface-800 text-[11px] font-semibold text-surface-700 dark:text-surface-300">
                Amount: {minAmount ? `₹${minAmount}` : '₹0'} - {maxAmount ? `₹${maxAmount}` : '∞'}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-rose-500"
                  onClick={() => {
                    setMinAmount('');
                    setMaxAmount('');
                  }}
                />
              </span>
            )}
          </div>
        )}
      </div>

      {/* Transaction History List Grouped by Date */}
      {groupedTransactions.length === 0 ? (
        <div className="bg-white dark:bg-surface-900 rounded-3xl p-10 text-center border border-surface-200/80 dark:border-surface-800 shadow-soft">
          <div className="w-14 h-14 rounded-2xl bg-surface-100 dark:bg-surface-800 text-surface-400 flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-surface-900 dark:text-surface-100 mb-1">
            No transactions match your filters
          </h3>
          <p className="text-xs text-surface-500 dark:text-surface-400 max-w-sm mx-auto mb-5">
            {hasAnyFilterOrSearch
              ? 'Try adjusting or clearing your search filters to find what you need.'
              : 'Start tracking your finances by adding your first transaction.'}
          </p>
          {hasAnyFilterOrSearch ? (
            <button
              onClick={clearAllFilters}
              className="px-4 py-2 bg-surface-200 dark:bg-surface-800 hover:bg-surface-300 dark:hover:bg-surface-700 text-surface-800 dark:text-surface-200 rounded-xl text-xs font-bold transition-all"
            >
              Clear All Filters
            </button>
          ) : (
            <button
              onClick={onOpenAddModal}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              + Add Transaction
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {groupedTransactions.map(group => (
            <div key={group.date} className="space-y-2">
              {/* Date Heading with daily totals */}
              <div className="flex items-center justify-between px-2 pt-2">
                <span className="text-xs font-bold text-surface-700 dark:text-surface-300">
                  {group.displayDate}
                </span>
                <div className="flex items-center gap-2 text-[11px] font-semibold text-surface-500 dark:text-surface-400">
                  {group.totalExpense > 0 && (
                    <span className="text-rose-600 dark:text-rose-400">
                      -{formatCurrency(group.totalExpense)}
                    </span>
                  )}
                  {group.totalIncome > 0 && (
                    <span className="text-emerald-600 dark:text-emerald-400">
                      +{formatCurrency(group.totalIncome)}
                    </span>
                  )}
                </div>
              </div>

              {/* Items in this date */}
              <div className="space-y-2">
                {group.items.map(tx => (
                  <TransactionItem
                    key={tx.id}
                    transaction={tx}
                    category={catMap.get(tx.categoryId || '')}
                    source={tx.sourceId ? sourceMap.get(tx.sourceId) : undefined}
                    onClick={onSelectTransaction}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
