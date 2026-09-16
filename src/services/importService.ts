import { Transaction, TransactionType, PaymentMethod } from '../types/transaction';
import { Category } from '../types/category';
import { MoneySource, MoneyReceipt } from '../types/otherMoney';
import { BackupData } from '../types/settings';
import {
  TransactionRepository,
  CategoryRepository,
  MoneySourceRepository,
  MoneyReceiptRepository,
  clearAllDatabaseData
} from '../db';
import { parseAmount } from '../utils/currency';

export interface ImportError {
  row: number;
  field?: string;
  reason: string;
}

export interface ImportPreviewResult {
  fileType: 'json' | 'csv';
  totalFound: number;
  validTransactions: Transaction[];
  validCategories: Category[];
  validSources: MoneySource[];
  validReceipts: MoneyReceipt[];
  duplicateCount: number;
  errors: ImportError[];
}

function parseDateString(raw: string): string | null {
  if (!raw) return null;
  const str = raw.trim();

  // Check YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // Check DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Fallback Date parser
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return null;
}

function parseCsvLines(csvText: string): string[][] {
  const lines: string[][] = [];
  let currentRow: string[] = [];
  let currentToken = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentToken += '"';
          i++; // Skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        currentToken += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentToken.trim());
        currentToken = '';
      } else if (char === '\r') {
        // Ignore carriage return
      } else if (char === '\n') {
        currentRow.push(currentToken.trim());
        if (currentRow.some(c => c.length > 0)) {
          lines.push(currentRow);
        }
        currentRow = [];
        currentToken = '';
      } else {
        currentToken += char;
      }
    }
  }

  if (currentToken.length > 0 || currentRow.length > 0) {
    currentRow.push(currentToken.trim());
    if (currentRow.some(c => c.length > 0)) {
      lines.push(currentRow);
    }
  }

  return lines;
}

export async function parseAndValidateJson(
  jsonText: string,
  existingTransactions: Transaction[]
): Promise<ImportPreviewResult> {
  const errors: ImportError[] = [];
  let data: any;

  try {
    data = JSON.parse(jsonText);
  } catch (err: any) {
    return {
      fileType: 'json',
      totalFound: 0,
      validTransactions: [],
      validCategories: [],
      validSources: [],
      validReceipts: [],
      duplicateCount: 0,
      errors: [{ row: 0, reason: `Invalid JSON syntax: ${err.message}` }]
    };
  }

  if (!data || typeof data !== 'object') {
    return {
      fileType: 'json',
      totalFound: 0,
      validTransactions: [],
      validCategories: [],
      validSources: [],
      validReceipts: [],
      duplicateCount: 0,
      errors: [{ row: 0, reason: 'Root object must be a valid JSON dictionary' }]
    };
  }

  const rawTxList = Array.isArray(data.transactions) ? data.transactions : [];
  const validTransactions: Transaction[] = [];
  const existingIds = new Set(existingTransactions.map(t => t.id));
  const existingFingerprints = new Set(
    existingTransactions.map(t => `${t.date}_${t.time}_${t.amount}_${t.categoryId}`)
  );

  let duplicateCount = 0;

  rawTxList.forEach((tx: any, idx: number) => {
    const rowNum = idx + 1;
    if (!tx || typeof tx !== 'object') {
      errors.push({ row: rowNum, reason: 'Transaction record is not an object' });
      return;
    }

    const amount = Number(tx.amount);
    if (isNaN(amount) || amount <= 0) {
      errors.push({ row: rowNum, field: 'amount', reason: `Amount must be a positive number (got: ${tx.amount})` });
      return;
    }

    const type: TransactionType = tx.type === 'income' ? 'income' : 'expense';
    const date = parseDateString(tx.date);
    if (!date) {
      errors.push({ row: rowNum, field: 'date', reason: `Invalid date format: ${tx.date}` });
      return;
    }

    const categoryId = tx.categoryId || (type === 'income' ? 'cat-other-income' : 'cat-miscellaneous');
    const paymentMethod: PaymentMethod = ['cash', 'upi', 'card', 'bank', 'other'].includes(tx.paymentMethod)
      ? tx.paymentMethod
      : 'upi';

    const id = tx.id || `tx-imp-${Date.now()}-${idx}`;
    const fingerprint = `${date}_${tx.time || ''}_${amount}_${categoryId}`;

    if (existingIds.has(id) || existingFingerprints.has(fingerprint)) {
      duplicateCount++;
    }

    validTransactions.push({
      id,
      amount,
      type,
      categoryId,
      date,
      time: tx.time || '12:00',
      description: tx.description ? String(tx.description) : '',
      paymentMethod,
      sourceId: tx.sourceId || null,
      createdAt: tx.createdAt || new Date().toISOString(),
      updatedAt: tx.updatedAt || new Date().toISOString(),
    });
  });

  const validCategories: Category[] = Array.isArray(data.categories) ? data.categories : [];
  const validSources: MoneySource[] = Array.isArray(data.moneySources) ? data.moneySources : [];
  const validReceipts: MoneyReceipt[] = Array.isArray(data.moneyReceipts) ? data.moneyReceipts : [];

  return {
    fileType: 'json',
    totalFound: rawTxList.length,
    validTransactions,
    validCategories,
    validSources,
    validReceipts,
    duplicateCount,
    errors,
  };
}

