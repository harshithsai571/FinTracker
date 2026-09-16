import React from 'react';
import { ChevronLeft, ChevronRight, Calendar, ArrowUpRight, ArrowDownRight, Hash } from 'lucide-react';
import { Card } from '../common/Card';
import { formatCurrency } from '../../utils/currency';
import { getMonthName, getAdjacentMonth } from '../../utils/dates';
import { Transaction } from '../../types/transaction';

interface MonthlySummaryCardProps {
  selectedMonth: string; // YYYY-MM
  onMonthChange: (newMonth: string) => void;
  transactions: Transaction[];
}

export const MonthlySummaryCard: React.FC<MonthlySummaryCardProps> = ({
  selectedMonth,
  onMonthChange,
  transactions,
}) => {
  // Filter transactions for this month
  const monthTransactions = transactions.filter(t => t.date.startsWith(selectedMonth));

  let monthIncome = 0;
  let monthExpenses = 0;

  for (const t of monthTransactions) {
    if (t.type === 'income') {
      monthIncome += t.amount;
    } else {
      monthExpenses += t.amount;
    }
  }

  const netChange = monthIncome - monthExpenses;
  const isNetPositive = netChange >= 0;

  return (
    <Card className="p-5">
      {/* Month Navigation Header */}
      <div className="flex items-center justify-between pb-3 border-b border-surface-100 dark:border-surface-800">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          <h3 className="text-sm font-bold text-surface-900 dark:text-surface-100">
            {getMonthName(selectedMonth)}
          </h3>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onMonthChange(getAdjacentMonth(selectedMonth, -1))}
            className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-600 dark:text-surface-300 transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onMonthChange(getAdjacentMonth(selectedMonth, 1))}
            className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-600 dark:text-surface-300 transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4-Metric Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
        {/* Income */}
        <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
            <ArrowDownRight className="w-3.5 h-3.5" /> Income
          </div>
          <p className="text-sm sm:text-base font-extrabold text-emerald-800 dark:text-emerald-300">
            {formatCurrency(monthIncome)}
          </p>
        </div>

        {/* Expenses */}
        <div className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-700 dark:text-rose-400 mb-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> Expenses
          </div>
          <p className="text-sm sm:text-base font-extrabold text-rose-800 dark:text-rose-300">
            {formatCurrency(monthExpenses)}
          </p>
        </div>

        {/* Net Change */}
        <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-800/60 border border-surface-200/60 dark:border-surface-700/60">
          <div className="text-[11px] font-semibold text-surface-500 dark:text-surface-400 mb-1">
            Net Savings
          </div>
          <p
            className={`text-sm sm:text-base font-extrabold ${
              isNetPositive
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {isNetPositive ? '+' : ''}{formatCurrency(netChange)}
          </p>
        </div>

        {/* Transaction Count */}
        <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-800/60 border border-surface-200/60 dark:border-surface-700/60">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-surface-500 dark:text-surface-400 mb-1">
            <Hash className="w-3 h-3" /> Transactions
          </div>
          <p className="text-sm sm:text-base font-extrabold text-surface-900 dark:text-surface-100">
            {monthTransactions.length}
          </p>
        </div>
      </div>
    </Card>
  );
};
