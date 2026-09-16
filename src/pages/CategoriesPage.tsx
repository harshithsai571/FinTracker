import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { CategoryIcon } from '../components/common/CategoryIcon';
import { Category, CategoryGroup, CategoryType } from '../types/category';
import { Plus, Edit2, Trash2, Tag, ShieldCheck } from 'lucide-react';

const CATEGORY_GROUPS: CategoryGroup[] = ['Food', 'Travel', 'Personal', 'Bills', 'Income', 'Other'];

const PRESET_ICONS = [
  'Utensils', 'Coffee', 'Cookie', 'ShoppingBag', 'UtensilsCrossed',
  'Bus', 'Car', 'CarFront', 'Fuel', 'Train', 'Plane',
  'Shirt', 'Film', 'Smartphone', 'GraduationCap', 'HeartPulse',
  'PhoneCall', 'Wifi', 'Zap', 'Receipt',
  'Briefcase', 'Wallet', 'Laptop', 'Award', 'Coins',
  'Gift', 'Layers', 'Tag', 'Sparkles', 'Activity'
];

const PRESET_COLORS = [
  '#f97316', '#ea580c', '#16a34a', '#e11d48', '#0284c7',
  '#ca8a04', '#ef4444', '#0d9488', '#6366f1', '#ec4899',
  '#8b5cf6', '#06b6d4', '#3b82f6', '#10b981', '#64748b'
];

