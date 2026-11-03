// Daily Sunshine — picks one message per calendar day.
//
// The pick must match the widgets (Android + iOS Scriptable), so all of them use:
//   day   = days since 1970-01-01 for the *local* calendar date
//   index = (day * 7919) mod quotes.length
// 7919 is prime, so every message is shown once before any repeats.

const STRIDE = 7919;
const LABELS = { quote: 'Quote of the day', funny: 'Smile of the day', kind: 'Reminder of the day' };

const $ = (id) => document.getElementById(id);
let quotes = [];
let offset = 0;          // 0 = today, -1 = yesterday, ...
let current = null;      // currently displayed quote object

function epochDay(date) {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
}

function indexForDay(day, n) {
  return (((day * STRIDE) % n) + n) % n;
}

function dateForOffset(off) {
  const d = new Date();
  d.setDate(d.getDate() + off);
  return d;
}

function show(q, dateLabel) {
  current = q;
  document.body.dataset.type = q.type || 'quote';
  $('tag').textContent = LABELS[q.type] || LABELS.quote;
  $('text').textContent = q.author ? `“${q.text}”` : q.text;
  $('author').textContent = q.author ? `— ${q.author}` : '';
  $('date').textContent = dateLabel;
  $('favBtn').textContent = isFav(q) ? '♥' : '♡';

  // restart the entrance animation
  const card = $('card');
  card.style.animation = 'none';
  void card.offsetWidth;
  card.style.animation = '';
}

function showDay() {
  const d = dateForOffset(offset);
  const q = quotes[indexForDay(epochDay(d), quotes.length)];
  const label = offset === 0
    ? 'Today · ' + d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
    : d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  show(q, label);
  $('nextBtn').disabled = offset >= 0;
  $('todayBtn').disabled = offset === 0;
}

function surprise() {
  let q;
  do { q = quotes[Math.floor(Math.random() * quotes.length)]; } while (quotes.length > 1 && q === current);
  show(q, 'Bonus round 🎉');
  $('nextBtn').disabled = false;
  $('todayBtn').disabled = false;
}

// ---- favorites (stored only on this device) ----
function loadFavs() {
  try { return JSON.parse(localStorage.getItem('favs') || '[]'); } catch { return []; }
}
function saveFavs(list) {
  try { localStorage.setItem('favs', JSON.stringify(list)); } catch { /* storage unavailable */ }
}
function isFav(q) { return loadFavs().some((f) => f.text === q.text); }
function toggleFav() {
  if (!current) return;
  let favs = loadFavs();
  if (isFav(current)) {
    favs = favs.filter((f) => f.text !== current.text);
    toast('Removed from favorites');
  } else {
    favs.unshift(current);
    toast('Saved to favorites ♥');
  }
  saveFavs(favs);
  $('favBtn').textContent = isFav(current) ? '♥' : '♡';
}
function renderFavs() {
  const list = $('favList');
  list.replaceChildren();
  const favs = loadFavs();
  if (!favs.length) {
    const li = document.createElement('li');
    li.textContent = 'Tap the ♡ on a message to save it here.';
    list.append(li);
    return;
  }
  for (const f of favs) {
    const li = document.createElement('li');
    li.textContent = f.author ? `“${f.text}” — ${f.author}` : f.text;
    list.append(li);
  }
}

// ---- sharing ----
function shareText(q) {
  return (q.author ? `“${q.text}” — ${q.author}` : q.text) + '\n\n☀️ Daily Sunshine';
}
async function share() {
  if (!current) return;
  const text = shareText(current);
  if (navigator.share) {
    try { await navigator.share({ text, url: location.href }); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  try { await navigator.clipboard.writeText(text); toast('Copied to clipboard'); }
  catch { toast('Could not share on this device'); }
}

let toastTimer;
function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 1800);
}

// ---- install hints ----
let deferredPrompt = null;
function setupInstall() {
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  if (standalone) return;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (ios) $('hint').textContent = 'Tip: tap Share → “Add to Home Screen” to install.';

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const b = document.createElement('button');
    b.className = 'btn';
    b.textContent = '⬇ Install app';
    b.onclick = async () => {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      b.remove();
    };
    $('hint').replaceChildren(b);
  });
}

// ---- wiring ----
function wire() {
  $('prevBtn').onclick = () => { offset -= 1; showDay(); };
  $('nextBtn').onclick = () => { offset = Math.min(0, offset + 1); showDay(); };
  $('todayBtn').onclick = () => { offset = 0; showDay(); };
  $('surpriseBtn').onclick = surprise;
  $('shareBtn').onclick = share;
  $('favBtn').onclick = toggleFav;
  $('infoBtn').onclick = () => $('infoDlg').showModal();
  $('favsBtn').onclick = () => { renderFavs(); $('favsDlg').showModal(); };
  document.querySelectorAll('[data-close]').forEach((b) => { b.onclick = () => b.closest('dialog').close(); });

  // swipe left/right on the card to move between days
  let x0 = null;
  const card = $('card');
  card.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  card.addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    x0 = null;
    if (dx > 60) { offset -= 1; showDay(); }
    else if (dx < -60 && offset < 0) { offset += 1; showDay(); }
  });

  document.addEventListener('keydown', (e) => {
    if (document.querySelector('dialog[open]')) return;
    if (e.key === 'ArrowLeft') $('prevBtn').click();
    if (e.key === 'ArrowRight' && offset < 0) $('nextBtn').click();
    if (e.key === ' ') { e.preventDefault(); surprise(); }
  });

  // if the app is left open overnight, roll over to the new day
  let lastDay = epochDay(new Date());
  const checkRollover = () => {
    const now = epochDay(new Date());
    if (now !== lastDay) { lastDay = now; offset = 0; showDay(); }
  };
  document.addEventListener('visibilitychange', () => { if (!document.hidden) checkRollover(); });
  setInterval(checkRollover, 60 * 1000);
}

async function init() {
  wire();
  setupInstall();
  try {
    const res = await fetch('quotes.json', { cache: 'no-cache' });
    quotes = await res.json();
  } catch {
    $('text').textContent = 'You are wonderful. (Also, you seem to be offline.)';
    return;
  }
  showDay();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
}

init();
