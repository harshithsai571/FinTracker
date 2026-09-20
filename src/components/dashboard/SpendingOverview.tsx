import React from 'react';
import { Card } from '../common/Card';
import { CategoryIcon } from '../common/CategoryIcon';
import { formatCurrency } from '../../utils/currency';
import { Transaction } from '../../types/transaction';
import { Category } from '../../types/category';
import { PieChart, ArrowRight, Receipt, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SpendingOverviewProps {
  transactions: Transaction[];
  categories: Category[];
  selectedMonth?: string;
  onAddExpense?: () => void;
}

export const SpendingOverview: React.FC<SpendingOverviewProps> = ({
  transactions,
  categories,
  selectedMonth,
  onAddExpense,
}) => {
  // Filter for expenses in this month (or all if not provided)
  const expenses = transactions.filter(t => {
    if (t.type !== 'expense') return false;
    if (selectedMonth && !t.date.startsWith(selectedMonth)) return false;
    return true;
  });

  const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);

  // Group by category (allocating split transactions to their respective categories)
  const catTotals = new Map<string, number>();
  expenses.forEach(t => {
    if (t.splits && t.splits.length > 0) {
      t.splits.forEach(s => {
        if (s.categoryId) {
          catTotals.set(s.categoryId, (catTotals.get(s.categoryId) || 0) + (s.amount || 0));
        }
      });
    } else if (t.categoryId) {
      catTotals.set(t.categoryId, (catTotals.get(t.categoryId) || 0) + t.amount);
    }
  });

  const sortedCategories = Array.from(catTotals.entries())
    .map(([catId, amount]) => {
      const category = categories.find(c => c.id === catId);
      const percentage = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
      return {
        category,
        amount,
        percentage,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between pb-3 border-b border-surface-100 dark:border-surface-800 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-950/70 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0 border border-brand-200/60 dark:border-brand-800/50">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-surface-900 dark:text-surface-100 leading-tight">
              Spending Overview
            </h3>
            <p className="text-[10.5px] text-surface-400 dark:text-surface-500 font-medium">
              Top spending categories
            </p>
          </div>
        </div>
        <Link
          to="/reports"
          className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 inline-flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-950/50"
        >
          <span>Reports</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {sortedCategories.length === 0 ? (
        <div className="py-7 px-4 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/70 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-2.5 border border-brand-200/50 dark:border-brand-800/50 shadow-xs">
            <Receipt className="w-6 h-6 stroke-[1.75]" />
          </div>
          <h4 className="text-sm font-bold text-surface-900 dark:text-surface-100 mb-1">
            No expenses recorded yet
          </h4>
          <p className="text-xs text-surface-500 dark:text-surface-400 max-w-xs mb-3.5">
            Log an expense for this period to see your category spending breakdown.
          </p>
          {onAddExpense && (
            <button
              onClick={onAddExpense}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white rounded-xl text-xs font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Expense</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3.5">
          {sortedCategories.slice(0, 5).map(({ category, amount, percentage }) => {
            const color = category?.color || '#059669';
            return (
              <div key={category?.id || 'unknown'} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0"
                      style={{ backgroundColor: color }}
                    >
                      <CategoryIcon name={category?.icon || 'Tag'} size={13} />
                    </div>
                    <span className="font-semibold text-surface-800 dark:text-surface-200 truncate">
                      {category?.name || 'Uncategorized'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="font-bold text-surface-900 dark:text-surface-100 tabular-nums">
                      {formatCurrency(amount)}
                    </span>
                    <span className="text-[11px] font-semibold text-surface-400 w-8 text-right tabular-nums">
                      {percentage}%
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 w-full bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
