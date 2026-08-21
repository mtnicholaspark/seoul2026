import { db } from './firebase-config.js';
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js';
import {
  withDistance,
  getOrigin,
  formatDistance,
  kakaoMapLink,
  googleMapLink,
  escapeHtml,
  openModal,
  closeModal,
  wireUseLocationButton,
} from './utils.js';
import { openPromoteModal } from './calendar.js';
import { CATEGORY_LABELS } from './wishlist.js';

let foodItems = [];
let wishlistItems = [];
let unsubFood = null;
let unsubWishlist = null;
let origin = null;
let typeFilter = 'all'; // 'all' | 'food' | 'activity'
let subFilter = 'all';
let searchQuery = '';
let sortMode = 'distance'; // 'distance' | 'name'
let hideCompleted = false;
let viewMode = 'list'; // 'list' | 'map'
let leafletMap = null;
let markerLayer = null;

export async function initNearbyTab() {
  const container = document.getElementById('nearby-tab');
  container.innerHTML = `
    <div id="nearby-origin-note" class="card-sub" style="margin-bottom:10px"></div>
    <input type="text" id="nearby-search" class="search-input" placeholder="Search nearby places & activities…">
    <div class="segmented" id="nearby-type-filter">
      <button data-type="all" class="active">All</button>
      <button data-type="food">🍜 Food</button>
      <button data-type="activity">📍 Activities</button>
    </div>
    <div class="filter-sub-label" id="nearby-sub-filter-label" hidden></div>
    <div class="filter-row" id="nearby-sub-filter"></div>
    <div class="toolbar-row">
      <div class="filter-row" id="nearby-sort-row">
        <button class="filter-pill active" data-sort="distance">📍 Nearest</button>
        <button class="filter-pill" data-sort="name">🔤 Name A–Z</button>
      </div>
      <label class="checkbox-pill">
        <input type="checkbox" id="nearby-hide-completed"> Hide visited/done
      </label>
    </div>
    <div class="segmented" id="nearby-view-toggle">
      <button data-view="list" class="active">☰ List</button>
      <button data-view="map">🗺️ Map</button>
    </div>
    <div id="nearby-list"></div>
    <div id="nearby-map" class="map-container" style="display:none"></div>
    <button class="fab" id="nearby-add-btn" aria-label="Add food place">+</button>
  `;

  document.getElementById('nearby-add-btn').addEventListener('click', () => openFoodModal(null));
  container.querySelectorAll('#nearby-type-filter button').forEach((btn) => {
    btn.addEventListener('click', () => {
      typeFilter = btn.dataset.type;
      subFilter = 'all';
      container.querySelectorAll('#nearby-type-filter button').forEach((b) => b.classList.toggle('active', b === btn));
      render();
    });
  });

  document.getElementById('nearby-search').addEventListener('input', (e) => {
    searchQuery = e.target.value;
    render();
  });

  container.querySelectorAll('#nearby-sort-row button').forEach((btn) => {
    btn.addEventListener('click', () => {
      sortMode = btn.dataset.sort;
      container.querySelectorAll('#nearby-sort-row button').forEach((b) => b.classList.toggle('active', b === btn));
      render();
    });
  });

  document.getElementById('nearby-hide-completed').addEventListener('change', (e) => {
    hideCompleted = e.target.checked;
    render();
  });

  container.querySelectorAll('#nearby-view-toggle button').forEach((btn) => {
    btn.addEventListener('click', () => {
      viewMode = btn.dataset.view;
      container.querySelectorAll('#nearby-view-toggle button').forEach((b) => b.classList.toggle('active', b === btn));
      document.getElementById('nearby-list').style.display = viewMode === 'list' ? '' : 'none';
      const mapEl = document.getElementById('nearby-map');
      mapEl.style.display = viewMode === 'map' ? 'block' : 'none';
      if (viewMode === 'map') {
        ensureMap();
        setTimeout(() => leafletMap && leafletMap.invalidateSize(), 50);
        render();
      }
    });
  });

  const originNote = document.getElementById('nearby-origin-note');
  originNote.textContent = 'Finding your location…';
  origin = await getOrigin();
  originNote.textContent = origin.isFallback
    ? '📍 Using accommodation location (location unavailable — check permissions)'
    : '📍 Sorted from your current location';

  if (unsubFood) unsubFood();
  if (unsubWishlist) unsubWishlist();
  unsubFood = onSnapshot(
    collection(db, 'foodPlaces'),
    (snap) => {
      foodItems = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      render();
    },
    (err) => console.error('foodPlaces snapshot error', err)
  );
  // Live listener is what makes the "drop off Nearby the instant it's scheduled" behavior
  // work for free — no extra sync code needed beyond the scheduled:false filter below.
  unsubWishlist = onSnapshot(
    collection(db, 'wishlistItems'),
    (snap) => {
      wishlistItems = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      render();
    },
    (err) => console.error('wishlistItems snapshot error', err)
  );
}

