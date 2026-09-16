import React from 'react';
import { Card } from '../common/Card';
import { CategoryIcon } from '../common/CategoryIcon';
import { formatCurrency } from '../../utils/currency';
import { Transaction } from '../../types/transaction';
import { Category } from '../../types/category';
import { PieChart, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SpendingOverviewProps {
  transactions: Transaction[];
  categories: Category[];
  selectedMonth?: string;
}

export const SpendingOverview: React.FC<SpendingOverviewProps> = ({
  transactions,
  categories,
  selectedMonth,
}) => {
  // Filter for expenses in this month (or all if not provided)
  const expenses = transactions.filter(t => {
    if (t.type !== 'expense') return false;
    if (selectedMonth && !t.date.startsWith(selectedMonth)) return false;
    return true;
  });

  const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);

  // Group by category
  const catTotals = new Map<string, number>();
  expenses.forEach(t => {
    catTotals.set(t.categoryId, (catTotals.get(t.categoryId) || 0) + t.amount);
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
          <PieChart className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          <h3 className="text-sm font-bold text-surface-900 dark:text-surface-100">
            Spending Overview
          </h3>
        </div>
        <Link
          to="/reports"
          className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 inline-flex items-center gap-1 transition-colors"
        >
          <span>Detailed Reports</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {sortedCategories.length === 0 ? (
        <div className="py-8 text-center text-xs text-surface-400 dark:text-surface-500">
          No expenses recorded for this period yet.
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
                    <span className="font-bold text-surface-900 dark:text-surface-100">
                      {formatCurrency(amount)}
                    </span>
                    <span className="text-[11px] font-semibold text-surface-400 w-8 text-right">
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
