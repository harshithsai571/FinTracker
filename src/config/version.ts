export const APP_VERSION = '1.0.0';
export const APP_NAME = 'FinTracker';
export const APP_RELEASE_DATE = 'September 2026';
export const APP_TAGLINE = 'Premium Local-First Personal Finance';

export interface VersionInfo {
  version: string;
  releaseDate: string;
  title: string;
  highlights: string[];
}

export const APP_CHANGELOG: VersionInfo[] = [
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

export function compareVersions(v1: string, v2: string): number {
  const parse = (v: string) => v.replace(/^v/i, '').split('.').map(num => parseInt(num, 10) || 0);
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