export const CategoriesPage: React.FC = () => {
  const { categories, transactions, addCategory, updateCategory, deleteCategory } = useFinance();

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [group, setGroup] = useState<CategoryGroup>('Other');
  const [type, setType] = useState<CategoryType>('expense');
  const [icon, setIcon] = useState('Tag');
  const [color, setColor] = useState('#10b981');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Migration & Delete states
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [migrateToCatId, setMigrateToCatId] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);

  const openCreateModal = () => {
    setEditingCategory(null);
    setName('');
    setGroup('Other');
    setType('expense');
    setIcon('Tag');
    setColor('#10b981');
    setError('');
    setIsFormOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setGroup(cat.group);
    setType(cat.type);
    setIcon(cat.icon);
    setColor(cat.color || '#10b981');
    setError('');
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a category name.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: name.trim(),
          group,
          type,
          icon,
          color,
        });
      } else {
        await addCategory({
          name: name.trim(),
          group,
          type,
          icon,
          color,
          isDefault: false,
        });
      }
      setIsFormOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInitiateDelete = (cat: Category) => {
    setCategoryToDelete(cat);
    // Auto pick first available other category as migration candidate
    const candidate = categories.find(c => c.id !== cat.id && (c.type === cat.type || c.type === 'both'));
    setMigrateToCatId(candidate ? candidate.id : '');
  };

  const executeDelete = async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);
    try {
      const txCount = transactions.filter(t => t.categoryId === categoryToDelete.id).length;
      await deleteCategory(
        categoryToDelete.id,
        txCount > 0 ? migrateToCatId : undefined
      );
      setCategoryToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const getUsageCount = (catId: string) => {
    return transactions.filter(t => t.categoryId === catId).length;
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-surface-900 dark:text-white tracking-tight">
            Categories
          </h2>
          <p className="text-xs text-surface-500 dark:text-surface-400">
            Manage spending and income categories ({categories.length})
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={openCreateModal}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          className="text-xs font-bold"
        >
          Add Category
        </Button>
      </div>

      {/* Grouped Categories List */}
      <div className="space-y-4">
        {CATEGORY_GROUPS.map(grp => {
          const groupCats = categories.filter(c => c.group === grp);
          if (groupCats.length === 0) return null;

          return (
            <div key={grp} className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                  {grp} ({groupCats.length})
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {groupCats.map(cat => {
                  const usage = getUsageCount(cat.id);
                  return (
                    <div
                      key={cat.id}
                      className="p-3 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200/80 dark:border-surface-800 flex items-center justify-between gap-3 shadow-xs hover:border-brand-500/40 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                          style={{ backgroundColor: cat.color || '#10b981' }}
                        >
                          <CategoryIcon name={cat.icon} size={18} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs sm:text-sm font-bold text-surface-900 dark:text-surface-100 truncate">
                              {cat.name}
                            </h4>
                            {cat.isDefault && (
                              <span
                                title="Default Category"
                                className="text-[10px] text-surface-400 dark:text-surface-500"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-surface-400">
                            {usage} {usage === 1 ? 'transaction' : 'transactions'} •{' '}
                            <span className="capitalize">{cat.type}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openEditModal(cat)}
                          className="p-1.5 rounded-lg text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                          aria-label="Edit category"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleInitiateDelete(cat)}
                          className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          aria-label="Delete category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Category Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingCategory ? 'Edit Category' : 'New Category'}
        maxWidth="sm"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-surface-600 dark:text-surface-300 block mb-1">
              Category Name
            </label>
            <input
              type="text"
              placeholder="e.g. Books, Gym, Subscriptions"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              autoFocus
              className="w-full h-11 px-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-xs font-semibold text-surface-800 dark:text-surface-200 placeholder:text-surface-400 focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-surface-600 dark:text-surface-300 block mb-1">
                Group
              </label>
              <select
                value={group}
                onChange={e => setGroup(e.target.value as CategoryGroup)}
                className="w-full h-10 px-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-xs font-semibold text-surface-800 dark:text-surface-200 focus:ring-2 focus:ring-brand-500 outline-none"
              >
                {CATEGORY_GROUPS.map(g => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-surface-600 dark:text-surface-300 block mb-1">
                Type
              </label>
              <select
                value={type}
                onChange={e => setType(e.target.value as CategoryType)}
                className="w-full h-10 px-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-xs font-semibold text-surface-800 dark:text-surface-200 focus:ring-2 focus:ring-brand-500 outline-none"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
                <option value="both">Both</option>
              </select>
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <label className="text-xs font-semibold text-surface-600 dark:text-surface-300 block mb-1.5">
              Color
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    color === c ? 'scale-125 ring-2 ring-offset-2 ring-brand-500 shadow-sm' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Icon Picker */}
          <div>
            <label className="text-xs font-semibold text-surface-600 dark:text-surface-300 block mb-1.5">
              Icon
            </label>
            <div className="grid grid-cols-6 gap-1.5 max-h-32 overflow-y-auto p-1 border border-surface-200 dark:border-surface-700 rounded-xl">
              {PRESET_ICONS.map(ic => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={`p-2 rounded-lg flex items-center justify-center transition-all ${
                    icon === ic
                      ? 'bg-brand-500 text-white shadow-xs'
                      : 'hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-600 dark:text-surface-300'
                  }`}
                >
                  <CategoryIcon name={ic} size={16} />
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full font-bold shadow-md"
              isLoading={isSubmitting}
            >
              {editingCategory ? 'Update Category' : 'Create Category'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Protective Deletion / Migration Modal */}
      {categoryToDelete && (
        <Modal
          isOpen={!!categoryToDelete}
          onClose={() => setCategoryToDelete(null)}
          title={`Delete Category "${categoryToDelete.name}"`}
          maxWidth="sm"
        >
          <div className="space-y-4 pt-1">
            {getUsageCount(categoryToDelete.id) > 0 ? (
              <>
                <div className="p-3 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs rounded-xl leading-relaxed">
                  <p className="font-bold mb-1">Category In Use</p>
                  This category is currently assigned to{' '}
                  <span className="font-bold">{getUsageCount(categoryToDelete.id)}</span>{' '}
                  transactions. To prevent orphaned records, select a category to reassign them to:
                </div>

                <div>
                  <label className="text-xs font-semibold text-surface-600 dark:text-surface-300 block mb-1">
                    Migrate Existing Transactions To:
                  </label>
                  <select
                    value={migrateToCatId}
                    onChange={e => setMigrateToCatId(e.target.value)}
                    required
                    className="w-full h-11 px-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-xs font-semibold text-surface-800 dark:text-surface-200 outline-none"
                  >
                    {categories
                      .filter(c => c.id !== categoryToDelete.id)
                      .map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.group})
                        </option>
                      ))}
                  </select>
                </div>
              </>
            ) : (
              <p className="text-sm text-surface-600 dark:text-surface-400">
                Are you sure you want to delete the category "{categoryToDelete.name}"? There are no transactions currently using this category.
              </p>
            )}

            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setCategoryToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                className="flex-1 font-bold"
                onClick={executeDelete}
                isLoading={isDeleting}
              >
                {getUsageCount(categoryToDelete.id) > 0 ? 'Migrate & Delete' : 'Delete'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
