import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { DesktopSidebar } from './DesktopSidebar';
import { TransactionFormModal } from '../transactions/TransactionFormModal';
import { TransactionDetailModal } from '../transactions/TransactionDetailModal';
import { UpdateNotificationPrompt } from '../pwa/UpdateNotificationPrompt';
import { InstallPwaBanner } from '../pwa/InstallPwaBanner';
import { NativeUpdateModal } from '../native/NativeUpdateModal';
import { usePwaUpdate } from '../../hooks/usePwaUpdate';
import { useNativeApp } from '../../hooks/useNativeApp';
import { isAndroidNative } from '../../services/native';
import { App } from '@capacitor/app';
import { updateService, ReleaseInfo } from '../../services/native/updateService';
import { APP_VERSION } from '../../config/version';
import { Transaction } from '../../types/transaction';

export const AppLayout: React.FC = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [nativeRelease, setNativeRelease] = useState<ReleaseInfo | null>(null);
  const [isNativeUpdateOpen, setIsNativeUpdateOpen] = useState(false);

  const { needRefresh, dismissUpdate, applyUpdate } = usePwaUpdate();

  // Startup background check for Android APK updates (respecting 24h cooldown & non-blocking)
  useEffect(() => {
    if (!isAndroidNative()) return;

    const performCheck = async () => {
      try {
        const res = await updateService.checkForUpdate(false);
        if (res.status === 'update_available') {
          setNativeRelease(res.release);
          setIsNativeUpdateOpen(true);
        }
      } catch (err) {
        console.debug('Background update check skipped:', err);
      }
    };

    // Run asynchronously without delaying dashboard load
    const timer = setTimeout(() => {
      performCheck();
    }, 1500);

    // Foreground resume listener: check again when app returns to foreground (subject to 24h cooldown)
    let appStateHandle: { remove: () => Promise<void> } | null = null;
    App.addListener('appStateChange', (state) => {
      if (state.isActive) {
        performCheck();
      }
    }).then(handle => {
      appStateHandle = handle;
    }).catch(() => {});

    return () => {
      clearTimeout(timer);
      if (appStateHandle) {
        appStateHandle.remove().catch(() => {});
      }
    };
  }, []);

  // Android hardware back button and theme-aware status bar
  useNativeApp({
    onBackWhenModalOpen: () => {
      if (isNativeUpdateOpen) {
        setIsNativeUpdateOpen(false);
        return true;
      }
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

      {/* PWA Update Notification Prompt (Web / PWA only) */}
      <UpdateNotificationPrompt
        needRefresh={needRefresh}
        onUpdate={applyUpdate}
        onDismiss={dismissUpdate}
      />

      {/* Android In-App Native Update Modal */}
      <NativeUpdateModal
        isOpen={isNativeUpdateOpen}
        onClose={() => setIsNativeUpdateOpen(false)}
        release={nativeRelease}
        currentVersion={APP_VERSION}
      />
    </div>
  );
};
