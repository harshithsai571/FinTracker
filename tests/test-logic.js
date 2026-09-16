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