function normalizeFood(f) {
  return {
    kind: 'food',
    id: f.id,
    title: f.nameEn || f.nameKo || 'Unnamed place',
    subtitle: [f.neighborhood, f.cuisine].filter(Boolean).join(' · '),
    lat: f.lat,
    lng: f.lng,
    filterValue: f.neighborhood || 'Other',
    raw: f,
  };
}

function normalizeActivity(w) {
  return {
    kind: 'activity',
    id: w.id,
    title: w.title,
    subtitle: CATEGORY_LABELS[w.category] || w.category || 'Other',
    lat: w.lat,
    lng: w.lng,
    filterValue: w.category || 'other',
    raw: w,
  };
}

function unscheduledActivities() {
  return wishlistItems.filter((w) => !w.scheduled);
}

// Leaflet (global `L`, loaded via <script> in index.html) needs a visible, sized container
// to lay itself out correctly, so the map instance is created lazily on first switch to Map
// view rather than at tab-init time when the container is still display:none.
function ensureMap() {
  if (leafletMap || typeof L === 'undefined') return leafletMap;
  leafletMap = L.map('nearby-map', { attributionControl: true });
  markerLayer = L.layerGroup().addTo(leafletMap);
  addEnglishBasemap(leafletMap);
  return leafletMap;
}

// OpenFreeMap's vector tiles (free, no signup, no API key, no usage limits) are added via
// the MapLibre-GL-in-Leaflet bridge (L.maplibreGL). Their default style renders each place's
// local-script name, so the fetched style is patched to prefer the OpenMapTiles "name:en"
// field — falling back to the local name only when no English name is tagged — before handing
// it to MapLibre. Falls back to plain OSM raster tiles (local-script labels) if the style
// fetch fails, so the map still works rather than staying blank.
async function addEnglishBasemap(map) {
  const attribution =
    '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors' +
    ' &middot; tiles by <a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a>';
  try {
    const res = await fetch('https://tiles.openfreemap.org/styles/liberty');
    if (!res.ok) throw new Error(`style fetch failed: ${res.status}`);
    const style = await res.json();
    (style.layers || []).forEach((layer) => {
      if (layer.layout && layer.layout['text-field']) {
        layer.layout['text-field'] = ['coalesce', ['get', 'name:en'], ['get', 'name']];
      }
    });
    L.maplibreGL({ style, attribution }).addTo(map);
  } catch (err) {
    console.warn('English map style unavailable, falling back to default OpenStreetMap tiles:', err);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution }).addTo(map);
  }
}

