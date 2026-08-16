# Seoul 2026 Trip App

A shared, mobile-first trip planner for the Seoul trip (Aug 29 – Sep 19, 2026), installed via
"Add to Home Screen" so it behaves like a normal app icon. Three tabs:

- **Calendar** — day-by-day itinerary, Aug 29–Sep 19, with a highlighted band for Sep 9–16 (the
  window when Gary & JiHee are also in town).
- **Wishlist** — things to do that don't have a date yet, grouped by category.
- **Nearby** — food places *and* undated wishlist activities, merged into one feed sorted by
  distance from wherever you're standing (falls back to the Gangnam accommodation's coordinates
  if location access is denied). Scheduling a wishlist item onto the calendar removes it from
  this feed automatically, live, on every phone.

Everything (add/edit/delete) syncs across phones in real time via Firestore — no login, no paid
tier, no build step. It's just static files.

## One-time setup (you do this, ~10 minutes)

### 1. Create a free Firebase project
1. Go to [console.firebase.google.com](https://console.firebase.google.com) → **Add project** →
   name it anything (e.g. `seoul-2026-trip`) → you can skip Google Analytics.
2. In the left sidebar, click **Build → Firestore Database → Create database**. Choose
   **Start in production mode** (we'll paste our own rules next), and pick a region close to
   Seoul — `asia-northeast3` (Seoul) is ideal.
3. Once created, go to **Rules** tab and paste the contents of [`firestore.rules`](firestore.rules)
   from this repo, then **Publish**. (This app has no login — access control relies on the repo
   staying private and the Pages URL not being shared publicly, not on these rules.)
4. Back in Project settings (gear icon, top left) → scroll to **Your apps** → click the `</>` web
   icon → register an app (any nickname) → **do not** check "also set up Firebase Hosting" → copy
   the `firebaseConfig` object it gives you.
5. Open [`firebase-config.js`](firebase-config.js) in this repo and replace the `REPLACE_ME`
   placeholders with the values from that config object. Commit and push.

That's the entire backend — no server, no functions, nothing else to deploy. The free Spark tier
covers this app's usage many times over.

### 2. Enable GitHub Pages
Settings → Pages → Source: **Deploy from a branch** → pick this branch → folder `/ (root)` →
Save. GitHub gives you a `https://<username>.github.io/seoul2026/` URL — that's what everyone
adds to their home screen. (Geolocation requires HTTPS, which Pages provides automatically.)

> Note: GitHub Pages on a **private** repo requires GitHub Pro/Team on the account. If Pages
> isn't available on a private repo on your plan, the fallback is making the repo public — the
> app itself has no secrets in it (the Firebase config is a public client identifier, not a
> secret; it's protected by the Firestore rules above, not by hiding it).

### 3. Seed the starter data (run once)
Once Pages is live and `firebase-config.js` has real values:
1. Open the deployed URL in a browser.
2. Open the browser's JavaScript console (e.g. Safari: enable Developer menu → Show JS Console;
   Chrome: ⋮ → More tools → Developer tools → Console).
3. Run:
   ```js
   seedAll()
   ```
   This writes the confirmed itinerary, the wishlist (including the animal cafés, theme parks,
   photobooths, wellness spot, shopping neighborhoods, etc.), and the full food list — all with
   best-effort coordinates — into Firestore. It's safe to re-run, but re-running **overwrites**
   any edits you've made to those specific seed items in the meantime, so only do this once, right
   after setup.

### 4. Add to your phone
- **iPhone (Safari):** open the URL → Share icon → **Add to Home Screen**.
- **Android (Chrome):** open the URL → ⋮ menu → **Install app** (or **Add to Home Screen**).

Share the URL with Gary & JiHee before Sep 9 so they can do the same.

## A note on coordinates

Every place's latitude/longitude in the seed data is a best-effort estimate from its address or
neighborhood landmark — no geocoding API was used, to keep this entirely free. They're accurate
enough for walking/subway-scale "what's nearby," but if one looks off once you're actually there,
just tap **Edit** on that card and correct it — it'll sync to everyone else's phone immediately.

A few seed entries (mostly from the Aug 16 batch of user-submitted places) carry a visible ⚠️
confidence warning because the original address couldn't be fully verified against a real
business — double-check those before relying on them.

## File map

| File | Purpose |
|---|---|
| `index.html` / `style.css` | App shell, tab bar, styling |
| `app.js` | Tab router, service worker registration |
| `firebase-config.js` | Firebase project config (**edit this**) — see setup step 1 |
| `firestore.rules` | Firestore security rules to paste into the console |
| `utils.js` | Haversine distance, geolocation, date/color helpers, shared modal |
| `calendar.js` | Calendar tab: day-list, add/edit/delete, promote-from-wishlist |
| `wishlist.js` | Wishlist tab: category list, add/edit/delete, "Schedule this" |
| `nearby.js` | Nearby tab: merged food + undated-activity feed, filters, add/edit/delete food places |
| `seed-data.js` | One-time seed content — exposes `window.seedAll()` |
| `manifest.json`, `sw.js`, `icons/` | PWA install + offline shell caching |
