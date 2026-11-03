package com.dailysunshine.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.view.View;
import android.widget.RemoteViews;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;

/** Home-screen widget that shows the message of the day. */
public class SunshineWidget extends AppWidgetProvider {

    private static final String ACTION_MIDNIGHT = "com.dailysunshine.app.MIDNIGHT";

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        render(context, manager, ids);
        scheduleMidnight(context);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        String action = intent.getAction();
        if (ACTION_MIDNIGHT.equals(action)
                || Intent.ACTION_TIME_CHANGED.equals(action)
                || Intent.ACTION_TIMEZONE_CHANGED.equals(action)
                || Intent.ACTION_BOOT_COMPLETED.equals(action)
                || Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)) {
            refreshAll(context);
        }
    }

    @Override
    public void onDisabled(Context context) {
        AlarmManager am = context.getSystemService(AlarmManager.class);
        if (am != null) am.cancel(midnightIntent(context));
    }

    static void refreshAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, SunshineWidget.class));
        if (ids.length > 0) {
            render(context, manager, ids);
            scheduleMidnight(context);
        }
    }

    private static void render(Context context, AppWidgetManager manager, int[] ids) {
        Quotes.Quote q = Quotes.forDate(context, LocalDate.now());

        Intent open = new Intent(context, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent tap = PendingIntent.getActivity(context, 0, open,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        for (int id : ids) {
            RemoteViews v = new RemoteViews(context.getPackageName(), R.layout.widget_sunshine);
            v.setInt(R.id.widget_root, "setBackgroundResource", q.widgetBackgroundRes());
            v.setTextViewText(R.id.widget_label, context.getString(q.labelRes()));
            v.setTextViewText(R.id.widget_text, q.displayText());
            if (q.author != null) {
                v.setTextViewText(R.id.widget_author, "— " + q.author);
                v.setViewVisibility(R.id.widget_author, View.VISIBLE);
            } else {
                v.setViewVisibility(R.id.widget_author, View.GONE);
            }
            v.setOnClickPendingIntent(R.id.widget_root, tap);
            manager.updateAppWidget(id, v);
        }
    }

    /** Wake shortly after local midnight so the new message shows up right away. */
    private static void scheduleMidnight(Context context) {
        AlarmManager am = context.getSystemService(AlarmManager.class);
        if (am == null) return;
        long at = ZonedDateTime.now(ZoneId.systemDefault())
                .toLocalDate().plusDays(1)
                .atStartOfDay(ZoneId.systemDefault())
                .plusMinutes(1)
                .toInstant().toEpochMilli();
        // Inexact alarm: needs no special permission and is battery friendly.
        am.set(AlarmManager.RTC, at, midnightIntent(context));
    }

    private static PendingIntent midnightIntent(Context context) {
        Intent i = new Intent(context, SunshineWidget.class).setAction(ACTION_MIDNIGHT);
        return PendingIntent.getBroadcast(context, 1, i,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
}
