import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { Transaction } from '../types/transaction';
import { Category } from '../types/category';
import { MoneySource, MoneyReceipt, SourceSummary } from '../types/otherMoney';
import { AppSettings } from '../types/settings';
import { Account, AccountBalanceSummary } from '../types/account';
import {
  TransactionRepository,
  CategoryRepository,
  MoneySourceRepository,
  MoneyReceiptRepository,
  AccountRepository,
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
  accounts: Account[];
  activeAccounts: Account[];
  accountSummaries: AccountBalanceSummary[];
  totalAccountsBalance: number;
  settings: AppSettings;
  sourceSummaries: SourceSummary[];
  otherMoneySummary: OtherMoneyGlobalSummary;
  currentBalance: number;
  totalIncome: number;
  totalExpenses: number;
  totalRefunds: number;

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

  addAccount: (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Account>;
  updateAccount: (id: string, account: Partial<Account>) => Promise<Account>;
  archiveAccount: (id: string, isArchived: boolean) => Promise<Account>;
  deleteAccount: (id: string) => Promise<void>;
  getAccountById: (id: string) => Account | undefined;
  getAccountSummary: (id: string) => AccountBalanceSummary | undefined;

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
  const [accounts, setAccounts] = useState<Account[]>([]);
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
      const [txs, cats, sources, receipts, accs, appSettings] = await Promise.all([
        TransactionRepository.getAll(),
        CategoryRepository.getAll(),
        MoneySourceRepository.getAll(),
        MoneyReceiptRepository.getAll(),
        AccountRepository.getAll(true),
        SettingsRepository.getSettings(),
      ]);

      setTransactions(txs);
      setCategories(cats);
      setMoneySources(sources);
      setMoneyReceipts(receipts);
      setAccounts(accs);
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

  // Accounts
  const activeAccounts = useMemo(() => {
    return accounts.filter(a => !a.isArchived);
  }, [accounts]);

  const accountSummaries: AccountBalanceSummary[] = useMemo(() => {
    return accounts.map(account => {
      const opening = account.openingBalance || 0;
      let inc = 0;
      let exp = 0;
      let ref = 0;
      let tIn = 0;
      let tOut = 0;
      let txCount = 0;

      for (const t of transactions) {
        if (t.accountId === account.id) {
          txCount++;
          if (t.type === 'income') inc += t.amount;
          else if (t.type === 'expense') exp += t.amount;
          else if (t.type === 'refund') ref += t.amount;
          else if (t.type === 'transfer') tOut += t.amount;
        } else if (t.toAccountId === account.id && t.type === 'transfer') {
          txCount++;
          tIn += t.amount;
        }
      }

      const currentBal = opening + inc - exp + ref + tIn - tOut;
      return {
        account,
        currentBalance: currentBal,
        totalIncome: inc,
        totalExpenses: exp,
        totalTransfersIn: tIn,
        totalTransfersOut: tOut,
        totalRefunds: ref,
        totalInflow: inc + tIn + ref,
        totalOutflow: exp + tOut,
        transactionCount: txCount,
      };
    });
  }, [accounts, transactions]);

  const totalAccountsBalance = useMemo(() => {
    const activeIds = new Set(activeAccounts.map(a => a.id));
    return accountSummaries
      .filter(s => activeIds.has(s.account.id))
      .reduce((sum, s) => sum + s.currentBalance, 0);
  }, [activeAccounts, accountSummaries]);

  // Source Calculations
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

  const { totalIncome, totalExpenses, totalRefunds, currentBalance } = useMemo(() => {
    let income = 0;
    let expenses = 0;
    let refunds = 0;

    for (const tx of transactions) {
      if (tx.type === 'income') {
        income += tx.amount;
      } else if (tx.type === 'expense') {
        expenses += tx.amount;
      } else if (tx.type === 'refund') {
        refunds += tx.amount;
      }
      // Note: transfer does NOT affect total income, total expenses, or total refunds
    }

    // Available balance calculation:
    // If user has accounts set up, balance is derived from active accounts + unassigned legacy transactions + other money.
    // If no accounts exist yet, standard formula: income + otherMoneySummary.totalReceived - expenses + refunds.
    let balance = 0;
    if (accounts.length > 0) {
      let unassignedIncome = 0;
      let unassignedExpenses = 0;
      let unassignedRefunds = 0;

      for (const tx of transactions) {
        if (!tx.accountId && !tx.toAccountId) {
          if (tx.type === 'income') unassignedIncome += tx.amount;
          else if (tx.type === 'expense') unassignedExpenses += tx.amount;
          else if (tx.type === 'refund') unassignedRefunds += tx.amount;
        }
      }

      const unassignedFunds = unassignedIncome + otherMoneySummary.totalReceived - unassignedExpenses + unassignedRefunds;
      balance = totalAccountsBalance + unassignedFunds;
    } else {
      balance = income + otherMoneySummary.totalReceived - expenses + refunds;
    }

    return {
      totalIncome: income,
      totalExpenses: expenses,
      totalRefunds: refunds,
      currentBalance: balance,
    };
  }, [transactions, accounts, totalAccountsBalance, otherMoneySummary]);

  // Transaction handlers
  const addTransaction = async (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    const created = await TransactionRepository.create(data);
    setTransactions(prev => [created, ...prev]);
    let title = 'Expense recorded';
    if (data.type === 'income') title = 'Income recorded';
    else if (data.type === 'transfer') title = 'Transfer completed';
    else if (data.type === 'refund') title = 'Refund recorded';
    showSuccess(title, `₹${data.amount} saved successfully`);
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

  // Account handlers
  const addAccount = async (data: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => {
    const created = await AccountRepository.create(data);
    setAccounts(prev => [...prev, created]);
    showSuccess('Account created', `Account "${data.name}" added`);
    return created;
  };

  const updateAccount = async (id: string, data: Partial<Account>) => {
    const updated = await AccountRepository.update(id, data);
    setAccounts(prev => prev.map(a => (a.id === id ? updated : a)));
    showSuccess('Account updated');
    return updated;
  };

  const archiveAccount = async (id: string, isArchived: boolean) => {
    const updated = await AccountRepository.archive(id, isArchived);
    setAccounts(prev => prev.map(a => (a.id === id ? updated : a)));
    showSuccess(isArchived ? 'Account archived' : 'Account restored');
    return updated;
  };

  const deleteAccount = async (id: string) => {
    try {
      await AccountRepository.delete(id);
      setAccounts(prev => prev.filter(a => a.id !== id));
      showSuccess('Account deleted');
    } catch (err: any) {
      showError('Cannot Delete Account', err.message || 'Account has linked transactions. Archive it instead.');
      throw err;
    }
  };

  const getAccountById = (id: string) => {
    return accounts.find(a => a.id === id);
  };

  const getAccountSummary = (id: string) => {
    return accountSummaries.find(s => s.account.id === id);
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
        accounts,
        activeAccounts,
        accountSummaries,
        totalAccountsBalance,
        settings,
        sourceSummaries,
        otherMoneySummary,
        currentBalance,
        totalIncome,
        totalExpenses,
        totalRefunds,
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
        addAccount,
        updateAccount,
        archiveAccount,
        deleteAccount,
        getAccountById,
        getAccountSummary,
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
