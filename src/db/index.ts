import { openDB, IDBPDatabase } from 'idb';
import { FinTrackerDB, DB_NAME, DB_VERSION } from './schema';
import { Transaction } from '../types/transaction';
import { Category } from '../types/category';
import { MoneySource, MoneyReceipt, SourceSummary } from '../types/otherMoney';
import { Account } from '../types/account';
import { AppSettings, BackupData } from '../types/settings';
import { DEFAULT_CATEGORIES, DEFAULT_MONEY_SOURCES } from '../config/defaultCategories';
import { APP_VERSION } from '../config/version';

let dbPromise: Promise<IDBPDatabase<FinTrackerDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<FinTrackerDB>> {
  if (!dbPromise) {
    dbPromise = openDB<FinTrackerDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        // Store: transactions
        let txStore;
        if (!db.objectStoreNames.contains('transactions')) {
          txStore = db.createObjectStore('transactions', { keyPath: 'id' });
          txStore.createIndex('by-date', 'date');
          txStore.createIndex('by-category', 'categoryId');
          txStore.createIndex('by-source', 'sourceId');
          txStore.createIndex('by-type', 'type');
        } else {
          txStore = transaction.objectStore('transactions');
        }

        // Store: categories
        if (!db.objectStoreNames.contains('categories')) {
          const catStore = db.createObjectStore('categories', { keyPath: 'id' });
          catStore.createIndex('by-group', 'group');
          catStore.createIndex('by-type', 'type');
        }

        // Store: moneySources
        if (!db.objectStoreNames.contains('moneySources')) {
          db.createObjectStore('moneySources', { keyPath: 'id' });
        }

        // Store: moneyReceipts
        if (!db.objectStoreNames.contains('moneyReceipts')) {
          const receiptStore = db.createObjectStore('moneyReceipts', { keyPath: 'id' });
          receiptStore.createIndex('by-source', 'sourceId');
          receiptStore.createIndex('by-date', 'date');
        }

        // Store: settings
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }

        // v2 Migration: accounts store & by-account index
        if (!db.objectStoreNames.contains('accounts')) {
          const accStore = db.createObjectStore('accounts', { keyPath: 'id' });
          accStore.createIndex('by-type', 'type');
          accStore.createIndex('by-archived', 'isArchived');
        }

        if (txStore && !txStore.indexNames.contains('by-account')) {
          txStore.createIndex('by-account', 'accountId');
        }
      },
    });
  }
  return dbPromise;
}

// Seed Initial Defaults if database is empty
export async function seedInitialDataIfNeeded(): Promise<void> {
  const db = await getDB();
  const catCount = await db.count('categories');
  if (catCount === 0) {
    const tx = db.transaction(['categories', 'moneySources', 'settings'], 'readwrite');
    const now = new Date().toISOString();

    for (const cat of DEFAULT_CATEGORIES) {
      await tx.objectStore('categories').put({
        ...cat,
        createdAt: now,
      });
    }

    for (const source of DEFAULT_MONEY_SOURCES) {
      await tx.objectStore('moneySources').put({
        ...source,
        createdAt: now,
      });
    }

    await tx.objectStore('settings').put({
      currencyCode: 'INR',
      currencySymbol: '₹',
      theme: 'system',
      appVersion: APP_VERSION,
      initialized: true,
    }, 'app_settings');

    await tx.done;
  }
}

