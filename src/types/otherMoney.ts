export interface MoneySource {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  createdAt: string;
}

export interface MoneyReceipt {
  id: string;
  sourceId: string;
  amount: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SourceSummary {
  source: MoneySource;
  totalReceived: number;
  totalUsed: number;
  remaining: number;
  receiptCount: number;
  expenseCount: number;
}
