/**
 * FinTracker Native Capabilities & Platform Abstraction Layer
 *
 * This service provides a clean bridge between the React application and
 * native mobile platforms (Android / iOS via Capacitor).
 *
 * Architectural Principle:
 *   NATIVE PLATFORM (Android)
 *          ↓
 *   CAPACITOR BRIDGE
 *          ↓
 *   FINTRACKER SERVICES & BUSINESS LOGIC
 *          ↓
 *   EXISTING LOCAL DATA LAYER (IndexedDB)
 *
 * No platform-specific native code is coupled directly into UI components.
 * Future native features (e.g. notification listeners, SMS detection, widgets)
 * integrate through this decoupled abstraction.
 */

import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';

export type PlatformType = 'android' | 'ios' | 'web';

export interface NativeFeatureFlags {
  notificationListener: boolean;
  smsDetection: boolean;
  nativeBiometrics: boolean;
  homeWidgets: boolean;
  backgroundSync: boolean;
  receiptScanning: boolean;
  pdfStatementParsing: boolean;
  cloudBackup: boolean;
}

/**
 * Returns true if running inside a native Capacitor container (Android / iOS)
 */
export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Returns true if running specifically inside native Android container
 */
export function isAndroidNative(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

/**
 * Returns true if running in a standard web browser or installed web PWA
 */
export function isWeb(): boolean {
  return !Capacitor.isNativePlatform();
}

/**
 * Returns the current platform name: 'android' | 'ios' | 'web'
 */
export function getPlatform(): PlatformType {
  const p = Capacitor.getPlatform();
  if (p === 'android') return 'android';
  if (p === 'ios') return 'ios';
  return 'web';
}

/**
 * Matrix of available native features on current platform.
 * In V1 foundation, native core is enabled; background listeners/cloud
 * are safely flagged false until future phases.
 */
export function getNativeCapabilities(): NativeFeatureFlags {
  const isNative = isNativePlatform();
  return {
    notificationListener: false, // Planned V2: Notification listener service
    smsDetection: false,         // Planned V2: Subject to Android/Play policy
    nativeBiometrics: false,     // Planned V2: WebAuthn / Biometric prompt
    homeWidgets: false,          // Planned V2: Android Glance widget
    backgroundSync: false,       // Planned V2: WorkManager
    receiptScanning: false,      // Planned V2: MLKit OCR
    pdfStatementParsing: false,  // Planned V2: Offline PDF extractor
    cloudBackup: false,          // Planned V2: Optional Google Drive sync
  };
}

/**
 * Set native status bar styling according to application theme
 */
export async function setNativeStatusBarTheme(isDark: boolean): Promise<void> {
  if (!isNativePlatform()) return;
  try {
    await StatusBar.setOverlaysWebView({ overlay: true });
    await StatusBar.setStyle({
      style: isDark ? Style.Dark : Style.Light,
    });
  } catch (err) {
    // Fail gracefully if status bar plugin is unsupported on current platform
    console.debug('StatusBar style update skipped:', err);
  }
}

/**
 * Safely exit the native application (Android back button at root)
 */
export async function exitNativeApp(): Promise<void> {
  if (isNativePlatform()) {
    try {
      await App.exitApp();
    } catch (e) {
      console.debug('Native App.exitApp error:', e);
    }
  }
}

/* =====================================================================
 * FUTURE TRANSACTION DETECTION ENGINE ARCHITECTURE (PLANNED V2 SPEC)
 * =====================================================================
 *
 * Pipeline Flow:
 *
 * 1. Native Event Trigger:
 *    - Android NotificationListenerService captures financial bank/UPI push notifications.
 *    - (Or SMS BroadcastReceiver if granted by user & Google Play permissions).
 *
 * 2. Capacitor Native Bridge:
 *    - Native listener buffers payload and invokes a Capacitor plugin event:
 *      `FinTrackerTransactionDetectionPlugin.notifyTransactionDetected(payload)`
 *
 * 3. FinTracker Detection Service (TypeScript):
 *    - Normalizes raw bank message strings (identifies Amount, Currency ₹, Debit/Credit, Date, Time, Sender/VPA).
 *    - Runs duplicate check against existing transactions in IndexedDB.
 *    - Runs merchant categorization classifier (e.g. "Swiggy" -> "Food", "Uber" -> "Travel").
 *
 * 4. User Review & Confirmation:
 *    - Presents a clean non-intrusive Quick Add / Confirmation Dialog to the user:
 *      "Detected ₹250 UPI payment to Metro. Record as Travel?"
 *      [Confirm] [Edit] [Dismiss]
 *
 * 5. Persistence:
 *    - Upon user confirmation, writes directly through the existing
 *      `TransactionRepository.create()` into IndexedDB.
 *    - Updates Dashboard and Transactions state immediately.
 * ===================================================================== */

export interface DetectedTransactionDraft {
  rawText: string;
  source: 'notification' | 'sms';
  amount: number;
  type: 'expense' | 'income';
  suggestedCategoryId: string;
  suggestedPaymentMethod: 'upi' | 'card' | 'bank' | 'cash' | 'other';
  merchantName?: string;
  timestamp: string;
}

export interface ITransactionDetectionService {
  isAvailable(): boolean;
  startListening(): Promise<boolean>;
  stopListening(): Promise<void>;
  onTransactionDetected(callback: (draft: DetectedTransactionDraft) => void): void;
}
