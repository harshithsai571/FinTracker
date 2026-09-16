import { Transaction } from '../types/transaction';

export function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentTimeString(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function getCurrentMonthString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const today = getTodayString();
  
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const yesterdayYear = d.getFullYear();
  const yesterdayMonth = String(d.getMonth() + 1).padStart(2, '0');
  const yesterdayDay = String(d.getDate()).padStart(2, '0');
  const yesterday = `${yesterdayYear}-${yesterdayMonth}-${yesterdayDay}`;

  if (dateStr === today) {
    return 'Today';
  }
  if (dateStr === yesterday) {
    return 'Yesterday';
  }

  // Parse YYYY-MM-DD
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const dateObj = new Date(year, month, day);
    
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: year !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  }

  return dateStr;
}

export function formatTime(timeStr: string): string {
  if (!timeStr) return '';
  const [hoursStr, minsStr] = timeStr.split(':');
  let hours = parseInt(hoursStr, 10);
  const mins = minsStr || '00';
  if (isNaN(hours)) return timeStr;

  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 is 12 AM
  return `${hours}:${mins} ${ampm}`;
}

export function formatDateTime(dateStr: string, timeStr?: string): string {
  const formattedDate = formatDate(dateStr);
  if (!timeStr) return formattedDate;
  return `${formattedDate}, ${formatTime(timeStr)}`;
}

export function getMonthName(monthStr: string): string {
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-');
  const dateObj = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
  return dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function getAdjacentMonth(monthStr: string, delta: number): string {
  const [yearStr, monthNumStr] = monthStr.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthNumStr, 10) - 1 + delta;

  const newDate = new Date(year, month, 1);
  const newYear = newDate.getFullYear();
  const newMonth = String(newDate.getMonth() + 1).padStart(2, '0');
  return `${newYear}-${newMonth}`;
}

export interface DateGroup<T> {
  date: string;
  displayDate: string;
  items: T[];
  totalIncome: number;
  totalExpense: number;
}

export function groupTransactionsByDate(transactions: Transaction[]): DateGroup<Transaction>[] {
  const groupMap = new Map<string, DateGroup<Transaction>>();

  for (const tx of transactions) {
    let group = groupMap.get(tx.date);
    if (!group) {
      group = {
        date: tx.date,
        displayDate: formatDate(tx.date),
        items: [],
        totalIncome: 0,
        totalExpense: 0,
      };
      groupMap.set(tx.date, group);
    }
    group.items.push(tx);
    if (tx.type === 'income') {
      group.totalIncome += tx.amount;
    } else {
      group.totalExpense += tx.amount;
    }
  }

  // Sort groups descending by date
  return Array.from(groupMap.values()).sort((a, b) => b.date.localeCompare(a.date));
}