// Repositories
export const TransactionRepository = {
  async getAll(): Promise<Transaction[]> {
    const db = await getDB();
    const txs = await db.getAll('transactions');
    return txs.sort((a, b) => {
      const dtA = `${a.date}T${a.time || '00:00'}`;
      const dtB = `${b.date}T${b.time || '00:00'}`;
      return dtB.localeCompare(dtA);
    });
  },

  async getById(id: string): Promise<Transaction | undefined> {
    const db = await getDB();
    return db.get('transactions', id);
  },

  async getBySourceId(sourceId: string): Promise<Transaction[]> {
    const db = await getDB();
    const index = db.transaction('transactions').store.index('by-source');
    return index.getAll(sourceId);
  },

  async getByCategoryId(categoryId: string): Promise<Transaction[]> {
    const db = await getDB();
    const index = db.transaction('transactions').store.index('by-category');
    return index.getAll(categoryId);
  },

  async create(data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Transaction> {
    const db = await getDB();
    const now = new Date().toISOString();
    const id = data.id || `tx-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const tx: Transaction = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    await db.put('transactions', tx);
    return tx;
  },

  async update(id: string, data: Partial<Transaction>): Promise<Transaction> {
    const db = await getDB();
    const existing = await db.get('transactions', id);
    if (!existing) {
      throw new Error(`Transaction ${id} not found`);
    }
    const updated: Transaction = {
      ...existing,
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    };
    await db.put('transactions', updated);
    return updated;
  },

  async delete(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('transactions', id);
  },

  async bulkInsert(transactions: Transaction[]): Promise<void> {
    const db = await getDB();
    const tx = db.transaction('transactions', 'readwrite');
    for (const item of transactions) {
      await tx.store.put(item);
    }
    await tx.done;
  },

  async migrateCategory(fromCategoryId: string, toCategoryId: string): Promise<number> {
    const db = await getDB();
    const tx = db.transaction('transactions', 'readwrite');
    let count = 0;
    let cursor = await tx.store.index('by-category').openCursor(fromCategoryId);
    while (cursor) {
      const updated = { ...cursor.value, categoryId: toCategoryId, updatedAt: new Date().toISOString() };
      await cursor.update(updated);
      count++;
      cursor = await cursor.continue();
    }
    await tx.done;
    return count;
  }
};

export const CategoryRepository = {
  async getAll(): Promise<Category[]> {
    const db = await getDB();
    return db.getAll('categories');
  },

  async getById(id: string): Promise<Category | undefined> {
    const db = await getDB();
    return db.get('categories', id);
  },

  async create(data: Omit<Category, 'id' | 'createdAt'> & { id?: string }): Promise<Category> {
    const db = await getDB();
    const id = data.id || `cat-custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const category: Category = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
    };
    await db.put('categories', category);
    return category;
  },

  async update(id: string, data: Partial<Category>): Promise<Category> {
    const db = await getDB();
    const existing = await db.get('categories', id);
    if (!existing) {
      throw new Error(`Category ${id} not found`);
    }
    const updated: Category = {
      ...existing,
      ...data,
      id,
    };
    await db.put('categories', updated);
    return updated;
  },

  async delete(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('categories', id);
  },

  async bulkInsert(categories: Category[]): Promise<void> {
    const db = await getDB();
    const tx = db.transaction('categories', 'readwrite');
    for (const item of categories) {
      await tx.store.put(item);
    }
    await tx.done;
  }
};

export const MoneySourceRepository = {
  async getAll(): Promise<MoneySource[]> {
    const db = await getDB();
    return db.getAll('moneySources');
  },

  async getById(id: string): Promise<MoneySource | undefined> {
    const db = await getDB();
    return db.get('moneySources', id);
  },

  async create(data: Omit<MoneySource, 'id' | 'createdAt'> & { id?: string }): Promise<MoneySource> {
    const db = await getDB();
    const id = data.id || `source-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const source: MoneySource = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
    };
    await db.put('moneySources', source);
    return source;
  },

  async update(id: string, data: Partial<MoneySource>): Promise<MoneySource> {
    const db = await getDB();
    const existing = await db.get('moneySources', id);
    if (!existing) {
      throw new Error(`Source ${id} not found`);
    }
    const updated: MoneySource = {
      ...existing,
      ...data,
      id,
    };
    await db.put('moneySources', updated);
    return updated;
  },

  async delete(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('moneySources', id);
  },

  async bulkInsert(sources: MoneySource[]): Promise<void> {
    const db = await getDB();
    const tx = db.transaction('moneySources', 'readwrite');
    for (const item of sources) {
      await tx.store.put(item);
    }
    await tx.done;
  }
};

export const MoneyReceiptRepository = {
  async getAll(): Promise<MoneyReceipt[]> {
    const db = await getDB();
    const receipts = await db.getAll('moneyReceipts');
    return receipts.sort((a, b) => {
      const dtA = `${a.date}T${a.time || '00:00'}`;
      const dtB = `${b.date}T${b.time || '00:00'}`;
      return dtB.localeCompare(dtA);
    });
  },

  async getBySourceId(sourceId: string): Promise<MoneyReceipt[]> {
    const db = await getDB();
    const receipts = await db.getAllFromIndex('moneyReceipts', 'by-source', sourceId);
    return receipts.sort((a, b) => {
      const dtA = `${a.date}T${a.time || '00:00'}`;
      const dtB = `${b.date}T${b.time || '00:00'}`;
      return dtB.localeCompare(dtA);
    });
  },

  async create(data: Omit<MoneyReceipt, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<MoneyReceipt> {
    const db = await getDB();
    const now = new Date().toISOString();
    const id = data.id || `receipt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const receipt: MoneyReceipt = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    await db.put('moneyReceipts', receipt);
    return receipt;
  },

  async update(id: string, data: Partial<MoneyReceipt>): Promise<MoneyReceipt> {
    const db = await getDB();
    const existing = await db.get('moneyReceipts', id);
    if (!existing) {
      throw new Error(`Receipt ${id} not found`);
    }
    const updated: MoneyReceipt = {
      ...existing,
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    };
    await db.put('moneyReceipts', updated);
    return updated;
  },

  async delete(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('moneyReceipts', id);
  },

  async bulkInsert(receipts: MoneyReceipt[]): Promise<void> {
    const db = await getDB();
    const tx = db.transaction('moneyReceipts', 'readwrite');
    for (const item of receipts) {
      await tx.store.put(item);
    }
    await tx.done;
  }
};