function updateMapMarkers(sorted) {
  if (!leafletMap || !markerLayer) return;
  markerLayer.clearLayers();

  const bounds = [];
  if (origin) {
    L.circleMarker([origin.lat, origin.lng], {
      radius: 9,
      color: '#22a35e',
      fillColor: '#22a35e',
      fillOpacity: 0.9,
      weight: 2,
    })
      .bindPopup(origin.isFallback ? 'Accommodation (fallback location)' : 'You are here')
      .addTo(markerLayer);
    bounds.push([origin.lat, origin.lng]);
  }

  sorted.forEach((m) => {
    const isFood = m.kind === 'food';
    const color = isFood ? '#e05b96' : '#5b93d9';
    const raw = m.raw;
    const statusText = isFood ? (raw.visited ? ' · ✓ Visited' : '') : raw.done ? ' · ✓ Done' : '';
    L.circleMarker([m.lat, m.lng], { radius: 7, color, fillColor: color, fillOpacity: 0.85, weight: 1.5 })
      .bindPopup(
        `<strong>${escapeHtml(m.title)}</strong>${statusText}<br>` +
          `<span>${escapeHtml(m.subtitle)} · ${formatDistance(m.distanceKm)}</span><br>` +
          `<a href="${kakaoMapLink(m.title, m.lat, m.lng)}" target="_blank" rel="noopener">Kakao Map</a> · ` +
          `<a href="${googleMapLink(m.lat, m.lng)}" target="_blank" rel="noopener">Google Maps</a>`
      )
      .addTo(markerLayer);
    bounds.push([m.lat, m.lng]);
  });

  if (bounds.length > 0) {
    leafletMap.fitBounds(bounds, { padding: [30, 30], maxZoom: 16 });
  }
}

