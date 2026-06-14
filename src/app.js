// СтройКонтроль — app controller.
// Holds state, renders the active screen + overlays into #sk-app, and wires all
// interactions through delegated events. The signature canvas is managed
// imperatively so an in-progress drawing survives state changes.
import { seedHomes, STAGES, CATS, seedCrews, seedRequisites } from './data.js';
import { total, obligations, fmt } from './helpers.js';
import { listScreen, objectScreen, actScreen, fab, sheet, noteSheet, payoutSheet, settingsScreen, confirmDialog, toast } from './views.js';
import { initTour, getTourNode, startTour } from './tour.js';

// ── accessibility prefs (тема + размер шрифта), сохраняются в localStorage ──
const FONT_STEPS = { normal: '1', large: '1.18', xlarge: '1.4' };
function loadPref(key, fallback) {
  try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
}
function applyTheme(theme) {
  // 'auto' → снять атрибут (работает @media prefers-color-scheme); иначе зафиксировать
  if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme;
  else delete document.documentElement.dataset.theme;
  try { localStorage.setItem('sk-theme', theme); } catch {}
}
function applyFont(scaleKey) {
  document.documentElement.style.setProperty('--sk-fs', FONT_STEPS[scaleKey] || '1');
  try { localStorage.setItem('sk-fs', scaleKey); } catch {}
}

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
  payoutDraft: { homeId: null, crewId: null, crew: '', work: '', amount: '', date: '' },
  theme: loadPref('sk-theme', 'auto'),       // 'auto' | 'light' | 'dark'
  fontScale: loadPref('sk-fs', 'normal'),    // 'normal' | 'large' | 'xlarge'
  // ── администрирование (Настройки → Управление) ──
  settingsView: 'main',                      // 'main'|'objects'|'objectForm'|'crews'|'categories'|'stages'|'requisites'
  settingsReturn: { screen: 'list', homeId: null, tab: 'expenses' },
  objForm: null,                             // форма объекта (создание/редактирование)
  adminDraft: '',                            // поле «Добавить…» в списках-справочниках
  confirm: null,                             // { text, okLabel, yes }
  crewsDir: seedCrews(),                     // справочник постоянных бригад
  categories: [...CATS],                     // редактируемые категории расходов
  stagesTemplate: [...STAGES],               // шаблон этапов для новых объектов
  requisites: seedRequisites(),              // реквизиты исполнителя для актов
  homes: seedHomes(),
};

// применить сохранённые настройки до первого рендера (без вспышки)
applyTheme(state.theme);
applyFont(state.fontScale);

// ── transition tracking, so animations play once per appearance ──
let prevScreen = null;
let prevSheetOpen = false;
let prevNoteOpen = false;
let prevPayoutOpen = false;
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
    state.screen === 'settings' ? settingsScreen(state) :
    actScreen(state);

  const fx = {
    sheet: state.sheet === 'expense' && !prevSheetOpen,
    note: state.sheet === 'note' && !prevNoteOpen,
    payout: state.sheet === 'payout' && !prevPayoutOpen,
    fab: fabShown() && !prevFabShown,
    toast: !!state.toast && !prevToastShown,
  };

  app.innerHTML =
    `<div class="sk-scroll" id="sk-scroll">${screenHtml}</div>` +
    fab(state, fx.fab) + sheet(state, fx.sheet) + noteSheet(state, fx.note) +
    payoutSheet(state, fx.payout) + confirmDialog(state) + toast(state, fx.toast);

  scrollEl = document.getElementById('sk-scroll');
  if (scrollEl) scrollEl.scrollTop = prevScreen === state.screen ? prevTop : 0;

  if (state.screen === 'act') wireSignature();

  // re-attach tour overlay if it's still active (app.innerHTML wipes it)
  const tn = getTourNode();
  if (tn) app.appendChild(tn);

  prevScreen = state.screen;
  prevSheetOpen = state.sheet === 'expense';
  prevNoteOpen = state.sheet === 'note';
  prevPayoutOpen = state.sheet === 'payout';
  prevFabShown = fabShown();
  prevToastShown = !!state.toast;
}

