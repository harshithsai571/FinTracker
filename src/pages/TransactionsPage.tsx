import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Search, Filter, ArrowUpDown, X, PlusCircle, Calendar } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { TransactionItem } from '../components/transactions/TransactionItem';
import { groupTransactionsByDate } from '../utils/dates';
import { formatCurrency } from '../utils/currency';
import { Transaction, TransactionType } from '../types/transaction';

interface ContextType {
  onSelectTransaction: (tx: Transaction) => void;
  onOpenAddModal: () => void;
}

export const TransactionsPage: React.FC = () => {
  const { onSelectTransaction, onOpenAddModal } = useOutletContext<ContextType>();
  const { transactions, categories, moneySources } = useFinance();

  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<TransactionType | 'all'>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [selectedSourceId, setSelectedSourceId] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  const [dateFilter, setDateFilter] = useState<'all' | 'this_month' | 'last_month'>('all');

  const catMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);
  const sourceMap = useMemo(() => new Map(moneySources.map(s => [s.id, s])), [moneySources]);

  // Filtering & Sorting
  const filteredTransactions = useMemo(() => {
    let result = [...transactions];

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(tx => {
        const catName = catMap.get(tx.categoryId)?.name?.toLowerCase() || '';
        const desc = (tx.description || '').toLowerCase();
        const method = (tx.paymentMethod || '').toLowerCase();
        const amt = tx.amount.toString();
        return catName.includes(q) || desc.includes(q) || method.includes(q) || amt.includes(q);
      });
    }

    // Type filter
    if (selectedType !== 'all') {
      result = result.filter(tx => tx.type === selectedType);
    }

    // Category filter
    if (selectedCategoryId !== 'all') {
      result = result.filter(tx => tx.categoryId === selectedCategoryId);
    }

    // Source filter
    if (selectedSourceId !== 'all') {
      if (selectedSourceId === 'main') {
        result = result.filter(tx => !tx.sourceId);
      } else {
        result = result.filter(tx => tx.sourceId === selectedSourceId);
      }
    }

    // Date range filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

      if (dateFilter === 'this_month') {
        result = result.filter(tx => tx.date.startsWith(currentMonth));
      } else if (dateFilter === 'last_month') {
        result = result.filter(tx => tx.date.startsWith(lastMonth));
      }
    }

    // Sorting
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
  }, [transactions, search, selectedType, selectedCategoryId, selectedSourceId, sortBy, dateFilter, catMap]);

  // Group by date for natural reading
  const groupedTransactions = useMemo(() => {
    return groupTransactionsByDate(filteredTransactions);
  }, [filteredTransactions]);

  const hasActiveFilters =
    search ||
    selectedType !== 'all' ||
    selectedCategoryId !== 'all' ||
    selectedSourceId !== 'all' ||
    dateFilter !== 'all' ||
    sortBy !== 'newest';

  const clearFilters = () => {
    setSearch('');
    setSelectedType('all');
    setSelectedCategoryId('all');
    setSelectedSourceId('all');
    setDateFilter('all');
    setSortBy('newest');
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-surface-900 dark:text-white tracking-tight">
            Transactions
          </h2>
          <p className="text-xs text-surface-500 dark:text-surface-400">
            {filteredTransactions.length} {filteredTransactions.length === 1 ? 'transaction' : 'transactions'} found
          </p>
        </div>
        <button
          onClick={onOpenAddModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
        >
          <span>+ Add</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white dark:bg-surface-900 p-3.5 rounded-2xl border border-surface-200/80 dark:border-surface-800 shadow-soft space-y-3">
        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-surface-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search note, category, payment method, amount..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-surface-50 dark:bg-surface-800/80 border border-surface-200 dark:border-surface-700 rounded-xl text-xs text-surface-800 dark:text-surface-200 placeholder:text-surface-400 focus:ring-2 focus:ring-brand-500 outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Pills Row */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {/* Type Toggle Chips */}
          <div className="flex bg-surface-100 dark:bg-surface-800 p-0.5 rounded-lg shrink-0">
            {(['all', 'expense', 'income'] as const).map(t => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`px-2.5 py-1 rounded-md capitalize font-semibold transition-all ${
                  selectedType === t
                    ? 'bg-white dark:bg-surface-700 text-surface-900 dark:text-white shadow-xs'
                    : 'text-surface-500 hover:text-surface-800 dark:text-surface-400'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategoryId}
            onChange={e => setSelectedCategoryId(e.target.value)}
            className="h-8 px-2.5 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-xs text-surface-700 dark:text-surface-300 font-medium outline-none shrink-0"
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Source Dropdown */}
          {moneySources.length > 0 && (
            <select
              value={selectedSourceId}
              onChange={e => setSelectedSourceId(e.target.value)}
              className="h-8 px-2.5 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-xs text-surface-700 dark:text-surface-300 font-medium outline-none shrink-0"
            >
              <option value="all">All Sources</option>
              <option value="main">Main Money Only</option>
              {moneySources.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value as any)}
            className="h-8 px-2.5 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-xs text-surface-700 dark:text-surface-300 font-medium outline-none shrink-0"
          >
            <option value="all">All Time</option>
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
          </select>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="h-8 px-2.5 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-xs text-surface-700 dark:text-surface-300 font-medium outline-none shrink-0"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Amount</option>
            <option value="lowest">Lowest Amount</option>
          </select>

          {/* Reset Filters button */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-rose-600 dark:text-rose-400 hover:underline shrink-0 font-medium px-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Transaction History List Grouped by Date */}
      {groupedTransactions.length === 0 ? (
        <div className="bg-white dark:bg-surface-900 rounded-2xl p-10 text-center border border-surface-200/80 dark:border-surface-800 shadow-soft">
          <div className="w-12 h-12 rounded-2xl bg-surface-100 dark:bg-surface-800 text-surface-400 flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-surface-900 dark:text-surface-100 mb-1">
            No transactions found
          </h3>
          <p className="text-xs text-surface-500 dark:text-surface-400 max-w-sm mx-auto mb-5">
            {hasActiveFilters
              ? 'Try changing or resetting your search filters to find transactions.'
              : 'Start your personal finance journey by adding your first transaction.'}
          </p>
          {hasActiveFilters ? (
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-surface-200 dark:bg-surface-800 hover:bg-surface-300 dark:hover:bg-surface-700 rounded-xl text-xs font-semibold"
            >
              Clear All Filters
            </button>
          ) : (
            <button
              onClick={onOpenAddModal}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm"
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
                    category={catMap.get(tx.categoryId)}
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
