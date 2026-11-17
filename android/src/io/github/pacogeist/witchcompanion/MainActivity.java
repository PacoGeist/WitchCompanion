package io.github.pacogeist.witchcompanion;

import android.app.Activity;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.IntentFilter;
import android.content.pm.PackageInfo;
import android.content.pm.PackageInstaller;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.Base64;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.webkit.JavascriptInterface;
import android.print.PrintAttributes;
import android.print.PrintManager;
import android.webkit.PermissionRequest;
import android.content.pm.PackageManager;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import org.json.JSONObject;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.HashMap;
import java.util.Map;

public class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final String START = "https://" + HOST + "/index.html";
    private static final int REQ_FILE = 11, REQ_SAVE = 12, REQ_CAMERA = 13, REQ_NOTIFY = 14;
    private PermissionRequest pendingCam;
    private String incoming;            // a shared file or link waiting for the page to collect it
    private boolean pageReady = false;
    // ---- updates: the ONLY network access the app makes ----
    private static final String VERSION_URL = "https://raw.githubusercontent.com/PacoGeist/WitchCompanion/main/docs/version.json";
    private static final String DOWNLOAD_PREFIX = "https://github.com/PacoGeist/WitchCompanion/releases/download/";
    private static final String ACTION_INSTALL_STATUS = "witchcompanion.INSTALL_STATUS";
    private BroadcastReceiver installReceiver;
    private volatile boolean downloading = false;

    private WebView web;
    private FrameLayout root;
    private ValueCallback<Uri[]> fileCallback;
    private byte[] pendingSave;
    private boolean dayTheme = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        root = new FrameLayout(this);
        root.setBackgroundColor(Color.parseColor("#0B0812"));
        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#0B0812"));
        root.addView(web, new FrameLayout.LayoutParams(-1, -1));
        setContentView(root);

        // keep content clear of the status / navigation bars and the keyboard (edge-to-edge on Android 15+)
        root.setOnApplyWindowInsetsListener((v, insets) -> {
            int l, t, r, b;
            if (Build.VERSION.SDK_INT >= 30) {
                android.graphics.Insets in = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.ime() | WindowInsets.Type.displayCutout());
                l = in.left; t = in.top; r = in.right; b = in.bottom;
            } else {
                l = insets.getSystemWindowInsetLeft(); t = insets.getSystemWindowInsetTop();
                r = insets.getSystemWindowInsetRight(); b = insets.getSystemWindowInsetBottom();
            }
            v.setPadding(l, t, r, b);
            return insets;
        });

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setTextZoom(100);
        s.setCacheMode(WebSettings.LOAD_NO_CACHE);

        web.addJavascriptInterface(new Bridge(), "AndroidBridge");
        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest req) {
                Uri u = req.getUrl();
                if (HOST.equals(u.getHost())) return asset(u.getPath());
                if ("data".equals(u.getScheme()) || "blob".equals(u.getScheme())) return null;
                // the app is fully offline: block anything else
                return new WebResourceResponse("text/plain", "utf-8", 404, "Offline", new HashMap<>(), new ByteArrayInputStream(new byte[0]));
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                Uri u = req.getUrl();
                if (HOST.equals(u.getHost())) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception ignored) { }
                return true;
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            // the in-app camera (photographing your own tarot cards) asks for the camera here
            @Override
            public void onPermissionRequest(PermissionRequest req) {
                runOnUiThread(() -> {
                    boolean video = false;
                    for (String r : req.getResources()) if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(r)) video = true;
                    if (!video || !HOST.equals(req.getOrigin().getHost())) { req.deny(); return; }
                    if (checkSelfPermission(android.Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
                        req.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});
                    } else {
                        if (pendingCam != null) pendingCam.deny();
                        pendingCam = req;
                        requestPermissions(new String[]{android.Manifest.permission.CAMERA}, REQ_CAMERA);
                    }
                });
            }

            @Override
            public boolean onShowFileChooser(WebView w, ValueCallback<Uri[]> cb, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = cb;
                Intent intent;
                try {
                    intent = params.createIntent();
                    String[] types = params.getAcceptTypes();
                    boolean image = types != null && types.length > 0 && types[0].startsWith("image");
                    if (!image) { intent.setType("*/*"); }
                    intent.addCategory(Intent.CATEGORY_OPENABLE);
                    startActivityForResult(Intent.createChooser(intent, image ? "Choose a picture" : "Choose a file"), REQ_FILE);
                } catch (Exception e) {
                    fileCallback = null;
                    return false;
                }
                return true;
            }
        });

        installReceiver = new BroadcastReceiver() {
            @Override
            @SuppressWarnings("deprecation")
            public void onReceive(Context c, Intent intent) {
                int st = intent.getIntExtra(PackageInstaller.EXTRA_STATUS, -999);
                if (st == PackageInstaller.STATUS_PENDING_USER_ACTION) {
                    Intent confirm = intent.getParcelableExtra(Intent.EXTRA_INTENT);
                    if (confirm != null) { confirm.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK); try { startActivity(confirm); } catch (Exception e) { status("failed", "Could not open the installer"); } }
                    status("confirm", "");
                } else if (st == PackageInstaller.STATUS_SUCCESS) {
                    status("done", "");
                } else {
                    String msg = intent.getStringExtra(PackageInstaller.EXTRA_STATUS_MESSAGE);
                    status(st == PackageInstaller.STATUS_FAILURE_ABORTED ? "cancelled" : "failed", msg == null ? "" : msg);
                }
            }
        };
        IntentFilter f = new IntentFilter(ACTION_INSTALL_STATUS);
        if (Build.VERSION.SDK_INT >= 33) registerReceiver(installReceiver, f, Context.RECEIVER_NOT_EXPORTED);
        else registerReceiver(installReceiver, f);

        handleIncoming(getIntent());
        if (savedInstanceState != null) web.restoreState(savedInstanceState);
        else web.loadUrl(START);
    }

    private WebResourceResponse asset(String path) {
        if (path == null || path.equals("/") || path.isEmpty()) path = "/index.html";
        try {
            InputStream in = getAssets().open("www" + path);
            Map<String, String> h = new HashMap<>();
            h.put("Access-Control-Allow-Origin", "*");
            h.put("Cache-Control", "no-cache");
            return new WebResourceResponse(mime(path), mime(path).startsWith("text") || path.endsWith(".js") ? "utf-8" : null, 200, "OK", h, in);
        } catch (Exception e) {
            return new WebResourceResponse("text/plain", "utf-8", 404, "Not found", new HashMap<>(), new ByteArrayInputStream(new byte[0]));
        }
    }

    private static String mime(String p) {
        p = p.toLowerCase();
        if (p.endsWith(".html")) return "text/html";
        if (p.endsWith(".js")) return "application/javascript";
        if (p.endsWith(".css")) return "text/css";
        if (p.endsWith(".json")) return "application/json";
        if (p.endsWith(".jpg") || p.endsWith(".jpeg")) return "image/jpeg";
        if (p.endsWith(".png")) return "image/png";
        if (p.endsWith(".webp")) return "image/webp";
        if (p.endsWith(".svg")) return "image/svg+xml";
        if (p.endsWith(".woff2")) return "font/woff2";
        return "application/octet-stream";
    }

    class Bridge {
        @JavascriptInterface
        public void shareFile(String name, String mimeType, String b64, String message) {
            try {
                File dir = new File(getCacheDir(), "share"); dir.mkdirs();
                String safe = name.replaceAll("[^\\w.\\- ]+", "").trim(); if (safe.isEmpty()) safe = "shared.witch.json";
                File f = new File(dir, safe);
                try (FileOutputStream o = new FileOutputStream(f)) { o.write(Base64.decode(b64, Base64.DEFAULT)); }
                Uri uri = Uri.parse("content://" + ShareProvider.AUTH + "/" + Uri.encode(safe));
                Intent send = new Intent(Intent.ACTION_SEND);
                send.setType(mimeType);
                send.putExtra(Intent.EXTRA_STREAM, uri);
                send.putExtra(Intent.EXTRA_SUBJECT, safe.replace(".witch.json", "") + " from the Witches' Companion");
                if (message != null && !message.isEmpty()) send.putExtra(Intent.EXTRA_TEXT, message);
                send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                Intent ch = Intent.createChooser(send, "Send to a friend");
                ch.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                runOnUiThread(() -> { try { startActivity(ch); } catch (Exception e) { Toast.makeText(MainActivity.this, "No app to send with", Toast.LENGTH_LONG).show(); } });
            } catch (Exception e) {
                runOnUiThread(() -> Toast.makeText(MainActivity.this, "Could not prepare the file", Toast.LENGTH_LONG).show());
            }
        }

        @JavascriptInterface
        public void shareText(String text) {
            Intent send = new Intent(Intent.ACTION_SEND);
            send.setType("text/plain");
            send.putExtra(Intent.EXTRA_TEXT, text);
            runOnUiThread(() -> { try { startActivity(Intent.createChooser(send, "Send to a friend")); } catch (Exception ignored) { } });
        }

        // collected once by the page when it starts
        @JavascriptInterface
        public String takeIncoming() { pageReady = true; String s = incoming; incoming = null; return s == null ? "" : s; }

        @JavascriptInterface
        public void print(String title) {
            runOnUiThread(() -> {
                try {
                    PrintManager pm = (PrintManager) getSystemService(Context.PRINT_SERVICE);
                    String job = (title == null || title.isEmpty()) ? "Witches' Companion" : title;
                    pm.print(job, web.createPrintDocumentAdapter(job), new PrintAttributes.Builder().build());
                } catch (Exception e) { Toast.makeText(MainActivity.this, "Printing isn't available", Toast.LENGTH_LONG).show(); }
            });
        }

        @JavascriptInterface
        public String appInfo() {
            try {
                PackageInfo pi = getPackageManager().getPackageInfo(getPackageName(), 0);
                @SuppressWarnings("deprecation") long code = Build.VERSION.SDK_INT >= 28 ? pi.getLongVersionCode() : pi.versionCode;
                return new JSONObject().put("code", code).put("name", pi.versionName).put("android", Build.VERSION.SDK_INT).toString();
            } catch (Exception e) { return "{}"; }
        }

        @JavascriptInterface
        public void checkUpdate() {
            new Thread(() -> {
                try {
                    String body = new String(fetch(VERSION_URL + "?t=" + System.currentTimeMillis(), null), "UTF-8");
                    js("window.onUpdateInfo && onUpdateInfo(" + JSONObject.quote(body) + ", null)");
                } catch (Exception e) {
                    js("window.onUpdateInfo && onUpdateInfo(null, " + JSONObject.quote(String.valueOf(e.getMessage())) + ")");
                }
            }).start();
        }

        @JavascriptInterface
        public void installUpdate(String url) {
            if (url == null || !url.startsWith(DOWNLOAD_PREFIX) || downloading) { status("failed", "Not a WitchCompanion download"); return; }
            downloading = true;
            new Thread(() -> {
                try {
                    File dir = new File(getCacheDir(), "updates"); dir.mkdirs();
                    File apk = new File(dir, "update.apk");
                    status("downloading", "0");
                    byte[] data = fetch(url, p -> status("downloading", String.valueOf(p)));
                    try (FileOutputStream o = new FileOutputStream(apk)) { o.write(data); }
                    status("installing", "");
                    install(apk);
                } catch (Exception e) {
                    status("failed", String.valueOf(e.getMessage()));
                } finally { downloading = false; }
            }).start();
        }

        @JavascriptInterface
        public void openUrl(String url) {
            if (url == null || !url.startsWith("https://")) return;
            runOnUiThread(() -> { try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url))); } catch (Exception ignored) { } });
        }

        @JavascriptInterface
        public void saveFile(String name, String mimeType, String b64) {
            pendingSave = Base64.decode(b64, Base64.DEFAULT);
            runOnUiThread(() -> {
                Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                i.setType(mimeType);
                i.putExtra(Intent.EXTRA_TITLE, name);
                try { startActivityForResult(i, REQ_SAVE); }
                catch (Exception e) { Toast.makeText(MainActivity.this, "No file app available", Toast.LENGTH_LONG).show(); }
            });
        }

        // ---- moon reminders (see ReminderReceiver) ----
        @JavascriptInterface
        public void setReminders(String json) { ReminderReceiver.save(MainActivity.this, json == null ? "[]" : json); }

        @JavascriptInterface
        public String notifyPermission() { return ReminderReceiver.allowed(MainActivity.this) ? "granted" : "off"; }

        // Android 13+ asks the person once; the answer comes back through onNotifyPermission
        @JavascriptInterface
        public void requestNotifyPermission() {
            if (ReminderReceiver.allowed(MainActivity.this)) { js("window.onNotifyPermission && onNotifyPermission(true)"); return; }
            if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission("android.permission.POST_NOTIFICATIONS") != PackageManager.PERMISSION_GRANTED)
                runOnUiThread(() -> requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"}, REQ_NOTIFY));
            else js("window.onNotifyPermission && onNotifyPermission(false)");
        }

        // the app's own notification switches in Android settings
        @JavascriptInterface
        public void openNotifySettings() {
            runOnUiThread(() -> {
                try {
                    Intent i = Build.VERSION.SDK_INT >= 26
                            ? new Intent(android.provider.Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(android.provider.Settings.EXTRA_APP_PACKAGE, getPackageName())
                            : new Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + getPackageName()));
                    startActivity(i);
                } catch (Exception e) { Toast.makeText(MainActivity.this, "Open Android Settings, then Apps, to allow notifications", Toast.LENGTH_LONG).show(); }
            });
        }

        @JavascriptInterface
        public void testReminder(String title, String body) { ReminderReceiver.notify(MainActivity.this, 999, title, body); }

        @JavascriptInterface
        public void setTheme(String t) {
            dayTheme = "day".equals(t);
            runOnUiThread(MainActivity.this::applyBars);
        }
    }


    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIncoming(intent);
        if (pageReady && incoming != null) { String s = incoming; incoming = null; js("window.receiveIncoming && receiveIncoming(" + JSONObject.quote(s) + ")"); }
    }

    // a file or link someone sent: read it now, hand it to the page as "file:<base64>" or "text:<text>"
    @SuppressWarnings("deprecation")
    private void handleIncoming(Intent intent) {
        if (intent == null) return;
        // a tapped moon reminder: open the Moon Tracker
        String route = intent.getStringExtra("route");
        if (ReminderReceiver.ACTION_OPEN.equals(intent.getAction()) && route != null && route.startsWith("#/")) { incoming = "route:" + route; return; }
        try {
            String action = intent.getAction();
            Uri uri = null; String text = null;
            if (Intent.ACTION_VIEW.equals(action)) {
                uri = intent.getData();
                if (uri != null && "witchcompanion".equals(uri.getScheme())) { text = uri.toString(); uri = null; }
            } else if (Intent.ACTION_SEND.equals(action)) {
                uri = intent.getParcelableExtra(Intent.EXTRA_STREAM);
                if (uri == null) text = intent.getStringExtra(Intent.EXTRA_TEXT);
            }
            if (uri != null) {
                try (InputStream in = getContentResolver().openInputStream(uri)) {
                    ByteArrayOutputStream out = new ByteArrayOutputStream();
                    byte[] buf = new byte[65536]; int n; long total = 0;
                    while ((n = in.read(buf)) > 0) { out.write(buf, 0, n); total += n; if (total > 60L * 1024 * 1024) throw new Exception("too big"); }
                    incoming = "file:" + Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP);
                }
            } else if (text != null) incoming = "text:" + text;
        } catch (Exception e) {
            Toast.makeText(this, "That file could not be opened", Toast.LENGTH_LONG).show();
        }
    }

    interface Progress { void on(int pct); }

    // GET a URL (following GitHub's redirect to its download server)
    private byte[] fetch(String url, Progress prog) throws Exception {
        for (int hop = 0; hop < 5; hop++) {
            HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
            c.setConnectTimeout(15000); c.setReadTimeout(30000);
            c.setInstanceFollowRedirects(false);
            c.setRequestProperty("User-Agent", "WitchCompanion-Android");
            c.setRequestProperty("Cache-Control", "no-cache");
            int code = c.getResponseCode();
            if (code >= 300 && code < 400) {
                String loc = c.getHeaderField("Location"); c.disconnect();
                if (loc == null || !loc.startsWith("https://")) throw new Exception("Bad redirect");
                url = loc; continue;
            }
            if (code == 404) throw new Exception("Not found (" + code + ")");
            if (code != 200) throw new Exception("Server answered " + code);
            long total = c.getContentLengthLong();
            try (InputStream in = c.getInputStream()) {
                ByteArrayOutputStream out = new ByteArrayOutputStream(total > 0 ? (int) total : 65536);
                byte[] buf = new byte[65536]; long got = 0; int n, last = -1;
                while ((n = in.read(buf)) > 0) {
                    out.write(buf, 0, n); got += n;
                    if (prog != null && total > 0) { int p = (int) (got * 100 / total); if (p != last && p % 2 == 0) { last = p; prog.on(p); } }
                }
                return out.toByteArray();
            } finally { c.disconnect(); }
        }
        throw new Exception("Too many redirects");
    }

    // hand the downloaded APK to Android's installer; Android asks the user to confirm
    private File pendingApk;   // waiting while the person allows "install unknown apps" for us

    private void install(File apk) throws Exception {
        // first time only: Android needs permission for this app to install updates; send the person
        // to that switch, and carry on by ourselves as soon as they come back with it turned on
        if (Build.VERSION.SDK_INT >= 26 && !getPackageManager().canRequestPackageInstalls()) {
            pendingApk = apk;
            status("permission", "");
            runOnUiThread(() -> {
                try { startActivity(new Intent(android.provider.Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + getPackageName()))); }
                catch (Exception e) { pendingApk = null; try { install2(apk); } catch (Exception ignored) { } }
            });
            return;
        }
        install2(apk);
    }

    private void install2(File apk) throws Exception {
        PackageInstaller pi = getPackageManager().getPackageInstaller();
        PackageInstaller.SessionParams p = new PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL);
        p.setAppPackageName(getPackageName());
        if (Build.VERSION.SDK_INT >= 31) p.setRequireUserAction(PackageInstaller.SessionParams.USER_ACTION_NOT_REQUIRED);
        int id = pi.createSession(p);
        try (PackageInstaller.Session s = pi.openSession(id)) {
            try (InputStream in = new FileInputStream(apk); OutputStream out = s.openWrite("update.apk", 0, apk.length())) {
                byte[] buf = new byte[65536]; int n;
                while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
                s.fsync(out);
            }
            Intent i = new Intent(ACTION_INSTALL_STATUS).setPackage(getPackageName());
            int flags = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 31 ? PendingIntent.FLAG_MUTABLE : 0);
            PendingIntent pend = PendingIntent.getBroadcast(this, id, i, flags);
            s.commit(pend.getIntentSender());
        }
    }

    private void status(String state, String detail) {
        js("window.onUpdateStatus && onUpdateStatus(" + JSONObject.quote(state) + "," + JSONObject.quote(detail == null ? "" : detail) + ")");
    }

    private void js(String code) { runOnUiThread(() -> { if (web != null) web.evaluateJavascript(code, null); }); }

    @Override
    protected void onDestroy() { try { unregisterReceiver(installReceiver); } catch (Exception ignored) { } super.onDestroy(); }

    @SuppressWarnings("deprecation")
    private void applyBars() {
        int c = Color.parseColor(dayTheme ? "#EFE3C8" : "#0B0812");
        Window w = getWindow();
        root.setBackgroundColor(c);
        w.getDecorView().setBackgroundColor(c);
        if (Build.VERSION.SDK_INT < 35) { w.setStatusBarColor(c); w.setNavigationBarColor(c); }
        if (Build.VERSION.SDK_INT >= 30 && w.getInsetsController() != null) {
            int light = android.view.WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS | android.view.WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS;
            w.getInsetsController().setSystemBarsAppearance(dayTheme ? light : 0, light);
        } else if (Build.VERSION.SDK_INT >= 23) {
            View d = w.getDecorView();
            int f = d.getSystemUiVisibility();
            f = dayTheme ? (f | View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR) : (f & ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);
            d.setSystemUiVisibility(f);
        }
    }

    @Override
    public void onRequestPermissionsResult(int req, String[] perms, int[] res) {
        super.onRequestPermissionsResult(req, perms, res);
        if (req == REQ_CAMERA && pendingCam != null) {
            if (res.length > 0 && res[0] == PackageManager.PERMISSION_GRANTED) pendingCam.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});
            else pendingCam.deny();
            pendingCam = null;
        }
        if (req == REQ_NOTIFY) {
            boolean ok = res.length > 0 && res[0] == PackageManager.PERMISSION_GRANTED && ReminderReceiver.allowed(this);
            js("window.onNotifyPermission && onNotifyPermission(" + ok + ")");
        }
    }

    @Override
    protected void onActivityResult(int req, int res, Intent data) {
        super.onActivityResult(req, res, data);
        if (req == REQ_FILE) {
            if (fileCallback != null) {
                Uri[] r = null;
                if (res == RESULT_OK && data != null) {
                    if (data.getData() != null) r = new Uri[]{data.getData()};
                    else if (data.getClipData() != null && data.getClipData().getItemCount() > 0) r = new Uri[]{data.getClipData().getItemAt(0).getUri()};
                }
                fileCallback.onReceiveValue(r);
                fileCallback = null;
            }
        } else if (req == REQ_SAVE) {
            if (res == RESULT_OK && data != null && data.getData() != null && pendingSave != null) {
                try (OutputStream os = getContentResolver().openOutputStream(data.getData())) {
                    os.write(pendingSave);
                    Toast.makeText(this, "Saved ✶", Toast.LENGTH_SHORT).show();
                } catch (Exception e) {
                    Toast.makeText(this, "Could not save: " + e.getMessage(), Toast.LENGTH_LONG).show();
                }
            }
            pendingSave = null;
        }
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        web.evaluateJavascript("window.appBack ? window.appBack() : false", v -> {
            if (!"true".equals(v)) {
                if (web.canGoBack()) web.goBack(); else finish();
            }
        });
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @Override
    protected void onPause() { super.onPause(); web.onPause(); }

    @Override
    protected void onResume() {
        super.onResume(); web.onResume();
        if (pendingApk != null && (Build.VERSION.SDK_INT < 26 || getPackageManager().canRequestPackageInstalls())) {
            File apk = pendingApk; pendingApk = null;
            status("installing", "");
            new Thread(() -> { try { install2(apk); } catch (Exception e) { status("failed", String.valueOf(e.getMessage())); } }).start();
        }
    }
}
