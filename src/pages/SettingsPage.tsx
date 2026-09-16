import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useFinance } from '../context/FinanceContext';
import { useToast } from '../context/ToastContext';
import { usePwaUpdate } from '../hooks/usePwaUpdate';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { DataImportModal } from '../components/settings/DataImportModal';
import { exportCompleteBackupJson, exportTransactionsToCsv } from '../services/exportService';
import { APP_VERSION, APP_RELEASE_DATE, APP_CHANGELOG } from '../config/version';
import {
  Sun,
  Moon,
  Laptop,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  Info,
  ShieldAlert,
  FileSpreadsheet,
  FileCode,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { transactions, categories, moneySources, resetAllData } = useFinance();
  const { showSuccess, showError } = useToast();
  const { checking, checkForUpdates } = usePwaUpdate();

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [exporting, setExporting] = useState<'json' | 'csv' | null>(null);

  const handleExportJson = async () => {
    setExporting('json');
    try {
      const filename = await exportCompleteBackupJson();
      showSuccess('Backup exported', `Saved file: ${filename}`);
    } catch (err: any) {
      showError('Export Failed', err.message);
    } finally {
      setExporting(null);
    }
  };

  const handleExportCsv = async () => {
    setExporting('csv');
    try {
      const filename = exportTransactionsToCsv(transactions, categories, moneySources);
      showSuccess('Spreadsheet exported', `Saved file: ${filename}`);
    } catch (err: any) {
      showError('Export Failed', err.message);
    } finally {
      setExporting(null);
    }
  };

  const handleClearAllData = async () => {
    setIsClearing(true);
    try {
      await resetAllData();
      setShowClearConfirm(false);
    } catch (err: any) {
      showError('Reset Error', err.message);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-surface-900 dark:text-white tracking-tight">
          Settings
        </h2>
        <p className="text-xs text-surface-500 dark:text-surface-400">
          Preferences, data backups, and application configuration
        </p>
      </div>

      {/* 1. Appearance */}
      <Card className="p-5 space-y-4">
        <h3 className="text-sm font-bold text-surface-900 dark:text-surface-100 flex items-center gap-2">
          <Sun className="w-4 h-4 text-amber-500" />
          Appearance & Theme
        </h3>

        <div className="grid grid-cols-3 gap-2.5">
          <button
            onClick={() => setTheme('light')}
            className={`p-3 rounded-2xl border text-center transition-all ${
              theme === 'light'
                ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-950/60 ring-1 ring-brand-500 text-brand-900 dark:text-brand-100'
                : 'border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300'
            }`}
          >
            <Sun className="w-5 h-5 mx-auto mb-1.5 text-amber-500" />
            <p className="text-xs font-bold">Light</p>
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={`p-3 rounded-2xl border text-center transition-all ${
              theme === 'dark'
                ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-950/60 ring-1 ring-brand-500 text-brand-900 dark:text-brand-100'
                : 'border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300'
            }`}
          >
            <Moon className="w-5 h-5 mx-auto mb-1.5 text-indigo-400" />
            <p className="text-xs font-bold">Dark</p>
          </button>

          <button
            onClick={() => setTheme('system')}
            className={`p-3 rounded-2xl border text-center transition-all ${
              theme === 'system'
                ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-950/60 ring-1 ring-brand-500 text-brand-900 dark:text-brand-100'
                : 'border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300'
            }`}
          >
            <Laptop className="w-5 h-5 mx-auto mb-1.5 text-brand-500" />
            <p className="text-xs font-bold">System</p>
          </button>
        </div>
      </Card>

      {/* 2. Currency */}
      <Card className="p-5 space-y-2">
        <h3 className="text-sm font-bold text-surface-900 dark:text-surface-100">
          Primary Currency
        </h3>
        <p className="text-xs text-surface-500 dark:text-surface-400">
          FinTracker is designed natively around the Indian Rupee with Indian number formatting (Lakhs & Crores).
        </p>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-50 dark:bg-surface-800/80 border border-surface-200 dark:border-surface-700">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-base shadow-xs">
            ₹
          </div>
          <div>
            <p className="text-xs font-bold text-surface-900 dark:text-surface-100">
              Indian Rupee (₹ INR)
            </p>
            <p className="text-[11px] text-surface-500 dark:text-surface-400">
              Default system currency format: ₹1,25,000
            </p>
          </div>
        </div>
      </Card>

      {/* 3. Data Management: Export, Import, Reset */}
      <Card className="p-5 space-y-4">
        <h3 className="text-sm font-bold text-surface-900 dark:text-surface-100">
          Data Management & Backups
        </h3>
        <p className="text-xs text-surface-500 dark:text-surface-400">
          FinTracker stores all data locally in your browser's IndexedDB. Export regular backups to protect your data.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* JSON Full Backup */}
          <button
            onClick={handleExportJson}
            disabled={!!exporting}
            className="p-3.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 hover:border-brand-500 text-left transition-all flex items-start gap-3 group"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-surface-900 dark:text-surface-100 group-hover:text-brand-600 dark:group-hover:text-brand-400">
                Export JSON Backup
              </p>
              <p className="text-[11px] text-surface-500 dark:text-surface-400 mt-0.5">
                Full snapshot with transactions, categories, and other money
              </p>
            </div>
          </button>

          {/* CSV Spreadsheet Export */}
          <button
            onClick={handleExportCsv}
            disabled={!!exporting}
            className="p-3.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 hover:border-brand-500 text-left transition-all flex items-start gap-3 group"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-surface-900 dark:text-surface-100 group-hover:text-brand-600 dark:group-hover:text-brand-400">
                Export CSV Transactions
              </p>
              <p className="text-[11px] text-surface-500 dark:text-surface-400 mt-0.5">
                Formatted for Excel, Google Sheets, or LibreOffice
              </p>
            </div>
          </button>
        </div>

        {/* Import Action */}
        <div className="pt-2 border-t border-surface-100 dark:border-surface-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-surface-900 dark:text-surface-100">
              Restore or Import Data
            </p>
            <p className="text-[11px] text-surface-500 dark:text-surface-400">
              Import existing records from JSON backup or CSV files
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsImportModalOpen(true)}
            leftIcon={<Upload className="w-3.5 h-3.5" />}
            className="text-xs font-semibold"
          >
            Import File
          </Button>
        </div>

        {/* Destructive Clear All Data */}
        <div className="pt-3 border-t border-rose-100 dark:border-rose-950/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              Reset All Financial Data
            </p>
            <p className="text-[11px] text-surface-500 dark:text-surface-400">
              Wipes all local transactions, receipts, and custom categories
            </p>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowClearConfirm(true)}
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            className="text-xs font-bold"
          >
            Clear All Data
          </Button>
        </div>
      </Card>

      {/* 4. App Information & Updates */}
      <Card className="p-5 space-y-4">
        <h3 className="text-sm font-bold text-surface-900 dark:text-surface-100 flex items-center gap-2">
          <Info className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          About FinTracker
        </h3>

        <div className="flex items-center justify-between p-3 rounded-xl bg-surface-50 dark:bg-surface-800/80 border border-surface-200 dark:border-surface-700">
          <div>
            <p className="text-xs font-bold text-surface-900 dark:text-surface-100">
              Installed Version
            </p>
            <p className="text-[11px] text-surface-500 dark:text-surface-400">
              v{APP_VERSION} • {APP_RELEASE_DATE}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await checkForUpdates();
              showSuccess('Update Check Complete', 'You are running the latest version of FinTracker.');
            }}
            isLoading={checking}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            className="text-xs font-semibold"
          >
            Check for updates
          </Button>
        </div>

        {/* Release Highlights */}
        <div className="space-y-2 pt-1">
          <p className="text-xs font-bold text-surface-700 dark:text-surface-300">
            {APP_CHANGELOG[0]?.title}
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-surface-600 dark:text-surface-400">
            {APP_CHANGELOG[0]?.highlights.map((h, i) => (
              <li key={i} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>
      </Card>

      {/* Data Import Modal */}
      <DataImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      {/* Clear Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClearAllData}
        title="Permanently Delete All Data?"
        message="This action will permanently wipe all your recorded transactions, custom categories, and Other Money entries from IndexedDB. Default categories will be restored. Make sure you have exported a JSON backup first if you want to keep your records."
        confirmText="Yes, Wipe All Data"
        isDestructive={true}
        isLoading={isClearing}
      />
    </div>
  );
};
