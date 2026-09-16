import { DBSchema } from 'idb';
import { Transaction } from '../types/transaction';
import { Category } from '../types/category';
import { MoneySource, MoneyReceipt } from '../types/otherMoney';

export interface FinTrackerDB extends DBSchema {
  transactions: {
    key: string;
    value: Transaction;
    indexes: {
      'by-date': string;
      'by-category': string;
      'by-source': string;
      'by-type': string;
    };
  };
  categories: {
    key: string;
    value: Category;
    indexes: {
      'by-group': string;
      'by-type': string;
    };
  };
  moneySources: {
    key: string;
    value: MoneySource;
  };
  moneyReceipts: {
    key: string;
    value: MoneyReceipt;
    indexes: {
      'by-source': string;
      'by-date': string;
    };
  };
  settings: {
    key: string;
    value: any;
  };
}

export const DB_NAME = 'fintracker_db';
export const DB_VERSION = 1;
