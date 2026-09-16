import { Transaction } from '../types/transaction';
import { Category } from '../types/category';
import { MoneySource } from '../types/otherMoney';
import { exportDatabaseBackup } from '../db';
import { escapeCsvField } from '../utils/sanitize';
import { getTodayString } from '../utils/dates';

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportCompleteBackupJson(): Promise<string> {
  const backup = await exportDatabaseBackup();
  const jsonStr = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const filename = `FinTracker_Backup_${getTodayString()}.json`;
  downloadBlob(blob, filename);
  return filename;
}

export function exportTransactionsToCsv(
  transactions: Transaction[],
  categories: Category[],
  sources: MoneySource[],
  customFilename?: string
): string {
  const catMap = new Map(categories.map(c => [c.id, c.name]));
  const sourceMap = new Map(sources.map(s => [s.id, s.name]));

  const headers = [
    'Date',
    'Time',
    'Type',
    'Amount',
    'Category',
    'Payment Method',
    'Paid From',
    'Description',
    'Transaction ID'
  ];

  const rows = transactions.map(tx => [
    escapeCsvField(tx.date),
    escapeCsvField(tx.time || ''),
    escapeCsvField(tx.type.toUpperCase()),
    escapeCsvField(tx.amount),
    escapeCsvField(catMap.get(tx.categoryId) || 'Uncategorized'),
    escapeCsvField(tx.paymentMethod.toUpperCase()),
    escapeCsvField(tx.sourceId ? (sourceMap.get(tx.sourceId) || 'Other Money') : 'Main Money'),
    escapeCsvField(tx.description || ''),
    escapeCsvField(tx.id)
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const filename = customFilename || `FinTracker_Transactions_${getTodayString()}.csv`;
  downloadBlob(blob, filename);
  return filename;
}
