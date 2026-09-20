import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFinance } from '../context/FinanceContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { TransactionItem } from '../components/transactions/TransactionItem';
import { TransactionDetailModal } from '../components/transactions/TransactionDetailModal';
import { TransactionFormModal } from '../components/transactions/TransactionFormModal';
import { AccountFormModal } from '../components/accounts/AccountFormModal';
import { Transaction } from '../types/transaction';
import { formatCurrency } from '../utils/currency';
import { formatDate } from '../utils/dates';
import {
  ArrowLeft,
  Building2,
  CircleDollarSign,
  Smartphone,
  Wallet,
  MoreHorizontal,
  ArrowRightLeft,
  Plus,
  Edit2,
  Archive,
  ArchiveRestore,
  TrendingUp,
  TrendingDown,
  Receipt
} from 'lucide-react';
import { cn } from '../utils/cn';

export const AccountDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    getAccountSummary,
    transactions,
    archiveAccount,
  } = useFinance();

  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isTxFormOpen, setIsTxFormOpen] = useState(false);
  const [defaultTxType, setDefaultTxType] = useState<'expense' | 'income' | 'transfer'>('expense');

  const [isEditAccountOpen, setIsEditAccountOpen] = useState(false);

  const summary = id ? getAccountSummary(id) : undefined;
  const account = summary?.account;

  if (!account || !summary) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-surface-400">
          <Wallet className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-surface-900 dark:text-white">Account Not Found</h3>
        <p className="text-xs text-surface-500">The account you are looking for does not exist or was removed.</p>
        <Button variant="primary" size="sm" onClick={() => navigate('/accounts')}>
          Back to Accounts
        </Button>
      </div>
    );
  }

  // Filter transactions belonging to this account (either source or target)
  const accountTransactions = transactions
    .filter(t => t.accountId === id || t.toAccountId === id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Group by date for clean presentation
  const groupedTxs = accountTransactions.reduce((acc, tx) => {
    const d = tx.date;
    if (!acc[d]) acc[d] = [];
    acc[d].push(tx);
    return acc;
  }, {} as Record<string, Transaction[]>);

  const handleOpenTransfer = () => {
    setEditingTransaction(null);
    setDefaultTxType('transfer');
    setIsTxFormOpen(true);
  };

  const handleOpenAddTx = () => {
    setEditingTransaction(null);
    setDefaultTxType('expense');
    setIsTxFormOpen(true);
  };

  const handleArchiveToggle = async () => {
    await archiveAccount(account.id, !account.isArchived);
  };

  const getAccountTypeIcon = (type: string) => {
    switch (type) {
      case 'cash': return CircleDollarSign;
      case 'bank': return Building2;
      case 'upi': return Smartphone;
      case 'wallet': return Wallet;
      default: return MoreHorizontal;
    }
  };

  const Icon = getAccountTypeIcon(account.type);
  const isNegative = summary.currentBalance < 0;

  return (
    <div className="space-y-5 animate-in fade-in duration-300 pb-16">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/accounts')}
          className="inline-flex items-center gap-2 text-xs font-bold text-surface-600 dark:text-surface-300 hover:text-surface-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Accounts</span>
        </button>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Edit2 className="w-3.5 h-3.5" />}
            onClick={() => setIsEditAccountOpen(true)}
            className="text-xs"
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleArchiveToggle}
            className="text-xs text-surface-500 hover:text-amber-600"
          >
            {account.isArchived ? (
              <ArchiveRestore className="w-3.5 h-3.5" />
            ) : (
              <Archive className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Hero Account Balance Card */}
      <div className="relative overflow-hidden rounded-3xl bg-surface-900 text-white dark:bg-surface-900 p-6 border border-surface-800 shadow-soft">
        <div className="relative z-10 space-y-4">
          {/* Header Row: Type & Name */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0"
                style={{ backgroundColor: account.color || '#2563eb' }}
              >
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black tracking-tight">{account.name}</h2>
                  {account.isArchived && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-800 text-amber-400 font-bold">
                      Archived
                    </span>
                  )}
                </div>
                <p className="text-xs text-surface-400 capitalize">{account.type} Account</p>
              </div>
            </div>
          </div>

          {/* Large Current Balance */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-surface-400 block mb-1">
              Current Balance
            </span>
            <div className="flex items-baseline gap-2">
              <span
                className={cn(
                  'text-4xl font-black tracking-tight',
                  isNegative ? 'text-rose-400' : 'text-white'
                )}
              >
                {formatCurrency(summary.currentBalance)}
              </span>
            </div>
          </div>

          {/* Inflow / Outflow & Opening Balance Grid */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-surface-800/80 text-center">
            <div className="bg-surface-800/50 p-2.5 rounded-xl">
              <span className="text-[10px] text-surface-400 block mb-0.5">Opening</span>
              <span className="text-xs font-bold text-surface-200 truncate block">
                {formatCurrency(account.openingBalance)}
              </span>
            </div>

            <div className="bg-surface-800/50 p-2.5 rounded-xl">
              <span className="text-[10px] text-emerald-400 flex items-center justify-center gap-1 mb-0.5">
                <TrendingUp className="w-3 h-3" /> Inflow
              </span>
              <span className="text-xs font-bold text-emerald-400 truncate block">
                +{formatCurrency(summary.totalInflow)}
              </span>
            </div>

            <div className="bg-surface-800/50 p-2.5 rounded-xl">
              <span className="text-[10px] text-rose-400 flex items-center justify-center gap-1 mb-0.5">
                <TrendingDown className="w-3 h-3" /> Outflow
              </span>
              <span className="text-xs font-bold text-rose-400 truncate block">
                -{formatCurrency(summary.totalOutflow)}
              </span>
            </div>
          </div>

          {/* Detailed Breakdown: Income, Expenses, Refunds, Transfers In/Out, Count */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] pt-1">
            <div className="bg-surface-800/40 px-2.5 py-1.5 rounded-lg flex items-center justify-between border border-surface-800/60">
              <span className="text-surface-400">Total Income:</span>
              <span className="font-bold text-emerald-400">+{formatCurrency(summary.totalIncome)}</span>
            </div>
            <div className="bg-surface-800/40 px-2.5 py-1.5 rounded-lg flex items-center justify-between border border-surface-800/60">
              <span className="text-surface-400">Total Expenses:</span>
              <span className="font-bold text-rose-400">-{formatCurrency(summary.totalExpenses)}</span>
            </div>
            <div className="bg-surface-800/40 px-2.5 py-1.5 rounded-lg flex items-center justify-between border border-surface-800/60">
              <span className="text-surface-400">Total Refunds:</span>
              <span className="font-bold text-teal-400">+{formatCurrency(summary.totalRefunds)}</span>
            </div>
            <div className="bg-surface-800/40 px-2.5 py-1.5 rounded-lg flex items-center justify-between border border-surface-800/60">
              <span className="text-surface-400">Transfers In:</span>
              <span className="font-bold text-blue-400">+{formatCurrency(summary.totalTransfersIn)}</span>
            </div>
            <div className="bg-surface-800/40 px-2.5 py-1.5 rounded-lg flex items-center justify-between border border-surface-800/60">
              <span className="text-surface-400">Transfers Out:</span>
              <span className="font-bold text-surface-300">-{formatCurrency(summary.totalTransfersOut)}</span>
            </div>
            <div className="bg-surface-800/40 px-2.5 py-1.5 rounded-lg flex items-center justify-between border border-surface-800/60">
              <span className="text-surface-400">Transactions:</span>
              <span className="font-bold text-surface-200">{summary.transactionCount}</span>
            </div>
          </div>

          {account.note && (
            <p className="text-xs text-surface-400 bg-surface-800/40 p-2.5 rounded-xl border border-surface-800/60">
              {account.note}
            </p>
          )}

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ArrowRightLeft className="w-4 h-4 text-blue-400" />}
              onClick={handleOpenTransfer}
              className="bg-surface-800/80 hover:bg-surface-800 border-surface-700 text-white font-bold text-xs"
            >
              Transfer
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={handleOpenAddTx}
              className="font-bold text-xs shadow-sm"
            >
              Add Transaction
            </Button>
          </div>
        </div>
      </div>

      {/* Account Transactions Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-surface-900 dark:text-white">
            Account Activity ({accountTransactions.length})
          </h3>
        </div>

        {accountTransactions.length === 0 ? (
          <Card className="p-8 text-center border-dashed">
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-surface-400">
              <Receipt className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-surface-900 dark:text-white mb-1">
              No Transactions Yet
            </h4>
            <p className="text-xs text-surface-500 max-w-xs mx-auto mb-4">
              Transactions, transfers, and refunds linked to this account will appear here.
            </p>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={handleOpenAddTx}
            >
              Record First Transaction
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedTxs).map(([dateStr, txs]) => (
              <div key={dateStr} className="space-y-2">
                <h4 className="text-xs font-bold text-surface-500 uppercase tracking-wider px-1">
                  {formatDate(dateStr)}
                </h4>
                <div className="space-y-2">
                  {txs.map(tx => (
                    <TransactionItem
                      key={tx.id}
                      transaction={tx}
                      onClick={setSelectedTransaction}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        onEdit={tx => {
          setSelectedTransaction(null);
          setEditingTransaction(tx);
          setIsTxFormOpen(true);
        }}
      />

      {/* Transaction Form Modal */}
      <TransactionFormModal
        isOpen={isTxFormOpen}
        onClose={() => {
          setIsTxFormOpen(false);
          setEditingTransaction(null);
        }}
        initialTransaction={editingTransaction}
      />

      {/* Edit Account Modal */}
      <AccountFormModal
        isOpen={isEditAccountOpen}
        onClose={() => setIsEditAccountOpen(false)}
        initialAccount={account}
      />
    </div>
  );
};
