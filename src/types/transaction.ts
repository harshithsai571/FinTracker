export type TransactionType = 'expense' | 'income';

export type PaymentMethod = 'cash' | 'upi' | 'card' | 'bank' | 'other';

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
  paymentMethod?: PaymentMethod | 'all';
  startDate?: string;
  endDate?: string;
  sortBy?: SortField;
  sortOrder?: SortOrder;
}
