import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Card } from '../components/common/Card';
import { CategoryIcon } from '../components/common/CategoryIcon';
import { formatCurrency, formatCompact } from '../utils/currency';
import {
  PieChart,
  TrendingUp,
  TrendingDown,
  Calendar,
  Zap,
  Award,
  BarChart3,
  Percent
} from 'lucide-react';

type ReportPeriod = 'this_month' | 'last_month' | 'last_3_months' | 'this_year' | 'all_time';

export const ReportsPage: React.FC = () => {
  const { transactions, categories } = useFinance();
  const [period, setPeriod] = useState<ReportPeriod>('this_month');

  // Filter transactions according to selected period
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthNum = now.getMonth() + 1;
    const currentMonthStr = `${currentYear}-${String(currentMonthNum).padStart(2, '0')}`;

    if (period === 'this_month') {
      return transactions.filter(t => t.date.startsWith(currentMonthStr));
    }

    if (period === 'last_month') {
      const prevDate = new Date(currentYear, now.getMonth() - 1, 1);
      const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
      return transactions.filter(t => t.date.startsWith(prevMonthStr));
    }

    if (period === 'last_3_months') {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      const limitStr = threeMonthsAgo.toISOString().split('T')[0];
      return transactions.filter(t => t.date >= limitStr);
    }

    if (period === 'this_year') {
      return transactions.filter(t => t.date.startsWith(`${currentYear}-`));
    }

    // all_time
    return transactions;
  }, [transactions, period]);

  // Aggregate Metrics
  const {
    totalIncome,
    totalExpense,
    netChange,
    savingsRate,
    highestCategory,
    avgDailySpend,
    categoryBreakdown,
    monthlyTrends,
  } = useMemo(() => {
    let income = 0;
    let expense = 0;
    const catMap = new Map<string, number>();
    const dateSet = new Set<string>();

    for (const t of filteredTransactions) {
      dateSet.add(t.date);
      if (t.type === 'income') {
        income += t.amount;
      } else {
        expense += t.amount;
        catMap.set(t.categoryId, (catMap.get(t.categoryId) || 0) + t.amount);
      }
    }

    const net = income - expense;
    const rate = income > 0 ? Math.round(((income - expense) / income) * 100) : 0;
    const daysCount = Math.max(dateSet.size, 1);
    const avgDaily = expense / daysCount;

    // Highest category
    let highestCatObj = null;
    let maxCatAmount = 0;
    for (const [catId, amt] of catMap.entries()) {
      if (amt > maxCatAmount) {
        maxCatAmount = amt;
        const found = categories.find(c => c.id === catId);
        if (found) {
          highestCatObj = { category: found, amount: amt };
        }
      }
    }

    // Category breakdown sorted
    const breakdown = Array.from(catMap.entries())
      .map(([catId, amt]) => {
        const cat = categories.find(c => c.id === catId);
        const percent = expense > 0 ? Math.round((amt / expense) * 100) : 0;
        return {
          category: cat,
          amount: amt,
          percentage: percent,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    // Monthly Trends for the last 6 months
    const monthMap = new Map<string, { month: string; income: number; expense: number }>();
    transactions.forEach(t => {
      const monthKey = t.date.substring(0, 7); // YYYY-MM
      let m = monthMap.get(monthKey);
      if (!m) {
        m = { month: monthKey, income: 0, expense: 0 };
        monthMap.set(monthKey, m);
      }
      if (t.type === 'income') {
        m.income += t.amount;
      } else {
        m.expense += t.amount;
      }
    });

    const sortedMonths = Array.from(monthMap.values())
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6);

    return {
      totalIncome: income,
      totalExpense: expense,
      netChange: net,
      savingsRate: rate,
      highestCategory: highestCatObj,
      avgDailySpend: avgDaily,
      categoryBreakdown: breakdown,
      monthlyTrends: sortedMonths,
    };
  }, [filteredTransactions, transactions, categories]);

  // Find max value in monthly trend for scaling chart
  const maxTrendVal = useMemo(() => {
    let max = 1000;
    monthlyTrends.forEach(m => {
      if (m.income > max) max = m.income;
      if (m.expense > max) max = m.expense;
    });
    return max;
  }, [monthlyTrends]);

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Header with Period Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-surface-900 dark:text-white tracking-tight">
            Reports & Insights
          </h2>
          <p className="text-xs text-surface-500 dark:text-surface-400">
            Actionable financial breakdown & trend analysis
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex bg-surface-100 dark:bg-surface-800 p-1 rounded-xl overflow-x-auto text-xs font-semibold shrink-0">
          {[
            { id: 'this_month', label: 'This Month' },
            { id: 'last_month', label: 'Last Month' },
            { id: 'last_3_months', label: '3 Months' },
            { id: 'this_year', label: 'This Year' },
            { id: 'all_time', label: 'All Time' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setPeriod(tab.id as ReportPeriod)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                period === tab.id
                  ? 'bg-white dark:bg-surface-700 text-surface-900 dark:text-white shadow-xs font-bold'
                  : 'text-surface-500 hover:text-surface-800 dark:text-surface-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Key Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Income */}
        <Card className="p-4 bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/40">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1">
            <TrendingUp className="w-3.5 h-3.5" /> Total Income
          </div>
          <p className="text-base sm:text-lg font-extrabold text-emerald-800 dark:text-emerald-300">
            {formatCurrency(totalIncome)}
          </p>
        </Card>

        {/* Expense */}
        <Card className="p-4 bg-rose-50/50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/40">
          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-400 mb-1">
            <TrendingDown className="w-3.5 h-3.5" /> Total Expenses
          </div>
          <p className="text-base sm:text-lg font-extrabold text-rose-800 dark:text-rose-300">
            {formatCurrency(totalExpense)}
          </p>
        </Card>

        {/* Net Savings */}
        <Card className="p-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-surface-500 dark:text-surface-400 mb-1">
            <Percent className="w-3.5 h-3.5" /> Savings Rate
          </div>
          <p className={`text-base sm:text-lg font-extrabold ${savingsRate >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {savingsRate}%
          </p>
          <span className="text-[10px] text-surface-400">
            {formatCurrency(netChange)} net
          </span>
        </Card>

        {/* Highest Category */}
        <Card className="p-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-surface-500 dark:text-surface-400 mb-1">
            <Award className="w-3.5 h-3.5" /> Top Spending
          </div>
          <p className="text-base sm:text-lg font-extrabold text-surface-900 dark:text-white truncate">
            {highestCategory ? highestCategory.category.name : '—'}
          </p>
          <span className="text-[10px] text-surface-400">
            {highestCategory ? formatCurrency(highestCategory.amount) : 'No expenses'}
          </span>
        </Card>
      </div>

      {/* Monthly Trend Chart */}
      {monthlyTrends.length > 0 && (
        <Card className="p-5">
          <div className="flex items-center justify-between pb-3 border-b border-surface-100 dark:border-surface-800 mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <h3 className="text-sm font-bold text-surface-900 dark:text-surface-100">
                Monthly Income vs Expenses Trend
              </h3>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Income
              </span>
              <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Expense
              </span>
            </div>
          </div>

          {/* Clean SVG Bar Chart */}
          <div className="h-44 flex items-end justify-between gap-3 pt-4 px-2">
            {monthlyTrends.map(m => {
              const incomeHeight = Math.max(Math.round((m.income / maxTrendVal) * 120), 4);
              const expenseHeight = Math.max(Math.round((m.expense / maxTrendVal) * 120), 4);
              const [year, month] = m.month.split('-');
              const dateObj = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
              const monthLabel = dateObj.toLocaleDateString('en-US', { month: 'short' });

              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5 group">
                  {/* Tooltip on hover */}
                  <div className="text-[9px] text-surface-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    +{formatCompact(m.income)} / -{formatCompact(m.expense)}
                  </div>

                  {/* Dual Bars */}
                  <div className="flex items-end gap-1 w-full justify-center h-32">
                    {/* Income Bar */}
                    <div
                      style={{ height: `${incomeHeight}px` }}
                      className="w-3 sm:w-5 bg-emerald-500 hover:bg-emerald-600 rounded-t-md transition-all"
                      title={`Income: ${formatCurrency(m.income)}`}
                    />
                    {/* Expense Bar */}
                    <div
                      style={{ height: `${expenseHeight}px` }}
                      className="w-3 sm:w-5 bg-rose-500 hover:bg-rose-600 rounded-t-md transition-all"
                      title={`Expense: ${formatCurrency(m.expense)}`}
                    />
                  </div>

                  {/* Month Label */}
                  <span className="text-[11px] font-bold text-surface-500 dark:text-surface-400">
                    {monthLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Spending by Category Detailed Breakdown */}
      <Card className="p-5">
        <div className="flex items-center justify-between pb-3 border-b border-surface-100 dark:border-surface-800 mb-4">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <h3 className="text-sm font-bold text-surface-900 dark:text-surface-100">
              Spending by Category
            </h3>
          </div>
          <span className="text-xs font-semibold text-surface-400">
            {categoryBreakdown.length} categories
          </span>
        </div>

        {categoryBreakdown.length === 0 ? (
          <div className="py-8 text-center text-xs text-surface-400 dark:text-surface-500">
            No expenses found for the selected time period.
          </div>
        ) : (
          <div className="space-y-4">
            {categoryBreakdown.map(({ category, amount, percentage }) => {
              const color = category?.color || '#059669';
              return (
                <div key={category?.id || 'uncategorized'} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 shadow-xs"
                        style={{ backgroundColor: color }}
                      >
                        <CategoryIcon name={category?.icon || 'Tag'} size={14} />
                      </div>
                      <span className="font-bold text-surface-800 dark:text-surface-200">
                        {category?.name || 'Uncategorized'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-surface-900 dark:text-white">
                        {formatCurrency(amount)}
                      </span>
                      <span className="text-xs font-bold text-surface-400 w-10 text-right">
                        {percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Bar */}
                  <div className="h-2 w-full bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
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
    </div>
  );
};
