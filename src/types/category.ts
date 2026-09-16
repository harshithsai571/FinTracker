export type CategoryGroup = 'Food' | 'Travel' | 'Personal' | 'Bills' | 'Income' | 'Other';

export type CategoryType = 'expense' | 'income' | 'both';

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  group: CategoryGroup;
  icon: string; // Lucide icon name
  color: string; // Tailwind color or hex
  isDefault: boolean;
  createdAt: string;
}
