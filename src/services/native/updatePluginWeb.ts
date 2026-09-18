import { WebPlugin } from '@capacitor/core';
import type {
  AppUpdatePlugin,
  AppVersionInfo,
  DownloadProgress,
  InstallResult,
  VerificationResult,
} from './updatePlugin';
import { APP_VERSION } from '../../config/version';

export class AppUpdatePluginWeb extends WebPlugin implements AppUpdatePlugin {
  async getAppVersion(): Promise<AppVersionInfo> {
    return {
      version: APP_VERSION,
      versionCode: 1,
      packageName: 'com.fintracker.app',
    };
  }

  async canInstallUnknownApps(): Promise<{ canInstall: boolean }> {
    return { canInstall: false };
  }

  async openInstallPermissionSettings(): Promise<{ opened: boolean }> {
    return { opened: false };
  }

  async downloadUpdate(): Promise<{ started: boolean }> {
    throw this.unimplemented('APK in-app updates are only available on Android native devices.');
  }

  async getDownloadProgress(): Promise<DownloadProgress> {
    return {
      state: 'IDLE',
      downloadedBytes: 0,
      totalBytes: 0,
      percentage: 0,
    };
  }

  async verifyUpdate(): Promise<VerificationResult> {
    return {
      valid: false,
      status: 'FILE_NOT_FOUND',
      error: 'Not running on Android native platform.',
    };
  }

  async installUpdate(): Promise<InstallResult> {
    return {
      status: 'ERROR',
      error: 'APK installation is only supported on Android native devices.',
    };
  }

  async cancelUpdate(): Promise<{ success: boolean }> {
    return { success: true };
  }

  async resetUpdateState(): Promise<{ success: boolean }> {
    return { success: true };
  }
}
