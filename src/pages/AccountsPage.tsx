import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '../context/FinanceContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { AccountFormModal } from '../components/accounts/AccountFormModal';
import { Account, AccountType } from '../types/account';
import { formatCurrency } from '../utils/currency';
import {
  Building2,
  CircleDollarSign,
  Smartphone,
  Wallet,
  MoreHorizontal,
  Plus,
  ArrowRight,
  Archive,
  ArchiveRestore,
  Edit2,
  Trash2,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { cn } from '../utils/cn';

export const AccountsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    accounts,
    accountSummaries,
    totalAccountsBalance,
    archiveAccount,
    deleteAccount,
  } = useFinance();

  const [tab, setTab] = useState<'active' | 'archived' | 'all'>('active');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState<Account | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreateAccount = () => {
    setEditingAccount(null);
    setIsModalOpen(true);
  };

  const handleEditAccount = (acc: Account, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAccount(acc);
    setIsModalOpen(true);
  };

  const handleArchiveToggle = async (acc: Account, e: React.MouseEvent) => {
    e.stopPropagation();
    await archiveAccount(acc.id, !acc.isArchived);
  };

  const handleDeletePrompt = (acc: Account, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDeleteAccount(acc);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteAccount) return;
    setIsDeleting(true);
    try {
      await deleteAccount(confirmDeleteAccount.id);
      setConfirmDeleteAccount(null);
    } catch {
      // Error handled by FinanceContext toast
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredSummaries = accountSummaries.filter(summary => {
    if (tab === 'active') return !summary.account.isArchived;
    if (tab === 'archived') return summary.account.isArchived;
    return true;
  });

  const getAccountTypeIcon = (type: AccountType) => {
    switch (type) {
      case 'cash': return CircleDollarSign;
      case 'bank': return Building2;
      case 'upi': return Smartphone;
      case 'wallet': return Wallet;
      default: return MoreHorizontal;
    }
  };

  const getAccountTypeLabel = (type: AccountType) => {
    switch (type) {
      case 'cash': return 'Cash';
      case 'bank': return 'Bank Account';
      case 'upi': return 'UPI / Digital';
      case 'wallet': return 'Prepaid Wallet';
      default: return 'Other';
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-surface-900 dark:text-white tracking-tight">
            Accounts
          </h2>
          <p className="text-xs text-surface-500 dark:text-surface-400">
            Manage your physical cash, bank accounts, UPI, and wallets
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={handleCreateAccount}
          className="shadow-sm font-bold"
        >
          Add Account
        </Button>
      </div>

      {/* Hero Balance Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-800 dark:from-brand-700 dark:via-indigo-900 dark:to-surface-950 p-6 text-white shadow-soft">
        <div className="relative z-10">
          <span className="text-xs font-semibold tracking-wider uppercase text-brand-100/90 block mb-1">
            Total Accounts Balance
          </span>
          <h3 className="text-3xl sm:text-4xl font-black tracking-tight">
            {formatCurrency(totalAccountsBalance)}
          </h3>
          <p className="text-xs text-brand-100/80 mt-2 flex items-center gap-1.5">
            <span>{accounts.filter(a => !a.isArchived).length} active accounts</span>
            <span>•</span>
            <span>Transfers preserve net worth</span>
          </p>
        </div>

        {/* Decorative ambient background shape */}
        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-surface-200 dark:border-surface-800 pb-2">
        {(['active', 'archived', 'all'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all',
              tab === t
                ? 'bg-surface-900 dark:bg-white text-white dark:text-surface-900 shadow-xs'
                : 'text-surface-500 hover:text-surface-900 dark:text-surface-400 dark:hover:text-white'
            )}
          >
            {t}
            <span className="ml-1.5 opacity-70">
              ({t === 'active'
                ? accounts.filter(a => !a.isArchived).length
                : t === 'archived'
                ? accounts.filter(a => a.isArchived).length
                : accounts.length})
            </span>
          </button>
        ))}
      </div>

      {/* Accounts List or Empty State */}
      {filteredSummaries.length === 0 ? (
        <Card className="p-8 text-center border-dashed">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-brand-50 dark:bg-brand-950/60 flex items-center justify-center text-brand-600 dark:text-brand-400">
            <Wallet className="w-7 h-7" />
          </div>
          <h4 className="text-base font-bold text-surface-900 dark:text-white mb-1">
            {tab === 'archived' ? 'No Archived Accounts' : 'No Accounts Added Yet'}
          </h4>
          <p className="text-xs text-surface-500 dark:text-surface-400 max-w-sm mx-auto mb-5">
            {tab === 'archived'
              ? 'Archived accounts will appear here. They remain preserved in your financial history.'
              : 'Add your Cash in Hand, Bank Accounts, GPay/PhonePe, and Wallets to track exact balances and transfer money between them.'}
          </p>
          {tab !== 'archived' && (
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={handleCreateAccount}
              className="font-bold shadow-sm"
            >
              Add Your First Account
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filteredSummaries.map(({ account, currentBalance, totalInflow, totalOutflow, transactionCount }) => {
            const Icon = getAccountTypeIcon(account.type);
            const isNegative = currentBalance < 0;

            return (
              <div
                key={account.id}
                onClick={() => navigate(`/accounts/${account.id}`)}
                className={cn(
                  'group relative p-4 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200/80 dark:border-surface-800/80 shadow-xs hover:border-brand-500/50 hover:shadow-soft transition-all cursor-pointer flex flex-col justify-between',
                  account.isArchived && 'opacity-65 bg-surface-50 dark:bg-surface-950'
                )}
              >
                <div>
                  {/* Card Header: Icon, Name, Type, and Quick Actions */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                        style={{ backgroundColor: account.color || '#2563eb' }}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-bold text-surface-900 dark:text-white truncate">
                            {account.name}
                          </h4>
                          {account.isArchived && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-200 dark:bg-surface-800 text-surface-600 dark:text-surface-400 font-semibold shrink-0">
                              Archived
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-surface-500 dark:text-surface-400 font-medium">
                          {getAccountTypeLabel(account.type)}
                        </p>
                      </div>
                    </div>

                    {/* Quick action buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={e => handleEditAccount(account, e)}
                        title="Edit Account"
                        className="p-1.5 rounded-lg text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={e => handleArchiveToggle(account, e)}
                        title={account.isArchived ? 'Restore Account' : 'Archive Account'}
                        className="p-1.5 rounded-lg text-surface-400 hover:text-amber-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                      >
                        {account.isArchived ? (
                          <ArchiveRestore className="w-3.5 h-3.5" />
                        ) : (
                          <Archive className="w-3.5 h-3.5" />
                        )}
                      </button>
                      {transactionCount === 0 && (
                        <button
                          type="button"
                          onClick={e => handleDeletePrompt(account, e)}
                          title="Delete Account"
                          className="p-1.5 rounded-lg text-surface-400 hover:text-rose-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Balance Display */}
                  <div className="mb-3">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-surface-400 block mb-0.5">
                      Current Balance
                    </span>
                    <span
                      className={cn(
                        'text-2xl font-black tracking-tight',
                        isNegative
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-surface-900 dark:text-white'
                      )}
                    >
                      {formatCurrency(currentBalance)}
                    </span>
                    <p className="text-[10px] text-surface-400 mt-0.5">
                      Opening: {formatCurrency(account.openingBalance)}
                    </p>
                  </div>
                </div>

                {/* Card Footer: Inflow / Outflow & Arrow */}
                <div className="pt-3 border-t border-surface-100 dark:border-surface-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 text-[11px]">
                    <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                      <TrendingUp className="w-3 h-3" />
                      <span>+{formatCurrency(totalInflow)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-surface-500 dark:text-surface-400 font-medium">
                      <TrendingDown className="w-3 h-3" />
                      <span>-{formatCurrency(totalOutflow)}</span>
                    </div>
                  </div>

                  <span className="text-surface-400 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all flex items-center gap-0.5 text-[11px] font-semibold">
                    <span>Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Account Form Modal */}
      <AccountFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialAccount={editingAccount}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!confirmDeleteAccount}
        onClose={() => setConfirmDeleteAccount(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Account?"
        message={`Are you sure you want to delete "${confirmDeleteAccount?.name}"? This action cannot be undone.`}
        confirmText="Delete Account"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
};