function render() {
  const listEl = document.getElementById('nearby-list');
  const subFilterEl = document.getElementById('nearby-sub-filter');
  if (!listEl || !origin) return;

  const preFilterPool =
    typeFilter === 'food'
      ? foodItems.map(normalizeFood)
      : typeFilter === 'activity'
      ? unscheduledActivities().map(normalizeActivity)
      : [];

  const subFilterLabelEl = document.getElementById('nearby-sub-filter-label');
  if (typeFilter === 'all') {
    subFilterEl.innerHTML = '';
    subFilterLabelEl.hidden = true;
  } else {
    subFilterLabelEl.hidden = false;
    subFilterLabelEl.textContent = typeFilter === 'food' ? 'Filter by neighborhood' : 'Filter by category';
    const values = [...new Set(preFilterPool.map((m) => m.filterValue))].sort();
    subFilterEl.innerHTML = ['all', ...values]
      .map(
        (v) =>
          `<button class="filter-pill ${subFilter === v ? 'active' : ''}" data-val="${escapeHtml(v)}">${
            v === 'all' ? 'All' : escapeHtml(CATEGORY_LABELS[v] || v)
          }</button>`
      )
      .join('');
    subFilterEl.querySelectorAll('.filter-pill').forEach((btn) => {
      btn.addEventListener('click', () => {
        subFilter = btn.dataset.val;
        render();
      });
    });
  }

  let merged;
  if (typeFilter === 'all') {
    merged = [...foodItems.map(normalizeFood), ...unscheduledActivities().map(normalizeActivity)];
  } else {
    merged = preFilterPool;
    if (subFilter !== 'all') merged = merged.filter((m) => m.filterValue === subFilter);
  }

  if (hideCompleted) {
    merged = merged.filter((m) => !(m.kind === 'food' ? m.raw.visited : m.raw.done));
  }

  const q = searchQuery.trim().toLowerCase();
  if (q) {
    merged = merged.filter((m) => {
      const haystack = [m.title, m.subtitle, m.raw.nameKo, m.raw.notes, m.raw.tips]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }

  let sorted = withDistance(merged, origin);
  if (sortMode === 'name') {
    sorted = [...sorted].sort((a, b) => a.title.localeCompare(b.title));
  }

  updateMapMarkers(sorted);

  if (sorted.length === 0) {
    listEl.innerHTML = `<div class="empty-state">Nothing matches — try a different search or filter.</div>`;
    return;
  }

  listEl.innerHTML = sorted.map(renderCard).join('');

  sorted.forEach((m) => {
    if (m.kind === 'food') {
      const visitBtn = listEl.querySelector(`#nb-visit-${m.id}`);
      if (visitBtn) visitBtn.addEventListener('click', () => openVisitModal(m.raw));
      const editBtn = listEl.querySelector(`#nb-edit-${m.id}`);
      if (editBtn) editBtn.addEventListener('click', () => openFoodModal(m.raw));
    } else {
      const doneBtn = listEl.querySelector(`#nb-done-${m.id}`);
      if (doneBtn) doneBtn.addEventListener('click', () => toggleDone(m.raw));
      const scheduleBtn = listEl.querySelector(`#nb-schedule-${m.id}`);
      if (scheduleBtn) scheduleBtn.addEventListener('click', () => openPromoteModal(m.raw));
    }
  });
}

function renderCard(m) {
  const isFood = m.kind === 'food';
  const raw = m.raw;
  const badge = isFood
    ? '<span class="badge-type badge-food">Food</span>'
    : '<span class="badge-type badge-activity">Activity</span>';
  const confidenceFlag =
    raw.confidence && raw.confidence !== 'verified'
      ? `<div class="confidence-flag">⚠️ ${escapeHtml(raw.confidence)}${raw.flagNote ? `: ${escapeHtml(raw.flagNote)}` : ''}</div>`
      : '';
  const hasCoords = typeof m.lat === 'number' && typeof m.lng === 'number';
  const mapLinks = hasCoords
    ? `<a class="btn btn-sm" href="${kakaoMapLink(m.title, m.lat, m.lng)}" target="_blank" rel="noopener">Kakao Map</a>
       <a class="btn btn-sm" href="${googleMapLink(m.lat, m.lng)}" target="_blank" rel="noopener">Google Maps</a>`
    : '';
  const statusChip = isFood
    ? raw.visited
      ? '<span class="chip chip-stamp">Visited</span>'
      : ''
    : raw.done
    ? '<span class="chip chip-stamp">Done</span>'
    : '';
  const notes = isFood ? raw.notes : [raw.notes, raw.tips].filter(Boolean).join(' · ');
  const personalNote =
    isFood && raw.personalNote ? `<div class="card-notes">📝 ${escapeHtml(raw.personalNote)}</div>` : '';

  return `
    <div class="card">
      <div class="card-row" style="gap:6px;margin-bottom:2px">${badge}${statusChip}</div>
      <div class="card-title">${escapeHtml(m.title)}</div>
      <div class="card-sub">${escapeHtml(m.subtitle)}${m.subtitle ? ' · ' : ''}${formatDistance(m.distanceKm)}</div>
      ${notes ? `<div class="card-notes">${escapeHtml(notes)}</div>` : ''}
      ${personalNote}
      ${confidenceFlag}
      <div class="card-actions">
        ${mapLinks}
        ${
          isFood
            ? `<button class="btn btn-sm ${raw.visited ? '' : 'btn-primary'}" id="nb-visit-${m.id}">${
                raw.visited ? 'Edit visit note' : 'Mark visited'
              }</button>
               <button class="btn btn-sm" id="nb-edit-${m.id}">Edit</button>`
            : `<button class="btn btn-sm ${raw.done ? '' : 'btn-primary'}" id="nb-done-${m.id}">${
                raw.done ? 'Mark not done' : 'Mark done'
              }</button>
               <button class="btn btn-sm" id="nb-schedule-${m.id}">Schedule this</button>`
        }
      </div>
    </div>
  `;
}

async function toggleDone(w) {
  await updateDoc(doc(db, 'wishlistItems', w.id), { done: !w.done });
}

function openVisitModal(f) {
  openModal(
    `
    <h2 class="modal-title">${escapeHtml(f.nameEn || f.nameKo || 'Food place')}</h2>
    <form id="visit-form">
      <div class="form-field">
        <label class="checkbox-pill" style="width:fit-content">
          <input type="checkbox" name="visited" ${f.visited ? 'checked' : ''}> Visited
        </label>
      </div>
      <div class="form-field">
        <label>Your notes / rating</label>
        <textarea name="personalNote">${escapeHtml(f.personalNote ?? '')}</textarea>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn" id="visit-cancel-btn">Cancel</button>
        <button type="submit" class="btn btn-primary">Save</button>
      </div>
    </form>
  `,
    (root) => {
      root.querySelector('#visit-cancel-btn').addEventListener('click', closeModal);
      root.querySelector('#visit-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        await updateDoc(doc(db, 'foodPlaces', f.id), {
          visited: fd.get('visited') === 'on',
          personalNote: fd.get('personalNote').trim(),
        });
        closeModal();
      });
    }
  );
}

