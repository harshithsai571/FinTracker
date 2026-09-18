import React from 'react';
import { Link } from 'react-router-dom';
import { Sun, Moon, Sparkles } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { APP_VERSION } from '../../config/version';

interface HeaderProps {
  onOpenAddModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAddModal }) => {
  const { theme, setTheme, isDark } = useTheme();

  const cycleTheme = () => {
    if (theme === 'system') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('system');
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-surface-950/90 backdrop-blur-md border-b border-surface-200/70 dark:border-surface-800/70 px-4 pt-[env(safe-area-inset-top,0px)] transition-colors">
      <div className="max-w-5xl mx-auto flex items-center justify-between h-14 sm:h-16">
        {/* Brand Logo & Title */}
        <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group select-none">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-emerald-500 to-teal-400 p-0.5 shadow-sm shadow-brand-500/20 ring-1 ring-brand-500/20 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
            <span className="text-white font-black text-lg sm:text-xl leading-none">₹</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-base sm:text-lg font-black tracking-tight text-surface-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                FinTracker
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-brand-50 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 rounded-md border border-brand-200/70 dark:border-brand-800/60 tabular-nums">
                v{APP_VERSION}
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-surface-500 dark:text-surface-400 font-medium leading-none">
              Local-First Finance
            </p>
          </div>
        </Link>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          {/* Quick Add on tablet/desktop */}
          <button
            onClick={onOpenAddModal}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white rounded-xl text-xs font-semibold shadow-sm shadow-brand-600/20 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            aria-label="Add transaction"
          >
            <span className="text-sm leading-none font-bold">+</span>
            <span>Add Transaction</span>
          </button>

          {/* Theme switcher */}
          <button
            onClick={cycleTheme}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-surface-100 hover:bg-surface-200/80 dark:bg-surface-800/80 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-300 flex items-center justify-center transition-all active:scale-95 border border-surface-200/50 dark:border-surface-700/50 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            title={`Theme: ${theme} (Click to toggle)`}
            aria-label={`Toggle theme (currently ${theme})`}
          >
            {theme === 'system' ? (
              <Sparkles className="w-4 h-4 text-brand-500" />
            ) : isDark ? (
              <Moon className="w-4 h-4 text-indigo-400" />
            ) : (
              <Sun className="w-4 h-4 text-amber-500" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
