package com.fintracker.app;

import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.util.Log;

import androidx.core.content.FileProvider;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Native Android Update Engine for FinTracker
 *
 * Handles streaming APK downloads, progress reporting, SHA-256 verification,
 * package identity verification (com.fintracker.app), and launching the
 * native Android package installer via FileProvider.
 */
public class UpdateEngine {
    private static final String TAG = "FinTrackerUpdate";
    public static final String EXPECTED_PACKAGE_NAME = "com.fintracker.app";
    private static final int BUFFER_SIZE = 8192;
    private static final int MAX_REDIRECTS = 6;
    private static final int CONNECT_TIMEOUT_MS = 15000;
    private static final int READ_TIMEOUT_MS = 30000;

    public enum State {
        IDLE,
        CHECKING,
        UPDATE_AVAILABLE,
        DOWNLOADING,
        VERIFYING,
        READY_TO_INSTALL,
        INSTALLING,
        COMPLETED,
        FAILED
    }

    public interface ProgressCallback {
        void onProgress(State state, long downloadedBytes, long totalBytes, int percentage, String error);
    }

    public static class VerificationResult {
        public final boolean valid;
        public final String status; // VERIFIED, VERIFICATION_FAILED, INVALID_PACKAGE, FILE_NOT_FOUND
        public final String error;
        public final String packageName;
        public final String versionName;
        public final long versionCode;

        public VerificationResult(boolean valid, String status, String error, String packageName, String versionName, long versionCode) {
            this.valid = valid;
            this.status = status;
            this.error = error;
            this.packageName = packageName;
            this.versionName = versionName;
            this.versionCode = versionCode;
        }
    }

    private final Context context;
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private final AtomicBoolean isDownloading = new AtomicBoolean(false);
    private final AtomicBoolean isCancelled = new AtomicBoolean(false);

    private volatile State currentState = State.IDLE;
    private volatile long currentDownloadedBytes = 0;
    private volatile long currentTotalBytes = 0;
    private volatile int currentPercentage = 0;
    private volatile String currentError = null;
    private volatile File currentApkFile = null;

    public UpdateEngine(Context context) {
        this.context = context.getApplicationContext();
    }

    public State getState() {
        return currentState;
    }

    public long getDownloadedBytes() {
        return currentDownloadedBytes;
    }

    public long getTotalBytes() {
        return currentTotalBytes;
    }

    public int getPercentage() {
        return currentPercentage;
    }

    public String getCurrentError() {
        return currentError;
    }

    public File getCurrentApkFile() {
        return currentApkFile;
    }

