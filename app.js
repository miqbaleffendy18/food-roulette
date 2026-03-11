// app.js — Main app entry, tab navigation, CRUD UI for Manage view

import * as Store from './store.js';
import * as Roulette from './roulette.js';

/* ---------- DOM refs ---------- */
const tabs        = document.querySelectorAll('.nav__tab');
const views       = document.querySelectorAll('.view');
const searchInput = document.getElementById('search-input');
const btnAdd      = document.getElementById('btn-add');
const restoList   = document.getElementById('resto-list');

// Modal
const modalOverlay = document.getElementById('modal-overlay');
const modalTitle   = document.getElementById('modal-title');
const modalName    = document.getElementById('modal-name');
const modalTags    = document.getElementById('modal-tags');
const modalSave    = document.getElementById('modal-save');
const modalCancel  = document.getElementById('modal-cancel');

// Confirm
const confirmOverlay = document.getElementById('confirm-overlay');
const confirmMsg     = document.getElementById('confirm-msg');
const confirmYes     = document.getElementById('confirm-yes');
const confirmNo      = document.getElementById('confirm-no');

let editingId = null;

/* ---------- Boot ---------- */
(async () => {
  await Store.seed();
  Roulette.init();
  renderRestoList();
  wireEvents();
})();

/* ---------- Tab switching ---------- */
function wireEvents() {
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.view;
      tabs.forEach(t => t.classList.toggle('active', t === tab));
      views.forEach(v => v.classList.toggle('active', v.id === target));
      if (target === 'roulette-view') Roulette.refresh();
      if (target === 'manage-view') renderRestoList();
    });
  });

  searchInput.addEventListener('input', renderRestoList);
  btnAdd.addEventListener('click', openAddModal);
  modalCancel.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
  confirmNo.addEventListener('click', closeConfirm);
  confirmOverlay.addEventListener('click', e => { if (e.target === confirmOverlay) closeConfirm(); });
  modalSave.addEventListener('click', handleSave);
}

/* ---------- Render resto list ---------- */
function renderRestoList() {
  const query = searchInput.value.trim().toLowerCase();
  let restos = Store.getAll();

  if (query) {
    restos = restos.filter(r =>
      r.name.toLowerCase().includes(query) ||
      r.tags.some(t => t.includes(query))
    );
  }

  if (restos.length === 0) {
    restoList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">🍽️</div>
        <p>${query ? 'No restaurants match your search.' : 'No restaurants yet — add one!'}</p>
      </div>`;
    return;
  }

  restoList.innerHTML = restos.map(r => `
    <div class="resto-card" data-id="${r.id}">
      <div class="resto-card__info">
        <div class="resto-card__name">${escHtml(r.name)}</div>
        <div class="resto-card__tags">
          ${r.tags.map(t => `<span class="tag">${escHtml(t)}</span>`).join('')}
        </div>
      </div>
      <div class="resto-card__actions">
        <button class="btn-icon btn-edit" title="Edit">✏️</button>
        <button class="btn-icon danger btn-delete" title="Delete">🗑️</button>
      </div>
    </div>
  `).join('');

  // Wire card buttons
  restoList.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.closest('.resto-card').dataset.id;
      openEditModal(id);
    });
  });

  restoList.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.resto-card');
      const id = card.dataset.id;
      const name = card.querySelector('.resto-card__name').textContent;
      openConfirm(id, name);
    });
  });
}

/* ---------- Modal ---------- */
function openAddModal() {
  editingId = null;
  modalTitle.textContent = 'Add Restaurant';
  modalName.value = '';
  modalTags.value = '';
  modalOverlay.classList.add('open');
  modalName.focus();
}

function openEditModal(id) {
  const r = Store.getById(id);
  if (!r) return;
  editingId = id;
  modalTitle.textContent = 'Edit Restaurant';
  modalName.value = r.name;
  modalTags.value = r.tags.join(', ');
  modalOverlay.classList.add('open');
  modalName.focus();
}

function closeModal() {
  modalOverlay.classList.remove('open');
  editingId = null;
}

function handleSave() {
  const name = modalName.value.trim();
  const tags = modalTags.value.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);

  if (!name) { modalName.focus(); return; }

  if (editingId) {
    Store.update(editingId, name, tags);
  } else {
    Store.add(name, tags);
  }

  closeModal();
  renderRestoList();
  Roulette.refresh();
}

/* ---------- Confirm dialog ---------- */
let confirmDeleteId = null;

function openConfirm(id, name) {
  confirmDeleteId = id;
  confirmMsg.textContent = `Delete "${name}"?`;
  confirmOverlay.classList.add('open');
}

function closeConfirm() {
  confirmOverlay.classList.remove('open');
  confirmDeleteId = null;
}

confirmYes.addEventListener('click', () => {
  if (confirmDeleteId) {
    Store.remove(confirmDeleteId);
    closeConfirm();
    renderRestoList();
    Roulette.refresh();
  }
});

/* ---------- Utils ---------- */
function escHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}
