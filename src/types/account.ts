export type AccountType = 'cash' | 'bank' | 'upi' | 'wallet' | 'other';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  openingBalance: number;
  icon?: string;
  color?: string;
  note?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AccountBalanceSummary {
  account: Account;
  currentBalance: number;
  totalIncome: number;
  totalExpenses: number;
  totalTransfersIn: number;
  totalTransfersOut: number;
  totalRefunds: number;
  totalInflow: number;
  totalOutflow: number;
  transactionCount: number;
}
