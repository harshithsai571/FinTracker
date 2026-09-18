import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useFinance } from '../context/FinanceContext';
import { BalanceCard } from '../components/dashboard/BalanceCard';
import { MonthlySummaryCard } from '../components/dashboard/MonthlySummaryCard';
import { SpendingOverview } from '../components/dashboard/SpendingOverview';
import { OtherMoneyWidget } from '../components/dashboard/OtherMoneyWidget';
import { RecentTransactions } from '../components/dashboard/RecentTransactions';
import { getCurrentMonthString } from '../utils/dates';
import { Transaction } from '../types/transaction';
import { PlusCircle, ArrowUpRight, ArrowDownRight, Landmark } from 'lucide-react';

interface ContextType {
  onSelectTransaction: (tx: Transaction) => void;
  onOpenAddModal: () => void;
}

export const DashboardPage: React.FC = () => {
  const { onSelectTransaction, onOpenAddModal } = useOutletContext<ContextType>();
  const {
    transactions,
    categories,
    moneySources,
    currentBalance,
    totalIncome,
    totalExpenses,
    otherMoneySummary,
  } = useFinance();

  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthString());

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* 1. Main Balance Hero Card */}
      <BalanceCard
        balance={currentBalance}
        income={totalIncome}
        expenses={totalExpenses}
        otherMoneyRemaining={otherMoneySummary.remaining}
      />

      {/* 2. Monthly Summary with Month Picker */}
      <MonthlySummaryCard
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        transactions={transactions}
      />

      {/* 3. Other Money Widget */}
      <OtherMoneyWidget
        totalReceived={otherMoneySummary.totalReceived}
        totalUsed={otherMoneySummary.totalUsed}
        remaining={otherMoneySummary.remaining}
        sourceCount={moneySources.length}
      />

      {/* 4. Spending Category Overview */}
      <SpendingOverview
        transactions={transactions}
        categories={categories}
        selectedMonth={selectedMonth}
        onAddExpense={onOpenAddModal}
      />

      {/* 5. Recent Transactions List */}
      <RecentTransactions
        transactions={transactions}
        categories={categories}
        sources={moneySources}
        onSelectTransaction={onSelectTransaction}
        onOpenAddModal={onOpenAddModal}
      />
    </div>
  );
};
