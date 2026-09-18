export type TransactionType = 'expense' | 'income' | 'transfer' | 'refund';

export type PaymentMethod = 'cash' | 'upi' | 'card' | 'bank' | 'other';

export interface SplitItem {
  id?: string;
  categoryId: string;
  categoryName?: string;
  amount: number;
  note?: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  description?: string;
  paymentMethod: PaymentMethod;
  sourceId?: string | null; // null or empty for Main Money; source ID when paid from Other Money
  accountId?: string | null; // Source account (or Unassigned if null/undefined)
  toAccountId?: string | null; // Destination account for transfers
  linkedTransactionId?: string | null; // Referenced expense for refunds
  splits?: SplitItem[]; // Multi-category splits for expenses
  createdAt: string;
  updatedAt: string;
}

export type SortField = 'date' | 'amount';
export type SortOrder = 'desc' | 'asc';

export interface TransactionFilter {
  search?: string;
  type?: TransactionType | 'all';
  categoryId?: string | 'all';
  sourceId?: string | 'all';
  accountId?: string | 'all';
  paymentMethod?: PaymentMethod | 'all';
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: SortField;
  sortOrder?: SortOrder;
}

