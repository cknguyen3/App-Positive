package com.dailysunshine.app;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.FormatStyle;
import java.util.List;
import java.util.Random;

/** Full-screen view of the daily message, with browsing and sharing. */
public class MainActivity extends Activity {

    private final Random random = new Random();
    private int offset = 0; // 0 = today, -1 = yesterday, ...
    private Quotes.Quote current;

    private View root;
    private TextView dateView, labelView, textView, authorView;
    private Button nextBtn, todayBtn;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        root = findViewById(R.id.root);
        dateView = findViewById(R.id.date);
        labelView = findViewById(R.id.label);
        textView = findViewById(R.id.text);
        authorView = findViewById(R.id.author);
        nextBtn = findViewById(R.id.btn_next);
        todayBtn = findViewById(R.id.btn_today);

        findViewById(R.id.btn_prev).setOnClickListener(v -> { offset--; showDay(); });
        nextBtn.setOnClickListener(v -> { offset = Math.min(0, offset + 1); showDay(); });
        todayBtn.setOnClickListener(v -> { offset = 0; showDay(); });
        findViewById(R.id.btn_surprise).setOnClickListener(v -> surprise());
        findViewById(R.id.btn_share).setOnClickListener(v -> share());

        if (savedInstanceState != null) offset = savedInstanceState.getInt("offset", 0);
    }

    @Override
    protected void onResume() {
        super.onResume();
        showDay();
        // keep any widgets in sync with the app
        SunshineWidget.refreshAll(this);
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        out.putInt("offset", offset);
    }

    private void showDay() {
        LocalDate date = LocalDate.now().plusDays(offset);
        String formatted = date.format(DateTimeFormatter.ofLocalizedDate(FormatStyle.FULL));
        show(Quotes.forDate(this, date), offset == 0 ? getString(R.string.today_prefix, formatted) : formatted);
        nextBtn.setEnabled(offset < 0);
        todayBtn.setEnabled(offset != 0);
    }

    private void surprise() {
        List<Quotes.Quote> all = Quotes.all(this);
        Quotes.Quote q;
        do {
            q = all.get(random.nextInt(all.size()));
        } while (all.size() > 1 && q == current);
        show(q, getString(R.string.bonus));
        nextBtn.setEnabled(true);
        todayBtn.setEnabled(true);
    }

    private void show(Quotes.Quote q, String dateLabel) {
        current = q;
        root.setBackgroundResource(q.backgroundRes());
        dateView.setText(dateLabel);
        labelView.setText(q.labelRes());
        textView.setText(q.displayText());
        if (q.author != null) {
            authorView.setText("— " + q.author);
            authorView.setVisibility(View.VISIBLE);
        } else {
            authorView.setVisibility(View.GONE);
        }
        textView.setAlpha(0f);
        textView.animate().alpha(1f).setDuration(350).start();
    }

    private void share() {
        if (current == null) return;
        Intent send = new Intent(Intent.ACTION_SEND);
        send.setType("text/plain");
        send.putExtra(Intent.EXTRA_TEXT, current.shareText());
        startActivity(Intent.createChooser(send, getString(R.string.share)));
    }
}