function todayDDMM() {
  const n = new Date();
  return String(n.getDate()).padStart(2, '0') + '.' + String(n.getMonth() + 1).padStart(2, '0');
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
      const ink = getComputedStyle(document.documentElement).getPropertyValue('--text').trim() || '#1c1c1e';
      ctx.lineWidth = 2.6; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = ink;
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

function savePayout() {
  const d = state.payoutDraft;
  const amt = parseInt(String(d.amount || '').replace(/\D/g, ''), 10) || 0;
  if (!amt) { showToast('Введите сумму выплаты'); return; }
  const hid = d.homeId || state.homeId || state.homes[0].id;
  const work = (d.work || '').trim() || 'Работы';
  const crew = (d.crew || '').trim();
  const date = (d.date || '').trim() || todayDDMM();
  // выплата помечается linked: учитывается в себестоимости через связанный расход «Работа»
  const payout = { d: date, a: amt, linked: true };
  const exp = {
    id: 'e' + Date.now(), date, amount: amt, cat: 'Работа', paid: true, who: 'Г',
    text: 'ЗП: ' + work + (crew ? ' · ' + crew : ''),
  };
  state.homes = state.homes.map((h) => {
    if (h.id !== hid) return h;
    let crews = h.crews;
    const match = (d.crewId && crews.find((c) => c.id === d.crewId))
      || crews.find((c) => c.work.trim().toLowerCase() === work.toLowerCase());
    if (match) {
      crews = crews.map((c) => c === match
        ? { ...c, crew: c.crew || crew || null, payouts: [...c.payouts, payout] }
        : c);
    } else {
      crews = [...crews, { id: 'c' + Date.now(), crew: crew || null, work, agreed: null, payouts: [payout] }];
    }
    return { ...h, crews, expenses: [exp, ...h.expenses] };
  });
  state.sheet = null;
  showToast('Выплата сохранена · видит Таня');
}

function openAct() {
  const h = state.homes.find((x) => x.id === state.homeId);
  state.signed = false;
  const stages = h ? (h.stages || STAGES) : STAGES;
  state.act = { client: h && h.client ? h.client : '', object: h ? h.name : '', works: h ? stages[h.stageIndex] : '', sum: '' };
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
  openPayout: (el) => {
    const crewId = el && el.dataset.id ? el.dataset.id : null;
    const h = state.homes.find((x) => x.id === state.homeId);
    const c = crewId && h ? h.crews.find((x) => x.id === crewId) : null;
    state.sheet = 'payout';
    state.payoutDraft = {
      homeId: state.homeId, crewId,
      crew: c && c.crew ? c.crew : '',
      work: c ? c.work : '',
      amount: '', date: todayDDMM(),
    };
    render();
  },
  setPayoutCrew: (el) => { state.payoutDraft.crew = el.dataset.crew; render(); },
  savePayout,
  startTour: () => startTour(),

  // ── Настройки: навигация ──
  openSettings: () => {
    state.settingsReturn = { screen: state.screen, homeId: state.homeId, tab: state.tab };
    state.screen = 'settings'; state.settingsView = 'main'; state.sheet = null; render();
  },
  settingsBack: () => {
    if (state.settingsView === 'objectForm') state.settingsView = 'objects';
    else if (state.settingsView !== 'main') state.settingsView = 'main';
    else { const r = state.settingsReturn; state.screen = r.screen || 'list'; state.homeId = r.homeId; state.tab = r.tab || 'expenses'; }
    render();
  },
  settingsGo: (el) => { state.settingsView = el.dataset.view; state.adminDraft = ''; render(); },
  setTheme: (el) => { state.theme = el.dataset.theme; applyTheme(state.theme); render(); },
  setFontScale: (el) => { state.fontScale = el.dataset.scale; applyFont(state.fontScale); render(); },
  openReqFromAct: () => { state.settingsReturn = { screen: 'object', homeId: state.homeId, tab: state.tab }; state.screen = 'settings'; state.settingsView = 'requisites'; render(); },

  // ── Объекты (CRUD + архив) ──
  objAddNew: () => { state.objForm = { id: null, name: '', type: 'contract', client: '', price: '' }; state.settingsView = 'objectForm'; render(); },
  objEdit: (el) => {
    const h = state.homes.find((x) => x.id === el.dataset.id);
    if (!h) return;
    state.objForm = { id: h.id, name: h.name, type: h.type, client: h.client || '', price: h.price ? String(h.price) : '' };
    state.settingsView = 'objectForm'; render();
  },
  setObjType: (el) => { if (state.objForm) state.objForm.type = el.dataset.type; render(); },
  objSave: () => {
    const f = state.objForm; if (!f) return;
    const name = (f.name || '').trim();
    if (!name) { showToast('Введите название объекта'); return; }
    const price = parseInt(String(f.price || '').replace(/\D/g, ''), 10) || null;
    const client = f.type === 'contract' ? (f.client || '').trim() : null;
    if (f.id) {
      state.homes = state.homes.map((h) => h.id === f.id ? { ...h, name, short: name, type: f.type, client, price } : h);
    } else {
      state.homes = [...state.homes, {
        id: 'h' + Date.now(), name, short: name, address: '', type: f.type, client, price,
        base: 0, stageIndex: 0, expenses: [], crews: [], clientPayments: [], notes: [],
        stages: [...state.stagesTemplate], archived: false,
      }];
    }
    state.objForm = null; state.settingsView = 'objects'; showToast('Объект сохранён');
  },
  objArchiveToggle: (el) => {
    state.homes = state.homes.map((h) => h.id === el.dataset.id ? { ...h, archived: !h.archived } : h);
    render();
  },
  askObjDelete: (el) => {
    const h = state.homes.find((x) => x.id === el.dataset.id); if (!h) return;
    state.confirm = { text: `Удалить объект «${h.name}»? Данные объекта будут потеряны.`, okLabel: 'Удалить', yes: () => { state.homes = state.homes.filter((x) => x.id !== h.id); } };
    render();
  },

  // ── Справочники (бригады / категории / этапы) ──
  addAdminItem: (el) => {
    const store = el.dataset.store; const v = (state.adminDraft || '').trim();
    if (v) { state[store] = [...(state[store] || []), v]; state.adminDraft = ''; }
    render();
  },
  delAdminItem: (el) => {
    const store = el.dataset.store; const idx = +el.dataset.idx;
    state[store] = (state[store] || []).filter((_, i) => i !== idx);
    render();
  },
  setReqForm: (el) => { state.requisites.form = el.dataset.form; render(); },

  // ── Данные ──
  exportData: () => {
    const data = { homes: state.homes, crewsDir: state.crewsDir, categories: state.categories, stagesTemplate: state.stagesTemplate, requisites: state.requisites, exportedAt: new Date().toISOString() };
    try {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'stroykontrol-backup.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast('Резервная копия выгружена');
    } catch (e) { showToast('Не удалось выгрузить'); }
  },
  printSummary: () => {
    const rows = state.homes.filter((h) => !h.archived).map((h) =>
      `<tr><td>${h.name}</td><td style="text-align:right">${fmt(total(h))}</td><td style="text-align:right">${fmt(obligations(h))}</td></tr>`).join('');
    const win = window.open('', '_blank');
    if (!win) { showToast('Разрешите всплывающие окна для печати'); return; }
    win.document.write(`<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8"><title>СтройКонтроль — сводка</title></head><body style="font-family:-apple-system,system-ui,sans-serif;padding:24px;color:#1c1c1e"><h2>СтройКонтроль — сводка</h2><table cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%"><thead><tr style="border-bottom:2px solid #1c1c1e"><th style="text-align:left">Объект</th><th style="text-align:right">Себестоимость</th><th style="text-align:right">К оплате</th></tr></thead><tbody>${rows}</tbody></table><p style="color:#666;margin-top:16px">Сформировано: ${new Date().toLocaleString('ru-RU')}</p></body></html>`);
    win.document.close(); win.focus();
    setTimeout(() => { try { win.print(); } catch (e) {} }, 250);
  },
  askResetDemo: () => {
    state.confirm = { text: 'Сбросить все данные к исходному демонабору? Текущие изменения будут потеряны.', okLabel: 'Сбросить', yes: () => {
      state.homes = seedHomes(); state.crewsDir = seedCrews(); state.categories = [...CATS];
      state.stagesTemplate = [...STAGES]; state.requisites = seedRequisites();
      state.settingsView = 'main'; showToast('Демо-данные восстановлены');
    } };
    render();
  },
  confirmNo: () => { state.confirm = null; render(); },
  confirmYes: () => { const c = state.confirm; state.confirm = null; if (c && c.yes) c.yes(); render(); },
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
  } else if (kind === 'payout-amount') {
    const raw = el.value.replace(/\D/g, '').slice(0, 12);
    state.payoutDraft.amount = raw;
    el.value = raw ? Number(raw).toLocaleString('ru-RU') : '';
  } else if (kind === 'payout-crew') {
    state.payoutDraft.crew = el.value;
  } else if (kind === 'payout-work') {
    state.payoutDraft.work = el.value;
  } else if (kind === 'payout-date') {
    state.payoutDraft.date = el.value;
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
  } else if (kind === 'adminDraft') {
    state.adminDraft = el.value;
  } else if (kind === 'edit') {
    const store = el.dataset.store; const idx = +el.dataset.idx;
    if (state[store]) state[store] = state[store].map((it, i) => (i === idx ? el.value : it));
  } else if (kind === 'obj-name') {
    if (state.objForm) state.objForm.name = el.value;
  } else if (kind === 'obj-client') {
    if (state.objForm) state.objForm.client = el.value;
  } else if (kind === 'obj-price') {
    const raw = el.value.replace(/\D/g, '').slice(0, 12);
    if (state.objForm) state.objForm.price = raw;
    el.value = raw ? Number(raw).toLocaleString('ru-RU') : '';
  } else if (kind === 'req-name') {
    state.requisites.name = el.value;
  } else if (kind === 'req-inn') {
    state.requisites.inn = el.value;
  } else if (kind === 'req-extra') {
    state.requisites.extra = el.value;
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

// ── PWA: register SW; auto-reload once when a new version takes control ──
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  const hadController = !!navigator.serviceWorker.controller;
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // не перезагружаем при самой первой установке (контроллера ещё не было)
    if (reloading || !hadController) return;
    reloading = true;
    window.location.reload();
  });
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then((reg) => {
      // если новая версия уже ждёт — активировать сразу
      if (reg.waiting) reg.waiting.postMessage('skipWaiting');
      reg.addEventListener('updatefound', () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener('statechange', () => {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) sw.postMessage('skipWaiting');
        });
      });
    }).catch(() => {});
  });
}
