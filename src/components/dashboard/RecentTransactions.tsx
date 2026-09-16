import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, ArrowRight, PlusCircle } from 'lucide-react';
import { Card } from '../common/Card';
import { TransactionItem } from '../transactions/TransactionItem';
import { Transaction } from '../../types/transaction';
import { Category } from '../../types/category';
import { MoneySource } from '../../types/otherMoney';

interface RecentTransactionsProps {
  transactions: Transaction[];
  categories: Category[];
  sources: MoneySource[];
  onSelectTransaction: (tx: Transaction) => void;
  onOpenAddModal: () => void;
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  transactions,
  categories,
  sources,
  onSelectTransaction,
  onOpenAddModal,
}) => {
  const recentList = transactions.slice(0, 5);
  const catMap = new Map(categories.map(c => [c.id, c]));
  const sourceMap = new Map(sources.map(s => [s.id, s]));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          <h3 className="text-sm font-bold text-surface-900 dark:text-surface-100">
            Recent Transactions
          </h3>
        </div>
        {transactions.length > 0 && (
          <Link
            to="/transactions"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 inline-flex items-center gap-1 transition-colors"
          >
            <span>View all ({transactions.length})</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>

      {recentList.length === 0 ? (
        <Card className="text-center py-10 px-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto mb-3">
            <PlusCircle className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-surface-900 dark:text-surface-100 mb-1">
            No transactions yet
          </h4>
          <p className="text-xs text-surface-500 dark:text-surface-400 max-w-xs mx-auto mb-4">
            Start tracking your spending and income by recording your first transaction.
          </p>
          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            <span>+ Add Transaction</span>
          </button>
        </Card>
      ) : (
        <div className="space-y-2">
          {recentList.map(tx => (
            <TransactionItem
              key={tx.id}
              transaction={tx}
              category={catMap.get(tx.categoryId)}
              source={tx.sourceId ? sourceMap.get(tx.sourceId) : undefined}
              onClick={onSelectTransaction}
            />
          ))}
        </div>
      )}
    </div>
  );
};
