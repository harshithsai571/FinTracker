import React from 'react';
import { Transaction } from '../../types/transaction';
import { Category } from '../../types/category';
import { MoneySource } from '../../types/otherMoney';
import { CategoryIcon } from '../common/CategoryIcon';
import { formatCurrency } from '../../utils/currency';
import { formatTime } from '../../utils/dates';
import { cn } from '../../utils/cn';
import { useFinance } from '../../context/FinanceContext';
import { ArrowRightLeft, RotateCcw, Split } from 'lucide-react';

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
  const { getAccountById } = useFinance();
  const account = transaction.accountId ? getAccountById(transaction.accountId) : null;
  const toAccount = transaction.toAccountId ? getAccountById(transaction.toAccountId) : null;

  const isIncome = transaction.type === 'income';
  const isTransfer = transaction.type === 'transfer';
  const isRefund = transaction.type === 'refund';
  const isExpense = transaction.type === 'expense';
  const hasSplits = !!(transaction.splits && transaction.splits.length > 0);

  // Title display
  let title = transaction.description;
  if (!title) {
    if (isTransfer) {
      title = account && toAccount ? `${account.name} → ${toAccount.name}` : 'Transfer';
    } else if (isRefund) {
      title = category ? `${category.name} Refund` : 'Refund';
    } else {
      title = category?.name || 'Transaction';
    }
  }

  return (
    <div
      onClick={() => onClick(transaction)}
      className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200/70 dark:border-surface-800/80 shadow-xs hover:border-brand-500/40 hover:shadow-soft transition-all duration-150 cursor-pointer active:scale-[0.99] group"
    >
      <div className="flex items-center gap-3.5 min-w-0">
        {/* Icon Badge */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs transition-transform group-hover:scale-105"
          style={{
            backgroundColor: isTransfer
              ? '#2563eb'
              : isRefund
              ? '#0d9488'
              : category?.color || (isIncome ? '#10b981' : '#f43f5e'),
          }}
        >
          {isTransfer ? (
            <ArrowRightLeft className="w-5 h-5" />
          ) : isRefund ? (
            <RotateCcw className="w-5 h-5" />
          ) : (
            <CategoryIcon name={category?.icon || (isIncome ? 'Wallet' : 'Tag')} size={20} />
          )}
        </div>

        {/* Title and metadata */}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="text-xs sm:text-sm font-bold text-surface-900 dark:text-surface-100 truncate max-w-[180px] sm:max-w-xs">
              {title}
            </h4>

            {/* Transfer Badge */}
            {isTransfer && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-bold shrink-0 border border-blue-200/50 dark:border-blue-800/40">
                TRANSFER
              </span>
            )}

            {/* Refund Badge */}
            {isRefund && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 font-bold shrink-0 border border-teal-200/50 dark:border-teal-800/40">
                REFUND
              </span>
            )}

            {/* Split Badge */}
            {hasSplits && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 font-semibold shrink-0 border border-amber-200/50 dark:border-amber-800/40 flex items-center gap-0.5">
                <Split className="w-2.5 h-2.5" />
                <span>Split ({transaction.splits!.length})</span>
              </span>
            )}

            {/* Account pill */}
            {account && !isTransfer && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 font-medium shrink-0">
                {account.name}
              </span>
            )}

            {/* External fund source */}
            {source && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 font-semibold shrink-0 border border-purple-200/50 dark:border-purple-800/40">
                {source.name}
              </span>
            )}
          </div>

          <p className="text-[11px] text-surface-500 dark:text-surface-400 mt-0.5 flex items-center gap-1.5 truncate">
            {isTransfer ? (
              <span>{account?.name || 'Account'} → {toAccount?.name || 'Account'}</span>
            ) : (
              <span>{category?.name || (isRefund ? 'Refund' : 'Uncategorized')}</span>
            )}
            <span>•</span>
            <span>{formatTime(transaction.time)}</span>
            {transaction.paymentMethod && (
              <>
                <span>•</span>
                <span className="uppercase text-[10px] font-semibold">{transaction.paymentMethod}</span>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Amount with +/- and color */}
      <div className="text-right shrink-0 ml-3">
        <span
          className={cn(
            'text-sm sm:text-base font-extrabold tracking-tight',
            isIncome && 'text-emerald-600 dark:text-emerald-400',
            isRefund && 'text-teal-600 dark:text-teal-400',
            isTransfer && 'text-blue-600 dark:text-blue-400',
            isExpense && 'text-surface-900 dark:text-surface-100'
          )}
        >
          {isIncome || isRefund ? '+' : isTransfer ? '' : '-'}{formatCurrency(transaction.amount)}
        </span>
      </div>
    </div>
  );
};
