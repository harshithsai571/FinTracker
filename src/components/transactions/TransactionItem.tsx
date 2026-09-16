import React from 'react';
import { Transaction } from '../../types/transaction';
import { Category } from '../../types/category';
import { MoneySource } from '../../types/otherMoney';
import { CategoryIcon } from '../common/CategoryIcon';
import { formatCurrency } from '../../utils/currency';
import { formatTime } from '../../utils/dates';
import { cn } from '../../utils/cn';

interface TransactionItemProps {
  transaction: Transaction;
  category?: Category;
  source?: MoneySource;
  onClick: (tx: Transaction) => void;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  category,
  source,
  onClick,
}) => {
  const isIncome = transaction.type === 'income';

  return (
    <div
      onClick={() => onClick(transaction)}
      className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200/70 dark:border-surface-800/80 shadow-xs hover:border-brand-500/40 hover:shadow-soft transition-all duration-150 cursor-pointer active:scale-[0.99] group"
    >
      <div className="flex items-center gap-3.5 min-w-0">
        {/* Category Icon Badge */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs transition-transform group-hover:scale-105"
          style={{ backgroundColor: category?.color || (isIncome ? '#10b981' : '#f43f5e') }}
        >
          <CategoryIcon name={category?.icon || (isIncome ? 'Wallet' : 'Tag')} size={20} />
        </div>

        {/* Title and metadata */}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="text-xs sm:text-sm font-bold text-surface-900 dark:text-surface-100 truncate">
              {transaction.description || category?.name || 'Transaction'}
            </h4>
            {source && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-semibold shrink-0 border border-blue-200/50 dark:border-blue-800/40">
                {source.name}
              </span>
            )}
          </div>
          <p className="text-[11px] text-surface-500 dark:text-surface-400 mt-0.5 flex items-center gap-1.5">
            <span>{category?.name || 'Uncategorized'}</span>
            <span>•</span>
            <span>{formatTime(transaction.time)}</span>
            <span>•</span>
            <span className="uppercase text-[10px] font-semibold">{transaction.paymentMethod}</span>
          </p>
        </div>
      </div>

      {/* Amount with +/- and color */}
      <div className="text-right shrink-0 ml-3">
        <span
          className={cn(
            'text-sm sm:text-base font-extrabold tracking-tight',
            isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-surface-900 dark:text-surface-100'
          )}
        >
          {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
        </span>
      </div>
    </div>
  );
};
