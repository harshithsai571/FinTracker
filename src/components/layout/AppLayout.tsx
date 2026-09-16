import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { DesktopSidebar } from './DesktopSidebar';
import { TransactionFormModal } from '../transactions/TransactionFormModal';
import { TransactionDetailModal } from '../transactions/TransactionDetailModal';
import { UpdateNotificationPrompt } from '../pwa/UpdateNotificationPrompt';
import { InstallPwaBanner } from '../pwa/InstallPwaBanner';
import { usePwaUpdate } from '../../hooks/usePwaUpdate';
import { useNativeApp } from '../../hooks/useNativeApp';
import { Transaction } from '../../types/transaction';

export const AppLayout: React.FC = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const { needRefresh, dismissUpdate, applyUpdate } = usePwaUpdate();

  // Android hardware back button and theme-aware status bar
  useNativeApp({
    onBackWhenModalOpen: () => {
      if (isAddModalOpen) {
        setIsAddModalOpen(false);
        setEditingTransaction(null);
        return true;
      }
      if (selectedTransaction) {
        setSelectedTransaction(null);
        return true;
      }
      return false;
    },
  });

  const handleOpenAdd = () => {
    setEditingTransaction(null);
    setIsAddModalOpen(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setSelectedTransaction(null);
    setEditingTransaction(tx);
    setIsAddModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-surface-100 flex flex-col transition-colors selection:bg-brand-500 selection:text-white">
      {/* Header */}
      <Header onOpenAddModal={handleOpenAdd} />

      {/* Main Container */}
      <div className="flex-1 flex max-w-6xl w-full mx-auto">
        {/* Desktop Sidebar */}
        <DesktopSidebar onOpenAddModal={handleOpenAdd} />

        {/* Content Outlet */}
        <main className="flex-1 p-4 sm:p-6 pb-24 sm:pb-8 min-w-0 max-w-4xl mx-auto w-full">
          <InstallPwaBanner />
          <Outlet context={{ onSelectTransaction: setSelectedTransaction, onOpenAddModal: handleOpenAdd }} />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav onOpenAddModal={handleOpenAdd} />

      {/* Transaction Entry / Edit Modal */}
      <TransactionFormModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingTransaction(null);
        }}
        initialTransaction={editingTransaction}
      />

      {/* Transaction Details Modal */}
      <TransactionDetailModal
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        onEdit={handleEditTransaction}
      />

      {/* PWA Update Notification Prompt */}
      <UpdateNotificationPrompt
        needRefresh={needRefresh}
        onUpdate={applyUpdate}
        onDismiss={dismissUpdate}
      />
    </div>
  );
};
