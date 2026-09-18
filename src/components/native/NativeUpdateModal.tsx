import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Download,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Settings,
  X,
  ArrowRight,
  HardDrive,
} from 'lucide-react';
import { Button } from '../common/Button';
import {
  updateService,
  ReleaseInfo,
} from '../../services/native/updateService';
import {
  DownloadProgress,
} from '../../services/native/updatePlugin';
import { cn } from '../../utils/cn';

interface NativeUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  release: ReleaseInfo | null;
  currentVersion: string;
  onUpdate?: (downloadUrl: string) => void;
}

type ModalStage =
  | 'UPDATE_AVAILABLE'
  | 'DOWNLOADING'
  | 'VERIFYING'
  | 'READY_TO_INSTALL'
  | 'INSTALL_PERMISSION_REQUIRED'
  | 'INSTALLING'
  | 'COMPLETED'
  | 'FAILED';

export const NativeUpdateModal: React.FC<NativeUpdateModalProps> = ({
  isOpen,
  onClose,
  release,
  currentVersion,
}) => {
  const [stage, setStage] = useState<ModalStage>('UPDATE_AVAILABLE');
  const [progress, setProgress] = useState<DownloadProgress>({
    state: 'IDLE',
    downloadedBytes: 0,
    totalBytes: 0,
    percentage: 0,
  });
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Reset or initialize stage whenever a new release is opened
  useEffect(() => {
    if (isOpen && release) {
      setStage('UPDATE_AVAILABLE');
      setProgress({
        state: 'IDLE',
        downloadedBytes: 0,
        totalBytes: release.assetSize || 0,
        percentage: 0,
      });
      setErrorMessage('');
    }
  }, [isOpen, release]);

  // Lock body scroll while modal is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const formatBytes = (bytes: number): string => {
    if (!bytes || bytes <= 0) return '0 B';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatSpeed = (bytesPerSec?: number): string => {
    if (!bytesPerSec || bytesPerSec <= 0) return '';
    const mbps = bytesPerSec / (1024 * 1024);
    return `${mbps.toFixed(1)} MB/s`;
  };

  // Clean and parse markdown bullet points from release notes
  const parseNotes = (notes?: string): string[] => {
    if (!notes) return [];
    const clean = notes.replace(/<[^>]*>/g, '');
    return clean
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('*') || line.startsWith('-') || line.startsWith('•') || /^\d+\./.test(line))
      .map(line => line.replace(/^[\*\-•]\s*|^\d+\.\s*/, '').trim())
      .filter(line => line.length > 0 && !line.toLowerCase().startsWith('http'));
  };

  // Launch the installation step
  const executeInstall = useCallback(async () => {
    setStage('INSTALLING');
    try {
      const result = await updateService.installUpdate();
      if (result.status === 'INSTALL_PERMISSION_REQUIRED') {
        setStage('INSTALL_PERMISSION_REQUIRED');
      } else if (result.status === 'INSTALLING') {
        // System Package Installer is taking over
        setStage('INSTALLING');
      } else {
        setErrorMessage(result.error || "FinTracker couldn't be updated.");
        setStage('FAILED');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "FinTracker couldn't be updated.");
      setStage('FAILED');
    }
  }, []);

  // Handle native progress events
  const handleProgress = useCallback((p: DownloadProgress) => {
    setProgress(p);

    if (p.state === 'DOWNLOADING') {
      setStage('DOWNLOADING');
    } else if (p.state === 'VERIFYING') {
      setStage('VERIFYING');
    } else if (p.state === 'READY_TO_INSTALL') {
      setStage('READY_TO_INSTALL');
      // Auto-trigger installation attempt
      executeInstall();
    } else if (p.state === 'FAILED') {
      setErrorMessage(p.error || "Couldn't download the update.");
      setStage('FAILED');
    }
  }, [executeInstall]);

  // Initiate native download flow
  const handleStartUpdate = async () => {
    if (!release) return;

    setStage('DOWNLOADING');
    setProgress({
      state: 'DOWNLOADING',
      downloadedBytes: 0,
      totalBytes: release.assetSize || 0,
      percentage: 0,
    });
    setErrorMessage('');

    try {
      const res = await updateService.downloadUpdate(release, handleProgress);
      if (!res.success) {
        setErrorMessage(res.error || "Couldn't download the update.");
        setStage('FAILED');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Couldn't download the update.");
      setStage('FAILED');
    }
  };

  // Handle snooze / later action
  const handleLater = async () => {
    if (stage === 'DOWNLOADING') {
      await updateService.cancelUpdate();
    }
    updateService.snoozeUpdate(24);
    onClose();
  };

  // Open Android system unknown sources settings
  const handleOpenSettings = async () => {
    await updateService.openInstallPermissionSettings();
  };

  // Retry update after permission grant or failure
  const handleRetry = async () => {
    if (stage === 'INSTALL_PERMISSION_REQUIRED') {
      const canInstall = await updateService.canInstallUnknownApps();
      if (canInstall) {
        executeInstall();
      } else {
        // Retry install anyway so system shows permission dialog if available
        executeInstall();
      }
    } else {
      handleStartUpdate();
    }
  };

  if (!isOpen || !release) return null;

  const notesList = parseNotes(release.releaseNotes);
  const formattedTotalSize = release.assetSize ? formatBytes(release.assetSize) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="update-dialog-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-surface-950/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={stage === 'DOWNLOADING' ? undefined : handleLater}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        className={cn(
          'relative w-full max-w-md bg-white dark:bg-surface-900',
          'rounded-t-3xl sm:rounded-2xl border-t sm:border border-surface-200 dark:border-surface-800',
          'shadow-2xl p-5 sm:p-6 z-10 flex flex-col transition-all',
          'pb-[max(1.5rem,env(safe-area-inset-bottom,1.5rem))]',
          'pt-[max(1.25rem,env(safe-area-inset-top,1.25rem))]',
          'animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-200'
        )}
      >
        {/* Top Pull Indicator on Mobile */}
        <div className="w-12 h-1.5 bg-surface-300 dark:bg-surface-700 rounded-full mx-auto mb-3 sm:hidden shrink-0" />

        {/* ========================================================================= */}
        {/* STAGE 1: UPDATE AVAILABLE                                                */}
        {/* ========================================================================= */}
        {stage === 'UPDATE_AVAILABLE' && (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500/20 to-amber-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center border border-brand-500/30">
                  <Sparkles className="w-5 h-5 text-amber-500 motion-safe:animate-pulse" />
                </div>
                <div>
                  <h3
                    id="update-dialog-title"
                    className="text-base font-bold text-surface-900 dark:text-surface-100"
                  >
                    Update Available
                  </h3>
                  <p className="text-xs text-surface-500 dark:text-surface-400">
                    FinTracker Android
                  </p>
                </div>
              </div>

              <button
                onClick={handleLater}
                className="p-1.5 rounded-xl text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                aria-label="Close update dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Version Transition Hero */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-50 via-brand-50/50 to-surface-50 dark:from-brand-950/60 dark:via-brand-950/30 dark:to-surface-900/60 border border-brand-200 dark:border-brand-900/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                  Installed
                </span>
                <p className="text-sm font-bold text-surface-700 dark:text-surface-300">
                  v{currentVersion}
                </p>
              </div>

              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/50 text-brand-600 dark:text-brand-400">
                <ArrowRight className="w-4 h-4" />
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                  New Version
                </span>
                <p className="text-base font-black text-brand-700 dark:text-brand-300">
                  v{release.version}
                </p>
              </div>
            </div>

            {/* Release Description */}
            <p className="text-xs text-surface-600 dark:text-surface-300 leading-relaxed">
              A new version is ready with improvements and fixes.
            </p>

            {/* Release Notes */}
            <div className="space-y-1.5">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-surface-700 dark:text-surface-300">
                What's New in This Release
              </h4>

              {notesList.length > 0 ? (
                <ul className="space-y-1.5 p-3.5 rounded-xl bg-surface-50 dark:bg-surface-800/60 border border-surface-200 dark:border-surface-700/80 text-xs text-surface-700 dark:text-surface-300 max-h-36 overflow-y-auto">
                  {notesList.map((bullet, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                      <span className="leading-snug">{bullet}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-800/60 border border-surface-200 dark:border-surface-700/80 text-xs text-surface-600 dark:text-surface-400">
                  Performance optimizations, stability fixes, and user experience enhancements.
                </div>
              )}
            </div>

            {/* Financial Data Guarantee & Package Size */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/40 text-[11px] text-emerald-800 dark:text-emerald-300">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              <div className="flex-1">
                <p className="font-bold">Financial Data Preserved</p>
                <p className="text-emerald-700 dark:text-emerald-400">
                  All transactions, accounts, and categories remain 100% intact.
                </p>
                {formattedTotalSize && (
                  <p className="mt-1 font-medium text-surface-500 dark:text-surface-400 flex items-center gap-1">
                    <HardDrive className="w-3 h-3" />
                    Download size: {formattedTotalSize}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 text-xs font-semibold min-h-[44px]"
                onClick={handleLater}
              >
                Later
              </Button>
              <Button
                variant="primary"
                className="flex-1 text-xs font-bold bg-brand-500 hover:bg-brand-600 text-surface-950 min-h-[44px]"
                leftIcon={<Download className="w-4 h-4" />}
                onClick={handleStartUpdate}
                aria-label={`Update FinTracker to version ${release.version}`}
              >
                Update Now
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STAGE 2: DOWNLOADING (REAL LIVE PROGRESS)                                */}
        {/* ========================================================================= */}
        {stage === 'DOWNLOADING' && (
          <div className="space-y-5 py-2">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto mb-2 border border-brand-500/20">
                <Download className="w-6 h-6 text-brand-600 dark:text-brand-400 motion-safe:animate-bounce" />
              </div>
              <h3 className="text-base font-bold text-surface-900 dark:text-surface-100">
                Updating FinTracker
              </h3>
              <p className="text-xs text-surface-500 dark:text-surface-400">
                Downloading update...
              </p>
            </div>

            {/* Real Progress Bar */}
            <div className="space-y-2">
              <div
                className="w-full h-3.5 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden p-0.5 border border-surface-200 dark:border-surface-700/80"
                role="progressbar"
                aria-valuenow={progress.percentage}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Download progress"
              >
                <div
                  className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.max(4, Math.min(100, progress.percentage))}%` }}
                />
              </div>

              {/* Real Progress Metrics */}
              <div className="flex items-center justify-between text-xs font-semibold text-surface-600 dark:text-surface-300">
                <span className="font-bold text-brand-600 dark:text-brand-400 text-sm">
                  {progress.percentage}%
                </span>
                <span>
                  {formatBytes(progress.downloadedBytes)}
                  {progress.totalBytes > 0 && ` / ${formatBytes(progress.totalBytes)}`}
                  {progress.speedBytesPerSec ? ` (${formatSpeed(progress.speedBytesPerSec)})` : ''}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-center text-surface-500 dark:text-surface-400">
              Please keep the app open while downloading the update package.
            </p>

            <div className="pt-2">
              <Button
                variant="outline"
                className="w-full text-xs font-semibold min-h-[44px]"
                onClick={handleLater}
              >
                Cancel Download
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STAGE 3: VERIFYING                                                       */}
        {/* ========================================================================= */}
        {stage === 'VERIFYING' && (
          <div className="space-y-4 py-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/20">
              <RefreshCw className="w-6 h-6 motion-safe:animate-spin" />
            </div>
            <div>
              <h3 className="text-base font-bold text-surface-900 dark:text-surface-100">
                Updating FinTracker
              </h3>
              <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
                Verifying update...
              </p>
            </div>
            <p className="text-xs text-surface-600 dark:text-surface-300 max-w-xs mx-auto">
              Verifying cryptographic SHA-256 checksum and package authenticity...
            </p>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STAGE 4: READY TO INSTALL                                                */}
        {/* ========================================================================= */}
        {stage === 'READY_TO_INSTALL' && (
          <div className="space-y-4 py-3 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-surface-900 dark:text-surface-100">
                Update Ready
              </h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                Update ready to install.
              </p>
            </div>
            <p className="text-xs text-surface-600 dark:text-surface-300">
              The update package has been downloaded and verified. Ready to launch the installer.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 text-xs font-semibold min-h-[44px]"
                onClick={handleLater}
              >
                Later
              </Button>
              <Button
                variant="primary"
                className="flex-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white min-h-[44px]"
                onClick={executeInstall}
              >
                Install Now
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STAGE 5: INSTALL PERMISSION REQUIRED                                     */}
        {/* ========================================================================= */}
        {stage === 'INSTALL_PERMISSION_REQUIRED' && (
          <div className="space-y-4 py-2">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-2 border border-amber-500/20">
                <Settings className="w-6 h-6 motion-safe:animate-spin" />
              </div>
              <h3 className="text-base font-bold text-surface-900 dark:text-surface-100">
                Installation Permission
              </h3>
              <p className="text-xs text-surface-500 dark:text-surface-400">
                Android needs permission to install this update.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-surface-50 dark:bg-surface-800/80 border border-surface-200 dark:border-surface-700 text-xs text-surface-700 dark:text-surface-300 space-y-2">
              <p>
                Android requires explicit permission for FinTracker to install app updates from inside the application.
              </p>
              <p className="font-semibold text-brand-600 dark:text-brand-400">
                1. Tap "Open Settings" below.<br />
                2. Toggle on "Allow from this source".<br />
                3. Return to FinTracker to finish installing.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 text-xs font-semibold min-h-[44px]"
                onClick={handleLater}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1 text-xs font-bold bg-brand-500 hover:bg-brand-600 text-surface-950 min-h-[44px]"
                leftIcon={<Settings className="w-4 h-4" />}
                onClick={handleOpenSettings}
              >
                Open Settings
              </Button>
            </div>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={handleRetry}
                className="text-xs text-brand-600 dark:text-brand-400 font-semibold underline p-1"
              >
                I've already enabled permission. Continue Install.
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STAGE 6: INSTALLING                                                      */}
        {/* ========================================================================= */}
        {stage === 'INSTALLING' && (
          <div className="space-y-4 py-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto border border-brand-500/20">
              <RefreshCw className="w-6 h-6 motion-safe:animate-spin" />
            </div>
            <div>
              <h3 className="text-base font-bold text-surface-900 dark:text-surface-100">
                Installing Update
              </h3>
              <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
                Installing update...
              </p>
            </div>
            <p className="text-xs text-surface-600 dark:text-surface-300 max-w-xs mx-auto">
              The Android Package Installer has been started. Please confirm the installation prompt if prompted by Android.
            </p>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STAGE 7: COMPLETED                                                       */}
        {/* ========================================================================= */}
        {stage === 'COMPLETED' && (
          <div className="space-y-4 py-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-surface-900 dark:text-surface-100">
                Update Complete
              </h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                FinTracker has been updated.
              </p>
            </div>
            <div className="pt-2">
              <Button
                variant="primary"
                className="w-full text-xs font-bold min-h-[44px]"
                onClick={onClose}
              >
                Done
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STAGE 8: FAILED                                                          */}
        {/* ========================================================================= */}
        {stage === 'FAILED' && (
          <div className="space-y-4 py-2">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-2 border border-rose-500/20">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-surface-900 dark:text-surface-100">
                Update Couldn't Be Completed
              </h3>
              <p className="text-xs text-rose-600 dark:text-rose-400">
                {errorMessage || "Update couldn't be completed."}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-50 dark:bg-surface-800/60 border border-surface-200 dark:border-surface-700/80 text-xs text-surface-600 dark:text-surface-300">
              <p>
                Your existing installed version and financial data remain completely safe and operational.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 text-xs font-semibold min-h-[44px]"
                onClick={handleLater}
              >
                Later
              </Button>
              <Button
                variant="primary"
                className="flex-1 text-xs font-bold bg-brand-500 hover:bg-brand-600 text-surface-950 min-h-[44px]"
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                onClick={handleRetry}
              >
                Retry
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