function openFoodModal(f) {
  const isEdit = !!f;
  openModal(
    `
    <h2 class="modal-title">${isEdit ? 'Edit' : 'Add'} Food Place</h2>
    <form id="food-form">
      <div class="form-row">
        <div class="form-field"><label>Name (English)</label><input type="text" name="nameEn" value="${escapeHtml(f?.nameEn ?? '')}"></div>
        <div class="form-field"><label>Name (Korean)</label><input type="text" name="nameKo" value="${escapeHtml(f?.nameKo ?? '')}"></div>
      </div>
      <div class="form-row">
        <div class="form-field"><label>Neighborhood</label><input type="text" name="neighborhood" value="${escapeHtml(f?.neighborhood ?? '')}"></div>
        <div class="form-field"><label>Cuisine</label><input type="text" name="cuisine" value="${escapeHtml(f?.cuisine ?? '')}"></div>
      </div>
      <div class="form-row">
        <div class="form-field"><label>Price tier</label><input type="text" name="priceTier" placeholder="₩ – ₩₩₩₩" value="${escapeHtml(f?.priceTier ?? '')}"></div>
        <div class="form-field"><label>Source</label><input type="text" name="source" value="${escapeHtml(f?.source ?? '')}"></div>
      </div>
      <div class="form-field"><label>Notes</label><textarea name="notes">${escapeHtml(f?.notes ?? '')}</textarea></div>
      <div class="form-row">
        <div class="form-field"><label>Latitude</label><input type="number" step="0.000001" name="lat" value="${f?.lat ?? ''}"></div>
        <div class="form-field"><label>Longitude</label><input type="number" step="0.000001" name="lng" value="${f?.lng ?? ''}"></div>
      </div>
      <div style="margin-bottom:12px">
        <button type="button" class="btn btn-sm" id="food-use-location-btn">📍 Use my current location</button>
      </div>
      <div class="modal-actions">
        ${isEdit ? `<button type="button" class="btn btn-danger" id="food-delete-btn">Delete</button>` : ''}
        <button type="button" class="btn" id="food-cancel-btn">Cancel</button>
        <button type="submit" class="btn btn-primary">Save</button>
      </div>
    </form>
  `,
    (root) => {
      root.querySelector('#food-cancel-btn').addEventListener('click', closeModal);
      wireUseLocationButton(root, '#food-use-location-btn');
      if (isEdit) {
        root.querySelector('#food-delete-btn').addEventListener('click', async () => {
          if (confirm('Delete this food place?')) {
            await deleteDoc(doc(db, 'foodPlaces', f.id));
            closeModal();
          }
        });
      }
      root.querySelector('#food-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = {
          nameEn: fd.get('nameEn').trim(),
          nameKo: fd.get('nameKo').trim(),
          neighborhood: fd.get('neighborhood').trim(),
          cuisine: fd.get('cuisine').trim(),
          priceTier: fd.get('priceTier').trim(),
          source: fd.get('source').trim(),
          notes: fd.get('notes').trim(),
        };
        const lat = parseFloat(fd.get('lat'));
        const lng = parseFloat(fd.get('lng'));
        if (!Number.isNaN(lat)) data.lat = lat;
        if (!Number.isNaN(lng)) data.lng = lng;
        if (isEdit) {
          await updateDoc(doc(db, 'foodPlaces', f.id), data);
        } else {
          data.visited = false;
          data.personalNote = '';
          await addDoc(collection(db, 'foodPlaces'), data);
        }
        closeModal();
      });
    }
  );
}
