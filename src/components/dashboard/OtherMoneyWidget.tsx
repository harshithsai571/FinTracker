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
      className="p-5 bg-gradient-to-br from-indigo-50/40 via-white to-surface-50 dark:from-indigo-950/30 dark:via-surface-900 dark:to-surface-900 border border-indigo-100 dark:border-indigo-900/50 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all group rounded-2xl"
    >
      <div className="flex items-center justify-between pb-3 border-b border-indigo-100/80 dark:border-indigo-900/50 mb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-200/60 dark:border-indigo-800/50">
            <Landmark className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm sm:text-base font-black text-surface-900 dark:text-surface-100 leading-tight">
                Other Money
              </h3>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 tabular-nums">
                {sourceCount}
              </span>
            </div>
            <p className="text-[10.5px] text-surface-500 dark:text-surface-400 font-medium">
              Family & separate sources
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/50 dark:border-indigo-800/50 text-xs font-bold text-indigo-600 dark:text-indigo-300 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/80 transition-all">
          <span>Manage</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-2.5 text-center">
        {/* Received */}
        <div className="p-2.5 sm:p-3 rounded-xl bg-white dark:bg-surface-800/70 border border-surface-200/60 dark:border-surface-700/60">
          <p className="text-[10px] font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-0.5">
            Received
          </p>
          <p className="text-xs sm:text-sm font-black text-surface-900 dark:text-white tabular-nums truncate">
            {formatCurrency(totalReceived)}
          </p>
        </div>

        {/* Used */}
        <div className="p-2.5 sm:p-3 rounded-xl bg-white dark:bg-surface-800/70 border border-surface-200/60 dark:border-surface-700/60">
          <p className="text-[10px] font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-0.5">
            Used
          </p>
          <p className="text-xs sm:text-sm font-black text-rose-600 dark:text-rose-400 tabular-nums truncate">
            {formatCurrency(totalUsed)}
          </p>
        </div>

        {/* Remaining (Prominent visual emphasis) */}
        <div className="p-2.5 sm:p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700/60 ring-1 ring-emerald-500/20 shadow-xs">
          <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-0.5 flex items-center justify-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span>Remaining</span>
          </p>
          <p className="text-xs sm:text-sm font-black text-emerald-700 dark:text-emerald-300 tabular-nums truncate">
            {formatCurrency(remaining)}
          </p>
        </div>
      </div>
    </Card>
  );
};
