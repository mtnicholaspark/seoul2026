// Shared helpers used by calendar.js, wishlist.js, and nearby.js.

export const TRAVELERS = {
  nick: { name: 'Nick', color: 'var(--nick)' },
  alexus: { name: 'Alexus', color: 'var(--alexus)' },
  gary: { name: 'Gary', color: 'var(--gary)' },
  jihee: { name: 'JiHee', color: 'var(--jihee)' },
  everyone: { name: 'Everyone', color: 'var(--everyone)' },
};

// Fallback origin for the Nearby tab when geolocation is denied/unavailable:
// the Gangnam-gu short-term rental (Teheran-ro 113, between Yeoksam & Seolleung stations).
export const GANGNAM_ORIGIN = { lat: 37.5006, lng: 127.0396 };

export const TRIP_START = '2026-08-29';
export const TRIP_END = '2026-09-19';
export const VISITING_START = '2026-09-09';
export const VISITING_END = '2026-09-16';

export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Tags each item with distanceKm from origin and returns them sorted nearest-first.
// Items without numeric lat/lng are dropped (nothing to sort them by).
export function withDistance(items, origin) {
  return items
    .filter((i) => typeof i.lat === 'number' && typeof i.lng === 'number')
    .map((i) => ({ ...i, distanceKm: haversineKm(origin.lat, origin.lng, i.lat, i.lng) }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

export function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

// Resolves to { lat, lng, isFallback }. Falls back to GANGNAM_ORIGIN on denial, timeout,
// or if the Geolocation API isn't available at all.
export function getOrigin() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ ...GANGNAM_ORIGIN, isFallback: true });
      return;
    }
    const timer = setTimeout(() => resolve({ ...GANGNAM_ORIGIN, isFallback: true }), 8000);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timer);
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, isFallback: false });
      },
      () => {
        clearTimeout(timer);
        resolve({ ...GANGNAM_ORIGIN, isFallback: true });
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
    );
  });
}

export function dateRange(startStr, endStr) {
  const dates = [];
  const cur = new Date(`${startStr}T00:00:00`);
  const end = new Date(`${endStr}T00:00:00`);
  while (cur <= end) {
    dates.push(toDateStr(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

export function toDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatDayHeader(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m ? `${h12}:${String(m).padStart(2, '0')} ${period}` : `${h12} ${period}`;
}

export function isVisitingWindow(dateStr) {
  return dateStr >= VISITING_START && dateStr <= VISITING_END;
}

export function kakaoMapLink(title, lat, lng) {
  return `https://map.kakao.com/link/map/${encodeURIComponent(title)},${lat},${lng}`;
}

export function googleMapLink(lat, lng) {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

export function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

let debounceTimers = new Map();
export function debounce(key, fn, delayMs = 600) {
  clearTimeout(debounceTimers.get(key));
  const t = setTimeout(fn, delayMs);
  debounceTimers.set(key, t);
}

// Shared bottom-sheet modal, used by calendar/wishlist/nearby for all add/edit forms.
export function openModal(innerHtml, onMount) {
  const root = document.getElementById('modal-root');
  root.innerHTML = `<div class="modal-backdrop" id="modal-backdrop"><div class="modal-sheet">${innerHtml}</div></div>`;
  document.getElementById('modal-backdrop').addEventListener('click', (e) => {
    if (e.target.id === 'modal-backdrop') closeModal();
  });
  if (onMount) onMount(root);
}

export function closeModal() {
  const root = document.getElementById('modal-root');
  root.innerHTML = '';
}
