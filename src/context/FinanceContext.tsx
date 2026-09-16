import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { Transaction } from '../types/transaction';
import { Category } from '../types/category';
import { MoneySource, MoneyReceipt, SourceSummary } from '../types/otherMoney';
import { AppSettings } from '../types/settings';
import {
  TransactionRepository,
  CategoryRepository,
  MoneySourceRepository,
  MoneyReceiptRepository,
  SettingsRepository,
  seedInitialDataIfNeeded,
  clearAllDatabaseData
} from '../db';
import { useToast } from './ToastContext';

interface OtherMoneyGlobalSummary {
  totalReceived: number;
  totalUsed: number;
  remaining: number;
}

interface FinanceContextType {
  loading: boolean;
  transactions: Transaction[];
  categories: Category[];
  moneySources: MoneySource[];
  moneyReceipts: MoneyReceipt[];
  settings: AppSettings;
  sourceSummaries: SourceSummary[];
  otherMoneySummary: OtherMoneyGlobalSummary;
  currentBalance: number;
  totalIncome: number;
  totalExpenses: number;

  // Actions
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Transaction>;
  updateTransaction: (id: string, tx: Partial<Transaction>) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;

  addCategory: (cat: Omit<Category, 'id' | 'createdAt'>) => Promise<Category>;
  updateCategory: (id: string, cat: Partial<Category>) => Promise<Category>;
  deleteCategory: (id: string, migrateToCategoryId?: string) => Promise<void>;

  addMoneySource: (source: Omit<MoneySource, 'id' | 'createdAt'>) => Promise<MoneySource>;
  updateMoneySource: (id: string, source: Partial<MoneySource>) => Promise<MoneySource>;
  deleteMoneySource: (id: string) => Promise<void>;

