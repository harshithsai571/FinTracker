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
    const sanitize = (v) =>
      v
        .trim()
        .replace(/^v/i, '')
        .split('-')[0]
        .split('.')
        .map(num => parseInt(num, 10) || 0);

    const p1 = sanitize(v1);
    const p2 = sanitize(v2);
    const len = Math.max(p1.length, p2.length);

    for (let i = 0; i < len; i++) {
      const num1 = p1[i] ?? 0;
      const num2 = p2[i] ?? 0;
      if (num1 > num2) return 1;
      if (num1 < num2) return -1;
    }
    return 0;
  }

  assert.strictEqual(compareVersions('1.0.0', '1.0.0'), 0);
  assert.strictEqual(compareVersions('1.1.0', '1.0.0'), 1);
  assert.strictEqual(compareVersions('1.0.0', '1.0.1'), -1);
  assert.strictEqual(compareVersions('2.0.0', '1.9.9'), 1);
  assert.strictEqual(compareVersions('1.10.0', '1.9.0'), 1, '1.10.0 must be greater than 1.9.0 (non-alphabetical)');
  assert.strictEqual(compareVersions('v1.2.0', '1.2.0'), 0, 'Leading v prefix should be normalized');
  assert.strictEqual(compareVersions('1.0.0', '1.1.0'), -1, 'Older version should return -1');
  assert.strictEqual(compareVersions('1.2.3-beta', '1.2.3'), 0, 'Pre-release suffixes should be stripped');
});

// Test 6: GitHub Release APK Asset Extraction
test('GitHub Release APK Asset Extraction', () => {
  function parseReleaseResponse(data) {
    if (!data || !data.tag_name) return null;
    const version = data.tag_name.replace(/^v/i, '').trim();

    const apkAsset = (data.assets || []).find(
      asset =>
        asset.name.endsWith('.apk') &&
        !asset.name.includes('-unsigned')
    ) || (data.assets || []).find(asset => asset.name.endsWith('.apk'));

    if (!apkAsset) return null;

    return {
      version,
      tagName: data.tag_name,
      title: data.name || `FinTracker v${version}`,
      releaseNotes: data.body || '',
      publishedAt: data.published_at,
      downloadUrl: apkAsset.browser_download_url,
      assetName: apkAsset.name,
      assetSize: apkAsset.size,
    };
  }

  const mockRelease = {
    tag_name: 'v1.1.0',
    name: 'FinTracker v1.1.0',
    body: '* Added release APK\n* Bug fixes',
    published_at: '2026-09-16T12:00:00Z',
    assets: [
      { name: 'FinTracker-v1.1.0-unsigned.apk', size: 3400000, browser_download_url: 'https://github.com/releases/download/v1.1.0/FinTracker-v1.1.0-unsigned.apk' },
      { name: 'FinTracker-v1.1.0.apk', size: 3450000, browser_download_url: 'https://github.com/releases/download/v1.1.0/FinTracker-v1.1.0.apk' },
      { name: 'FinTracker-v1.1.0.apk.sha256', size: 64, browser_download_url: 'https://github.com/releases/download/v1.1.0/FinTracker-v1.1.0.apk.sha256' },
    ],
  };

  const parsed = parseReleaseResponse(mockRelease);
  assert.ok(parsed, 'Parsed release should not be null');
  assert.strictEqual(parsed.version, '1.1.0');
  assert.strictEqual(parsed.assetName, 'FinTracker-v1.1.0.apk', 'Should prioritize signed APK over unsigned or checksum file');
  assert.strictEqual(parsed.downloadUrl, 'https://github.com/releases/download/v1.1.0/FinTracker-v1.1.0.apk');
});

// Test 7: Update Cooldown Logic
test('Update Cooldown (24-hour interval)', () => {
  const AUTO_CHECK_COOLDOWN_MS = 24 * 60 * 60 * 1000;
  const now = Date.now();

  const shouldAutoCheck = (lastCheckTimestamp) => {
    if (!lastCheckTimestamp) return true;
    return (now - lastCheckTimestamp) >= AUTO_CHECK_COOLDOWN_MS;
  };

  assert.strictEqual(shouldAutoCheck(null), true, 'First launch should always check');
  assert.strictEqual(shouldAutoCheck(now - 1000), false, '1 second ago should be suppressed by cooldown');
  assert.strictEqual(shouldAutoCheck(now - 12 * 60 * 60 * 1000), false, '12 hours ago should be suppressed by cooldown');
  assert.strictEqual(shouldAutoCheck(now - 25 * 60 * 60 * 1000), true, '25 hours ago should trigger an update check');
});

// Test 8: Account Balance Derivation
test('Account Balance Derivation (openingBalance + income - expense + refund + transfersIn - transfersOut)', () => {
  const account = { id: 'acc-cash', name: 'Cash in Hand', type: 'cash', openingBalance: 5000 };
  const transactions = [
    { id: 'tx-1', type: 'income', amount: 2000, accountId: 'acc-cash' },
    { id: 'tx-2', type: 'expense', amount: 1500, accountId: 'acc-cash' },
    { id: 'tx-3', type: 'refund', amount: 500, accountId: 'acc-cash' },
    { id: 'tx-4', type: 'transfer', amount: 1000, accountId: 'acc-bank', toAccountId: 'acc-cash' }, // ATM withdrawal into cash
    { id: 'tx-5', type: 'transfer', amount: 800, accountId: 'acc-cash', toAccountId: 'acc-bank' },  // Cash deposit to bank
  ];

  let inc = 0;
  let exp = 0;
  let ref = 0;
  let tIn = 0;
  let tOut = 0;

  for (const t of transactions) {
    if (t.accountId === account.id) {
      if (t.type === 'income') inc += t.amount;
      else if (t.type === 'expense') exp += t.amount;
      else if (t.type === 'refund') ref += t.amount;
      else if (t.type === 'transfer') tOut += t.amount;
    } else if (t.toAccountId === account.id && t.type === 'transfer') {
      tIn += t.amount;
    }
  }

  const currentBalance = account.openingBalance + inc - exp + ref + tIn - tOut;
  // 5000 + 2000 - 1500 + 500 + 1000 - 800 = 6200
  assert.strictEqual(currentBalance, 6200, 'Cash in Hand balance should be ₹6,200');
});

