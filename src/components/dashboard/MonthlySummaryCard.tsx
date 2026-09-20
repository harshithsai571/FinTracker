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
  let monthRefunds = 0;

  for (const t of monthTransactions) {
    if (t.type === 'income') {
      monthIncome += t.amount;
    } else if (t.type === 'expense') {
      monthExpenses += t.amount;
    } else if (t.type === 'refund') {
      monthRefunds += t.amount;
    }
    // Note: transfers are inter-account and do not affect monthly income or expense
  }

  const netChange = monthIncome + monthRefunds - monthExpenses;
  const isNetPositive = netChange >= 0;

  return (
    <Card className="p-5">
      {/* Month Navigation Header */}
      <div className="flex items-center justify-between pb-3 border-b border-surface-100 dark:border-surface-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-950/70 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0 border border-brand-200/60 dark:border-brand-800/50">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-surface-900 dark:text-surface-100 tracking-tight leading-none">
              {getMonthName(selectedMonth)}
            </h3>
            <p className="text-[10.5px] font-medium text-surface-400 dark:text-surface-500 mt-0.5">
              Monthly Financial Summary
            </p>
          </div>
        </div>

        {/* Comfortable 40px+ Touch Target Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onMonthChange(getAdjacentMonth(selectedMonth, -1))}
            className="w-10 h-10 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 active:scale-95 text-surface-600 dark:text-surface-300 flex items-center justify-center transition-all border border-surface-200/60 dark:border-surface-700/60 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            aria-label="Previous month"
            title="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onMonthChange(getAdjacentMonth(selectedMonth, 1))}
            className="w-10 h-10 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 active:scale-95 text-surface-600 dark:text-surface-300 flex items-center justify-center transition-all border border-surface-200/60 dark:border-surface-700/60 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            aria-label="Next month"
            title="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4-Metric Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5 pt-4">
        {/* Income */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50">
          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 mb-1">
            <ArrowDownRight className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Income</span>
          </div>
          <p className="text-sm sm:text-base font-black text-emerald-800 dark:text-emerald-300 tabular-nums truncate">
            {formatCurrency(monthIncome)}
          </p>
        </div>

        {/* Expenses */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50">
          <div className="flex items-center gap-1 text-[11px] font-bold text-rose-700 dark:text-rose-400 mb-1">
            <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Expenses</span>
          </div>
          <p className="text-sm sm:text-base font-black text-rose-800 dark:text-rose-300 tabular-nums truncate">
            {formatCurrency(monthExpenses)}
          </p>
        </div>

        {/* Net Change */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-surface-50 dark:bg-surface-800/60 border border-surface-200/60 dark:border-surface-700/60">
          <div className="text-[11px] font-bold text-surface-500 dark:text-surface-400 mb-1 truncate">
            Net Savings
          </div>
          <p
            className={`text-sm sm:text-base font-black tabular-nums truncate ${
              isNetPositive
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {isNetPositive ? '+' : ''}{formatCurrency(netChange)}
          </p>
        </div>

        {/* Transaction Count */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-surface-50 dark:bg-surface-800/60 border border-surface-200/60 dark:border-surface-700/60">
          <div className="flex items-center gap-1 text-[11px] font-bold text-surface-500 dark:text-surface-400 mb-1">
            <Hash className="w-3 h-3 shrink-0" />
            <span className="truncate">Tx Count</span>
          </div>
          <p className="text-sm sm:text-base font-black text-surface-900 dark:text-surface-100 tabular-nums">
            {monthTransactions.length}
          </p>
        </div>
      </div>
    </Card>
  );
};
