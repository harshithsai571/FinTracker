import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { SourceSummary, MoneyReceipt, MoneySource } from '../types/otherMoney';
import { SourceDetailModal } from '../components/otherMoney/SourceDetailModal';
import { AddMoneyReceiptModal } from '../components/otherMoney/AddMoneyReceiptModal';
import { AddMoneySourceModal } from '../components/otherMoney/AddMoneySourceModal';
import { formatCurrency } from '../utils/currency';
import { Landmark, Plus, ArrowDownLeft, ArrowUpRight, CheckCircle2, AlertCircle } from 'lucide-react';

export const OtherMoneyPage: React.FC = () => {
  const { sourceSummaries, otherMoneySummary, moneySources } = useFinance();

  const [selectedSummary, setSelectedSummary] = useState<SourceSummary | null>(null);
  const [isAddReceiptOpen, setIsAddReceiptOpen] = useState(false);
  const [receiptTargetSourceId, setReceiptTargetSourceId] = useState<string | undefined>();
  const [editingReceipt, setEditingReceipt] = useState<MoneyReceipt | null>(null);

  const [isAddSourceOpen, setIsAddSourceOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<MoneySource | null>(null);

  const handleOpenAddMoney = (sourceId?: string) => {
    setEditingReceipt(null);
    setReceiptTargetSourceId(sourceId);
    setIsAddReceiptOpen(true);
  };

  const handleEditReceipt = (receipt: MoneyReceipt) => {
    setEditingReceipt(receipt);
    setIsAddReceiptOpen(true);
  };

  const handleEditSource = (summary: SourceSummary) => {
    setEditingSource(summary.source);
    setIsAddSourceOpen(true);
  };

  // Keep selectedSummary updated when sourceSummaries change
  const currentSelectedSummary = selectedSummary
    ? sourceSummaries.find(s => s.source.id === selectedSummary.source.id) || null
    : null;

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-surface-900 dark:text-white tracking-tight">
            Other Money
          </h2>
          <p className="text-xs text-surface-500 dark:text-surface-400">
            Track money from parents, family, or scholarships separately
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingSource(null);
              setIsAddSourceOpen(true);
            }}
            className="text-xs font-semibold"
          >
            + New Source
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleOpenAddMoney()}
            className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Record Money
          </Button>
        </div>
      </div>

      {/* Global Summary Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-surface-950 text-white p-5 sm:p-6 shadow-elevated border border-indigo-900/60">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-surface-300 uppercase tracking-wider">
                Overall Other Money
              </span>
            </div>
            <span className="text-[11px] text-surface-400">
              {sourceSummaries.length} sources tracked
            </span>
          </div>

          <div className="mb-4">
            <h3 className="text-2xl sm:text-3xl font-black text-white">
              {formatCurrency(otherMoneySummary.remaining)}
            </h3>
            <p className="text-[11px] text-surface-400">Total remaining across all sources</p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <ArrowDownLeft className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-surface-400">Total Received</p>
                <p className="text-xs sm:text-sm font-bold text-emerald-400">
                  {formatCurrency(otherMoneySummary.totalReceived)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-surface-400">Total Used</p>
                <p className="text-xs sm:text-sm font-bold text-rose-400">
                  {formatCurrency(otherMoneySummary.totalUsed)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sources Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400 px-1">
          Money Sources
        </h3>

        {sourceSummaries.length === 0 ? (
          <Card className="text-center py-10">
            <div className="w-12 h-12 rounded-2xl bg-surface-100 dark:bg-surface-800 text-surface-400 flex items-center justify-center mx-auto mb-3">
              <Landmark className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-surface-900 dark:text-surface-100 mb-1">
              No Money Sources Configured
            </h4>
            <p className="text-xs text-surface-500 dark:text-surface-400 max-w-xs mx-auto mb-4">
              Add a source like "Dad's Money" or "Scholarship" to track funds received from family.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setEditingSource(null);
                setIsAddSourceOpen(true);
              }}
            >
              + Create First Source
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {sourceSummaries.map(summary => {
              const { source, totalReceived, totalUsed, remaining, receiptCount, expenseCount } = summary;
              const usedPercent = totalReceived > 0 ? Math.min(Math.round((totalUsed / totalReceived) * 100), 100) : 0;

              return (
                <Card
                  key={source.id}
                  interactive
                  onClick={() => setSelectedSummary(summary)}
                  className="p-5 border-surface-200/80 dark:border-surface-800 hover:border-brand-500/40 group flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: Name and Action */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-xs font-black text-xs"
                          style={{ backgroundColor: source.color || '#3b82f6' }}
                        >
                          ₹
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-surface-900 dark:text-surface-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                            {source.name}
                          </h4>
                          <p className="text-[10px] text-surface-400 line-clamp-1">
                            {source.description || `${receiptCount} deposits • ${expenseCount} expenses`}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenAddMoney(source.id);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] border border-emerald-200/50 dark:border-emerald-800/50 transition-colors shrink-0"
                      >
                        + Add ₹
                      </button>
                    </div>

                    {/* Remaining Balance Display */}
                    <div className="mb-4">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-surface-400 block">
                        Remaining
                      </span>
                      <span className="text-xl sm:text-2xl font-black text-surface-900 dark:text-white">
                        {formatCurrency(remaining)}
                      </span>
                    </div>

                    {/* Progress Bar of used money */}
                    <div className="space-y-1 mb-4">
                      <div className="flex items-center justify-between text-[10px] font-semibold text-surface-400">
                        <span>Used: {formatCurrency(totalUsed)}</span>
                        <span>{usedPercent}% used</span>
                      </div>
                      <div className="h-1.5 w-full bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${usedPercent}%`,
                            backgroundColor: source.color || '#3b82f6',
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer Stats */}
                  <div className="pt-3 border-t border-surface-100 dark:border-surface-800 flex items-center justify-between text-[11px] text-surface-500 dark:text-surface-400">
                    <span>Received: {formatCurrency(totalReceived)}</span>
                    <span className="text-brand-600 dark:text-brand-400 font-semibold group-hover:underline">
                      View details →
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <SourceDetailModal
        summary={currentSelectedSummary}
        onClose={() => setSelectedSummary(null)}
        onAddMoney={handleOpenAddMoney}
        onEditReceipt={handleEditReceipt}
        onEditSource={handleEditSource}
      />

      {/* Add / Edit Receipt Modal */}
      <AddMoneyReceiptModal
        isOpen={isAddReceiptOpen}
        onClose={() => {
          setIsAddReceiptOpen(false);
          setEditingReceipt(null);
        }}
        defaultSourceId={receiptTargetSourceId}
        initialReceipt={editingReceipt}
      />

      {/* Add / Edit Source Modal */}
      <AddMoneySourceModal
        isOpen={isAddSourceOpen}
        onClose={() => {
          setIsAddSourceOpen(false);
          setEditingSource(null);
        }}
        initialSource={editingSource}
      />
    </div>
  );
};