export async function parseAndValidateCsv(
  csvText: string,
  categories: Category[],
  sources: MoneySource[],
  existingTransactions: Transaction[]
): Promise<ImportPreviewResult> {
  const rows = parseCsvLines(csvText);
  if (rows.length < 2) {
    return {
      fileType: 'csv',
      totalFound: 0,
      validTransactions: [],
      validCategories: [],
      validSources: [],
      validReceipts: [],
      duplicateCount: 0,
      errors: [{ row: 0, reason: 'CSV file contains no data rows' }]
    };
  }

  // Header detection
  const headers = rows[0].map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const dateIdx = headers.findIndex(h => h.includes('date'));
  const timeIdx = headers.findIndex(h => h.includes('time'));
  const typeIdx = headers.findIndex(h => h.includes('type'));
  const amountIdx = headers.findIndex(h => h.includes('amount') || h.includes('rupee') || h.includes('inr'));
  const catIdx = headers.findIndex(h => h.includes('category') || h.includes('cat'));
  const methodIdx = headers.findIndex(h => h.includes('method') || h.includes('payment'));
  const sourceIdx = headers.findIndex(h => h.includes('source') || h.includes('paidfrom'));
  const descIdx = headers.findIndex(h => h.includes('desc') || h.includes('note') || h.includes('particular'));
  const idIdx = headers.findIndex(h => h === 'id' || h.includes('transactionid'));

  if (amountIdx === -1 || dateIdx === -1) {
    return {
      fileType: 'csv',
      totalFound: 0,
      validTransactions: [],
      validCategories: [],
      validSources: [],
      validReceipts: [],
      duplicateCount: 0,
      errors: [{ row: 1, reason: 'Missing required header columns: Date and Amount must be present in the CSV' }]
    };
  }

  const catMap = new Map<string, string>();
  categories.forEach(c => {
    catMap.set(c.name.toLowerCase().trim(), c.id);
  });

  const sourceMap = new Map<string, string>();
  sources.forEach(s => {
    sourceMap.set(s.name.toLowerCase().trim(), s.id);
  });

  const existingIds = new Set(existingTransactions.map(t => t.id));
  const existingFingerprints = new Set(
    existingTransactions.map(t => `${t.date}_${t.time}_${t.amount}_${t.categoryId}`)
  );

  const validTransactions: Transaction[] = [];
  const errors: ImportError[] = [];
  let duplicateCount = 0;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 1;

    const rawAmount = row[amountIdx];
    const amount = parseAmount(rawAmount);
    if (amount <= 0) {
      errors.push({ row: rowNum, field: 'Amount', reason: `Invalid or zero amount: "${rawAmount}"` });
      continue;
    }

    const rawDate = row[dateIdx];
    const date = parseDateString(rawDate);
    if (!date) {
      errors.push({ row: rowNum, field: 'Date', reason: `Unrecognized date format: "${rawDate}"` });
      continue;
    }

    // Determine type
    let type: TransactionType = 'expense';
    if (typeIdx !== -1 && row[typeIdx]) {
      const rawType = row[typeIdx].toLowerCase();
      if (rawType.includes('inc') || rawType.includes('credit') || rawType.includes('+')) {
        type = 'income';
      }
    }

    // Determine category
    let categoryId = type === 'income' ? 'cat-other-income' : 'cat-miscellaneous';
    if (catIdx !== -1 && row[catIdx]) {
      const rawCat = row[catIdx].toLowerCase().trim();
      const matched = catMap.get(rawCat);
      if (matched) {
        categoryId = matched;
      }
    }

    // Determine payment method
    let paymentMethod: PaymentMethod = 'upi';
    if (methodIdx !== -1 && row[methodIdx]) {
      const rawMethod = row[methodIdx].toLowerCase().trim();
      if (['cash', 'upi', 'card', 'bank', 'other'].includes(rawMethod)) {
        paymentMethod = rawMethod as PaymentMethod;
      }
    }

    // Determine source
    let sourceId: string | null = null;
    if (sourceIdx !== -1 && row[sourceIdx]) {
      const rawSource = row[sourceIdx].toLowerCase().trim();
      if (rawSource !== 'main money' && rawSource !== 'none') {
        sourceId = sourceMap.get(rawSource) || null;
      }
    }

    const time = (timeIdx !== -1 && row[timeIdx]) ? row[timeIdx].trim() : '12:00';
    const description = (descIdx !== -1 && row[descIdx]) ? row[descIdx].trim() : '';
    const id = (idIdx !== -1 && row[idIdx]) ? row[idIdx].trim() : `tx-csv-${Date.now()}-${i}`;

    const fingerprint = `${date}_${time}_${amount}_${categoryId}`;
    if (existingIds.has(id) || existingFingerprints.has(fingerprint)) {
      duplicateCount++;
    }

    validTransactions.push({
      id,
      amount,
      type,
      categoryId,
      date,
      time,
      description,
      paymentMethod,
      sourceId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  return {
    fileType: 'csv',
    totalFound: rows.length - 1,
    validTransactions,
    validCategories: [],
    validSources: [],
    validReceipts: [],
    duplicateCount,
    errors,
  };
}

export async function executeImport(
  preview: ImportPreviewResult,
  mode: 'merge' | 'replace'
): Promise<{ importedCount: number }> {
  if (mode === 'replace') {
    await clearAllDatabaseData();
  }

  if (preview.validCategories.length > 0) {
    await CategoryRepository.bulkInsert(preview.validCategories);
  }

  if (preview.validSources.length > 0) {
    await MoneySourceRepository.bulkInsert(preview.validSources);
  }

  if (preview.validReceipts.length > 0) {
    await MoneyReceiptRepository.bulkInsert(preview.validReceipts);
  }

  if (preview.validTransactions.length > 0) {
    await TransactionRepository.bulkInsert(preview.validTransactions);
  }

  return { importedCount: preview.validTransactions.length };
}
