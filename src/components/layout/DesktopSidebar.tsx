import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  ReceiptText,
  Landmark,
  PieChart,
  Tag,
  Settings,
  Plus
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface DesktopSidebarProps {
  onOpenAddModal: () => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({ onOpenAddModal }) => {
  const links = [
    { to: '/', label: 'Dashboard', icon: Home, end: true },
    { to: '/transactions', label: 'Transactions', icon: ReceiptText },
    { to: '/other-money', label: 'Other Money', icon: Landmark },
    { to: '/reports', label: 'Reports & Insights', icon: PieChart },
    { to: '/categories', label: 'Categories', icon: Tag },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="hidden sm:flex flex-col w-64 border-r border-surface-200/80 dark:border-surface-800/80 bg-white/60 dark:bg-surface-950/60 p-4 shrink-0 h-[calc(100vh-61px)] sticky top-[61px]">
      <button
        onClick={onOpenAddModal}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-700 hover:to-emerald-700 text-white py-3 px-4 rounded-xl font-bold text-sm shadow-sm transition-all duration-150 active:scale-[0.98] mb-6"
      >
        <Plus className="w-5 h-5 stroke-[2.5]" />
        <span>Add Transaction</span>
      </button>

      <nav className="flex flex-col gap-1.5 flex-1">
        {links.map(link => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors',
                  isActive
                    ? 'bg-brand-50 dark:bg-brand-950/70 text-brand-700 dark:text-brand-300 border border-brand-200/50 dark:border-brand-800/40'
                    : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-900 hover:text-surface-900 dark:hover:text-surface-100'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn('w-5 h-5', isActive ? 'text-brand-600 dark:text-brand-400' : 'opacity-70')} />
                  <span>{link.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="pt-4 border-t border-surface-100 dark:border-surface-800/80 text-[11px] text-surface-400 dark:text-surface-500 text-center">
        FinTracker • Local-First PWA
      </div>
    </aside>
  );
};
