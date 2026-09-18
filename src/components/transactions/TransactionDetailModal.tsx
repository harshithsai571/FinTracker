import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { CategoryIcon } from '../common/CategoryIcon';
import { Transaction } from '../../types/transaction';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/currency';
import { formatDate, formatTime } from '../../utils/dates';
import {
  Edit2,
  Trash2,
  Calendar,
  Clock,
  CreditCard,
  Landmark,
  FileText,
  ArrowDownRight,
  ArrowUpRight,
  ArrowRightLeft,
  RotateCcw,
  Split,
  Link as LinkIcon
} from 'lucide-react';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  onEdit: (tx: Transaction) => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  onClose,
  onEdit,
}) => {
  const { categories, moneySources, getAccountById, transactions, deleteTransaction } = useFinance();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!transaction) return null;

  const category = categories.find(c => c.id === transaction.categoryId);
  const source = transaction.sourceId ? moneySources.find(s => s.id === transaction.sourceId) : null;
  const account = transaction.accountId ? getAccountById(transaction.accountId) : null;
  const toAccount = transaction.toAccountId ? getAccountById(transaction.toAccountId) : null;
  const linkedTx = transaction.linkedTransactionId
    ? transactions.find(t => t.id === transaction.linkedTransactionId)
    : null;

  const isIncome = transaction.type === 'income';
  const isTransfer = transaction.type === 'transfer';
  const isRefund = transaction.type === 'refund';
  const isExpense = transaction.type === 'expense';

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteTransaction(transaction.id);
      setShowConfirmDelete(false);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Modal isOpen={!!transaction} onClose={onClose} maxWidth="sm">
        <div className="flex flex-col items-center text-center pb-2">
          {/* Icon Badge */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-3 shadow-md"
            style={{
              backgroundColor: isTransfer
                ? '#2563eb'
                : isRefund
                ? '#0d9488'
                : category?.color || (isIncome ? '#10b981' : '#f43f5e'),
            }}
          >
            {isTransfer ? (
              <ArrowRightLeft className="w-8 h-8" />
            ) : isRefund ? (
              <RotateCcw className="w-8 h-8" />
            ) : (
              <CategoryIcon name={category?.icon || (isIncome ? 'Wallet' : 'Tag')} size={32} />
            )}
          </div>

          {/* Amount Display */}
          <div className="flex items-center gap-1.5 mb-1">
            <span
              className={`text-3xl font-extrabold tracking-tight ${
                isIncome
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : isRefund
                  ? 'text-teal-600 dark:text-teal-400'
                  : isTransfer
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-surface-900 dark:text-white'
              }`}
            >
              {isIncome || isRefund ? '+' : isTransfer ? '' : '-'}
              {formatCurrency(transaction.amount)}
            </span>
          </div>

          {/* Type Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-6 bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300">
            {isIncome && <ArrowDownRight className="w-3.5 h-3.5 text-emerald-500" />}
            {isExpense && <ArrowUpRight className="w-3.5 h-3.5 text-rose-500" />}
            {isTransfer && <ArrowRightLeft className="w-3.5 h-3.5 text-blue-500" />}
            {isRefund && <RotateCcw className="w-3.5 h-3.5 text-teal-500" />}
            <span className="capitalize font-bold">{transaction.type}</span>
            {category && !isTransfer && (
              <>
                <span>•</span>
                <span>{category.name}</span>
              </>
            )}
          </div>

          {/* Details Table */}
          <div className="w-full bg-surface-50 dark:bg-surface-800/60 rounded-2xl p-4 space-y-3 text-left border border-surface-200/60 dark:border-surface-700/60 mb-6">
            <div className="flex items-center justify-between text-xs">
              <span className="text-surface-500 dark:text-surface-400 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-surface-400" /> Date
              </span>
              <span className="font-semibold text-surface-800 dark:text-surface-200">
                {formatDate(transaction.date)}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-surface-500 dark:text-surface-400 flex items-center gap-2">
                <Clock className="w-4 h-4 text-surface-400" /> Time
              </span>
              <span className="font-semibold text-surface-800 dark:text-surface-200">
                {formatTime(transaction.time)}
              </span>
            </div>

            {/* Transfer From / To */}
            {isTransfer ? (
              <>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-surface-500 dark:text-surface-400 flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-surface-400" /> From Account
                  </span>
                  <span className="font-semibold text-surface-800 dark:text-surface-200">
                    {account ? account.name : 'Unknown Account'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-surface-500 dark:text-surface-400 flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-blue-500" /> To Account
                  </span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {toAccount ? toAccount.name : 'Unknown Account'}
                  </span>
                </div>
              </>
            ) : (
              /* Account / Source */
              <>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-surface-500 dark:text-surface-400 flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-surface-400" /> Account
                  </span>
                  <span className="font-semibold text-surface-800 dark:text-surface-200">
                    {account ? `${account.name} (${account.type.toUpperCase()})` : 'Unassigned'}
                  </span>
                </div>

                {source && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-surface-500 dark:text-surface-400 flex items-center gap-2">
                      <Landmark className="w-4 h-4 text-surface-400" /> External Fund
                    </span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {source.name}
                    </span>
                  </div>
                )}

                {transaction.paymentMethod && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-surface-500 dark:text-surface-400 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-surface-400" /> Payment Method
                    </span>
                    <span className="font-semibold uppercase tracking-wider text-surface-800 dark:text-surface-200">
                      {transaction.paymentMethod}
                    </span>
                  </div>
                )}
              </>
            )}

            {/* Linked Refund Reference */}
            {isRefund && linkedTx && (
              <div className="pt-2 border-t border-surface-200/50 dark:border-surface-700/50">
                <span className="text-[11px] text-teal-600 dark:text-teal-400 block mb-1 flex items-center gap-1.5 font-bold">
                  <LinkIcon className="w-3.5 h-3.5" /> Linked Expense
                </span>
                <p className="text-xs text-surface-700 dark:text-surface-300 bg-teal-50/60 dark:bg-teal-950/40 p-2.5 rounded-xl border border-teal-200/50 dark:border-teal-900/40">
                  {linkedTx.date} — {linkedTx.description || 'Original Expense'} ({formatCurrency(linkedTx.amount)})
                </p>
              </div>
            )}

            {/* Split Breakdown */}
            {transaction.splits && transaction.splits.length > 0 && (
              <div className="pt-2 border-t border-surface-200/50 dark:border-surface-700/50">
                <span className="text-[11px] text-surface-500 dark:text-surface-400 block mb-2 flex items-center gap-1.5 font-bold">
                  <Split className="w-3.5 h-3.5 text-brand-500" /> Split Breakdown ({transaction.splits.length} categories)
                </span>
                <div className="space-y-1.5">
                  {transaction.splits.map((split, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-surface-900 border border-surface-200/60 dark:border-surface-700/60 text-xs"
                    >
                      <div>
                        <span className="font-bold text-surface-800 dark:text-surface-200 block">
                          {split.categoryName || 'Category'}
                        </span>
                        {split.note && (
                          <span className="text-[10px] text-surface-400">{split.note}</span>
                        )}
                      </div>
                      <span className="font-extrabold text-surface-900 dark:text-surface-100">
                        {formatCurrency(split.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Note */}
            {transaction.description && (
              <div className="pt-2 border-t border-surface-200/50 dark:border-surface-700/50">
                <span className="text-[11px] text-surface-400 block mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Note
                </span>
                <p className="text-xs text-surface-700 dark:text-surface-300 bg-white/70 dark:bg-surface-900/60 p-2.5 rounded-xl">
                  {transaction.description}
                </p>
              </div>
            )}

            <div className="pt-2 border-t border-surface-200/50 dark:border-surface-700/50 text-[10px] text-surface-400 space-y-0.5">
              <div>Created: {new Date(transaction.createdAt).toLocaleString()}</div>
              {transaction.updatedAt !== transaction.createdAt && (
                <div>Last updated: {new Date(transaction.updatedAt).toLocaleString()}</div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 w-full">
            <Button
              variant="outline"
              size="md"
              leftIcon={<Edit2 className="w-4 h-4" />}
              onClick={() => {
                onClose();
                onEdit(transaction);
              }}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              size="md"
              leftIcon={<Trash2 className="w-4 h-4" />}
              onClick={() => setShowConfirmDelete(true)}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Delete Transaction?"
        message={`Are you sure you want to remove this ${transaction.type} of ${formatCurrency(transaction.amount)}? This action cannot be undone.`}
        confirmText="Delete"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </>
  );
};
