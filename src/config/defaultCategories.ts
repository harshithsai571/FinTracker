import { Category } from '../types/category';
import { MoneySource } from '../types/otherMoney';

export const DEFAULT_CATEGORIES: Omit<Category, 'createdAt'>[] = [
  // Food
  { id: 'cat-food', name: 'Food', type: 'expense', group: 'Food', icon: 'Utensils', color: '#f97316', isDefault: true },
  { id: 'cat-canteen', name: 'Canteen', type: 'expense', group: 'Food', icon: 'Coffee', color: '#ea580c', isDefault: true },
  { id: 'cat-snacks', name: 'Snacks', type: 'expense', group: 'Food', icon: 'Cookie', color: '#d97706', isDefault: true },
  { id: 'cat-groceries', name: 'Groceries', type: 'expense', group: 'Food', icon: 'ShoppingBag', color: '#16a34a', isDefault: true },
  { id: 'cat-restaurant', name: 'Restaurant', type: 'expense', group: 'Food', icon: 'UtensilsCrossed', color: '#e11d48', isDefault: true },

  // Travel
  { id: 'cat-bus', name: 'Bus', type: 'expense', group: 'Travel', icon: 'Bus', color: '#0284c7', isDefault: true },
  { id: 'cat-auto', name: 'Auto', type: 'expense', group: 'Travel', icon: 'CarFront', color: '#eab308', isDefault: true },
  { id: 'cat-cab', name: 'Cab', type: 'expense', group: 'Travel', icon: 'Car', color: '#ca8a04', isDefault: true },
  { id: 'cat-fuel', name: 'Fuel', type: 'expense', group: 'Travel', icon: 'Fuel', color: '#ef4444', isDefault: true },
  { id: 'cat-train', name: 'Train', type: 'expense', group: 'Travel', icon: 'Train', color: '#0d9488', isDefault: true },
  { id: 'cat-travel', name: 'Travel', type: 'expense', group: 'Travel', icon: 'Plane', color: '#6366f1', isDefault: true },

  // Personal
  { id: 'cat-shopping', name: 'Shopping', type: 'expense', group: 'Personal', icon: 'Shirt', color: '#ec4899', isDefault: true },
  { id: 'cat-entertainment', name: 'Entertainment', type: 'expense', group: 'Personal', icon: 'Film', color: '#8b5cf6', isDefault: true },
  { id: 'cat-recharge', name: 'Recharge', type: 'expense', group: 'Personal', icon: 'Smartphone', color: '#06b6d4', isDefault: true },
  { id: 'cat-education', name: 'Education', type: 'expense', group: 'Personal', icon: 'GraduationCap', color: '#3b82f6', isDefault: true },
  { id: 'cat-health', name: 'Health', type: 'expense', group: 'Personal', icon: 'HeartPulse', color: '#10b981', isDefault: true },

  // Bills
  { id: 'cat-mobile', name: 'Mobile', type: 'expense', group: 'Bills', icon: 'PhoneCall', color: '#0891b2', isDefault: true },
  { id: 'cat-internet', name: 'Internet', type: 'expense', group: 'Bills', icon: 'Wifi', color: '#4f46e5', isDefault: true },
  { id: 'cat-electricity', name: 'Electricity', type: 'expense', group: 'Bills', icon: 'Zap', color: '#f59e0b', isDefault: true },
  { id: 'cat-other-bills', name: 'Other Bills', type: 'expense', group: 'Bills', icon: 'Receipt', color: '#64748b', isDefault: true },

  // Income
  { id: 'cat-salary', name: 'Salary', type: 'income', group: 'Income', icon: 'Briefcase', color: '#10b981', isDefault: true },
  { id: 'cat-pocket-money', name: 'Pocket Money', type: 'income', group: 'Income', icon: 'Wallet', color: '#059669', isDefault: true },
  { id: 'cat-freelance', name: 'Freelance', type: 'income', group: 'Income', icon: 'Laptop', color: '#0284c7', isDefault: true },
  { id: 'cat-scholarship', name: 'Scholarship', type: 'income', group: 'Income', icon: 'Award', color: '#8b5cf6', isDefault: true },
  { id: 'cat-other-income', name: 'Other Income', type: 'income', group: 'Income', icon: 'Coins', color: '#14b8a6', isDefault: true },

  // Other
  { id: 'cat-gifts', name: 'Gifts', type: 'both', group: 'Other', icon: 'Gift', color: '#f43f5e', isDefault: true },
  { id: 'cat-miscellaneous', name: 'Miscellaneous', type: 'expense', group: 'Other', icon: 'Layers', color: '#64748b', isDefault: true },
  { id: 'cat-other', name: 'Other', type: 'both', group: 'Other', icon: 'CircleEllipsis', color: '#94a3b8', isDefault: true },
];

export const DEFAULT_MONEY_SOURCES: Omit<MoneySource, 'createdAt'>[] = [
  { id: 'source-dad', name: "Dad's Money", description: "Monthly allowances and transfers from Dad", icon: 'UserCheck', color: '#3b82f6' },
  { id: 'source-mom', name: "Mom's Money", description: "Special support and pocket funds from Mom", icon: 'Heart', color: '#ec4899' },
  { id: 'source-scholarship', name: "Scholarship", description: "Academic and merit stipend disbursements", icon: 'Award', color: '#8b5cf6' },
  { id: 'source-freelance', name: "Freelance", description: "Direct project and gig earnings", icon: 'Laptop', color: '#10b981' },
];
