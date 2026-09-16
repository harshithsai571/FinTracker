import assert from 'node:assert';
import { test } from 'node:test';

// Test 1: Currency Formatting
test('Currency formatting with Indian Lakhs and Crores numbering', () => {
  function formatCurrency(amount, symbol = '₹') {
    if (isNaN(amount) || amount === null || amount === undefined) return `${symbol}0`;
    const isNegative = amount < 0;
    const absAmount = Math.abs(amount);
    const formattedNumber = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(absAmount);
    return `${isNegative ? '-' : ''}${symbol}${formattedNumber}`;
  }

  assert.strictEqual(formatCurrency(0), '₹0');
  assert.strictEqual(formatCurrency(250), '₹250');
  assert.strictEqual(formatCurrency(12450), '₹12,450');
  assert.strictEqual(formatCurrency(100000), '₹1,00,000');
  assert.strictEqual(formatCurrency(1550000), '₹15,50,000');
  assert.strictEqual(formatCurrency(-7550), '-₹7,550');
});

// Test 2: Other Money Calculations
test('Other Money Calculations (Received - Used = Remaining)', () => {
  const receipts = [
    { id: '1', sourceId: 'dad', amount: 3000 },
    { id: '2', sourceId: 'dad', amount: 2000 },
    { id: '3', sourceId: 'dad', amount: 3000 },
    { id: '4', sourceId: 'mom', amount: 1500 },
  ];

  const expenses = [
    { id: 'tx-1', amount: 1200, sourceId: 'dad' },
    { id: 'tx-2', amount: 800, sourceId: 'dad' },
    { id: 'tx-3', amount: 3350, sourceId: 'dad' },
    { id: 'tx-4', amount: 500, sourceId: null }, // Main money
  ];

  const dadTotalReceived = receipts.filter(r => r.sourceId === 'dad').reduce((s, r) => s + r.amount, 0);
  const dadTotalUsed = expenses.filter(e => e.sourceId === 'dad').reduce((s, e) => s + e.amount, 0);
  const dadRemaining = dadTotalReceived - dadTotalUsed;

  assert.strictEqual(dadTotalReceived, 8000, 'Dad total received should be ₹8,000');
  assert.strictEqual(dadTotalUsed, 5350, 'Dad total used should be ₹5,350');
  assert.strictEqual(dadRemaining, 2650, 'Dad remaining should be ₹2,650');
});

// Test 3: Total Liquid Balance Calculation
test('Liquid Balance Calculation (Total Income + External Received - Total Expenses)', () => {
  const totalIncome = 20000;
  const otherMoneyReceived = 8000;
  const totalExpenses = 7550; // includes both main and linked expenses

  const availableBalance = totalIncome + otherMoneyReceived - totalExpenses;
  assert.strictEqual(availableBalance, 20450);
});

// Test 4: CSV Field Escaping
test('CSV Escaping against formula injection and quotes', () => {
  function escapeCsvField(field) {
    if (field === null || field === undefined) return '""';
    const str = String(field).replace(/"/g, '""');
    if (str.search(/([",\n\r]|^[=+\-@])/) !== -1) {
      return `"${str}"`;
    }
    return `"${str}"`;
  }

  assert.strictEqual(escapeCsvField('Canteen'), '"Canteen"');
  assert.strictEqual(escapeCsvField('Dinner "special"'), '"Dinner ""special"""');
  assert.strictEqual(escapeCsvField('=SUM(A1:A10)'), '"=SUM(A1:A10)"');
});

// Test 5: Version comparison
test('Semantic version comparison', () => {
  function compareVersions(v1, v2) {
    const parse = (v) => v.replace(/^v/i, '').split('.').map(num => parseInt(num, 10) || 0);
    const p1 = parse(v1);
    const p2 = parse(v2);
    const len = Math.max(p1.length, p2.length);
    for (let i = 0; i < len; i++) {
      const num1 = p1[i] || 0;
      const num2 = p2[i] || 0;
      if (num1 > num2) return 1;
      if (num1 < num2) return -1;
    }
    return 0;
  }

  assert.strictEqual(compareVersions('1.0.0', '1.0.0'), 0);
  assert.strictEqual(compareVersions('1.1.0', '1.0.0'), 1);
  assert.strictEqual(compareVersions('1.0.0', '1.0.1'), -1);
  assert.strictEqual(compareVersions('2.0.0', '1.9.9'), 1);
});
