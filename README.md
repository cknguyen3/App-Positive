# ☀️ Daily Sunshine

A positive, funny message or quote every day, on all your devices: a
home-screen **widget** plus a full-screen **app** to read, browse, favorite and share.

Every device shows the **same message on the same day**. All messages live in one file,
[`web/quotes.json`](web/quotes.json). Edit it to add your own, and every device picks them up.

| Folder | What it is |
| --- | --- |
| `web/` | The app. An installable web app (PWA) for iPhone, iPad, Android, Mac, Windows and Chromebook. Works offline. |
| `android/` | Native Android app with a resizable home-screen widget. GitHub builds the APK for you. |
| `widgets/ios-scriptable/` | iPhone/iPad home-screen widget, run by the free **Scriptable** app. |

## One-time setup (on GitHub)

1. Merge this branch into your default branch (e.g. `main`).
2. Go to the repo's **Settings → Pages**. Under *Build and deployment*, set **Source** to **GitHub Actions**.
3. Open the **Actions** tab and run **Publish web app** once (or push any change to `web/`).
   The app is then live at **https://cknguyen3.github.io/App-Positive/**.
4. The **Build Android app** workflow runs on its own and publishes `DailySunshine.apk` under **Releases**.

> GitHub Pages on a *private* repo needs a paid GitHub plan. If the repo is private, either make it
> public or download the APK from the Actions run while signed in to GitHub.

## Installing on each device

### iPhone / iPad
- **App:** open the site in **Safari** → **Share** → **Add to Home Screen**.
- **Widget:** Apple only lets real apps add widgets, so this uses the free **Scriptable** app:
  1. Install *Scriptable* from the App Store.
  2. In the site tap **＋** → *Daily Sunshine script*, then Select All → Copy.
  3. In Scriptable tap **+**, paste, and name it *Daily Sunshine*.
  4. Long-press your home screen → **+** → **Scriptable** → pick a size → **Add Widget**.
  5. Long-press the widget → **Edit Widget** → Script: **Daily Sunshine**.
  Tapping the widget opens the full app.

### Android
- **Widget + app:** on the phone, open **Releases** → latest → download `DailySunshine.apk` and open it.
  You may need to allow your browser to *Install unknown apps*. Then long-press the home screen →
  **Widgets** → **Daily Sunshine**. Tapping the widget opens the app. Newer APKs install over older ones.
- **App only:** open the site in Chrome → **⋮** → **Install app**.

### Mac / Windows / Chromebook
Open the site in Chrome or Edge and click the **install** icon in the address bar.

## How the daily pick works

`index = (daysSince1970(localDate) × 7919) mod numberOfMessages`

7919 is prime, so each message appears once before any repeats, and every platform computes the same
message for the same calendar day. If you change this formula, update it in all three places:
`web/app.js`, `widgets/ios-scriptable/DailySunshine.js` and `android/.../Quotes.java`.

## Run the web app locally

```bash
cd web && python3 -m http.server 8000
```

Then open http://localhost:8000.
