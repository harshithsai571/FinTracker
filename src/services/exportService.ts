import { Transaction } from '../types/transaction';
import { Category } from '../types/category';
import { MoneySource } from '../types/otherMoney';
import { Account } from '../types/account';
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
  accounts: Account[] = [],
  customFilename?: string
): string {
  const catMap = new Map(categories.map(c => [c.id, c.name]));
  const sourceMap = new Map(sources.map(s => [s.id, s.name]));
  const accMap = new Map(accounts.map(a => [a.id, a.name]));

  const headers = [
    'Date',
    'Time',
    'Type',
    'Amount',
    'Category',
    'Account',
    'To Account',
    'Payment Method',
    'External Source',
    'Description',
    'Transaction ID'
  ];

  const rows = transactions.map(tx => {
    let catDisplay = catMap.get(tx.categoryId || '') || '';
    if (tx.splits && tx.splits.length > 0) {
      catDisplay = `Split: ${tx.splits.map(s => `${s.categoryName || 'Cat'} (₹${s.amount})`).join('; ')}`;
    } else if (tx.type === 'transfer') {
      catDisplay = 'Transfer';
    } else if (tx.type === 'refund') {
      catDisplay = catDisplay ? `${catDisplay} (Refund)` : 'Refund';
    }

    const accDisplay = tx.accountId ? (accMap.get(tx.accountId) || 'Account') : 'Unassigned';
    const toAccDisplay = tx.toAccountId ? (accMap.get(tx.toAccountId) || 'Account') : '';

    return [
      escapeCsvField(tx.date),
      escapeCsvField(tx.time || ''),
      escapeCsvField(tx.type.toUpperCase()),
      escapeCsvField(tx.amount),
      escapeCsvField(catDisplay || 'Uncategorized'),
      escapeCsvField(accDisplay),
      escapeCsvField(toAccDisplay),
      escapeCsvField(tx.paymentMethod ? tx.paymentMethod.toUpperCase() : ''),
      escapeCsvField(tx.sourceId ? (sourceMap.get(tx.sourceId) || 'External') : ''),
      escapeCsvField(tx.description || ''),
      escapeCsvField(tx.id)
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const filename = customFilename || `FinTracker_Transactions_${getTodayString()}.csv`;
  downloadBlob(blob, filename);
  return filename;
}
