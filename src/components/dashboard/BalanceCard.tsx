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
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-surface-900 via-surface-900 to-surface-950 text-white p-5 sm:p-7 shadow-elevated border border-surface-800/80 ring-1 ring-white/5">
      {/* Decorative gradient glowing orbs */}
      <div className="absolute -right-14 -top-14 w-52 h-52 bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-14 -bottom-14 w-44 h-44 bg-teal-600/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10">
        {/* Header Label Row */}
        <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-brand-400 shrink-0">
              <Wallet className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] sm:text-xs font-bold text-surface-300 uppercase tracking-wider truncate">
              Total Available Balance
            </span>
          </div>
          {otherMoneyRemaining > 0 && (
            <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-700/50 shrink-0 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Incl. Other Money</span>
            </span>
          )}
        </div>

        {/* Large Amount Display */}
        <div className="my-3 sm:my-4">
          <h2 className="text-3xl min-[360px]:text-3.5xl min-[390px]:text-4xl sm:text-5xl font-black tracking-tight text-white tabular-nums break-words leading-tight">
            {formatCurrency(balance)}
          </h2>
        </div>

        {/* Income and Expenses breakdown sub-cards */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 pt-4 border-t border-white/10">
          <div className="bg-white/[0.06] hover:bg-white/[0.09] transition-colors rounded-2xl p-3 sm:p-3.5 border border-white/10 flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10.5px] sm:text-[11px] font-medium text-surface-400">Total Income</p>
              <p className="text-xs min-[360px]:text-sm sm:text-base font-extrabold text-emerald-400 truncate tabular-nums">
                {formatCurrency(income)}
              </p>
            </div>
          </div>

          <div className="bg-white/[0.06] hover:bg-white/[0.09] transition-colors rounded-2xl p-3 sm:p-3.5 border border-white/10 flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <TrendingDown className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10.5px] sm:text-[11px] font-medium text-surface-400">Total Expenses</p>
              <p className="text-xs min-[360px]:text-sm sm:text-base font-extrabold text-rose-400 truncate tabular-nums">
                {formatCurrency(expenses)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
