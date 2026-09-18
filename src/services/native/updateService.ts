/**
 * FinTracker Native Android In-App Update Service
 *
 * Checks for new releases published to the official FinTracker GitHub repository.
 * Compares semantic versions, respects update-check cooldown intervals,
 * downloads release APKs with real-time progress, verifies SHA-256 integrity
 * and package identity (com.fintracker.app), and launches the native Android
 * Package Installer via FileProvider.
 *
 * Privacy Guarantee:
 *   Zero user transactions, account details, or balances are ever transmitted.
 *   Only public release metadata is retrieved from GitHub.
 */

import { APP_VERSION, GITHUB_RELEASES_API, compareVersions } from '../../config/version';
import { isAndroidNative } from './index';
import {
  NativeAppUpdate,
  UpdateState,
  DownloadProgress,
  VerificationResult,
  InstallResult,
} from './updatePlugin';
import { PluginListenerHandle } from '@capacitor/core';

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
  draft?: boolean;
  prerelease?: boolean;
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
  sha256?: string;
  sha256Url?: string;
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
  private state: UpdateState = 'IDLE';
  private activeProgressHandle: PluginListenerHandle | null = null;

  constructor(apiEndpoint = GITHUB_RELEASES_API, currentVersion = APP_VERSION) {
    this.apiEndpoint = apiEndpoint;
    this.currentVersion = currentVersion;
  }

  public getState(): UpdateState {
    return this.state;
  }

  public getCurrentVersion(): string {
    return this.currentVersion;
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
   * Parse GitHub release response, enforce stable production releases,
   * and locate the official signed APK asset and SHA-256 checksum asset.
   */
  public parseReleaseResponse(data: GitHubReleaseResponse): ReleaseInfo | null {
    if (!data || !data.tag_name) return null;

    // Rule: The production updater must ignore draft and pre-release builds
    if (data.draft === true || data.prerelease === true) {
      return null;
    }

    const version = data.tag_name.replace(/^v/i, '').trim();
    const assets = Array.isArray(data.assets) ? data.assets : [];

    // Locate primary signed APK release asset (ignore -unsigned APKs)
    const apkAsset =
      assets.find(
        asset =>
          asset.name.endsWith('.apk') &&
          !asset.name.toLowerCase().includes('-unsigned') &&
          !asset.name.toLowerCase().includes('-debug')
      ) || assets.find(asset => asset.name.endsWith('.apk') && !asset.name.toLowerCase().includes('-debug'));

    if (!apkAsset) return null;

    // Locate corresponding SHA-256 checksum asset if present
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

  /**
   * Fetch SHA-256 hash text from the release asset if available
   */
  public async fetchExpectedSha256(sha256Url: string): Promise<string | null> {
    if (!sha256Url) return null;
    try {
      const resp = await fetch(sha256Url);
      if (!resp.ok) return null;
      const text = await resp.text();
      // Look for a 64-character hexadecimal SHA-256 hash
      const match = text.match(/\b[a-fA-F0-9]{64}\b/);
      return match ? match[0].toLowerCase() : null;
    } catch {
      return null;
    }
  }

  /**
   * Query GitHub Releases API and determine if a newer version is available.
   *
   * @param force When true, ignores the 24h startup cooldown
   */
  public async checkForUpdate(force = false): Promise<UpdateCheckResult> {
    // Offline check
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return { status: 'offline', message: 'No internet connection available.' };
    }

    if (!force && !this.shouldAutoCheck()) {
      return { status: 'up_to_date', currentVersion: this.currentVersion };
    }

    this.state = 'CHECKING';

    try {
      const response = await fetch(this.apiEndpoint, {
        headers: {
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        this.state = 'IDLE';
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
        this.state = 'IDLE';
        return { status: 'up_to_date', currentVersion: this.currentVersion };
      }

      this.recordLastCheck(release);

      // Semantic comparison: returns 1 if release.version > currentVersion
      const isNewer = compareVersions(release.version, this.currentVersion) > 0;

      if (isNewer) {
        this.state = 'UPDATE_AVAILABLE';

        // Optionally pre-fetch SHA-256 checksum if available
        if (release.sha256Url && !release.sha256) {
          try {
            const hash = await this.fetchExpectedSha256(release.sha256Url);
            if (hash) release.sha256 = hash;
          } catch {
            // Checksum asset optional
          }
        }

        return { status: 'update_available', release };
      }

      this.state = 'IDLE';
      return { status: 'up_to_date', currentVersion: this.currentVersion };
    } catch (err: any) {
      this.state = 'FAILED';
      return {
        status: 'error',
        message: err?.message || 'Failed to check for updates.',
      };
    }
  }

  /**
   * Start native background download with live progress
   */
  public async downloadUpdate(
    release: ReleaseInfo,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<{ success: boolean; error?: string }> {
    if (!isAndroidNative()) {
      return {
        success: false,
        error: 'In-app APK downloading is only supported on Android native devices.',
      };
    }

    if (this.state === 'DOWNLOADING') {
      return {
        success: false,
        error: 'A download is already in progress.',
      };
    }

    this.state = 'DOWNLOADING';

    // Remove any prior progress listener
    if (this.activeProgressHandle) {
      await this.activeProgressHandle.remove();
      this.activeProgressHandle = null;
    }

    // Subscribe to native progress events
    this.activeProgressHandle = await NativeAppUpdate.addListener(
      'updateProgress',
      (progress: DownloadProgress) => {
        this.state = progress.state;
        if (onProgress) {
          onProgress(progress);
        }
      }
    );

    // If expected SHA-256 is not yet populated, attempt fetching it
    let expectedHash = release.sha256;
    if (!expectedHash && release.sha256Url) {
      expectedHash = (await this.fetchExpectedSha256(release.sha256Url)) || undefined;
      release.sha256 = expectedHash;
    }

    try {
      const result = await NativeAppUpdate.downloadUpdate({
        url: release.downloadUrl,
        fileName: release.assetName,
        expectedSha256: expectedHash,
      });

      return { success: result.started };
    } catch (err: any) {
      this.state = 'FAILED';
      return {
        success: false,
        error: err?.message || 'Failed to start update download.',
      };
    }
  }

  /**
   * Query current download progress and state
   */
  public async getDownloadProgress(): Promise<DownloadProgress> {
    if (!isAndroidNative()) {
      return {
        state: this.state,
        downloadedBytes: 0,
        totalBytes: 0,
        percentage: 0,
      };
    }

    const progress = await NativeAppUpdate.getDownloadProgress();
    this.state = progress.state;
    return progress;
  }

  /**
   * Verify downloaded APK integrity and package ID
   */
  public async verifyUpdate(expectedSha256?: string): Promise<VerificationResult> {
    if (!isAndroidNative()) {
      return {
        valid: false,
        status: 'FILE_NOT_FOUND',
        error: 'Verification only available on Android native devices.',
      };
    }

    this.state = 'VERIFYING';
    const result = await NativeAppUpdate.verifyUpdate({ expectedSha256 });
    if (result.valid) {
      this.state = 'READY_TO_INSTALL';
    } else {
      this.state = 'FAILED';
    }
    return result;
  }

  /**
   * Launch native Android Package Installer for the verified APK
   */
  public async installUpdate(): Promise<InstallResult> {
    if (!isAndroidNative()) {
      return {
        status: 'ERROR',
        error: 'Installation only supported on Android native devices.',
      };
    }

    const result = await NativeAppUpdate.installUpdate();
    if (result.status === 'INSTALLING') {
      this.state = 'INSTALLING';
    } else if (result.status === 'INSTALL_PERMISSION_REQUIRED') {
      this.state = 'READY_TO_INSTALL';
    } else {
      this.state = 'FAILED';
    }
    return result;
  }

  /**
   * Check if app has permission to install unknown apps
   */
  public async canInstallUnknownApps(): Promise<boolean> {
    if (!isAndroidNative()) return false;
    try {
      const res = await NativeAppUpdate.canInstallUnknownApps();
      return res.canInstall;
    } catch {
      return false;
    }
  }

  /**
   * Open Android system settings to grant unknown apps installation permission
   */
  public async openInstallPermissionSettings(): Promise<void> {
    if (!isAndroidNative()) return;
    try {
      await NativeAppUpdate.openInstallPermissionSettings();
    } catch (err) {
      console.error('Failed to open install permission settings', err);
    }
  }

  /**
   * Cancel an in-progress update download and clean temporary files
   */
  public async cancelUpdate(): Promise<void> {
    if (this.activeProgressHandle) {
      await this.activeProgressHandle.remove();
      this.activeProgressHandle = null;
    }

    if (isAndroidNative()) {
      try {
        await NativeAppUpdate.cancelUpdate();
      } catch (err) {
        console.error('Error cancelling update', err);
      }
    }

    this.state = 'IDLE';
  }

  /**
   * Reset update state and clean update cache
   */
  public async resetUpdateState(): Promise<void> {
    if (this.activeProgressHandle) {
      await this.activeProgressHandle.remove();
      this.activeProgressHandle = null;
    }

    if (isAndroidNative()) {
      try {
        await NativeAppUpdate.resetUpdateState();
      } catch (err) {
        console.error('Error resetting update state', err);
      }
    }

    this.state = 'IDLE';
  }

  /**
   * Launch Android package download & installation flow (Backwards compatibility).
   *
   * On Android, opening the direct verified HTTPS APK download URL initiates
   * the browser/download manager if native engine is not invoked directly.
   */
  public launchApkInstaller(downloadUrl: string): void {
    if (!downloadUrl) return;

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

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.target = '_system';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export const updateService = new UpdateService();

