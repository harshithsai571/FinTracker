import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { SourceSummary, MoneyReceipt } from '../../types/otherMoney';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/currency';
import { formatDate, formatTime } from '../../utils/dates';
import {
  Plus,
  Trash2,
  Edit2,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  FileText
} from 'lucide-react';

interface SourceDetailModalProps {
  summary: SourceSummary | null;
  onClose: () => void;
  onAddMoney: (sourceId: string) => void;
  onEditReceipt: (receipt: MoneyReceipt) => void;
  onEditSource: (summary: SourceSummary) => void;
}

export const SourceDetailModal: React.FC<SourceDetailModalProps> = ({
  summary,
  onClose,
  onAddMoney,
  onEditReceipt,
  onEditSource,
}) => {
  const { moneyReceipts, transactions, categories, deleteMoneyReceipt, deleteMoneySource } = useFinance();
  const [activeTab, setActiveTab] = useState<'receipts' | 'expenses'>('receipts');
  const [receiptToDelete, setReceiptToDelete] = useState<MoneyReceipt | null>(null);
  const [showDeleteSourceConfirm, setShowDeleteSourceConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!summary) return null;

  const { source, totalReceived, totalUsed, remaining } = summary;

  // Receipts for this source
  const sourceReceipts = moneyReceipts.filter(r => r.sourceId === source.id);

  // Expenses paid from this source
  const sourceExpenses = transactions.filter(
    t => t.type === 'expense' && t.sourceId === source.id
  );

  const catMap = new Map(categories.map(c => [c.id, c]));

  const handleDeleteReceipt = async () => {
    if (!receiptToDelete) return;
    setIsDeleting(true);
    try {
      await deleteMoneyReceipt(receiptToDelete.id);
      setReceiptToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteSource = async () => {
    setIsDeleting(true);
    try {
      await deleteMoneySource(source.id);
      setShowDeleteSourceConfirm(false);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={!!summary}
        onClose={onClose}
        title={source.name}
        description={source.description || 'Separate money tracking'}
        maxWidth="lg"
      >
        <div className="space-y-4">
          {/* Summary Card with Received, Used, Remaining */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-surface-900 to-surface-950 text-white shadow-soft border border-surface-800">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: source.color || '#3b82f6' }}
                />
                <span className="text-xs font-bold uppercase tracking-wider text-surface-400">
                  Fund Status
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onEditSource(summary)}
                  className="text-xs text-surface-400 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition-colors"
                >
                  Edit Source
                </button>
                <button
                  onClick={() => setShowDeleteSourceConfirm(true)}
                  className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1 rounded-lg hover:bg-rose-950/40 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                <p className="text-[10px] text-surface-400 uppercase font-semibold mb-0.5">
                  Total Received
                </p>
                <p className="text-sm sm:text-base font-extrabold text-white truncate">
                  {formatCurrency(totalReceived)}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                <p className="text-[10px] text-surface-400 uppercase font-semibold mb-0.5">
                  Total Used
                </p>
                <p className="text-sm sm:text-base font-extrabold text-rose-400 truncate">
                  {formatCurrency(totalUsed)}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
                <p className="text-[10px] text-emerald-300 uppercase font-semibold mb-0.5">
                  Remaining
                </p>
                <p className="text-sm sm:text-base font-extrabold text-emerald-400 truncate">
                  {formatCurrency(remaining)}
                </p>
              </div>
            </div>

            {/* Quick Action Button */}
            <div className="mt-4 pt-3 border-t border-white/10 flex justify-end">
              <Button
                variant="primary"
                size="sm"
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700"
                onClick={() => onAddMoney(source.id)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Add Received Money
              </Button>
            </div>
          </div>

          {/* Tabs: Received History vs Expenses Paid */}
          <div className="flex border-b border-surface-200 dark:border-surface-800">
            <button
              onClick={() => setActiveTab('receipts')}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'receipts'
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-surface-500 hover:text-surface-800 dark:text-surface-400'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Received History ({sourceReceipts.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'expenses'
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-surface-500 hover:text-surface-800 dark:text-surface-400'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Expenses Paid ({sourceExpenses.length})</span>
            </button>
          </div>

          {/* Tab Content: Receipts */}
          {activeTab === 'receipts' && (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {sourceReceipts.length === 0 ? (
                <div className="p-8 text-center text-xs text-surface-400 dark:text-surface-500">
                  No deposits recorded yet. Tap "Add Received Money" to track funds received from this source.
                </div>
              ) : (
                sourceReceipts.map(receipt => (
                  <div
                    key={receipt.id}
                    className="p-3 rounded-xl bg-white dark:bg-surface-800/80 border border-surface-200/70 dark:border-surface-700/60 flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          +{formatCurrency(receipt.amount)}
                        </span>
                        <span className="text-[11px] text-surface-500 dark:text-surface-400">
                          • {formatDate(receipt.date)} {receipt.time ? `• ${formatTime(receipt.time)}` : ''}
                        </span>
                      </div>
                      {receipt.note && (
                        <p className="text-xs text-surface-600 dark:text-surface-300 mt-0.5 truncate">
                          {receipt.note}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => onEditReceipt(receipt)}
                        className="p-1.5 rounded-lg text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                        aria-label="Edit receipt"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setReceiptToDelete(receipt)}
                        className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        aria-label="Delete receipt"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab Content: Expenses */}
          {activeTab === 'expenses' && (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {sourceExpenses.length === 0 ? (
                <div className="p-8 text-center text-xs text-surface-400 dark:text-surface-500">
                  No expenses have been paid from {source.name} yet. When adding an expense, select "{source.name}" in "Paid From".
                </div>
              ) : (
                sourceExpenses.map(exp => {
                  const cat = catMap.get(exp.categoryId);
                  return (
                    <div
                      key={exp.id}
                      className="p-3 rounded-xl bg-white dark:bg-surface-800/80 border border-surface-200/70 dark:border-surface-700/60 flex items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                            -{formatCurrency(exp.amount)}
                          </span>
                          <span className="text-[11px] font-semibold text-surface-600 dark:text-surface-300">
                            {cat?.name || 'Expense'}
                          </span>
                          <span className="text-[11px] text-surface-400">
                            • {formatDate(exp.date)}
                          </span>
                        </div>
                        {exp.description && (
                          <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5 truncate">
                            {exp.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Receipt Confirmation */}
      <ConfirmDialog
        isOpen={!!receiptToDelete}
        onClose={() => setReceiptToDelete(null)}
        onConfirm={handleDeleteReceipt}
        title="Delete Money Deposit?"
        message={`Are you sure you want to remove this deposit of ${receiptToDelete ? formatCurrency(receiptToDelete.amount) : ''}? This will update the remaining balance.`}
        confirmText="Delete"
        isDestructive={true}
        isLoading={isDeleting}
      />

      {/* Delete Source Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteSourceConfirm}
        onClose={() => setShowDeleteSourceConfirm(false)}
        onConfirm={handleDeleteSource}
        title="Delete Money Source?"
        message={`Are you sure you want to delete "${source.name}"? This source and its associated history will be removed.`}
        confirmText="Delete Source"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </>
  );
};
