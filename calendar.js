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
  TRAVELERS,
  TRIP_START,
  TRIP_END,
  dateRange,
  formatDayHeader,
  formatTime,
  isVisitingWindow,
  escapeHtml,
  openModal,
  closeModal,
} from './utils.js';

let items = [];
let unsubscribe = null;
const ALL_DATES = dateRange(TRIP_START, TRIP_END);

export function initCalendarTab() {
  const container = document.getElementById('calendar-tab');
  container.innerHTML = `
    <div id="calendar-days"></div>
    <button class="fab" id="cal-add-btn" aria-label="Add calendar item">+</button>
  `;
  document.getElementById('cal-add-btn').addEventListener('click', () => openItemModal(null));

  if (unsubscribe) unsubscribe();
  unsubscribe = onSnapshot(
    collection(db, 'itineraryItems'),
    (snap) => {
      items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      render();
    },
    (err) => console.error('itineraryItems snapshot error', err)
  );
}

function itemSpanDates(item) {
  const start = item.date;
  const end = item.endDate && item.endDate > item.date ? item.endDate : item.date;
  return dateRange(start, end);
}

function render() {
  const host = document.getElementById('calendar-days');
  if (!host) return;

  const byDate = {};
  items.forEach((item) => {
    const spanDates = itemSpanDates(item);
    spanDates.forEach((d, idx) => {
      if (!byDate[d]) byDate[d] = [];
      byDate[d].push({ item, dayIndex: idx + 1, totalDays: spanDates.length });
    });
  });

  host.innerHTML = ALL_DATES.map((dateStr) => {
    const dayItems = (byDate[dateStr] || []).sort((a, b) =>
      (a.item.startTime || '99:99').localeCompare(b.item.startTime || '99:99')
    );
    const banded = isVisitingWindow(dateStr);
    return `
      <div class="day-section ${banded ? 'in-visiting-window' : ''}">
        <div class="day-header">
          <span class="day-header-date">${formatDayHeader(dateStr)}</span>
          ${banded ? '<span class="day-header-badge">Gary &amp; JiHee here</span>' : ''}
        </div>
        ${
          dayItems.length === 0
            ? '<div class="day-empty">Nothing scheduled</div>'
            : dayItems.map(({ item, dayIndex, totalDays }) => renderItemRow(item, dayIndex, totalDays)).join('')
        }
      </div>
    `;
  }).join('');

  items.forEach((item) => {
    const row = host.querySelector(`[data-item-id="${item.id}"]`);
    if (row) row.addEventListener('click', () => openItemModal(item));
  });
}

function renderItemRow(item, dayIndex, totalDays) {
  const timeLabel =
    item.startTime && item.endTime
      ? `${formatTime(item.startTime)}–${formatTime(item.endTime)}`
      : item.startTime
      ? formatTime(item.startTime)
      : '';
  const assigned = (item.assignedTo || []).filter((t) => TRAVELERS[t]);
  const multiDayLabel = totalDays > 1 ? `Day ${dayIndex}/${totalDays}` : '';
  return `
    <div class="item-row" data-item-id="${item.id}">
      <div class="item-time">${escapeHtml(timeLabel || multiDayLabel || '')}</div>
      <div class="item-body">
        <div class="item-title ${item.status === 'tentative' ? 'tentative' : ''}">${escapeHtml(item.title)}${
          totalDays > 1 && timeLabel ? ` <span class="card-sub">(${multiDayLabel})</span>` : ''
        }</div>
        ${item.location ? `<div class="item-loc">📍 ${escapeHtml(item.location)}</div>` : ''}
        <div class="item-tags">
          ${assigned
            .map(
              (t) =>
                `<span class="chip"><span class="chip-dot" style="background:${TRAVELERS[t].color}"></span>${TRAVELERS[t].name}</span>`
            )
            .join('')}
          ${item.status === 'tentative' ? '<span class="chip chip-warn">Tentative</span>' : ''}
        </div>
      </div>
    </div>
  `;
}

