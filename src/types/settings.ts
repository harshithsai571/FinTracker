export type ThemePreference = 'system' | 'light' | 'dark';

export interface AppSettings {
  currencyCode: string;
  currencySymbol: string;
  theme: ThemePreference;
  appVersion: string;
  initialized: boolean;
}

export interface BackupData {
  version: string;
  exportedAt: string;
  transactions: import('./transaction').Transaction[];
  categories: import('./category').Category[];
  moneySources: import('./otherMoney').MoneySource[];
  moneyReceipts: import('./otherMoney').MoneyReceipt[];
  settings: AppSettings;
}
