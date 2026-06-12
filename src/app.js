// СтройКонтроль — app controller.
// Holds state, renders the active screen + overlays into #sk-app, and wires all
// interactions through delegated events. The signature canvas is managed
// imperatively so an in-progress drawing survives state changes.
import { seedHomes, STAGES } from './data.js';
import { listScreen, objectScreen, actScreen, fab, sheet, noteSheet, toast } from './views.js';
import { initTour, getTourNode, startTour } from './tour.js';

const state = {
  screen: 'list',          // 'list' | 'object' | 'act'
  homeId: null,
  tab: 'expenses',
  notesOpen: false,        // раскрыта ли полоса заметок под себестоимостью
  sheet: null,             // 'expense' | 'note' | null
  toast: null,
  signed: false,
  act: { client: '', object: '', works: '', sum: '' },
  draft: { text: '', amount: '', category: null, homeId: null, paid: true, split: false, photo: false },
  noteDraft: { text: '', photo: false, homeId: null },
  homes: seedHomes(),
};

// ── transition tracking, so animations play once per appearance ──
let prevScreen = null;
let prevSheetOpen = false;
let prevNoteOpen = false;
let prevFabShown = false;
let prevToastShown = false;
let toastTimer = null;
let scrollEl = null;

const app = document.getElementById('sk-app');

function fabShown() {
  return (state.screen === 'list' || state.screen === 'object') && !state.sheet;
}

function render() {
  // preserve scroll position across re-renders (innerHTML swaps the node)
  const prevTop = scrollEl ? scrollEl.scrollTop : 0;

  const screenHtml =
    state.screen === 'list' ? listScreen(state) :
    state.screen === 'object' ? objectScreen(state) :
    actScreen(state);

  const fx = {
    sheet: state.sheet === 'expense' && !prevSheetOpen,
    note: state.sheet === 'note' && !prevNoteOpen,
    fab: fabShown() && !prevFabShown,
    toast: !!state.toast && !prevToastShown,
  };

  app.innerHTML =
    `<div class="sk-scroll" id="sk-scroll">${screenHtml}</div>` +
    fab(state, fx.fab) + sheet(state, fx.sheet) + noteSheet(state, fx.note) + toast(state, fx.toast);

  scrollEl = document.getElementById('sk-scroll');
  if (scrollEl) scrollEl.scrollTop = prevScreen === state.screen ? prevTop : 0;

  if (state.screen === 'act') wireSignature();

  // re-attach tour overlay if it's still active (app.innerHTML wipes it)
  const tn = getTourNode();
  if (tn) app.appendChild(tn);

  prevScreen = state.screen;
  prevSheetOpen = state.sheet === 'expense';
  prevNoteOpen = state.sheet === 'note';
  prevFabShown = fabShown();
  prevToastShown = !!state.toast;
}

function showToast(msg) {
  clearTimeout(toastTimer);
  state.toast = msg;
  render();
  toastTimer = setTimeout(() => { state.toast = null; render(); }, 2600);
}

// ─────────────────────────────────────────────
// Signature pad (imperative, survives re-renders)
// ─────────────────────────────────────────────
let sigCanvas = null;
function wireSignature() {
  const canvas = document.getElementById('sk-sig');
  if (!canvas) return;
  sigCanvas = canvas;
  let ctx = null, drawing = false, last = null;

  const sized = () => {
    const w = canvas.clientWidth || 300;
    const dpr = window.devicePixelRatio || 1;
    const tW = Math.round(w * dpr), tH = Math.round(150 * dpr);
    if (canvas.width !== tW || canvas.height !== tH) {
      canvas.width = tW; canvas.height = tH;
      ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineWidth = 2.6; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#1c1c1e';
    }
    if (!ctx) ctx = canvas.getContext('2d');
    return ctx;
  };
  const pos = (e) => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const start = (e) => {
    e.preventDefault();
    sized();
    drawing = true; last = pos(e);
    if (!state.signed) {
      state.signed = true; // flip without a full re-render so ink isn't wiped
      const ph = document.getElementById('sk-sig-ph');
      if (ph) ph.style.display = 'none';
      const btn = document.getElementById('sk-save-act');
      if (btn) btn.style.background = '#0a84ff';
    }
    try { canvas.setPointerCapture(e.pointerId); } catch (x) {}
  };
  const move = (e) => {
    if (!drawing) return;
    e.preventDefault();
    const p = pos(e);
    ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke();
    last = p;
  };
  const end = () => { drawing = false; };
  canvas.addEventListener('pointerdown', start);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
}

// ─────────────────────────────────────────────
// Actions
// ─────────────────────────────────────────────
function openSheet(hid) {
  state.sheet = 'expense';
  state.draft = {
    text: '', amount: '', category: null,
    homeId: hid || state.homeId || state.homes[0].id,
    paid: true, split: false, photo: false,
  };
  render();
}

function saveExpense() {
  const d = state.draft;
  const amt = parseInt((d.amount || '').replace(/\D/g, ''), 10) || 0;
  const hid = d.homeId || state.homes[0].id;
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const exp = {
    id: 'e' + Date.now(), date: dd + '.' + mm,
    text: (d.text || '').trim() || 'Без описания',
    amount: amt, cat: d.category, paid: d.paid, who: 'Г', photo: d.photo, split: d.split,
  };
  state.homes = state.homes.map((h) => h.id === hid ? { ...h, expenses: [exp, ...h.expenses] } : h);
  state.sheet = null;
  showToast('Сохранено · видит Таня');
}

function openNote() {
  state.sheet = 'note';
  state.noteDraft = { text: '', photo: false, homeId: state.homeId };
  render();
}

