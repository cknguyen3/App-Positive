package com.dailysunshine.app;

import android.content.Context;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/** Loads the shared message list and picks the message for a given day. */
final class Quotes {

    /** Must match web/app.js and the iOS widget so every device shows the same message. */
    private static final long STRIDE = 7919L;

    static final class Quote {
        final String text;
        final String author; // may be null
        final String type;   // "quote", "funny" or "kind"

        Quote(String text, String author, String type) {
            this.text = text;
            this.author = author;
            this.type = type;
        }

        String displayText() {
            return author != null ? "“" + text + "”" : text;
        }

        String shareText() {
            return (author != null ? displayText() + " — " + author : text) + "\n\n☀️ Daily Sunshine";
        }

        int labelRes() {
            if ("funny".equals(type)) return R.string.label_funny;
            if ("kind".equals(type)) return R.string.label_kind;
            return R.string.label_quote;
        }

        int backgroundRes() {
            if ("funny".equals(type)) return R.drawable.bg_funny;
            if ("kind".equals(type)) return R.drawable.bg_kind;
            return R.drawable.bg_quote;
        }

        int widgetBackgroundRes() {
            if ("funny".equals(type)) return R.drawable.widget_bg_funny;
            if ("kind".equals(type)) return R.drawable.widget_bg_kind;
            return R.drawable.widget_bg_quote;
        }
    }

    private static List<Quote> cache;

    private Quotes() {}

    static synchronized List<Quote> all(Context context) {
        if (cache != null) return cache;
        List<Quote> list = new ArrayList<>();
        try (InputStream in = context.getAssets().open("quotes.json")) {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buf = new byte[8192];
            int n;
            while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
            JSONArray arr = new JSONArray(new String(out.toByteArray(), StandardCharsets.UTF_8));
            for (int i = 0; i < arr.length(); i++) {
                JSONObject o = arr.getJSONObject(i);
                String author = o.optString("author", "");
                list.add(new Quote(o.getString("text"), author.isEmpty() ? null : author, o.optString("type", "quote")));
            }
        } catch (Exception e) {
            list.clear();
        }
        if (list.isEmpty()) {
            list.add(new Quote("You're doing better than you think.", null, "kind"));
        }
        cache = list;
        return list;
    }

    static Quote forDate(Context context, LocalDate date) {
        List<Quote> list = all(context);
        long n = list.size();
        long idx = Math.floorMod(date.toEpochDay() * STRIDE, n);
        return list.get((int) idx);
    }
}
