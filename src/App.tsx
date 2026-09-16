import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { FinanceProvider } from './context/FinanceContext';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { OtherMoneyPage } from './pages/OtherMoneyPage';
import { ReportsPage } from './pages/ReportsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { SettingsPage } from './pages/SettingsPage';
import { MorePage } from './pages/MorePage';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <FinanceProvider>
          <HashRouter>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/transactions" element={<TransactionsPage />} />
                <Route path="/other-money" element={<OtherMoneyPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/more" element={<MorePage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </HashRouter>
        </FinanceProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};
