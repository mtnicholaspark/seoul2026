import { db } from './firebase-config.js';
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js';
import { escapeHtml, formatDayHeader, openModal, closeModal, wireUseLocationButton } from './utils.js';
import { openPromoteModal } from './calendar.js';

export const CATEGORY_LABELS = {
  cafe: 'Animal Cafés',
  park: 'Parks & Nature',
  'theme-park': 'Theme Parks',
  trip: 'Day / Overnight Trips',
  museum: 'Museums & Culture',
  shopping: 'Shopping',
  photobooth: 'Photobooths',
  wellness: 'Wellness & Beauty',
  landmark: 'Landmarks & Views',
  other: 'Other',
};

let items = [];
let unsubscribe = null;
let groupBy = 'category'; // 'category' | 'neighborhood'

export function initWishlistTab() {
  const container = document.getElementById('wishlist-tab');
  container.innerHTML = `
    <div class="segmented" id="wishlist-groupby">
      <button data-group="category" class="active">By Category</button>
      <button data-group="neighborhood">By Neighborhood</button>
    </div>
    <div id="wishlist-list"></div>
    <button class="fab" id="wishlist-add-btn" aria-label="Add wishlist item">+</button>
  `;
  document.getElementById('wishlist-add-btn').addEventListener('click', () => openEditModal(null));
  container.querySelectorAll('#wishlist-groupby button').forEach((btn) => {
    btn.addEventListener('click', () => {
      groupBy = btn.dataset.group;
      container.querySelectorAll('#wishlist-groupby button').forEach((b) => b.classList.toggle('active', b === btn));
      render();
    });
  });

  if (unsubscribe) unsubscribe();
  unsubscribe = onSnapshot(
    collection(db, 'wishlistItems'),
    (snap) => {
      items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      render();
    },
    (err) => console.error('wishlistItems snapshot error', err)
  );
}

function render() {
  const listEl = document.getElementById('wishlist-list');
  if (!listEl) return;
  if (items.length === 0) {
    listEl.innerHTML = `<div class="empty-state">No wishlist items yet. Tap + to add one.</div>`;
    return;
  }

  let groups, order, labelFor;
  if (groupBy === 'neighborhood') {
    groups = {};
    items.forEach((item) => {
      const key = item.neighborhood?.trim() || 'Unspecified';
      (groups[key] = groups[key] || []).push(item);
    });
    order = Object.keys(groups).sort((a, b) => (a === 'Unspecified' ? 1 : b === 'Unspecified' ? -1 : a.localeCompare(b)));
    labelFor = (key) => key;
  } else {
    groups = {};
    items.forEach((item) => {
      const cat = item.category && CATEGORY_LABELS[item.category] ? item.category : 'other';
      (groups[cat] = groups[cat] || []).push(item);
    });
    order = Object.keys(CATEGORY_LABELS).filter((c) => groups[c]);
    labelFor = (key) => CATEGORY_LABELS[key];
  }

  listEl.innerHTML = order
    .map(
      (key) => `
    <div class="section-title">${escapeHtml(labelFor(key))}</div>
    ${groups[key]
      .sort((a, b) => a.title.localeCompare(b.title))
      .map(renderCard)
      .join('')}
  `
    )
    .join('');

  items.forEach((item) => {
    const editBtn = listEl.querySelector(`#wl-edit-${item.id}`);
    if (editBtn) editBtn.addEventListener('click', () => openEditModal(item));
    const scheduleBtn = listEl.querySelector(`#wl-schedule-${item.id}`);
    if (scheduleBtn) scheduleBtn.addEventListener('click', () => openPromoteModal(item));
  });
}

function renderCard(item) {
  const scheduledBadge = item.scheduled
    ? `<span class="chip chip-muted">Scheduled${item.scheduledDate ? `: ${formatDayHeader(item.scheduledDate)}` : ''}</span>`
    : '';
  const confidenceFlag =
    item.confidence && item.confidence !== 'verified'
      ? `<div class="confidence-flag">⚠️ ${escapeHtml(item.confidence)}${item.flagNote ? `: ${escapeHtml(item.flagNote)}` : ''}</div>`
      : '';
  const subBits = [item.hours, item.cost, item.bestTime].filter(Boolean).map(escapeHtml).join(' · ');
  return `
    <div class="card">
      <div class="card-row">
        <div class="card-title">${escapeHtml(item.title)}</div>
        ${scheduledBadge}
      </div>
      ${subBits ? `<div class="card-sub">${subBits}</div>` : ''}
      ${item.notes ? `<div class="card-notes">${escapeHtml(item.notes)}</div>` : ''}
      ${item.travelFromGangnam ? `<div class="card-notes">🚇 ${escapeHtml(item.travelFromGangnam)}</div>` : ''}
      ${item.tips ? `<div class="card-notes">💡 ${escapeHtml(item.tips)}</div>` : ''}
      ${confidenceFlag}
      <div class="card-actions">
        ${!item.scheduled ? `<button class="btn btn-sm btn-primary" id="wl-schedule-${item.id}">Schedule this</button>` : ''}
        <button class="btn btn-sm" id="wl-edit-${item.id}">Edit</button>
      </div>
    </div>
  `;
}

