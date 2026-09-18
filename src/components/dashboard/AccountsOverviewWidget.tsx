import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '../../context/FinanceContext';
import { AccountFormModal } from '../accounts/AccountFormModal';
import { formatCurrency } from '../../utils/currency';
import {
  Building2,
  CircleDollarSign,
  Smartphone,
  Wallet,
  MoreHorizontal,
  Plus,
  ArrowRight
} from 'lucide-react';
import { cn } from '../../utils/cn';

export const AccountsOverviewWidget: React.FC = () => {
  const navigate = useNavigate();
  const { activeAccounts, accountSummaries } = useFinance();
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);

  const getAccountTypeIcon = (type: string) => {
    switch (type) {
      case 'cash': return CircleDollarSign;
      case 'bank': return Building2;
      case 'upi': return Smartphone;
      case 'wallet': return Wallet;
      default: return MoreHorizontal;
    }
  };

  const activeSummaries = accountSummaries.filter(s => !s.account.isArchived);

  return (
    <div className="space-y-3">
      {/* Widget Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-surface-900 dark:text-white">
          Accounts ({activeAccounts.length})
        </h3>
        <button
          onClick={() => navigate('/accounts')}
          className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 flex items-center gap-1 transition-colors"
        >
          <span>Manage</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Accounts Horizontal Scroll / Grid */}
      {activeSummaries.length === 0 ? (
        <div className="p-4 rounded-2xl bg-white dark:bg-surface-900 border border-dashed border-surface-200 dark:border-surface-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 flex items-center justify-center text-brand-600 dark:text-brand-400 shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-surface-900 dark:text-white">
                No accounts added yet
              </h4>
              <p className="text-[11px] text-surface-500 dark:text-surface-400 truncate">
                Track Cash in Hand, Bank, UPI, and Wallets
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAddAccountOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shrink-0 transition-colors shadow-xs"
          >
            + Add Account
          </button>
        </div>
      ) : (
        <div className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-none">
          {activeSummaries.map(({ account, currentBalance }) => {
            const Icon = getAccountTypeIcon(account.type);
            const isNegative = currentBalance < 0;

            return (
              <div
                key={account.id}
                onClick={() => navigate(`/accounts/${account.id}`)}
                className="min-w-[150px] sm:min-w-[170px] p-3 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200/80 dark:border-surface-800/80 shadow-xs hover:border-brand-500/50 hover:shadow-soft transition-all cursor-pointer shrink-0 flex flex-col justify-between"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 shadow-xs"
                    style={{ backgroundColor: account.color || '#2563eb' }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-surface-900 dark:text-white truncate">
                    {account.name}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-surface-400 uppercase tracking-wider block font-semibold">
                    Balance
                  </span>
                  <span
                    className={cn(
                      'text-sm font-black tracking-tight truncate block',
                      isNegative ? 'text-rose-600 dark:text-rose-400' : 'text-surface-900 dark:text-white'
                    )}
                  >
                    {formatCurrency(currentBalance)}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Quick Add Account Button */}
          <button
            type="button"
            onClick={() => setIsAddAccountOpen(true)}
            className="min-w-[110px] p-3 rounded-2xl border border-dashed border-surface-300 dark:border-surface-700 hover:border-brand-500 text-surface-500 dark:text-surface-400 hover:text-brand-600 dark:hover:text-brand-400 flex flex-col items-center justify-center gap-1 shrink-0 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold">Add Account</span>
          </button>
        </div>
      )}

      {/* Account Form Modal */}
      <AccountFormModal
        isOpen={isAddAccountOpen}
        onClose={() => setIsAddAccountOpen(false)}
      />
    </div>
  );
};