export const AccountRepository = {
  async getAll(includeArchived = false): Promise<Account[]> {
    const db = await getDB();
    const accounts = await db.getAll('accounts');
    const filtered = includeArchived ? accounts : accounts.filter(a => !a.isArchived);
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  },

  async getById(id: string): Promise<Account | undefined> {
    const db = await getDB();
    return db.get('accounts', id);
  },

  async create(data: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Promise<Account> {
    const db = await getDB();
    const now = new Date().toISOString();
    const account: Account = {
      ...data,
      id: `acc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: now,
      updatedAt: now,
    };
    await db.put('accounts', account);
    return account;
  },

  async update(id: string, data: Partial<Account>): Promise<Account> {
    const db = await getDB();
    const existing = await db.get('accounts', id);
    if (!existing) throw new Error(`Account ${id} not found`);
    const updated: Account = {
      ...existing,
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    };
    await db.put('accounts', updated);
    return updated;
  },

  async archive(id: string, isArchived: boolean = true): Promise<Account> {
    return this.update(id, { isArchived });
  },

  async delete(id: string): Promise<void> {
    const db = await getDB();
    // Safety check: ensure no transactions are associated with this account
    const txs = await db.getAll('transactions');
    const hasTransactions = txs.some(t => t.accountId === id || t.toAccountId === id);
    if (hasTransactions) {
      throw new Error('Cannot delete an account with existing transactions. Please archive it instead.');
    }
    await db.delete('accounts', id);
  },

  async bulkPut(accounts: Account[]): Promise<void> {
    const db = await getDB();
    const tx = db.transaction('accounts', 'readwrite');
    for (const acc of accounts) {
      await tx.store.put(acc);
    }
    await tx.done;
  }
};

export const SettingsRepository = {
  async getSettings(): Promise<AppSettings> {
    const db = await getDB();
    const stored = await db.get('settings', 'app_settings');
    return stored || {
      currencyCode: 'INR',
      currencySymbol: '₹',
      theme: 'system',
      appVersion: APP_VERSION,
      initialized: true,
    };
  },

  async updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    const db = await getDB();
    const existing = await this.getSettings();
    const updated = { ...existing, ...settings };
    await db.put('settings', updated, 'app_settings');
    return updated;
  }
};

export async function clearAllDatabaseData(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['transactions', 'categories', 'moneySources', 'moneyReceipts', 'settings', 'accounts'], 'readwrite');
  await tx.objectStore('transactions').clear();
  await tx.objectStore('categories').clear();
  await tx.objectStore('moneySources').clear();
  await tx.objectStore('moneyReceipts').clear();
  await tx.objectStore('accounts').clear();
  await tx.objectStore('settings').clear();
  await tx.done;
  // Re-seed default categories, sources, and settings
  await seedInitialDataIfNeeded();
}

export async function exportDatabaseBackup(): Promise<BackupData> {
  const db = await getDB();
  const transactions = await db.getAll('transactions');
  const categories = await db.getAll('categories');
  const moneySources = await db.getAll('moneySources');
  const moneyReceipts = await db.getAll('moneyReceipts');
  const accounts = await db.getAll('accounts');
  const settings = await SettingsRepository.getSettings();

  return {
    version: APP_VERSION,
    exportedAt: new Date().toISOString(),
    transactions,
    categories,
    moneySources,
    moneyReceipts,
    accounts,
    settings,
  };
}