function saveNote() {
  const d = state.noteDraft;
  const hid = d.homeId || state.homeId || state.homes[0].id;
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const note = {
    id: 'n' + Date.now(), date: dd + '.' + mm,
    text: (d.text || '').trim() || 'Без текста', photo: d.photo,
  };
  state.homes = state.homes.map((h) => h.id === hid ? { ...h, notes: [note, ...(h.notes || [])] } : h);
  state.sheet = null;
  showToast('Заметка сохранена · видит Таня');
}

function openAct() {
  const h = state.homes.find((x) => x.id === state.homeId);
  state.signed = false;
  state.act = { client: '', object: h ? h.name : '', works: h ? STAGES[h.stageIndex] : '', sum: '' };
  state.screen = 'act';
  render();
}

const actions = {
  openHome: (el) => { state.screen = 'object'; state.homeId = el.dataset.id; state.tab = 'expenses'; state.notesOpen = false; render(); },
  toggleNotes: () => { state.notesOpen = !state.notesOpen; render(); },
  togglePin: (el) => {
    const id = el.dataset.id;
    state.homes = state.homes.map((h) => h.id === state.homeId
      ? { ...h, notes: (h.notes || []).map((n) => ({ ...n, pinned: n.id === id ? !n.pinned : false })) }
      : h);
    render();
  },
  back: () => { state.screen = 'list'; render(); },
  setTab: (el) => { state.tab = el.dataset.tab; render(); },
  openFab: () => openSheet(state.screen === 'object' ? state.homeId : null),
  closeSheet: () => { state.sheet = null; render(); },
  setDraftHome: (el) => { state.draft.homeId = el.dataset.id; render(); },
  setCategory: (el) => { const c = el.dataset.cat; state.draft.category = state.draft.category === c ? null : c; render(); },
  setPaid: (el) => { state.draft.paid = el.dataset.paid === 'true'; render(); },
  toggleSplit: () => { state.draft.split = !state.draft.split; render(); },
  togglePhoto: () => { state.draft.photo = !state.draft.photo; render(); },
  saveExpense,
  openNote,
  saveNote,
  toggleNotePhoto: () => { state.noteDraft.photo = !state.noteDraft.photo; render(); },
  openAct,
  closeAct: () => { state.screen = 'object'; render(); },
  saveAct: () => { state.screen = 'object'; render(); showToast('Акт сохранён · PDF на почту'); },
  clearSig: () => { if (sigCanvas) { const cx = sigCanvas.getContext('2d'); cx.clearRect(0, 0, sigCanvas.width, sigCanvas.height); } state.signed = false; render(); },
  addPayout: () => showToast('Скоро: добавление выплаты'),
  startTour: () => startTour(),
};

// ── click delegation ──
app.addEventListener('click', (e) => {
  const t = e.target.closest('[data-action]');
  if (!t) return;
  const fn = actions[t.dataset.action];
  if (fn) fn(t);
});

// ── input delegation (no full re-render: keeps caret/focus) ──
app.addEventListener('input', (e) => {
  const el = e.target;
  const kind = el.dataset.input;
  if (!kind) return;
  if (kind === 'amount') {
    const raw = el.value.replace(/\D/g, '').slice(0, 12);
    state.draft.amount = raw;
    el.value = raw ? Number(raw).toLocaleString('ru-RU') : '';
  } else if (kind === 'text') {
    state.draft.text = el.value;
  } else if (kind === 'note-text') {
    state.noteDraft.text = el.value;
  } else if (kind === 'act-sum') {
    const raw = el.value.replace(/\D/g, '').slice(0, 12);
    state.act.sum = raw ? Number(raw).toLocaleString('ru-RU') : '';
    el.value = state.act.sum;
  } else if (kind === 'act-client') {
    state.act.client = el.value;
  } else if (kind === 'act-object') {
    state.act.object = el.value;
  } else if (kind === 'act-works') {
    state.act.works = el.value;
  }
});

render();

// ─────────────────────────────────────────────
// Demo onboarding tour — drives the real app along the demo script.
// ─────────────────────────────────────────────
const DEMO_HOME = 'lesnoy'; // договорной дом ~87% — на нём срабатывает баннер бюджета

function tourOpenSheet() {
  // открыть форму расхода уже заполненной — под подсказку «бетон 26 кубов 312000»
  state.sheet = 'expense';
  state.draft = { text: 'бетон, 26 кубов', amount: '312000', category: 'Материалы', homeId: DEMO_HOME, paid: true, split: false, photo: true };
  render();
}

function tourSaveDemo() {
  // идемпотентно: один демо-расход, чтобы повторный запуск тура не плодил записи
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const exp = { id: 'tour-demo', date: dd + '.' + mm, text: 'Бетон М300, 26 м³', amount: 312000, cat: 'Материалы', paid: true, who: 'Г', photo: true };
  state.homes = state.homes.map((h) =>
    h.id === DEMO_HOME ? { ...h, expenses: [exp, ...h.expenses.filter((e) => e.id !== 'tour-demo')] } : h);
  state.sheet = null;
  state.screen = 'object';
  state.homeId = DEMO_HOME;
  state.tab = 'expenses';
  state.notesOpen = false;
  showToast('Сохранено · видит Таня');
}

initTour(app, {
  goList: () => { state.screen = 'list'; state.sheet = null; state.homeId = null; render(); },
  openSheet: tourOpenSheet,
  saveDemo: tourSaveDemo,
  openHome: (id, tab) => { state.screen = 'object'; state.sheet = null; state.homeId = id; state.tab = tab || 'expenses'; state.notesOpen = false; render(); },
  setTab: (k) => { state.tab = k; render(); },
});

// ── PWA: register the offline service worker when served over http(s) ──
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
