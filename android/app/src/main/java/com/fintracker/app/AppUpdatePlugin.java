package com.fintracker.app;

import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.os.Build;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Capacitor Plugin bridging the Native Android Update Engine to JavaScript/React.
 */
@CapacitorPlugin(name = "AppUpdate")
public class AppUpdatePlugin extends Plugin {
    private static final String TAG = "AppUpdatePlugin";
    private UpdateEngine updateEngine;

    @Override
    public void load() {
        super.load();
        updateEngine = new UpdateEngine(getContext());
    }

    @PluginMethod
    public void getAppVersion(PluginCall call) {
        try {
            PackageManager pm = getContext().getPackageManager();
            PackageInfo info = pm.getPackageInfo(getContext().getPackageName(), 0);

            long versionCode;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                versionCode = info.getLongVersionCode();
            } else {
                versionCode = info.versionCode;
            }

            JSObject ret = new JSObject();
            ret.put("version", info.versionName != null ? info.versionName : "1.0.0");
            ret.put("versionCode", versionCode);
            ret.put("packageName", getContext().getPackageName());
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to retrieve package version info", e);
        }
    }

    @PluginMethod
    public void canInstallUnknownApps(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("canInstall", updateEngine.canInstallUnknownApps());
        call.resolve(ret);
    }

    @PluginMethod
    public void openInstallPermissionSettings(PluginCall call) {
        updateEngine.openInstallPermissionSettings();
        JSObject ret = new JSObject();
        ret.put("opened", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void downloadUpdate(final PluginCall call) {
        String url = call.getString("url");
        String fileName = call.getString("fileName");
        String expectedSha256 = call.getString("expectedSha256");

        if (url == null || url.trim().isEmpty()) {
            call.reject("Download URL is required");
            return;
        }

        boolean started = updateEngine.startDownload(url, fileName, expectedSha256, new UpdateEngine.ProgressCallback() {
            @Override
            public void onProgress(UpdateEngine.State state, long downloadedBytes, long totalBytes, int percentage, String error) {
                JSObject progress = new JSObject();
                progress.put("state", state.name());
                progress.put("downloadedBytes", downloadedBytes);
                progress.put("totalBytes", totalBytes);
                progress.put("percentage", percentage);
                if (error != null) {
                    progress.put("error", error);
                }
                notifyListeners("updateProgress", progress);
            }
        });

        if (!started) {
            call.reject("A download is already in progress or failed to initialize");
            return;
        }

        JSObject ret = new JSObject();
        ret.put("started", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void getDownloadProgress(PluginCall call) {
        JSObject progress = new JSObject();
        progress.put("state", updateEngine.getState().name());
        progress.put("downloadedBytes", updateEngine.getDownloadedBytes());
        progress.put("totalBytes", updateEngine.getTotalBytes());
        progress.put("percentage", updateEngine.getPercentage());
        if (updateEngine.getCurrentError() != null) {
            progress.put("error", updateEngine.getCurrentError());
        }
        call.resolve(progress);
    }

    @PluginMethod
    public void verifyUpdate(PluginCall call) {
        String expectedSha256 = call.getString("expectedSha256");
        UpdateEngine.VerificationResult result = updateEngine.verifyUpdate(expectedSha256);

        JSObject ret = new JSObject();
        ret.put("valid", result.valid);
        ret.put("status", result.status);
        if (result.error != null) {
            ret.put("error", result.error);
        }
        if (result.packageName != null) {
            ret.put("packageName", result.packageName);
        }
        if (result.versionName != null) {
            ret.put("versionName", result.versionName);
        }
        ret.put("versionCode", result.versionCode);
        call.resolve(ret);
    }

    @PluginMethod
    public void installUpdate(PluginCall call) {
        String status = updateEngine.launchInstaller();

        JSObject ret = new JSObject();
        ret.put("status", status);
        if ("ERROR".equals(status) || "FILE_NOT_FOUND".equals(status)) {
            ret.put("error", updateEngine.getCurrentError());
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void cancelUpdate(PluginCall call) {
        updateEngine.cancelDownload();
        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void resetUpdateState(PluginCall call) {
        updateEngine.reset();
        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }
}
