/**
 * FinTracker Android In-App Update Service
 *
 * Checks for new releases published to the official FinTracker GitHub repository.
 * Compares semantic versions, respects update-check cooldown intervals,
 * and launches the native Android APK package installer flow.
 *
 * Privacy Guarantee:
 *   Zero user transactions, account details, or balances are ever transmitted.
 *   Only public release metadata is retrieved from GitHub.
 */

import { APP_VERSION, GITHUB_RELEASES_API, compareVersions } from '../../config/version';
import { isAndroidNative } from './index';

export interface ReleaseAsset {
  name: string;
  size: number;
  browser_download_url: string;
  content_type: string;
}

export interface GitHubReleaseResponse {
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  html_url: string;
  assets: ReleaseAsset[];
}

export interface ReleaseInfo {
  version: string;
  tagName: string;
  title: string;
  releaseNotes: string;
  publishedAt: string;
  downloadUrl: string;
  assetName: string;
  assetSize?: number;
}

export type UpdateCheckResult =
  | { status: 'update_available'; release: ReleaseInfo }
  | { status: 'up_to_date'; currentVersion: string }
  | { status: 'offline'; message: string }
  | { status: 'error'; message: string };

const STORAGE_KEY_LAST_CHECK = 'fintracker_last_update_check';
const AUTO_CHECK_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 Hours

export class UpdateService {
  private apiEndpoint: string;
  private currentVersion: string;

  constructor(apiEndpoint = GITHUB_RELEASES_API, currentVersion = APP_VERSION) {
    this.apiEndpoint = apiEndpoint;
    this.currentVersion = currentVersion;
  }

  /**
   * Check if the application should perform an automatic update check
   */
  public shouldAutoCheck(): boolean {
    if (!isAndroidNative()) return false;
    if (typeof window === 'undefined' || !window.localStorage) return false;

    const raw = localStorage.getItem(STORAGE_KEY_LAST_CHECK);
    if (!raw) return true;

    try {
      const data = JSON.parse(raw);
      const elapsed = Date.now() - (data.timestamp || 0);
      return elapsed >= AUTO_CHECK_COOLDOWN_MS;
    } catch {
      return true;
    }
  }

  /**
   * Record the timestamp of the last successful check
   */
  private recordLastCheck(release?: ReleaseInfo): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      localStorage.setItem(
        STORAGE_KEY_LAST_CHECK,
        JSON.stringify({
          timestamp: Date.now(),
          release: release || null,
        })
      );
    } catch {
      // Storage quota or private mode fallback
    }
  }

  /**
   * Parse GitHub release response and locate the appropriate APK asset
   */
  public parseReleaseResponse(data: GitHubReleaseResponse): ReleaseInfo | null {
    if (!data || !data.tag_name) return null;

    const version = data.tag_name.replace(/^v/i, '').trim();

    // Locate primary APK release asset
    const apkAsset = (data.assets || []).find(
      asset =>
        asset.name.endsWith('.apk') &&
        !asset.name.includes('-unsigned') // prefer signed APK
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

  /**
   * Query GitHub Releases API and determine if a newer version is available.
   *
   * @param force When true, ignores the 24h startup cooldown (e.g. user clicked "Check for Updates")
   */
  public async checkForUpdate(force = false): Promise<UpdateCheckResult> {
    // Offline check
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return { status: 'offline', message: 'No internet connection available.' };
    }

    if (!force && !this.shouldAutoCheck()) {
      // Respect cooldown for silent background checks
      return { status: 'up_to_date', currentVersion: this.currentVersion };
    }

    try {
      const response = await fetch(this.apiEndpoint, {
        headers: {
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return { status: 'up_to_date', currentVersion: this.currentVersion };
        }
        if (response.status === 403) {
          return { status: 'error', message: 'GitHub API rate limit reached. Please try again later.' };
        }
        return { status: 'error', message: `Server returned HTTP ${response.status}` };
      }

      const data: GitHubReleaseResponse = await response.json();
      const release = this.parseReleaseResponse(data);

      if (!release) {
        return { status: 'up_to_date', currentVersion: this.currentVersion };
      }

      this.recordLastCheck(release);

      // Semantic comparison: returns 1 if release.version > currentVersion
      const isNewer = compareVersions(release.version, this.currentVersion) > 0;

      if (isNewer) {
        return { status: 'update_available', release };
      }

      return { status: 'up_to_date', currentVersion: this.currentVersion };
    } catch (err: any) {
      return {
        status: 'error',
        message: err?.message || 'Failed to check for updates.',
      };
    }
  }

  /**
   * Launch Android package download & installation flow.
   *
   * On Android, opening the direct verified HTTPS APK download URL initiates
   * the Android DownloadManager, which prompts the user to open and install the update.
   */
  public launchApkInstaller(downloadUrl: string): void {
    if (!downloadUrl) return;

    // Security check: only allow official HTTPS URLs from GitHub
    try {
      const url = new URL(downloadUrl);
      if (url.protocol !== 'https:' || !url.hostname.endsWith('github.com')) {
        console.error('Security alert: Rejected untrusted APK download source:', downloadUrl);
        return;
      }
    } catch {
      console.error('Invalid APK download URL:', downloadUrl);
      return;
    }

    // Launch in system browser / download manager
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.target = '_system'; // Instructs Capacitor / Android to open outside WebView
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export const updateService = new UpdateService();
