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
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-surface-950/90 backdrop-blur-md border-b border-surface-200/80 dark:border-surface-800/80 px-4 py-3 transition-colors">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        {/* Brand Logo & Title */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 p-0.5 shadow-sm group-hover:scale-105 transition-transform flex items-center justify-center">
            <span className="text-white font-black text-xl leading-none">₹</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-extrabold tracking-tight text-surface-900 dark:text-white">
                FinTracker
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 bg-brand-100 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 rounded-md border border-brand-200/60 dark:border-brand-800/60">
                v{APP_VERSION}
              </span>
            </div>
            <p className="text-[10px] text-surface-500 dark:text-surface-400 font-medium leading-none">
              Local-First Finance
            </p>
          </div>
        </Link>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          {/* Quick Add on tablet/desktop */}
          <button
            onClick={onOpenAddModal}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-95"
          >
            <span className="text-base leading-none">+</span>
            <span>Add Transaction</span>
          </button>

          {/* Theme switcher */}
          <button
            onClick={cycleTheme}
            className="w-9 h-9 rounded-xl bg-surface-100 hover:bg-surface-200 dark:bg-surface-800 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-300 flex items-center justify-center transition-colors"
            title={`Theme: ${theme} (Click to toggle)`}
            aria-label="Toggle theme"
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
