import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/common/Card';
import {
  PieChart,
  Tag,
  Wallet,
  Settings,
  Download,
  Upload,
  ChevronRight,
  Info,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { APP_VERSION, APP_NAME } from '../config/version';

export const MorePage: React.FC = () => {
  const menuSections = [
    {
      title: 'Money & Accounts',
      items: [
        {
          to: '/accounts',
          label: 'Accounts & Wallets',
          desc: 'Cash in Hand, Bank Accounts, UPI, and Wallets',
          icon: Wallet,
          color: 'bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400',
        },
      ],
    },
    {
      title: 'Analytics & Structure',
      items: [
        {
          to: '/reports',
          label: 'Reports & Insights',
          desc: 'Monthly trends, savings rate, category breakdowns',
          icon: PieChart,
          color: 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400',
        },
        {
          to: '/categories',
          label: 'Manage Categories',
          desc: 'Add, edit, and organize custom categories',
          icon: Tag,
          color: 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400',
        },
      ],
    },
    {
      title: 'Preferences & Storage',
      items: [
        {
          to: '/settings',
          label: 'Settings & Data Backup',
          desc: 'Theme, currency, export backup, and restore',
          icon: Settings,
          color: 'bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400',
        },
      ],
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Profile / Brand Header */}
      <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-700 text-white shadow-soft">
        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center font-black text-2xl">
          ₹
        </div>
        <div>
          <h2 className="text-lg font-extrabold">{APP_NAME}</h2>
          <p className="text-xs text-brand-100">Local-First Finance • v{APP_VERSION}</p>
        </div>
      </div>

      {/* Menu Groups */}
      {menuSections.map((sec, idx) => (
        <div key={idx} className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400 px-1">
            {sec.title}
          </h3>
          <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200/80 dark:border-surface-800 shadow-soft overflow-hidden divide-y divide-surface-100 dark:divide-surface-800">
            {sec.items.map((item, itemIdx) => {
              const Icon = item.icon;
              return (
                <Link
                  key={itemIdx}
                  to={item.to}
                  className="flex items-center justify-between p-4 hover:bg-surface-50 dark:hover:bg-surface-800/60 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-surface-900 dark:text-surface-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                        {item.label}
                      </p>
                      <p className="text-xs text-surface-500 dark:text-surface-400 truncate">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-surface-400 group-hover:translate-x-0.5 transition-transform shrink-0 ml-2" />
                </Link>
              );
            })}
          </div>
        </div>
      ))}

      {/* Privacy & Offline Notice */}
      <div className="p-4 rounded-2xl bg-surface-100/70 dark:bg-surface-850 border border-surface-200/60 dark:border-surface-800/80 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs text-surface-600 dark:text-surface-400 leading-relaxed">
          <p className="font-bold text-surface-900 dark:text-surface-100 mb-0.5">
            100% Local & Private
          </p>
          Your financial transactions never leave this device. FinTracker runs offline without cloud servers or tracking cookies.
        </div>
      </div>
    </div>
  );
};
