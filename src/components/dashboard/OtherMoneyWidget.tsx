import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Landmark, ArrowRight, Wallet, CheckCircle2 } from 'lucide-react';
import { Card } from '../common/Card';
import { formatCurrency } from '../../utils/currency';

interface OtherMoneyWidgetProps {
  totalReceived: number;
  totalUsed: number;
  remaining: number;
  sourceCount: number;
}

export const OtherMoneyWidget: React.FC<OtherMoneyWidgetProps> = ({
  totalReceived,
  totalUsed,
  remaining,
  sourceCount,
}) => {
  const navigate = useNavigate();

  return (
    <Card
      interactive
      onClick={() => navigate('/other-money')}
      className="p-5 bg-gradient-to-br from-indigo-900/10 via-brand-900/5 to-surface-50 dark:from-indigo-950/40 dark:via-brand-950/30 dark:to-surface-900 border-indigo-200/60 dark:border-indigo-800/40 hover:border-indigo-400 group"
    >
      <div className="flex items-center justify-between pb-3 border-b border-indigo-100 dark:border-indigo-900/50 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Landmark className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-surface-900 dark:text-surface-100 leading-tight">
              Other Money
            </h3>
            <p className="text-[10px] text-surface-500 dark:text-surface-400">
              Family & separate sources ({sourceCount})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform">
          <span>Manage</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2.5 rounded-xl bg-white/70 dark:bg-surface-800/80 border border-surface-200/50 dark:border-surface-700/50">
          <p className="text-[10px] font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-0.5">
            Received
          </p>
          <p className="text-xs sm:text-sm font-extrabold text-surface-900 dark:text-white truncate">
            {formatCurrency(totalReceived)}
          </p>
        </div>

        <div className="p-2.5 rounded-xl bg-white/70 dark:bg-surface-800/80 border border-surface-200/50 dark:border-surface-700/50">
          <p className="text-[10px] font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-0.5">
            Used
          </p>
          <p className="text-xs sm:text-sm font-extrabold text-rose-600 dark:text-rose-400 truncate">
            {formatCurrency(totalUsed)}
          </p>
        </div>

        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/50">
          <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-0.5">
            Remaining
          </p>
          <p className="text-xs sm:text-sm font-extrabold text-emerald-700 dark:text-emerald-300 truncate">
            {formatCurrency(remaining)}
          </p>
        </div>
      </div>
    </Card>
  );
};