    public boolean canInstallUnknownApps() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            return context.getPackageManager().canRequestPackageInstalls();
        }
        return true;
    }

    public void openInstallPermissionSettings() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                Intent intent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES);
                intent.setData(Uri.parse("package:" + context.getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);
            } catch (Exception e) {
                Log.e(TAG, "Failed to open manage unknown app sources settings", e);
                // Fallback to general security settings
                try {
                    Intent fallback = new Intent(Settings.ACTION_SECURITY_SETTINGS);
                    fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    context.startActivity(fallback);
                } catch (Exception ex) {
                    Log.e(TAG, "Failed to open fallback security settings", ex);
                }
            }
        }
    }

    /**
     * Start downloading an APK update in the background.
     */
    public synchronized boolean startDownload(
            final String downloadUrl,
            final String fileName,
            final String expectedSha256,
            final ProgressCallback callback
    ) {
        if (isDownloading.get()) {
            Log.w(TAG, "Download request rejected: a download is already in progress.");
            return false;
        }

        if (downloadUrl == null || downloadUrl.trim().isEmpty()) {
            currentState = State.FAILED;
            currentError = "Download URL cannot be empty";
            if (callback != null) callback.onProgress(currentState, 0, 0, 0, currentError);
            return false;
        }

        isDownloading.set(true);
        isCancelled.set(false);
        currentState = State.DOWNLOADING;
        currentDownloadedBytes = 0;
        currentTotalBytes = 0;
        currentPercentage = 0;
        currentError = null;

        executor.execute(new Runnable() {
            @Override
            public void run() {
                executeDownloadTask(downloadUrl, fileName, expectedSha256, callback);
            }
        });

        return true;
    }

    private void executeDownloadTask(
            String downloadUrl,
            String fileName,
            String expectedSha256,
            ProgressCallback callback
    ) {
        File updatesDir = new File(context.getCacheDir(), "updates");
        if (!updatesDir.exists() && !updatesDir.mkdirs()) {
            handleDownloadError("Failed to create updates directory", callback);
            return;
        }

        String safeFileName = (fileName != null && !fileName.trim().isEmpty())
                ? fileName.trim()
                : "FinTracker-update.apk";

        File tempFile = new File(updatesDir, safeFileName + ".tmp");
        File targetFile = new File(updatesDir, safeFileName);

        // Delete existing temporary file if present
        if (tempFile.exists()) {
            tempFile.delete();
        }

        HttpURLConnection connection = null;
        InputStream in = null;
        OutputStream out = null;

        try {
            connection = openConnectionFollowingRedirects(downloadUrl);
            int responseCode = connection.getResponseCode();

            if (responseCode != HttpURLConnection.HTTP_OK) {
                handleDownloadError("Server returned HTTP " + responseCode, callback);
                return;
            }

            long contentLength = connection.getContentLengthLong();
            if (contentLength <= 0) {
                contentLength = connection.getContentLength();
            }
            currentTotalBytes = contentLength;

            in = new BufferedInputStream(connection.getInputStream(), BUFFER_SIZE);
            out = new FileOutputStream(tempFile);

            byte[] buffer = new byte[BUFFER_SIZE];
            int bytesRead;
            long totalRead = 0;
            long lastReportTime = System.currentTimeMillis();

            while ((bytesRead = in.read(buffer)) != -1) {
                if (isCancelled.get()) {
                    Log.i(TAG, "Download cancelled by user.");
                    closeQuietly(in);
                    closeQuietly(out);
                    if (tempFile.exists()) tempFile.delete();
                    isDownloading.set(false);
                    currentState = State.IDLE;
                    if (callback != null) callback.onProgress(State.IDLE, 0, 0, 0, null);
                    return;
                }

                out.write(buffer, 0, bytesRead);
                totalRead += bytesRead;
                currentDownloadedBytes = totalRead;

                int pct = (contentLength > 0) ? (int) ((totalRead * 100) / contentLength) : 0;
                currentPercentage = Math.min(100, Math.max(0, pct));

                long now = System.currentTimeMillis();
                if (now - lastReportTime >= 100 || totalRead == contentLength) {
                    lastReportTime = now;
                    if (callback != null) {
                        callback.onProgress(State.DOWNLOADING, currentDownloadedBytes, currentTotalBytes, currentPercentage, null);
                    }
                }
            }

            out.flush();
            closeQuietly(out);
            out = null;
            closeQuietly(in);
            in = null;

            // Atomically replace target file
            if (targetFile.exists()) {
                targetFile.delete();
            }
            if (!tempFile.renameTo(targetFile)) {
                handleDownloadError("Failed to rename temporary APK file", callback);
                return;
            }

            currentApkFile = targetFile;
            currentState = State.VERIFYING;
            if (callback != null) {
                callback.onProgress(State.VERIFYING, currentDownloadedBytes, currentTotalBytes, 100, null);
            }

            // Step 2: Verification
            VerificationResult verification = verifyApkInternal(targetFile, expectedSha256);
            if (!verification.valid) {
                targetFile.delete();
                currentApkFile = null;
                currentState = State.FAILED;
                currentError = verification.error;
                if (callback != null) {
                    callback.onProgress(State.FAILED, currentDownloadedBytes, currentTotalBytes, 100, currentError);
                }
                isDownloading.set(false);
                return;
            }

            // Ready for installation
            currentState = State.READY_TO_INSTALL;
            if (callback != null) {
                callback.onProgress(State.READY_TO_INSTALL, currentDownloadedBytes, currentTotalBytes, 100, null);
            }
        } catch (Exception e) {
            Log.e(TAG, "Download error", e);
            closeQuietly(out);
            closeQuietly(in);
            if (tempFile.exists()) tempFile.delete();
            handleDownloadError(e.getMessage() != null ? e.getMessage() : "Download network error", callback);
        } finally {
            isDownloading.set(false);
            if (connection != null) {
                connection.disconnect();
            }
        }
    }

    private void handleDownloadError(String errorMsg, ProgressCallback callback) {
        currentState = State.FAILED;
        currentError = errorMsg;
        Log.e(TAG, "Download failed: " + errorMsg);
        if (callback != null) {
            callback.onProgress(State.FAILED, currentDownloadedBytes, currentTotalBytes, currentPercentage, currentError);
        }
    }

    /**
     * Follow HTTP redirects up to MAX_REDIRECTS (required for GitHub Releases S3 URLs).
     */
    private HttpURLConnection openConnectionFollowingRedirects(String urlStr) throws Exception {
        String currentUrl = urlStr;
        for (int i = 0; i < MAX_REDIRECTS; i++) {
            URL url = new URL(currentUrl);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setInstanceFollowRedirects(false);
            conn.setConnectTimeout(CONNECT_TIMEOUT_MS);
            conn.setReadTimeout(READ_TIMEOUT_MS);
            conn.setRequestProperty("User-Agent", "FinTracker-Android-Updater");

            int code = conn.getResponseCode();
            if (code == HttpURLConnection.HTTP_MOVED_PERM
                    || code == HttpURLConnection.HTTP_MOVED_TEMP
                    || code == HttpURLConnection.HTTP_SEE_OTHER
                    || code == 307
                    || code == 308) {
                String location = conn.getHeaderField("Location");
                conn.disconnect();
                if (location == null || location.isEmpty()) {
                    throw new Exception("Redirect with missing Location header");
                }
                currentUrl = location;
            } else {
                return conn;
            }
        }
        throw new Exception("Too many HTTP redirects while accessing release asset");
    }

    /**
     * Public standalone verification method.
     */
    public VerificationResult verifyUpdate(String expectedSha256) {
        if (currentApkFile == null || !currentApkFile.exists()) {
            return new VerificationResult(false, "FILE_NOT_FOUND", "No downloaded APK file found to verify", null, null, 0);
        }
        return verifyApkInternal(currentApkFile, expectedSha256);
    }

    private VerificationResult verifyApkInternal(File apkFile, String expectedSha256) {
        if (apkFile == null || !apkFile.exists() || apkFile.length() == 0) {
            return new VerificationResult(false, "FILE_NOT_FOUND", "APK file is missing or empty", null, null, 0);
        }

        // 1. Checksum verification if expectedSha256 provided
        if (expectedSha256 != null && !expectedSha256.trim().isEmpty()) {
            String cleanExpected = expectedSha256.trim().toLowerCase();
            String computedHash = computeSha256(apkFile);

            if (computedHash == null || !computedHash.equalsIgnoreCase(cleanExpected)) {
                Log.e(TAG, "SHA-256 mismatch: expected=" + cleanExpected + ", computed=" + computedHash);
                return new VerificationResult(false, "VERIFICATION_FAILED",
                        "SHA-256 integrity check failed. The downloaded file may be corrupt or altered.",
                        null, null, 0);
            }
            Log.i(TAG, "SHA-256 verification passed: " + computedHash);
        }

        // 2. Structural & Package ID validation via Android PackageManager
        try {
            PackageManager pm = context.getPackageManager();
            PackageInfo info = pm.getPackageArchiveInfo(apkFile.getAbsolutePath(), PackageManager.GET_ACTIVITIES);

            if (info == null || info.packageName == null) {
                Log.e(TAG, "APK package info could not be parsed: invalid APK structure.");
                return new VerificationResult(false, "INVALID_PACKAGE",
                        "APK structure is invalid or corrupt.", null, null, 0);
            }

            if (!EXPECTED_PACKAGE_NAME.equals(info.packageName)) {
                Log.e(TAG, "APK package ID mismatch. Expected=" + EXPECTED_PACKAGE_NAME + ", Found=" + info.packageName);
                return new VerificationResult(false, "INVALID_PACKAGE",
                        "Package ID mismatch: expected " + EXPECTED_PACKAGE_NAME + ", got " + info.packageName,
                        info.packageName, info.versionName, getVersionCode(info));
            }

            long versionCode = getVersionCode(info);
            Log.i(TAG, "APK package verified: " + info.packageName + " v" + info.versionName + " (" + versionCode + ")");

            return new VerificationResult(true, "VERIFIED", null, info.packageName, info.versionName, versionCode);
        } catch (Exception e) {
            Log.e(TAG, "Exception during APK verification", e);
            return new VerificationResult(false, "INVALID_PACKAGE",
                    "Failed to verify APK package: " + e.getMessage(), null, null, 0);
        }
    }

    private long getVersionCode(PackageInfo info) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            return info.getLongVersionCode();
        } else {
            return info.versionCode;
        }
    }

    /**
     * Compute the SHA-256 hex string of a file.
     */
    private String computeSha256(File file) {
        InputStream is = null;
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            is = new BufferedInputStream(new FileInputStream(file));
            byte[] buffer = new byte[BUFFER_SIZE];
            int read;
            while ((read = is.read(buffer)) != -1) {
                digest.update(buffer, 0, read);
            }
            byte[] hashBytes = digest.digest();

            StringBuilder sb = new StringBuilder();
            for (byte b : hashBytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            Log.e(TAG, "Error computing SHA-256", e);
            return null;
        } finally {
            closeQuietly(is);
        }
    }

    /**
     * Launch the native Android Package Installer for the downloaded APK.
     */
    public synchronized String launchInstaller() {
        if (currentApkFile == null || !currentApkFile.exists() || currentApkFile.length() == 0) {
            currentState = State.FAILED;
            currentError = "No valid update file found to install";
            return "FILE_NOT_FOUND";
        }

        // Check unknown sources installation permission
        if (!canInstallUnknownApps()) {
            return "INSTALL_PERMISSION_REQUIRED";
        }

        try {
            currentState = State.INSTALLING;

            Uri apkUri = FileProvider.getUriForFile(
                    context,
                    context.getPackageName() + ".fileprovider",
                    currentApkFile
            );

            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            context.startActivity(intent);
            Log.i(TAG, "Launched Android Package Installer for " + currentApkFile.getName());
            return "INSTALLING";
        } catch (Exception e) {
            Log.e(TAG, "Failed to launch package installer", e);
            currentState = State.FAILED;
            currentError = e.getMessage();
            return "ERROR";
        }
    }

    /**
     * Cancel any active download and clean up temporary files.
     */
    public void cancelDownload() {
        isCancelled.set(true);
    }

    /**
     * Reset state and clean cache.
     */
    public void reset() {
        cancelDownload();
        isDownloading.set(false);
        currentState = State.IDLE;
        currentDownloadedBytes = 0;
        currentTotalBytes = 0;
        currentPercentage = 0;
        currentError = null;

        try {
            File updatesDir = new File(context.getCacheDir(), "updates");
            if (updatesDir.exists()) {
                File[] files = updatesDir.listFiles();
                if (files != null) {
                    for (File f : files) {
                        f.delete();
                    }
                }
            }
        } catch (Exception e) {
            Log.w(TAG, "Failed to clean updates cache directory", e);
        }
        currentApkFile = null;
    }

    private static void closeQuietly(AutoCloseable closeable) {
        if (closeable != null) {
            try {
                closeable.close();
            } catch (Exception ignored) {
            }
        }
    }
}
