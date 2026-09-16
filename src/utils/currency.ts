/**
 * Currency formatting utilities for FinTracker with Indian numbering system (Lakhs/Crores)
 */

export function formatCurrency(
  amount: number,
  symbol: string = '₹',
  includeDecimals: boolean = false
): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return `${symbol}0`;
  }

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  const formattedNumber = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: includeDecimals ? (absAmount % 1 !== 0 ? 2 : 0) : 0,
    maximumFractionDigits: 2,
  }).format(absAmount);

  return `${isNegative ? '-' : ''}${symbol}${formattedNumber}`;
}

export function formatCompact(amount: number, symbol: string = '₹'): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return `${symbol}0`;
  }

  const isNegative = amount < 0;
  const abs = Math.abs(amount);

  let formatted = '';
  if (abs >= 10000000) {
    formatted = (abs / 10000000).toFixed(2).replace(/\.?0+$/, '') + ' Cr';
  } else if (abs >= 100000) {
    formatted = (abs / 100000).toFixed(2).replace(/\.?0+$/, '') + ' L';
  } else if (abs >= 1000) {
    formatted = (abs / 1000).toFixed(1).replace(/\.?0+$/, '') + ' k';
  } else {
    formatted = abs.toString();
  }

  return `${isNegative ? '-' : ''}${symbol}${formatted}`;
}

export function parseAmount(val: string): number {
  if (!val) return 0;
  const cleaned = val.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
}
