// store.js — localStorage CRUD for restaurants & spin history

const STORE_KEY = 'food_roulette_restos';
const HISTORY_KEY = 'food_roulette_history';
const SEED_FLAG = 'food_roulette_seeded';

/* ---------- Helpers ---------- */
function uuid() {
  return crypto.randomUUID?.() ??
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

function read(key) {
  try { return JSON.parse(localStorage.getItem(key)); }
  catch { return null; }
}

function write(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

/* ---------- Seed from resto.json ---------- */
export async function seed() {
  if (localStorage.getItem(SEED_FLAG)) return;
  try {
    const res = await fetch('resto.json');
    const list = await res.json();
    const restos = list.map(r => ({ id: uuid(), name: r.name, tags: r.tags }));
    write(STORE_KEY, restos);
    localStorage.setItem(SEED_FLAG, 'true');
  } catch (err) {
    console.error('Failed to seed data:', err);
  }
}

/* ---------- CRUD ---------- */
export function getAll() {
  return read(STORE_KEY) || [];
}

export function getById(id) {
  return getAll().find(r => r.id === id) || null;
}

export function add(name, tags) {
  const list = getAll();
  const resto = { id: uuid(), name: name.trim(), tags: tags.map(t => t.trim().toLowerCase()).filter(Boolean) };
  list.push(resto);
  write(STORE_KEY, list);
  return resto;
}

export function update(id, name, tags) {
  const list = getAll();
  const idx = list.findIndex(r => r.id === id);
  if (idx === -1) return null;
  list[idx].name = name.trim();
  list[idx].tags = tags.map(t => t.trim().toLowerCase()).filter(Boolean);
  write(STORE_KEY, list);
  return list[idx];
}

export function remove(id) {
  const list = getAll().filter(r => r.id !== id);
  write(STORE_KEY, list);
  // also remove from history
  const history = getHistory().filter(h => h.id !== id);
  write(HISTORY_KEY, history);
}

/* ---------- All unique tags ---------- */
export function getAllTags() {
  const set = new Set();
  getAll().forEach(r => r.tags.forEach(t => set.add(t)));
  return [...set].sort();
}

/* ---------- History ---------- */
const MAX_HISTORY = 10;

export function getHistory() {
  return read(HISTORY_KEY) || [];
}

export function pushHistory(resto) {
  const list = getHistory();
  list.unshift({ id: resto.id, name: resto.name, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
  if (list.length > MAX_HISTORY) list.length = MAX_HISTORY;
  write(HISTORY_KEY, list);
}
