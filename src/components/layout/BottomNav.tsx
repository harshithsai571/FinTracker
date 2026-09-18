import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, ReceiptText, Plus, Landmark, MoreHorizontal } from 'lucide-react';
import { cn } from '../../utils/cn';

interface BottomNavProps {
  onOpenAddModal: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onOpenAddModal }) => {
  const navItems = [
    { to: '/', label: 'Home', icon: Home, end: true },
    { to: '/transactions', label: 'Transactions', icon: ReceiptText },
    // '+' is central action button
    { to: '/other-money', label: 'Other Money', icon: Landmark },
    { to: '/more', label: 'More', icon: MoreHorizontal },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 sm:hidden bg-white/95 dark:bg-surface-950/95 backdrop-blur-xl border-t border-surface-200/80 dark:border-surface-800/80 px-2 pt-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.4)]"
      style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom, 8px))' }}
    >
      <div className="flex items-center justify-around relative">
        {/* Home */}
        <NavLink
          to={navItems[0].to}
          end={navItems[0].end}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center min-w-[60px] min-h-[48px] py-1 gap-1 text-[10.5px] font-semibold transition-all select-none',
              isActive
                ? 'text-brand-600 dark:text-brand-400 font-bold'
                : 'text-surface-500 hover:text-surface-800 dark:text-surface-400 dark:hover:text-surface-200'
            )
          }
        >
          {({ isActive }) => {
            const Icon = navItems[0].icon;
            return (
              <>
                <Icon className={cn('w-5 h-5 transition-transform', isActive && 'scale-110')} />
                <span className="leading-tight">{navItems[0].label}</span>
              </>
            );
          }}
        </NavLink>

        {/* Transactions */}
        <NavLink
          to={navItems[1].to}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center min-w-[60px] min-h-[48px] py-1 gap-1 text-[10.5px] font-semibold transition-all select-none',
              isActive
                ? 'text-brand-600 dark:text-brand-400 font-bold'
                : 'text-surface-500 hover:text-surface-800 dark:text-surface-400 dark:hover:text-surface-200'
            )
          }
        >
          {({ isActive }) => {
            const Icon = navItems[1].icon;
            return (
              <>
                <Icon className={cn('w-5 h-5 transition-transform', isActive && 'scale-110')} />
                <span className="leading-tight">{navItems[1].label}</span>
              </>
            );
          }}
        </NavLink>

        {/* Central Prominent Floating '+' Action Button */}
        <div className="relative -top-5 flex flex-col items-center justify-center shrink-0">
          <button
            onClick={onOpenAddModal}
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-brand-600 via-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-brand-500/35 ring-4 ring-white dark:ring-surface-950 active:scale-90 hover:scale-105 transition-all focus:outline-none focus:ring-4 focus:ring-brand-500/40"
            aria-label="Add transaction"
          >
            <Plus className="w-7 h-7 stroke-[2.5]" />
          </button>
          <span className="text-[10px] font-bold text-surface-600 dark:text-surface-400 mt-1 select-none">
            Add
          </span>
        </div>

        {/* Other Money */}
        <NavLink
          to={navItems[2].to}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center min-w-[60px] min-h-[48px] py-1 gap-1 text-[10.5px] font-semibold transition-all select-none',
              isActive
                ? 'text-brand-600 dark:text-brand-400 font-bold'
                : 'text-surface-500 hover:text-surface-800 dark:text-surface-400 dark:hover:text-surface-200'
            )
          }
        >
          {({ isActive }) => {
            const Icon = navItems[2].icon;
            return (
              <>
                <Icon className={cn('w-5 h-5 transition-transform', isActive && 'scale-110')} />
                <span className="leading-tight">{navItems[2].label}</span>
              </>
            );
          }}
        </NavLink>

        {/* More / Settings */}
        <NavLink
          to={navItems[3].to}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center min-w-[60px] min-h-[48px] py-1 gap-1 text-[10.5px] font-semibold transition-all select-none',
              isActive
                ? 'text-brand-600 dark:text-brand-400 font-bold'
                : 'text-surface-500 hover:text-surface-800 dark:text-surface-400 dark:hover:text-surface-200'
            )
          }
        >
          {({ isActive }) => {
            const Icon = navItems[3].icon;
            return (
              <>
                <Icon className={cn('w-5 h-5 transition-transform', isActive && 'scale-110')} />
                <span className="leading-tight">{navItems[3].label}</span>
              </>
            );
          }}
        </NavLink>
      </div>
    </nav>
  );
};
