// Daily Sunshine — iPhone / iPad home-screen widget for the free "Scriptable" app.
//
// Setup:
//   1. Install "Scriptable" from the App Store.
//   2. Open Scriptable, tap +, paste this whole file, name it "Daily Sunshine".
//   3. Long-press your home screen → + → Scriptable → pick a size → Add Widget.
//   4. Long-press the new widget → Edit Widget → Script: "Daily Sunshine".
//   Tapping the widget opens the full Daily Sunshine app.
//
// Running the script inside Scriptable shows a preview of the widget.

const APP_URL = "https://cknguyen3.github.io/App-Positive/";
const QUOTES_URL = APP_URL + "quotes.json";
const STRIDE = 7919; // must match web/app.js and the Android widget

const LABELS = { quote: "QUOTE OF THE DAY", funny: "SMILE OF THE DAY", kind: "REMINDER OF THE DAY" };
const COLORS = {
  quote: ["#ffd27a", "#ff6f91"],
  funny: ["#8fe8e0", "#a07bff"],
  kind:  ["#c9f59a", "#4fbfbf"],
};
const FALLBACK = [
  { text: "You're doing better than you think.", type: "kind" },
  { text: "You miss 100% of the naps you don't take.", type: "funny" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt", type: "quote" },
];

async function loadQuotes() {
  const fm = FileManager.local();
  const cache = fm.joinPath(fm.cacheDirectory(), "daily-sunshine-quotes.json");
  try {
    const req = new Request(QUOTES_URL);
    req.timeoutInterval = 10;
    const data = await req.loadJSON();
    if (Array.isArray(data) && data.length) {
      fm.writeString(cache, JSON.stringify(data));
      return data;
    }
  } catch (e) { /* offline: fall through to cache */ }
  if (fm.fileExists(cache)) {
    try { return JSON.parse(fm.readString(cache)); } catch (e) {}
  }
  return FALLBACK;
}

function todaysQuote(quotes) {
  const now = new Date();
  const day = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);
  const n = quotes.length;
  return quotes[((day * STRIDE) % n + n) % n];
}

function buildWidget(q) {
  const size = config.widgetFamily || "medium";
  const w = new ListWidget();
  const [c1, c2] = COLORS[q.type] || COLORS.quote;
  const g = new LinearGradient();
  g.colors = [new Color(c1), new Color(c2)];
  g.locations = [0, 1];
  g.startPoint = new Point(0, 0);
  g.endPoint = new Point(1, 1);
  w.backgroundGradient = g;
  w.setPadding(14, 16, 14, 16);
  w.url = APP_URL;

  const ink = new Color("#2d1f33");
  const isSmall = size === "small";
  const isBig = size === "large" || size === "extraLarge";

  const label = w.addText("☀️ " + (LABELS[q.type] || LABELS.quote));
  label.font = Font.heavySystemFont(isSmall ? 9 : 11);
  label.textColor = ink;
  label.textOpacity = 0.7;

  w.addSpacer(isSmall ? 4 : 8);

  const body = w.addText(q.author ? `“${q.text}”` : q.text);
  body.font = Font.boldRoundedSystemFont(isSmall ? 14 : isBig ? 24 : 17);
  body.textColor = ink;
  body.minimumScaleFactor = 0.5;

  if (q.author && !isSmall) {
    w.addSpacer(6);
    const a = w.addText("— " + q.author);
    a.font = Font.semiboldRoundedSystemFont(isBig ? 15 : 12);
    a.textColor = ink;
    a.textOpacity = 0.75;
  }

  w.addSpacer();

  // Ask iOS to refresh just after midnight so the new message appears.
  const tomorrow = new Date();
  tomorrow.setHours(24, 1, 0, 0);
  w.refreshAfterDate = tomorrow;
  return w;
}

const quotes = await loadQuotes();
const widget = buildWidget(todaysQuote(quotes));

if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  await widget.presentMedium();
}
Script.complete();
