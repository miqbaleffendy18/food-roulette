// roulette.js — Spin logic, animation, tag filtering, history rendering

import * as Store from './store.js';

let selectedTags = new Set();
let isSpinning = false;
let currentFiltered = [];

/* ---------- DOM refs ---------- */
const filterChips   = document.getElementById('filter-chips');
const spinText      = document.getElementById('spin-text');
const btnSpin       = document.getElementById('btn-spin');
const resultCard    = document.getElementById('result-card');
const resultName    = document.getElementById('result-name');
const resultTags    = document.getElementById('result-tags');
const historyList   = document.getElementById('history-list');

/* ---------- Initialise ---------- */
export function init() {
  renderTagFilters();
  renderHistory();
  btnSpin.addEventListener('click', spin);
}

/* ---------- Re-render when data changes ---------- */
export function refresh() {
  renderTagFilters();
  renderHistory();
}

/* ---------- Tag filter chips ---------- */
function renderTagFilters() {
  const tags = Store.getAllTags();
  filterChips.innerHTML = '';
  tags.forEach(tag => {
    const chip = document.createElement('button');
    chip.className = 'chip' + (selectedTags.has(tag) ? ' selected' : '');
    chip.textContent = tag;
    chip.addEventListener('click', () => toggleTag(tag));
    filterChips.appendChild(chip);
  });
}

function toggleTag(tag) {
  if (selectedTags.has(tag)) selectedTags.delete(tag);
  else selectedTags.add(tag);
  renderTagFilters();
}

/* ---------- Spin ---------- */
function getFilteredRestos() {
  const all = Store.getAll();
  if (selectedTags.size === 0) return all;
  return all.filter(r => r.tags.some(t => selectedTags.has(t)));
}

async function spin() {
  if (isSpinning) return;

  currentFiltered = getFilteredRestos();
  if (currentFiltered.length === 0) {
    spinText.textContent = 'No restaurants match 😢';
    spinText.className = 'spin-display__text';
    return;
  }

  isSpinning = true;
  btnSpin.disabled = true;
  resultCard.classList.remove('visible');
  spinText.className = 'spin-display__text cycling';

  // Pick winner upfront
  const winner = currentFiltered[Math.floor(Math.random() * currentFiltered.length)];

  // Animate cycling names for ~2.5s
  const totalCycles = 25;
  for (let i = 0; i < totalCycles; i++) {
    const rand = currentFiltered[Math.floor(Math.random() * currentFiltered.length)];
    spinText.textContent = rand.name;
    // Slow down towards the end
    const delay = 60 + (i * i * 1.8);
    await wait(delay);
  }

  // Show winner
  spinText.textContent = winner.name;
  spinText.className = 'spin-display__text winner';

  // Show result card
  resultName.textContent = winner.name;
  resultTags.innerHTML = winner.tags.map(t => `<span class="tag">${escHtml(t)}</span>`).join('');
  resultCard.classList.add('visible');

  // Save to history
  Store.pushHistory(winner);
  renderHistory();

  isSpinning = false;
  btnSpin.disabled = false;
}

/* ---------- History ---------- */
function renderHistory() {
  const history = Store.getHistory();
  if (history.length === 0) {
    historyList.innerHTML = '<li class="history__item" style="justify-content:center;color:var(--text-muted);">No spins yet</li>';
    return;
  }
  historyList.innerHTML = history.map(h =>
    `<li class="history__item"><span>${escHtml(h.name)}</span><span>${h.time}</span></li>`
  ).join('');
}

/* ---------- Utils ---------- */
function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function escHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}
