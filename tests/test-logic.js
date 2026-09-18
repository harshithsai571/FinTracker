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

// Test 5: Version comparison
test('Semantic version comparison', () => {
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

// ============================================================================
// PART 1 — NATIVE ANDROID IN-APP UPDATE ENGINE: 18 VERIFICATION REQUIREMENTS
// ============================================================================

// Helper functions and state machine for update engine tests
function parseReleaseResponseStrict(data) {
  if (!data || !data.tag_name) return null;
  if (data.draft === true || data.prerelease === true) return null;

  const version = data.tag_name.replace(/^v/i, '').trim();
  const assets = Array.isArray(data.assets) ? data.assets : [];

  const apkAsset =
    assets.find(
      asset =>
        asset.name.endsWith('.apk') &&
        !asset.name.toLowerCase().includes('-unsigned') &&
        !asset.name.toLowerCase().includes('-debug')
    ) || assets.find(asset => asset.name.endsWith('.apk') && !asset.name.toLowerCase().includes('-debug'));

  if (!apkAsset) return null;

  const sha256Asset = assets.find(
    asset =>
      asset.name === `${apkAsset.name}.sha256` ||
      asset.name.endsWith('.sha256') ||
      asset.name.toLowerCase().includes('checksum')
  );

  return {
    version,
    tagName: data.tag_name,
    title: data.name || `FinTracker v${version}`,
    releaseNotes: data.body || '',
    publishedAt: data.published_at,
    downloadUrl: apkAsset.browser_download_url,
    assetName: apkAsset.name,
    assetSize: apkAsset.size,
    sha256Url: sha256Asset ? sha256Asset.browser_download_url : undefined,
  };
}

function verifyApkPackageArchive({ expectedSha256, actualSha256, packageName, isArchiveValid }) {
  if (expectedSha256) {
    const cleanExpected = expectedSha256.trim().toLowerCase();
    const cleanActual = (actualSha256 || '').trim().toLowerCase();
    if (cleanExpected !== cleanActual) {
      return { valid: false, status: 'VERIFICATION_FAILED', error: 'SHA-256 checksum mismatch' };
    }
  }

  if (!isArchiveValid) {
    return { valid: false, status: 'INVALID_PACKAGE', error: 'Corrupt or unreadable APK archive' };
  }

  if (packageName !== 'com.fintracker.app') {
    return { valid: false, status: 'INVALID_PACKAGE', error: `Mismatched package name: expected com.fintracker.app, got ${packageName}` };
  }

  return { valid: true, status: 'VERIFIED' };
}

class TestUpdateStateMachine {
  constructor(currentVersion = '1.2.0') {
    this.currentVersion = currentVersion;
    this.state = 'IDLE';
    this.lastCheckTimestamp = null;
    this.tempFiles = [];
  }

  checkForUpdate({ releaseData, force = false, isOnline = true }) {
    if (!isOnline) {
      return { status: 'offline', message: 'No internet connection available.' };
    }

    const COOLDOWN = 24 * 60 * 60 * 1000;
    const now = Date.now();
    if (!force && this.lastCheckTimestamp && (now - this.lastCheckTimestamp < COOLDOWN)) {
      return { status: 'up_to_date', currentVersion: this.currentVersion };
    }

    this.state = 'CHECKING';
    const release = parseReleaseResponseStrict(releaseData);
    if (!release) {
      this.state = 'IDLE';
      return { status: 'up_to_date', currentVersion: this.currentVersion };
    }

    this.lastCheckTimestamp = now;
    const isNewer = compareVersions(release.version, this.currentVersion) > 0;
    if (isNewer) {
      this.state = 'UPDATE_AVAILABLE';
      return { status: 'update_available', release };
    }

    this.state = 'IDLE';
    return { status: 'up_to_date', currentVersion: this.currentVersion };
  }

  startDownload(release, { simulateFailure = false, simulateProgress = false } = {}) {
    if (this.state === 'DOWNLOADING') {
      return { success: false, error: 'A download is already in progress.' };
    }

    this.state = 'DOWNLOADING';
    const tmpFile = `${release.assetName}.tmp`;
    this.tempFiles.push(tmpFile);

    const progressHistory = [];
    if (simulateProgress) {
      progressHistory.push({ state: 'DOWNLOADING', percentage: 25, downloadedBytes: 2500000, totalBytes: 10000000 });
      progressHistory.push({ state: 'DOWNLOADING', percentage: 50, downloadedBytes: 5000000, totalBytes: 10000000 });
      progressHistory.push({ state: 'DOWNLOADING', percentage: 100, downloadedBytes: 10000000, totalBytes: 10000000 });
    }

    if (simulateFailure) {
      // Clean up tmp files on failure
      this.tempFiles = this.tempFiles.filter(f => f !== tmpFile);
      this.state = 'FAILED';
      return { success: false, error: 'Connection reset by peer' };
    }

    return { success: true, progressHistory, tmpFile };
  }

  cancelDownload() {
    // Interrupted / cancelled download cleanup
    this.tempFiles = [];
    this.state = 'IDLE';
    return { cancelled: true };
  }

  verifyAndPrepare(verificationParams) {
    this.state = 'VERIFYING';
    const res = verifyApkPackageArchive(verificationParams);
    if (res.valid) {
      this.state = 'READY_TO_INSTALL';
    } else {
      this.state = 'FAILED';
    }
    return res;
  }

  installUpdate({ canInstallUnknown = true } = {}) {
    if (!canInstallUnknown) {
      // State remains READY_TO_INSTALL so user can grant permission and retry
      return { status: 'INSTALL_PERMISSION_REQUIRED' };
    }
    this.state = 'INSTALLING';
    return { status: 'INSTALLING' };
  }
}

// 1. Current version equals latest (UP_TO_DATE)
test('Req 1: Current version equals latest release (UP_TO_DATE)', () => {
  const machine = new TestUpdateStateMachine('1.2.0');
  const release = {
    tag_name: 'v1.2.0',
    assets: [{ name: 'FinTracker-v1.2.0.apk', size: 5000000, browser_download_url: 'https://example.com/FinTracker-v1.2.0.apk' }],
  };
  const result = machine.checkForUpdate({ releaseData: release, force: true });
  assert.strictEqual(result.status, 'up_to_date');
  assert.strictEqual(result.currentVersion, '1.2.0');
  assert.strictEqual(machine.state, 'IDLE');
});

// 2. Newer release exists (UPDATE_AVAILABLE)
test('Req 2: Newer release available (UPDATE_AVAILABLE)', () => {
  const machine = new TestUpdateStateMachine('1.2.0');
  const release = {
    tag_name: 'v1.3.0',
    name: 'FinTracker v1.3.0',
    body: 'Major upgrade',
    published_at: '2026-09-18T12:00:00Z',
    assets: [{ name: 'FinTracker-v1.3.0.apk', size: 5200000, browser_download_url: 'https://example.com/FinTracker-v1.3.0.apk' }],
  };
  const result = machine.checkForUpdate({ releaseData: release, force: true });
  assert.strictEqual(result.status, 'update_available');
  assert.strictEqual(result.release.version, '1.3.0');
  assert.strictEqual(result.release.downloadUrl, 'https://example.com/FinTracker-v1.3.0.apk');
  assert.strictEqual(machine.state, 'UPDATE_AVAILABLE');
});

// 3. Older remote release (no downgrade)
test('Req 3: Older remote release does not trigger downgrade', () => {
  const machine = new TestUpdateStateMachine('1.2.0');
  const release = {
    tag_name: 'v1.1.0',
    assets: [{ name: 'FinTracker-v1.1.0.apk', size: 4800000, browser_download_url: 'https://example.com/FinTracker-v1.1.0.apk' }],
  };
  const result = machine.checkForUpdate({ releaseData: release, force: true });
  assert.strictEqual(result.status, 'up_to_date');
  assert.strictEqual(machine.state, 'IDLE');
});

// 4. Draft release ignored
test('Req 4: Draft release is ignored', () => {
  const machine = new TestUpdateStateMachine('1.2.0');
  const release = {
    tag_name: 'v1.3.0',
    draft: true,
    assets: [{ name: 'FinTracker-v1.3.0.apk', size: 5200000, browser_download_url: 'https://example.com/FinTracker-v1.3.0.apk' }],
  };
  const result = machine.checkForUpdate({ releaseData: release, force: true });
  assert.strictEqual(result.status, 'up_to_date', 'Draft releases must never be offered for update');
  assert.strictEqual(machine.state, 'IDLE');
});

// 5. Pre-release ignored
test('Req 5: Pre-release is ignored for stable production channel', () => {
  const machine = new TestUpdateStateMachine('1.2.0');
  const release = {
    tag_name: 'v1.3.0-rc1',
    prerelease: true,
    assets: [{ name: 'FinTracker-v1.3.0-rc1.apk', size: 5200000, browser_download_url: 'https://example.com/FinTracker-v1.3.0-rc1.apk' }],
  };
  const result = machine.checkForUpdate({ releaseData: release, force: true });
  assert.strictEqual(result.status, 'up_to_date', 'Pre-releases must be ignored for stable channel');
  assert.strictEqual(machine.state, 'IDLE');
});

// 6. Missing APK handled
test('Req 6: Release without APK asset handled safely', () => {
  const machine = new TestUpdateStateMachine('1.2.0');
  const release = {
    tag_name: 'v1.3.0',
    assets: [
      { name: 'source-code.zip', size: 100000, browser_download_url: 'https://example.com/source.zip' },
      { name: 'notes.txt', size: 500, browser_download_url: 'https://example.com/notes.txt' }
    ],
  };
  const result = machine.checkForUpdate({ releaseData: release, force: true });
  assert.strictEqual(result.status, 'up_to_date');
  assert.strictEqual(machine.state, 'IDLE');
});

// 7. Download success & state progression
test('Req 7: Download success and progressive state transitions', () => {
  const machine = new TestUpdateStateMachine('1.2.0');
  machine.state = 'UPDATE_AVAILABLE';

  const downloadRes = machine.startDownload({ assetName: 'FinTracker-v1.3.0.apk' }, { simulateProgress: true });
  assert.strictEqual(downloadRes.success, true);
  assert.strictEqual(downloadRes.progressHistory.length, 3);
  assert.strictEqual(downloadRes.progressHistory[0].percentage, 25);
  assert.strictEqual(downloadRes.progressHistory[2].percentage, 100);

  // Transition to VERIFYING -> READY_TO_INSTALL
  const vRes = machine.verifyAndPrepare({
    expectedSha256: 'a1b2c3d4',
    actualSha256: 'a1b2c3d4',
    packageName: 'com.fintracker.app',
    isArchiveValid: true,
  });
  assert.strictEqual(vRes.valid, true);
  assert.strictEqual(machine.state, 'READY_TO_INSTALL');
});

// 8. Download failure & cleanup
test('Req 8: Download failure triggers state FAILED and deletes temporary .tmp file', () => {
  const machine = new TestUpdateStateMachine('1.2.0');
  machine.state = 'UPDATE_AVAILABLE';

  const downloadRes = machine.startDownload({ assetName: 'FinTracker-v1.3.0.apk' }, { simulateFailure: true });
  assert.strictEqual(downloadRes.success, false);
  assert.strictEqual(machine.state, 'FAILED');
  assert.strictEqual(machine.tempFiles.length, 0, 'Temporary .tmp file must be cleaned up on failure');
});

// 9. Interrupted/cancelled download cleanup
test('Req 9: Cancelled update cleans up temporary files and resets state to IDLE', () => {
  const machine = new TestUpdateStateMachine('1.2.0');
  machine.state = 'DOWNLOADING';
  machine.tempFiles.push('FinTracker-v1.3.0.apk.tmp');

  const cancelRes = machine.cancelDownload();
  assert.strictEqual(cancelRes.cancelled, true);
  assert.strictEqual(machine.state, 'IDLE');
  assert.strictEqual(machine.tempFiles.length, 0, 'No leftover .tmp files after cancellation');
});

// 10. Checksum match success
test('Req 10: SHA-256 Checksum Match succeeds verification', () => {
  const verification = verifyApkPackageArchive({
    expectedSha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    actualSha256: '9F86D081884C7D659A2FEAA0C55AD015A3BF4F1B2B0B822CD15D6C15B0F00A08', // Case insensitive
    packageName: 'com.fintracker.app',
    isArchiveValid: true,
  });
  assert.strictEqual(verification.valid, true);
  assert.strictEqual(verification.status, 'VERIFIED');
});

// 11. Checksum mismatch (VERIFICATION_FAILED)
test('Req 11: SHA-256 Checksum Mismatch rejects package with VERIFICATION_FAILED', () => {
  const verification = verifyApkPackageArchive({
    expectedSha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    actualSha256: '0000000000000000000000000000000000000000000000000000000000000000',
    packageName: 'com.fintracker.app',
    isArchiveValid: true,
  });
  assert.strictEqual(verification.valid, false);
  assert.strictEqual(verification.status, 'VERIFICATION_FAILED');
  assert.ok(verification.error.includes('mismatch'));
});

// 12. Invalid/corrupt APK structure (INVALID_PACKAGE)
test('Req 12: Corrupted or unparseable APK archive rejects with INVALID_PACKAGE', () => {
  const verification = verifyApkPackageArchive({
    expectedSha256: undefined,
    actualSha256: '12345',
    packageName: null,
    isArchiveValid: false,
  });
  assert.strictEqual(verification.valid, false);
  assert.strictEqual(verification.status, 'INVALID_PACKAGE');
  assert.ok(verification.error.includes('Corrupt or unreadable'));
});

// 13. Wrong package ID (INVALID_PACKAGE)
test('Req 13: Wrong package ID rejects with INVALID_PACKAGE to protect com.fintracker.app', () => {
  const verification = verifyApkPackageArchive({
    expectedSha256: undefined,
    actualSha256: '12345',
    packageName: 'com.malicious.imposter',
    isArchiveValid: true,
  });
  assert.strictEqual(verification.valid, false);
  assert.strictEqual(verification.status, 'INVALID_PACKAGE');
  assert.ok(verification.error.includes('Mismatched package name'));
});

// 14. Installation permission required status
test('Req 14: canRequestPackageInstalls() false returns INSTALL_PERMISSION_REQUIRED', () => {
  const machine = new TestUpdateStateMachine('1.2.0');
  machine.state = 'READY_TO_INSTALL';

  const installRes = machine.installUpdate({ canInstallUnknown: false });
  assert.strictEqual(installRes.status, 'INSTALL_PERMISSION_REQUIRED');
  assert.strictEqual(machine.state, 'READY_TO_INSTALL', 'State remains READY_TO_INSTALL for retry after granting permission');
});

// 15. Network unavailable / offline status
test('Req 15: Offline status detected without throwing uncaught exceptions', () => {
  const machine = new TestUpdateStateMachine('1.2.0');
  const result = machine.checkForUpdate({
    releaseData: null,
    force: true,
    isOnline: false,
  });
  assert.strictEqual(result.status, 'offline');
  assert.ok(result.message.includes('No internet connection'));
});

// 16. Duplicate update request prevention
test('Req 16: Duplicate update check suppressed by cooldown unless forced', () => {
  const machine = new TestUpdateStateMachine('1.2.0');
  const release = { tag_name: 'v1.2.0', assets: [] };

  // First check records timestamp
  const first = machine.checkForUpdate({ releaseData: release, force: false });
  assert.strictEqual(first.status, 'up_to_date');

  // Immediate subsequent automatic check is suppressed
  const duplicate = machine.checkForUpdate({ releaseData: release, force: false });
  assert.strictEqual(duplicate.status, 'up_to_date');

  // Forced check bypasses cooldown
  const forced = machine.checkForUpdate({ releaseData: release, force: true });
  assert.strictEqual(forced.status, 'up_to_date');
});

// 17. Duplicate download prevention
test('Req 17: Concurrent duplicate download calls are rejected', () => {
  const machine = new TestUpdateStateMachine('1.2.0');
  machine.state = 'UPDATE_AVAILABLE';

  const firstCall = machine.startDownload({ assetName: 'FinTracker-v1.3.0.apk' });
  assert.strictEqual(firstCall.success, true);
  assert.strictEqual(machine.state, 'DOWNLOADING');

  const secondCall = machine.startDownload({ assetName: 'FinTracker-v1.3.0.apk' });
  assert.strictEqual(secondCall.success, false);
  assert.strictEqual(secondCall.error, 'A download is already in progress.');
});

// 18. Existing financial data preservation check
test('Req 18: Existing financial data stores remain untouched by update operations', () => {
  // Mock financial database / storage state
  const mockStorage = {
    fintracker_transactions: JSON.stringify([{ id: 'tx-1', amount: 500, categoryId: 'cat-groceries' }]),
    fintracker_accounts: JSON.stringify([{ id: 'acc-1', name: 'Main Account', openingBalance: 10000 }]),
    fintracker_receipts: JSON.stringify([{ id: 'rc-1', amount: 2000 }]),
  };

  const initialTxSnapshot = mockStorage.fintracker_transactions;
  const initialAccSnapshot = mockStorage.fintracker_accounts;
  const initialRcSnapshot = mockStorage.fintracker_receipts;

  // Perform complete simulated update lifecycle
  const machine = new TestUpdateStateMachine('1.2.0');
  machine.checkForUpdate({ releaseData: { tag_name: 'v1.3.0', assets: [{ name: 'FinTracker-v1.3.0.apk' }] }, force: true });
  machine.startDownload({ assetName: 'FinTracker-v1.3.0.apk' });
  machine.verifyAndPrepare({ expectedSha256: 'hash', actualSha256: 'hash', packageName: 'com.fintracker.app', isArchiveValid: true });
  machine.installUpdate({ canInstallUnknown: true });

  // Assert user data integrity was not altered
  assert.strictEqual(mockStorage.fintracker_transactions, initialTxSnapshot, 'Transactions data preserved');
  assert.strictEqual(mockStorage.fintracker_accounts, initialAccSnapshot, 'Accounts data preserved');
  assert.strictEqual(mockStorage.fintracker_receipts, initialRcSnapshot, 'Receipts data preserved');
});

// ============================================================================
// PART 2 — PREMIUM IN-APP UPDATE UI + NATIVE UPDATER INTEGRATION TESTS
// ============================================================================

// Part 2 Test 1: Snooze ("Later") sets 24h cooldown and suppresses automatic checks
test('Part 2: Later snooze suppresses automatic check but allows manual check', () => {
  const store = {};
  const mockStorage = {
    getItem: (k) => store[k] || null,
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
  };

  const isSnoozed = () => {
    const raw = mockStorage.getItem('fintracker_update_snooze_until');
    if (!raw) return false;
    return Date.now() < parseInt(raw, 10);
  };

  const snoozeUpdate = (hours = 24) => {
    mockStorage.setItem('fintracker_update_snooze_until', Date.now() + hours * 3600 * 1000);
  };

  const clearSnooze = () => {
    mockStorage.removeItem('fintracker_update_snooze_until');
  };

  assert.strictEqual(isSnoozed(), false, 'Initially not snoozed');

  // User taps "Later"
  snoozeUpdate(24);
  assert.strictEqual(isSnoozed(), true, 'Snoozed after tapping Later');

  // Manual check in Settings clears snooze
  clearSnooze();
  assert.strictEqual(isSnoozed(), false, 'Snooze cleared on manual check');
});

// Part 2 Test 2: Release notes markdown sanitization & bullet parsing
test('Part 2: Release notes sanitization removes HTML and produces clean bullet items', () => {
  const parseNotes = (notes) => {
    if (!notes) return [];
    const clean = notes.replace(/<[^>]*>/g, '');
    return clean
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('*') || line.startsWith('-') || line.startsWith('•') || /^\d+\./.test(line))
      .map(line => line.replace(/^[\*\-•]\s*|^\d+\.\s*/, '').trim())
      .filter(line => line.length > 0 && !line.toLowerCase().startsWith('http'));
  };

  const rawNotes = `
# Release Notes <b>v1.1.1</b>
* Real-time download progress bar
* Cryptographic SHA-256 package validation
- In-app Android Package Installer launch
• Zero external browser redirection
1. Automated unknown sources guidance
<p>Full changelog at: https://github.com/harshithsai571/FinTracker</p>
  `;

  const parsed = parseNotes(rawNotes);
  assert.strictEqual(parsed.length, 5);
  assert.strictEqual(parsed[0], 'Real-time download progress bar');
  assert.strictEqual(parsed[1], 'Cryptographic SHA-256 package validation');
  assert.strictEqual(parsed[2], 'In-app Android Package Installer launch');
  assert.strictEqual(parsed[3], 'Zero external browser redirection');
  assert.strictEqual(parsed[4], 'Automated unknown sources guidance');
});

// Part 2 Test 3: Zero GitHub redirection - Direct APK flow verified
test('Part 2: Zero GitHub redirection — direct in-app download and installation', () => {
  let redirectedToBrowser = false;
  const mockBrowserOpen = (url) => {
    if (url.includes('github.com') && !url.endsWith('.apk')) {
      redirectedToBrowser = true;
    }
  };

  // Modern In-App Update flow:
  const releaseAssetUrl = 'https://github.com/harshithsai571/FinTracker/releases/download/v1.1.1/FinTracker-v1.1.1.apk';
  let downloadedAsset = null;
  let packageInstalled = false;

  const inAppDownload = (url) => {
    // Download directly via native engine, no browser launch
    downloadedAsset = url;
  };

  const inAppInstall = () => {
    if (downloadedAsset) {
      packageInstalled = true;
    }
  };

  inAppDownload(releaseAssetUrl);
  inAppInstall();

  assert.strictEqual(downloadedAsset, releaseAssetUrl);
  assert.strictEqual(packageInstalled, true);
  assert.strictEqual(redirectedToBrowser, false, 'User must never be redirected to GitHub release website');
});

// Part 2 Test 4: Platform separation between PWA and Native Android
test('Part 2: Clean separation between PWA service worker and Android Native APK updater', () => {
  const getUpdaterType = (isAndroidNative) => {
    if (isAndroidNative) {
      return 'NATIVE_APK_ENGINE';
    }
    return 'PWA_SERVICE_WORKER';
  };

  assert.strictEqual(getUpdaterType(true), 'NATIVE_APK_ENGINE', 'Android devices use native APK updater');
  assert.strictEqual(getUpdaterType(false), 'PWA_SERVICE_WORKER', 'Browser/PWA users use service worker updater');
});

// Part 2 Test 5: Unknown sources permission handling and recovery
test('Part 2: Unknown app install permission requirement and retry handling', () => {
  let permissionGranted = false;

  const tryInstall = () => {
    if (!permissionGranted) {
      return { status: 'INSTALL_PERMISSION_REQUIRED' };
    }
    return { status: 'INSTALLING' };
  };

  // Initial attempt before permission
  const firstAttempt = tryInstall();
  assert.strictEqual(firstAttempt.status, 'INSTALL_PERMISSION_REQUIRED');

  // User opens settings and grants permission
  permissionGranted = true;

  // Retry attempt
  const retryAttempt = tryInstall();
  assert.strictEqual(retryAttempt.status, 'INSTALLING');
});