function itemFormHtml(item, { prefillTitle, prefillNotes, prefillDate, forcedNote } = {}) {
  const isEdit = !!item;
  const travelerOptions = Object.entries(TRAVELERS);
  const assigned = item?.assignedTo || [];
  return `
    <h2 class="modal-title">${isEdit ? 'Edit' : 'Add'} Calendar Item</h2>
    ${forcedNote ? `<div class="card-notes" style="margin-bottom:12px">${escapeHtml(forcedNote)}</div>` : ''}
    <form id="cal-form">
      <div class="form-field">
        <label>Title</label>
        <input type="text" name="title" required value="${escapeHtml(item?.title ?? prefillTitle ?? '')}">
      </div>
      <div class="form-row">
        <div class="form-field">
          <label>Date</label>
          <input type="date" name="date" required min="${TRIP_START}" max="${TRIP_END}" value="${item?.date ?? prefillDate ?? ''}">
        </div>
        <div class="form-field">
          <label>End date (multi-day)</label>
          <input type="date" name="endDate" min="${TRIP_START}" max="${TRIP_END}" value="${item?.endDate ?? ''}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-field">
          <label>Start time</label>
          <input type="time" name="startTime" value="${item?.startTime ?? ''}">
        </div>
        <div class="form-field">
          <label>End time</label>
          <input type="time" name="endTime" value="${item?.endTime ?? ''}">
        </div>
      </div>
      <div class="form-field">
        <label>Location</label>
        <input type="text" name="location" value="${escapeHtml(item?.location ?? '')}">
      </div>
      <div class="form-field">
        <label>Notes</label>
        <textarea name="notes">${escapeHtml(item?.notes ?? prefillNotes ?? '')}</textarea>
      </div>
      <div class="form-field">
        <label>Who's it for</label>
        <div class="checkbox-group">
          ${travelerOptions
            .map(
              ([key, t]) => `
            <label class="checkbox-pill">
              <input type="checkbox" name="assignedTo" value="${key}" ${assigned.includes(key) ? 'checked' : ''}>
              ${t.name}
            </label>`
            )
            .join('')}
        </div>
      </div>
      <div class="form-field">
        <label>Status</label>
        <select name="status">
          <option value="confirmed" ${(item?.status ?? 'confirmed') === 'confirmed' ? 'selected' : ''}>Confirmed</option>
          <option value="tentative" ${item?.status === 'tentative' ? 'selected' : ''}>Tentative</option>
        </select>
      </div>
      <div class="modal-actions">
        ${isEdit ? `<button type="button" class="btn btn-danger" id="cal-delete-btn">Delete</button>` : ''}
        <button type="button" class="btn" id="cal-cancel-btn">Cancel</button>
        <button type="submit" class="btn btn-primary">Save</button>
      </div>
    </form>
  `;
}

function openItemModal(item) {
  const isEdit = !!item;
  openModal(itemFormHtml(item), (root) => {
    root.querySelector('#cal-cancel-btn').addEventListener('click', closeModal);
    if (isEdit) {
      root.querySelector('#cal-delete-btn').addEventListener('click', async () => {
        if (confirm('Delete this calendar item?')) {
          await deleteDoc(doc(db, 'itineraryItems', item.id));
          closeModal();
        }
      });
    }
    root.querySelector('#cal-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = readItemForm(e.target);
      if (isEdit) {
        await updateDoc(doc(db, 'itineraryItems', item.id), data);
      } else {
        await addDoc(collection(db, 'itineraryItems'), data);
      }
      closeModal();
    });
  });
}

function readItemForm(form) {
  const fd = new FormData(form);
  const data = {
    title: fd.get('title').trim(),
    date: fd.get('date'),
    startTime: fd.get('startTime') || null,
    endTime: fd.get('endTime') || null,
    location: fd.get('location').trim(),
    notes: fd.get('notes').trim(),
    assignedTo: fd.getAll('assignedTo'),
    status: fd.get('status'),
  };
  const endDate = fd.get('endDate');
  if (endDate && endDate > data.date) data.endDate = endDate;
  return data;
}

// Called from wishlist.js ("Schedule this") and nearby.js (activity card shortcut).
// Opens the same add/edit modal pre-filled from a wishlist item; on save, creates the
// itinerary item AND flips the source wishlist item to scheduled so it drops off the
// Nearby feed and shows a "Scheduled" badge in the Wishlist tab.
export function openPromoteModal(wishlistItem) {
  openModal(
    itemFormHtml(null, {
      prefillTitle: wishlistItem.title,
      prefillNotes: [wishlistItem.notes, wishlistItem.tips].filter(Boolean).join('\n\n'),
      forcedNote: `Scheduling from Wishlist — pick a date to move "${wishlistItem.title}" onto the calendar.`,
    }),
    (root) => {
      root.querySelector('#cal-cancel-btn').addEventListener('click', closeModal);
      root.querySelector('#cal-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = readItemForm(e.target);
        data.sourceWishlistId = wishlistItem.id;
        await addDoc(collection(db, 'itineraryItems'), data);
        await updateDoc(doc(db, 'wishlistItems', wishlistItem.id), {
          scheduled: true,
          scheduledDate: data.date,
        });
        closeModal();
      });
    }
  );
}
