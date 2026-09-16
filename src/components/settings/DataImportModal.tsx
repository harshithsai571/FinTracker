import React, { useState, useRef } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useFinance } from '../../context/FinanceContext';
import { useToast } from '../../context/ToastContext';
import {
  parseAndValidateJson,
  parseAndValidateCsv,
  executeImport,
  ImportPreviewResult
} from '../../services/importService';
import { Upload, FileCode, FileSpreadsheet, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';

interface DataImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataImportModal: React.FC<DataImportModalProps> = ({ isOpen, onClose }) => {
  const { transactions, categories, moneySources, refreshData } = useFinance();
  const { showSuccess, showError } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseError, setParseError] = useState<string>('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setParseError('');
    setPreview(null);
    setIsProcessing(true);

    try {
      const text = await selectedFile.text();
      const fileName = selectedFile.name.toLowerCase();

      let result: ImportPreviewResult;
      if (fileName.endsWith('.json')) {
        result = await parseAndValidateJson(text, transactions);
      } else if (fileName.endsWith('.csv')) {
        result = await parseAndValidateCsv(text, categories, moneySources, transactions);
      } else {
        throw new Error('Unsupported file format. Please choose a .json or .csv file.');
      }

      setPreview(result);
    } catch (err: any) {
      setParseError(err.message || 'Failed to parse file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!preview) return;
    setIsProcessing(true);
    try {
      const { importedCount } = await executeImport(preview, importMode);
      await refreshData();
      showSuccess('Data imported', `Successfully imported ${importedCount} transactions.`);
      onClose();
    } catch (err: any) {
      showError('Import Failed', err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setPreview(null);
    setParseError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetForm();
        onClose();
      }}
      title="Import Financial Data"
      description="Safely import transactions from a FinTracker JSON backup or CSV spreadsheet"
      maxWidth="lg"
    >
      <div className="space-y-4 pt-1">
        {/* File Drop / Select Area */}
        {!preview && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-surface-300 dark:border-surface-700 hover:border-brand-500 rounded-2xl p-8 text-center cursor-pointer bg-surface-50 dark:bg-surface-850 transition-colors"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json,.csv"
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-surface-900 dark:text-surface-100 mb-1">
              Select JSON or CSV File
            </h4>
            <p className="text-xs text-surface-500 dark:text-surface-400 max-w-xs mx-auto mb-3">
              Upload a .json backup file or a .csv transaction export
            </p>
            <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-surface-200 dark:bg-surface-800 text-xs font-semibold text-surface-700 dark:text-surface-300">
              Browse Files
            </span>
          </div>
        )}

        {parseError && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Parsing Error</p>
              <p>{parseError}</p>
            </div>
          </div>
        )}

        {/* Preview and Validation Report */}
        {preview && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-surface-100 dark:bg-surface-800 rounded-xl">
              <div className="flex items-center gap-2 min-w-0">
                {preview.fileType === 'json' ? (
                  <FileCode className="w-5 h-5 text-indigo-500 shrink-0" />
                ) : (
                  <FileSpreadsheet className="w-5 h-5 text-emerald-500 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-xs font-bold text-surface-900 dark:text-white truncate">
                    {file?.name}
                  </p>
                  <p className="text-[10px] text-surface-500 dark:text-surface-400 uppercase">
                    {preview.fileType} • {preview.totalFound} rows evaluated
                  </p>
                </div>
              </div>
              <button
                onClick={resetForm}
                className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-semibold"
              >
                Change File
              </button>
            </div>

            {/* Verification Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/60">
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold uppercase block">
                  Valid Transactions
                </span>
                <span className="text-lg font-black text-emerald-800 dark:text-emerald-300">
                  {preview.validTransactions.length}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/60">
                <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold uppercase block">
                  Potential Duplicates
                </span>
                <span className="text-lg font-black text-amber-800 dark:text-amber-300">
                  {preview.duplicateCount}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/60 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-rose-700 dark:text-rose-400 font-semibold uppercase block">
                  Invalid / Skipped
                </span>
                <span className="text-lg font-black text-rose-800 dark:text-rose-300">
                  {preview.errors.length}
                </span>
              </div>
            </div>

            {/* Error explanations if any */}
            {preview.errors.length > 0 && (
              <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-800/80 border border-surface-200 dark:border-surface-700 max-h-32 overflow-y-auto text-xs space-y-1">
                <p className="font-bold text-rose-600 dark:text-rose-400 mb-1 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Issues Found ({preview.errors.length}):
                </p>
                {preview.errors.slice(0, 10).map((err, idx) => (
                  <p key={idx} className="text-surface-600 dark:text-surface-300 text-[11px]">
                    • Row {err.row}: {err.reason}
                  </p>
                ))}
                {preview.errors.length > 10 && (
                  <p className="text-surface-400 text-[10px] italic">
                    ...and {preview.errors.length - 10} more rows
                  </p>
                )}
              </div>
            )}

            {/* Import Strategy: Merge vs Replace */}
            <div className="space-y-2 pt-1">
              <label className="text-xs font-bold text-surface-700 dark:text-surface-300 block">
                Import Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setImportMode('merge')}
                  className={`p-3 rounded-xl border text-left text-xs transition-all ${
                    importMode === 'merge'
                      ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-950/60 ring-1 ring-brand-500 text-brand-900 dark:text-white'
                      : 'border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300'
                  }`}
                >
                  <p className="font-bold">Merge Data</p>
                  <p className="text-[10px] text-surface-500 dark:text-surface-400">
                    Add new records to your existing database safely
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setImportMode('replace')}
                  className={`p-3 rounded-xl border text-left text-xs transition-all ${
                    importMode === 'replace'
                      ? 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/60 ring-1 ring-rose-500 text-rose-900 dark:text-white'
                      : 'border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300'
                  }`}
                >
                  <p className="font-bold text-rose-600 dark:text-rose-400">Replace Everything</p>
                  <p className="text-[10px] text-surface-500 dark:text-surface-400">
                    Wipes current database and restores backup
                  </p>
                </button>
              </div>
            </div>

            {/* Confirm & Execute Actions */}
            <div className="flex items-center gap-2 pt-3 border-t border-surface-100 dark:border-surface-800">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  resetForm();
                  onClose();
                }}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                variant={importMode === 'replace' ? 'danger' : 'primary'}
                className="flex-1 font-bold shadow-md"
                onClick={handleExecuteImport}
                isLoading={isProcessing}
                disabled={preview.validTransactions.length === 0}
              >
                Confirm & Import ({preview.validTransactions.length})
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
