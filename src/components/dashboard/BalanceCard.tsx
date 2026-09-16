import React from 'react';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

interface BalanceCardProps {
  balance: number;
  income: number;
  expenses: number;
  otherMoneyRemaining: number;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  balance,
  income,
  expenses,
  otherMoneyRemaining,
}) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-surface-900 via-surface-900 to-surface-950 text-white p-6 sm:p-7 shadow-elevated border border-surface-800">
      {/* Decorative gradient glowing orb */}
      <div className="absolute -right-16 -top-16 w-56 h-56 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-emerald-600/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10">
        {/* Header Label */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-brand-400">
              <Wallet className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-surface-300 uppercase tracking-wider">
              Total Available Balance
            </span>
          </div>
          {otherMoneyRemaining > 0 && (
            <span className="text-[11px] font-medium text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/60">
              Incl. Other Money
            </span>
          )}
        </div>

        {/* Large Amount Display */}
        <div className="mb-6">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white flex items-baseline gap-1">
            <span>{formatCurrency(balance)}</span>
          </h2>
        </div>

        {/* Income and Expenses breakdown row */}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 sm:p-3.5 border border-white/5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-surface-400">Total Income</p>
              <p className="text-sm sm:text-base font-bold text-emerald-400 truncate">
                {formatCurrency(income)}
              </p>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 sm:p-3.5 border border-white/5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <TrendingDown className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-surface-400">Total Expenses</p>
              <p className="text-sm sm:text-base font-bold text-rose-400 truncate">
                {formatCurrency(expenses)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
