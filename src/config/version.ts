export const APP_VERSION = '1.2.0';
export const APP_VERSION_CODE = 5;
export const APP_NAME = 'FinTracker';
export const APP_RELEASE_DATE = 'September 2026';
export const APP_TAGLINE = 'Premium Local-First Personal Finance';

export const GITHUB_REPO_OWNER = 'harshithsai571';
export const GITHUB_REPO_NAME = 'FinTracker';
export const GITHUB_RELEASES_API = `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/releases/latest`;
export const GITHUB_RELEASES_PAGE = `https://github.com/harshithsai571/${GITHUB_REPO_NAME}/releases/latest`;

export interface VersionInfo {
  version: string;
  releaseDate: string;
  title: string;
  highlights: string[];
}

export const APP_CHANGELOG: VersionInfo[] = [
  {
    version: '1.2.0',
    releaseDate: 'September 18, 2026',
    title: 'Smarter Money Tracking — Accounts, Transfers, Refunds & Splits',
    highlights: [
      'Multiple Accounts: Cash in Hand, Bank, UPI, Wallets, and Other with derived balances',
      'Inter-Account Transfers: ATM withdrawals and account shifts preserve overall net worth',
      'Distinct Refund tracking with Emerald badges and optional original expense linking',
      'Split Transactions: Allocate a single bill across multiple categories with strict validation',
      'Advanced Search & Combinable Multi-Criteria Filters (Payee, Account, Category, Date range, Amount)',
      'Accounts Overview Dashboard Widget with quick navigation and Add Account button',
      'Full IndexedDB Schema v2 migration with zero data loss for existing users',
      'Complete backward-compatible JSON backup and CSV export with account breakdowns'
    ]
  },
  {
    version: '1.1.1',
    releaseDate: 'September 18, 2026',
    title: 'Native Android In-App Update Experience',
    highlights: [
      'Direct native APK downloads with real-time progress and transfer speed indicators',
      'Cryptographic SHA-256 integrity verification and package identity safety checks',
      'Seamless Android Package Installer integration via secure FileProvider',
      'Intelligent update detection respecting 24-hour battery and data cooldown intervals',
      'Safe unknown app installation permission assistance with one-tap system settings access',
      'Zero external browser redirections — update directly within the FinTracker interface',
      'Guaranteed financial data preservation: 100% offline IndexedDB records remain intact'
    ]
  },
  {
    version: '1.1.0',
    releaseDate: 'September 18, 2026',
    title: 'Premium UI/UX Upgrade & Android Safe-Area Fix',
    highlights: [
      'Android system status-bar and gesture safe-area insets fix',
      'Dynamic edge-to-edge transparent system bars with Light and Dark theme matching',
      'Premium Fintech UI upgrade for Header, Balance Hero Card, and Navigation',
      'Responsive financial amount typography ensuring large ₹ figures remain readable',
      'Polished spending overview empty state with direct Add Expense CTA',
      'Enhanced touch targets on month navigation and tactile floating Add button',
      'Preserved 100% local-first IndexedDB persistence and offline PWA capability'
    ]
  },
  {
    version: '1.0.0',
    releaseDate: 'September 16, 2026',
    title: 'FinTracker V1 Official Release',
    highlights: [
      'Local-first persistent IndexedDB storage',
      'Indian Rupee (₹) branding & high-precision tracking',
      'Other Money system with Dad/Mom/Scholarship tracking & expense linking',
      'Fast transaction entry with quick keypad & categorization',
      'Reports & visual monthly spending trends',
      'Defensive JSON and CSV data import & export',
      'Offline-capable PWA with automatic update detection',
      'Refined Dark and Light themes'
    ]
  }
];

/**
 * Compare two semantic version strings.
 * Returns:
 *   1 if v1 > v2 (e.g. 1.1.0 > 1.0.0, 1.10.0 > 1.9.0)
 *  -1 if v1 < v2
 *   0 if v1 === v2
 */
export function compareVersions(v1: string, v2: string): number {
  const sanitize = (v: string) =>
    v
      .trim()
      .replace(/^v/i, '')
      .split('-')[0] // remove pre-release tags like -beta or -rc
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