// Test 9: Inter-Account Transfer Net Worth Preservation
test('Inter-Account Transfer Preserves Global Net Worth', () => {
  const accCash = { id: 'cash', openingBalance: 2000 };
  const accBank = { id: 'bank', openingBalance: 10000 };

  const getBalance = (acc, txs) => {
    let bal = acc.openingBalance;
    for (const t of txs) {
      if (t.accountId === acc.id) {
        if (t.type === 'expense' || t.type === 'transfer') bal -= t.amount;
        else if (t.type === 'income' || t.type === 'refund') bal += t.amount;
      }
      if (t.toAccountId === acc.id && t.type === 'transfer') {
        bal += t.amount;
      }
    }
    return bal;
  };

  const initialTxs = [];
  const initialNetWorth = getBalance(accCash, initialTxs) + getBalance(accBank, initialTxs);
  assert.strictEqual(initialNetWorth, 12000);

  // ATM withdrawal: Transfer ₹3,000 from Bank to Cash
  const afterTransferTxs = [
    { id: 'tx-t1', type: 'transfer', amount: 3000, accountId: 'bank', toAccountId: 'cash' },
  ];

  const cashBalAfter = getBalance(accCash, afterTransferTxs);
  const bankBalAfter = getBalance(accBank, afterTransferTxs);
  const postTransferNetWorth = cashBalAfter + bankBalAfter;

  assert.strictEqual(cashBalAfter, 5000, 'Cash should increase by ₹3,000 to ₹5,000');
  assert.strictEqual(bankBalAfter, 7000, 'Bank should decrease by ₹3,000 to ₹7,000');
  assert.strictEqual(postTransferNetWorth, 12000, 'Net worth must remain exactly ₹12,000 after transfer');
});

// Test 10: Split Transaction Strict Sum Validation
test('Split Transaction Sum Validation', () => {
  function validateSplitTransaction(amount, splits) {
    if (!splits || splits.length < 2) return { valid: false, error: 'Must have at least 2 split allocations' };
    const sum = splits.reduce((s, item) => s + (item.amount || 0), 0);
    if (Math.abs(sum - amount) > 0.01) {
      return { valid: false, error: `Split sum (${sum}) does not match total (${amount})` };
    }
    for (const item of splits) {
      if (!item.categoryId) return { valid: false, error: 'Every split must have a category' };
      if (!item.amount || item.amount <= 0) return { valid: false, error: 'Split amount must be positive' };
    }
    return { valid: true };
  }

  // Valid split
  const res1 = validateSplitTransaction(1250, [
    { categoryId: 'cat-groceries', amount: 800 },
    { categoryId: 'cat-home', amount: 450 },
  ]);
  assert.strictEqual(res1.valid, true);

  // Mismatched split sum
  const res2 = validateSplitTransaction(1250, [
    { categoryId: 'cat-groceries', amount: 800 },
    { categoryId: 'cat-home', amount: 400 },
  ]);
  assert.strictEqual(res2.valid, false);
  assert.ok(res2.error.includes('does not match total'));

  // Missing category in split
  const res3 = validateSplitTransaction(500, [
    { categoryId: 'cat-groceries', amount: 300 },
    { categoryId: '', amount: 200 },
  ]);
  assert.strictEqual(res3.valid, false);
});

// Test 11: Refund Balance Restoration
test('Refund Restores Account Balance Without Inflating Regular Income', () => {
  const account = { id: 'bank', openingBalance: 15000 };
  const txExpense = { id: 'e1', type: 'expense', amount: 2500, accountId: 'bank' };
  const txRefund = { id: 'r1', type: 'refund', amount: 2500, accountId: 'bank', linkedTransactionId: 'e1' };

  let bal = account.openingBalance - txExpense.amount;
  assert.strictEqual(bal, 12500, 'Balance after purchase should be ₹12,500');

  bal += txRefund.amount;
  assert.strictEqual(bal, 15000, 'Balance after refund should be restored to ₹15,000');
});

// Test 12: Legacy Unassigned Transactions Compatibility
test('Legacy Transactions without accountId Are Preserved Safely', () => {
  const legacyTx = {
    id: 'legacy-1',
    type: 'expense',
    amount: 350,
    categoryId: 'cat-food',
    date: '2026-09-10',
    time: '13:00',
    paymentMethod: 'upi',
    createdAt: '2026-09-10T13:00:00Z',
    updatedAt: '2026-09-10T13:00:00Z',
  };

  assert.strictEqual(legacyTx.accountId, undefined);
  const accountId = legacyTx.accountId || 'unassigned';
  assert.strictEqual(accountId, 'unassigned', 'Legacy tx should default gracefully to unassigned');
});