  addMoneyReceipt: (receipt: Omit<MoneyReceipt, 'id' | 'createdAt' | 'updatedAt'>) => Promise<MoneyReceipt>;
  updateMoneyReceipt: (id: string, receipt: Partial<MoneyReceipt>) => Promise<MoneyReceipt>;
  deleteMoneyReceipt: (id: string) => Promise<void>;

  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  resetAllData: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [moneySources, setMoneySources] = useState<MoneySource[]>([]);
  const [moneyReceipts, setMoneyReceipts] = useState<MoneyReceipt[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    currencyCode: 'INR',
    currencySymbol: '₹',
    theme: 'system',
    appVersion: '1.0.0',
    initialized: true,
  });

  const loadData = useCallback(async () => {
    try {
      await seedInitialDataIfNeeded();
      const [txs, cats, sources, receipts, appSettings] = await Promise.all([
        TransactionRepository.getAll(),
        CategoryRepository.getAll(),
        MoneySourceRepository.getAll(),
        MoneyReceiptRepository.getAll(),
        SettingsRepository.getSettings(),
      ]);

      setTransactions(txs);
      setCategories(cats);
      setMoneySources(sources);
      setMoneyReceipts(receipts);
      setSettings(appSettings);
    } catch (err: any) {
      console.error('Failed to load data from IndexedDB:', err);
      showError('Database Error', 'Could not load saved financial data from local storage.');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculations
  const sourceSummaries: SourceSummary[] = useMemo(() => {
    return moneySources.map(source => {
      const receiptsForSource = moneyReceipts.filter(r => r.sourceId === source.id);
      const totalReceived = receiptsForSource.reduce((sum, r) => sum + r.amount, 0);

      const expensesForSource = transactions.filter(
        t => t.type === 'expense' && t.sourceId === source.id
      );
      const totalUsed = expensesForSource.reduce((sum, t) => sum + t.amount, 0);
      const remaining = totalReceived - totalUsed;

      return {
        source,
        totalReceived,
        totalUsed,
        remaining,
        receiptCount: receiptsForSource.length,
        expenseCount: expensesForSource.length,
      };
    });
  }, [moneySources, moneyReceipts, transactions]);

  const otherMoneySummary: OtherMoneyGlobalSummary = useMemo(() => {
    let totalReceived = 0;
    let totalUsed = 0;
    sourceSummaries.forEach(s => {
      totalReceived += s.totalReceived;
      totalUsed += s.totalUsed;
    });
    return {
      totalReceived,
      totalUsed,
      remaining: totalReceived - totalUsed,
    };
  }, [sourceSummaries]);

  const { totalIncome, totalExpenses, currentBalance } = useMemo(() => {
    let income = 0;
    let expenses = 0;

    for (const tx of transactions) {
      if (tx.type === 'income') {
        income += tx.amount;
      } else {
        expenses += tx.amount;
      }
    }

    // Available balance = Regular Income + Received External Funds - Total Expenses
    const balance = income + otherMoneySummary.totalReceived - expenses;

    return {
      totalIncome: income,
      totalExpenses: expenses,
      currentBalance: balance,
    };
  }, [transactions, otherMoneySummary]);

  // Transaction handlers
  const addTransaction = async (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    const created = await TransactionRepository.create(data);
    setTransactions(prev => [created, ...prev]);
    showSuccess(
      data.type === 'income' ? 'Income recorded' : 'Expense recorded',
      `₹${data.amount} saved successfully`
    );
    return created;
  };

  const updateTransaction = async (id: string, data: Partial<Transaction>) => {
    const updated = await TransactionRepository.update(id, data);
    setTransactions(prev => prev.map(t => (t.id === id ? updated : t)));
    showSuccess('Transaction updated', 'Changes saved successfully');
    return updated;
  };

  const deleteTransaction = async (id: string) => {
    await TransactionRepository.delete(id);
    setTransactions(prev => prev.filter(t => t.id !== id));
    showSuccess('Transaction deleted');
  };

  // Category handlers
  const addCategory = async (data: Omit<Category, 'id' | 'createdAt'>) => {
    const created = await CategoryRepository.create(data);
    setCategories(prev => [...prev, created]);
    showSuccess('Category added', `Category "${data.name}" created`);
    return created;
  };

  const updateCategory = async (id: string, data: Partial<Category>) => {
    const updated = await CategoryRepository.update(id, data);
    setCategories(prev => prev.map(c => (c.id === id ? updated : c)));
    showSuccess('Category updated');
    return updated;
  };

  const deleteCategory = async (id: string, migrateToCategoryId?: string) => {
    if (migrateToCategoryId) {
      await TransactionRepository.migrateCategory(id, migrateToCategoryId);
    }
    await CategoryRepository.delete(id);
    setCategories(prev => prev.filter(c => c.id !== id));
    // Reload transactions to reflect migrated category IDs
    const updatedTxs = await TransactionRepository.getAll();
    setTransactions(updatedTxs);
    showSuccess('Category removed');
  };

  // Money Source handlers
  const addMoneySource = async (data: Omit<MoneySource, 'id' | 'createdAt'>) => {
    const created = await MoneySourceRepository.create(data);
    setMoneySources(prev => [...prev, created]);
    showSuccess('Source added', `Source "${data.name}" created`);
    return created;
  };

  const updateMoneySource = async (id: string, data: Partial<MoneySource>) => {
    const updated = await MoneySourceRepository.update(id, data);
    setMoneySources(prev => prev.map(s => (s.id === id ? updated : s)));
    showSuccess('Source updated');
    return updated;
  };

  const deleteMoneySource = async (id: string) => {
    await MoneySourceRepository.delete(id);
    setMoneySources(prev => prev.filter(s => s.id !== id));
    showSuccess('Source deleted');
  };

  // Money Receipt handlers
  const addMoneyReceipt = async (data: Omit<MoneyReceipt, 'id' | 'createdAt' | 'updatedAt'>) => {
    const created = await MoneyReceiptRepository.create(data);
    setMoneyReceipts(prev => [created, ...prev]);
    showSuccess('Money added', `₹${data.amount} recorded to source`);
    return created;
  };

  const updateMoneyReceipt = async (id: string, data: Partial<MoneyReceipt>) => {
    const updated = await MoneyReceiptRepository.update(id, data);
    setMoneyReceipts(prev => prev.map(r => (r.id === id ? updated : r)));
    showSuccess('Receipt updated');
    return updated;
  };

  const deleteMoneyReceipt = async (id: string) => {
    await MoneyReceiptRepository.delete(id);
    setMoneyReceipts(prev => prev.filter(r => r.id !== id));
    showSuccess('Receipt deleted');
  };

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    const updated = await SettingsRepository.updateSettings(newSettings);
    setSettings(updated);
    showSuccess('Settings updated');
  };

  const resetAllData = async () => {
    await clearAllDatabaseData();
    await loadData();
    showSuccess('Data reset', 'All records cleared and defaults restored.');
  };

  return (
    <FinanceContext.Provider
      value={{
        loading,
        transactions,
        categories,
        moneySources,
        moneyReceipts,
        settings,
        sourceSummaries,
        otherMoneySummary,
        currentBalance,
        totalIncome,
        totalExpenses,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addCategory,
        updateCategory,
        deleteCategory,
        addMoneySource,
        updateMoneySource,
        deleteMoneySource,
        addMoneyReceipt,
        updateMoneyReceipt,
        deleteMoneyReceipt,
        updateSettings,
        resetAllData,
        refreshData: loadData,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export function useFinance(): FinanceContextType {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}
