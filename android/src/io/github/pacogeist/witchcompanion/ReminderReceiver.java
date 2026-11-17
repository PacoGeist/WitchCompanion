package io.github.pacogeist.witchcompanion;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;

import org.json.JSONArray;
import org.json.JSONObject;

/* Moon reminders. The page works out the coming reminders (moon phases and sabbats at the person's chosen
   time) and hands the list over with setReminders. We keep it here and ask Android's alarm service to wake us
   for the next one only; when it fires we show the notification and set the alarm for the one after.
   After a restart, an app update or a clock change Android tells us, and we set the next alarm again.
   Nothing here uses the network. */
public class ReminderReceiver extends BroadcastReceiver {
    static final String PREFS = "reminders", KEY = "list", CHANNEL = "moon";
    static final String ACTION_FIRE = "io.github.pacogeist.witchcompanion.REMINDER";
    static final String ACTION_OPEN = "io.github.pacogeist.witchcompanion.OPEN_REMINDER";
    private static final long LATE_LIMIT = 6L * 3600 * 1000;   // skip reminders more than 6 hours late (phone was off)

    @Override
    public void onReceive(Context c, Intent intent) {
        if (ACTION_FIRE.equals(intent.getAction())) showDue(c);
        schedule(c);   // also on BOOT_COMPLETED, MY_PACKAGE_REPLACED, TIME_SET and TIMEZONE_CHANGED
    }

    /* a fresh list from the page: [{at, id, title, body}, ...]; an empty list cancels everything */
    static void save(Context c, String json) {
        try { new JSONArray(json); } catch (Exception e) { json = "[]"; }
        prefs(c).edit().putString(KEY, json).apply();
        schedule(c);
    }

    private static SharedPreferences prefs(Context c) { return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE); }

    private static JSONArray load(Context c) {
        try { return new JSONArray(prefs(c).getString(KEY, "[]")); } catch (Exception e) { return new JSONArray(); }
    }

    private static PendingIntent alarmIntent(Context c) {
        Intent i = new Intent(c, ReminderReceiver.class).setAction(ACTION_FIRE);
        return PendingIntent.getBroadcast(c, 0, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    static void schedule(Context c) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        JSONArray list = load(c);
        long now = System.currentTimeMillis(), next = Long.MAX_VALUE;
        for (int i = 0; i < list.length(); i++) {
            long at = list.optJSONObject(i) == null ? 0 : list.optJSONObject(i).optLong("at", 0);
            if (at > now - LATE_LIMIT && at < next) next = at;
        }
        PendingIntent pi = alarmIntent(c);
        if (next == Long.MAX_VALUE) { am.cancel(pi); return; }
        // inexact while the phone dozes (may arrive a few minutes late), but needs no special permission
        am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, Math.max(next, now + 1000), pi);
    }

    /* show every reminder that is due now, and keep the rest for later */
    private static void showDue(Context c) {
        JSONArray list = load(c), keep = new JSONArray();
        long now = System.currentTimeMillis();
        for (int i = 0; i < list.length(); i++) {
            JSONObject o = list.optJSONObject(i);
            if (o == null) continue;
            long at = o.optLong("at", 0);
            if (at <= now + 60000) {
                if (at > now - LATE_LIMIT) notify(c, o.optInt("id", 1000), o.optString("title", "Moon reminder"), o.optString("body", ""));
            } else keep.put(o);
        }
        prefs(c).edit().putString(KEY, keep.toString()).apply();
    }

    static boolean allowed(Context c) {
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null || !nm.areNotificationsEnabled()) return false;
        return Build.VERSION.SDK_INT < 33 || c.checkSelfPermission("android.permission.POST_NOTIFICATIONS") == PackageManager.PERMISSION_GRANTED;
    }

    private static void channel(Context c) {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null || nm.getNotificationChannel(CHANNEL) != null) return;
        NotificationChannel ch = new NotificationChannel(CHANNEL, "Moon reminders", NotificationManager.IMPORTANCE_DEFAULT);
        ch.setDescription("The moon phases and sabbats you chose in Moon Reminders");
        nm.createNotificationChannel(ch);
    }

    @SuppressWarnings("deprecation")
    static void notify(Context c, int id, String title, String body) {
        if (!allowed(c)) return;
        channel(c);
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        Intent open = new Intent(c, MainActivity.class).setAction(ACTION_OPEN).putExtra("route", "#/moon")
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent tap = PendingIntent.getActivity(c, id, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(c, CHANNEL) : new Notification.Builder(c);
        b.setSmallIcon(R.drawable.ic_stat_moon)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(new Notification.BigTextStyle().bigText(body))
                .setContentIntent(tap)
                .setAutoCancel(true)
                .setColor(0xFFD4AD5A)
                .setCategory(Notification.CATEGORY_REMINDER)
                .setWhen(System.currentTimeMillis())
                .setShowWhen(true);
        if (Build.VERSION.SDK_INT < 26) b.setPriority(Notification.PRIORITY_DEFAULT);
        nm.notify(id, b.build());
    }
}