function openEditModal(item) {
  const isEdit = !!item;
  openModal(
    `
    <h2 class="modal-title">${isEdit ? 'Edit' : 'Add'} Wishlist Item</h2>
    <form id="wishlist-form">
      <div class="form-field">
        <label>Title</label>
        <input type="text" name="title" required value="${escapeHtml(item?.title ?? '')}">
      </div>
      <div class="form-field">
        <label>Category</label>
        <select name="category">
          ${Object.entries(CATEGORY_LABELS)
            .map(([k, l]) => `<option value="${k}" ${item?.category === k ? 'selected' : ''}>${l}</option>`)
            .join('')}
        </select>
      </div>
      <div class="form-field">
        <label>Neighborhood</label>
        <input type="text" name="neighborhood" placeholder="e.g. Hongdae, Gangnam-gu" value="${escapeHtml(item?.neighborhood ?? '')}">
      </div>
      <div class="form-field">
        <label>Notes</label>
        <textarea name="notes">${escapeHtml(item?.notes ?? '')}</textarea>
      </div>
      <div class="form-row">
        <div class="form-field"><label>Hours</label><input type="text" name="hours" value="${escapeHtml(item?.hours ?? '')}"></div>
        <div class="form-field"><label>Cost</label><input type="text" name="cost" value="${escapeHtml(item?.cost ?? '')}"></div>
      </div>
      <div class="form-field"><label>Best time to go</label><input type="text" name="bestTime" value="${escapeHtml(item?.bestTime ?? '')}"></div>
      <div class="form-field"><label>Travel from Gangnam</label><input type="text" name="travelFromGangnam" value="${escapeHtml(item?.travelFromGangnam ?? '')}"></div>
      <div class="form-field"><label>Tips</label><textarea name="tips">${escapeHtml(item?.tips ?? '')}</textarea></div>
      <div class="form-row">
        <div class="form-field"><label>Latitude</label><input type="number" step="0.000001" name="lat" value="${item?.lat ?? ''}"></div>
        <div class="form-field"><label>Longitude</label><input type="number" step="0.000001" name="lng" value="${item?.lng ?? ''}"></div>
      </div>
      <div style="margin-bottom:12px">
        <button type="button" class="btn btn-sm" id="wl-use-location-btn">📍 Use my current location</button>
      </div>
      <div class="modal-actions">
        ${isEdit ? `<button type="button" class="btn btn-danger" id="wl-delete-btn">Delete</button>` : ''}
        <button type="button" class="btn" id="wl-cancel-btn">Cancel</button>
        <button type="submit" class="btn btn-primary">Save</button>
      </div>
    </form>
  `,
    (root) => {
      root.querySelector('#wl-cancel-btn').addEventListener('click', closeModal);
      wireUseLocationButton(root, '#wl-use-location-btn');
      if (isEdit) {
        root.querySelector('#wl-delete-btn').addEventListener('click', async () => {
          if (confirm('Delete this wishlist item?')) {
            await deleteDoc(doc(db, 'wishlistItems', item.id));
            closeModal();
          }
        });
      }
      root.querySelector('#wishlist-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = {
          title: fd.get('title').trim(),
          category: fd.get('category'),
          neighborhood: fd.get('neighborhood').trim(),
          notes: fd.get('notes').trim(),
          hours: fd.get('hours').trim(),
          cost: fd.get('cost').trim(),
          bestTime: fd.get('bestTime').trim(),
          travelFromGangnam: fd.get('travelFromGangnam').trim(),
          tips: fd.get('tips').trim(),
        };
        const lat = parseFloat(fd.get('lat'));
        const lng = parseFloat(fd.get('lng'));
        if (!Number.isNaN(lat)) data.lat = lat;
        if (!Number.isNaN(lng)) data.lng = lng;
        if (isEdit) {
          await updateDoc(doc(db, 'wishlistItems', item.id), data);
        } else {
          data.scheduled = false;
          await addDoc(collection(db, 'wishlistItems'), data);
        }
        closeModal();
      });
    }
  );
}
