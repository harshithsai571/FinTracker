import { registerPlugin, PluginListenerHandle } from '@capacitor/core';

export type UpdateState =
  | 'IDLE'
  | 'CHECKING'
  | 'UPDATE_AVAILABLE'
  | 'DOWNLOADING'
  | 'VERIFYING'
  | 'READY_TO_INSTALL'
  | 'INSTALLING'
  | 'COMPLETED'
  | 'FAILED';

export interface DownloadProgress {
  state: UpdateState;
  downloadedBytes: number;
  totalBytes: number;
  percentage: number;
  speedBytesPerSec?: number;
  error?: string;
}

export interface VerificationResult {
  valid: boolean;
  status: 'VERIFIED' | 'VERIFICATION_FAILED' | 'INVALID_PACKAGE' | 'FILE_NOT_FOUND';
  error?: string;
  packageName?: string;
  versionName?: string;
  versionCode?: number;
}

export interface InstallResult {
  status: 'INSTALLING' | 'INSTALL_PERMISSION_REQUIRED' | 'FILE_NOT_FOUND' | 'ERROR';
  error?: string;
}

export interface AppVersionInfo {
  version: string;
  versionCode: number;
  packageName: string;
}

export interface AppUpdatePlugin {
  getAppVersion(): Promise<AppVersionInfo>;
  canInstallUnknownApps(): Promise<{ canInstall: boolean }>;
  openInstallPermissionSettings(): Promise<{ opened: boolean }>;
  downloadUpdate(options: {
    url: string;
    fileName?: string;
    expectedSha256?: string;
  }): Promise<{ started: boolean }>;
  getDownloadProgress(): Promise<DownloadProgress>;
  verifyUpdate(options?: {
    expectedSha256?: string;
  }): Promise<VerificationResult>;
  installUpdate(): Promise<InstallResult>;
  cancelUpdate(): Promise<{ success: boolean }>;
  resetUpdateState(): Promise<{ success: boolean }>;
  addListener(
    eventName: 'updateProgress',
    listenerFunc: (progress: DownloadProgress) => void
  ): Promise<PluginListenerHandle>;
}

export const NativeAppUpdate = registerPlugin<AppUpdatePlugin>('AppUpdate', {
  web: () => import('./updatePluginWeb').then(m => new m.AppUpdatePluginWeb()),
});
