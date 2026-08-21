import { initCalendarTab } from './calendar.js';
import { initWishlistTab } from './wishlist.js';
import { initNearbyTab } from './nearby.js';
import { initIdeasTab } from './ideas.js';
import { firebaseConfigured } from './firebase-config.js';

const tabs = {
  calendar: { init: initCalendarTab, initialized: false },
  wishlist: { init: initWishlistTab, initialized: false },
  nearby: { init: initNearbyTab, initialized: false },
  ideas: { init: initIdeasTab, initialized: false },
};

function showTab(name) {
  Object.keys(tabs).forEach((key) => {
    const panel = document.getElementById(`${key}-tab`);
    const btn = document.getElementById(`nav-${key}`);
    const active = key === name;
    panel.hidden = !active;
    btn.classList.toggle('active', active);
  });
  if (!tabs[name].initialized) {
    tabs[name].initialized = true;
    tabs[name].init();
  }
}

document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => showTab(btn.dataset.tab));
});

if (!firebaseConfigured) {
  const warn = document.createElement('div');
  warn.textContent = 'Firebase not configured yet — edit firebase-config.js with your project keys (see README.md).';
  warn.style.cssText =
    'position:sticky;top:53px;z-index:9;background:#3a2a12;color:#ffb84c;font-size:12px;padding:8px 16px;line-height:1.4;';
  document.querySelector('.app-header').insertAdjacentElement('afterend', warn);
}

const syncIndicator = document.getElementById('sync-indicator');
function updateSyncIndicator() {
  syncIndicator.classList.toggle('online', navigator.onLine);
  syncIndicator.classList.toggle('offline', !navigator.onLine);
}
window.addEventListener('online', updateSyncIndicator);
window.addEventListener('offline', updateSyncIndicator);
updateSyncIndicator();

showTab('calendar');

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => console.warn('Service worker registration failed', err));
  });
}

// Exposes window.seedAll() / window.seedAdditions() for one-time console-run seeding
// after Firebase is configured.
import('./seed-data.js').then((m) => {
  window.seedAll = m.seedAll;
  window.seedAdditions = m.seedAdditions;
  console.info(
    'Seed data loaded. Run seedAll() once to populate Firestore, or seedAdditions() to add just the newer 2026-08-16 PDF batch without touching existing data.'
  );
});
