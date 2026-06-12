// Interactive onboarding tour — shown once on first launch.
// Navigates through screens as part of the tour by calling app-provided fns.
// After each app render(), app.js re-attaches getTourNode() to keep tour visible.

const STORAGE_KEY = 'sk-tour-v1';
const CARD_H = 216;
const PAD = 10;

let _appEl = null;
let _fns = {};
let currentStep = 0;
let tourEl = null;

// onBeforeNext: called when the user clicks "Далее" on this step, before rendering the next.
// It can trigger navigation (which calls app render()), so tourEl must be nulled first.
const STEPS = [
  {
    title: 'Добро пожаловать!',
    body: 'СтройКонтроль — учёт стройки для семейного бизнеса: расходы, бригады, этапы и акты.',
  },
  {
    title: 'Общая себестоимость',
    body: 'Суммарные затраты по всем объектам и сколько ещё не оплачено поставщикам.',
    targetId: 'sk-tour-summary',
  },
  {
    title: 'Карточка объекта',
    body: 'Нажмём — откроются расходы, бригады, этапы и оплаты клиента.',
    targetId: 'sk-tour-card',
    onBeforeNext: () => {
      const el = document.getElementById('sk-tour-card');
      if (el) _fns.openHome(el.dataset.id);
    },
  },
  {
    title: 'Список расходов',
    body: 'Все траты: сумма, категория, дата и кто внёс. Красным — ещё не оплачено поставщику.',
    targetId: 'sk-tour-expenses',
  },
  {
    title: 'Расходы · Бригады · Этапы',
    body: 'Переключайтесь между вкладками: договорённости с бригадами, статус этапов и акты.',
    targetId: 'sk-tour-tabs',
  },
  {
    title: '+ Расход',
    body: 'Кнопка для добавления любой траты. Откроем форму.',
    targetId: 'sk-fab-btn',
    onBeforeNext: () => _fns.openSheet(),
  },
  {
    title: 'Форма расхода',
    body: 'Введите сумму и описание — категория необязательна. Расход сразу увидит второй участник.',
    targetId: 'sk-tour-amount',
    forceCardAt: 'top',
  },
];

function isDone() {
  try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch { return false; }
}

function markDone() {
  try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
}

function getRelRect(id) {
  if (!id || !_appEl) return null;
  const el = document.getElementById(id);
  if (!el) return null;
  const a = _appEl.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  return { top: r.top - a.top, left: r.left - a.left, bottom: r.bottom - a.top, right: r.right - a.left };
}

function renderTour() {
  if (tourEl) { tourEl.remove(); tourEl = null; }

  const s = STEPS[currentStep];
  const appH = _appEl.offsetHeight;
  const appW = _appEl.offsetWidth;
  const rect = s.targetId ? getRelRect(s.targetId) : null;
  const isLast = currentStep === STEPS.length - 1;

  // card placement: forced → use it; no target → centered; target low → card at top; else → bottom
  const cardAt = s.forceCardAt
    || (!rect ? 'center' : rect.top > appH * 0.55 ? 'top' : 'bottom');

  const ov = 'position:absolute;background:rgba(0,0,0,0.5);pointer-events:none;';
  let overlayHtml = '';
  let ringHtml = '';

  if (cardAt === 'center') {
    overlayHtml = `<div style="${ov}inset:0"></div>`;
  } else if (rect) {
    const t = Math.max(0, rect.top - PAD);
    const b = Math.min(appH, rect.bottom + PAD);
    const l = Math.max(0, rect.left - PAD);
    const r = Math.min(appW, rect.right + PAD);
    if (cardAt === 'bottom') {
      overlayHtml = `
        <div style="${ov}top:0;left:0;right:0;height:${t}px"></div>
        <div style="${ov}top:${b}px;left:0;right:0;height:${Math.max(0, appH - CARD_H - b)}px"></div>
        <div style="${ov}top:${t}px;left:0;width:${l}px;height:${b - t}px"></div>
        <div style="${ov}top:${t}px;left:${r}px;right:0;height:${b - t}px"></div>`;
    } else {
      overlayHtml = `
        <div style="${ov}top:${CARD_H}px;left:0;right:0;height:${Math.max(0, t - CARD_H)}px"></div>
        <div style="${ov}top:${b}px;left:0;right:0;bottom:0"></div>
        <div style="${ov}top:${t}px;left:0;width:${l}px;height:${b - t}px"></div>
        <div style="${ov}top:${t}px;left:${r}px;right:0;height:${b - t}px"></div>`;
    }
    ringHtml = `<div style="position:absolute;top:${t}px;left:${l}px;width:${r - l}px;height:${b - t}px;border-radius:18px;box-shadow:0 0 0 2px rgba(255,255,255,0.9),0 0 0 5px rgba(10,132,255,0.7);pointer-events:none"></div>`;
  }

  const dots = STEPS.map((_, i) =>
    `<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${i === currentStep ? '#0a84ff' : 'rgba(60,60,67,0.18)'}"></span>`
  ).join('');

  let cardWrap, cardInner;
  if (cardAt === 'center') {
    cardWrap  = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:24px;pointer-events:none';
    cardInner = 'background:#fff;border-radius:22px;padding:26px 24px;width:100%;max-width:360px;box-shadow:0 8px 32px rgba(0,0,0,0.28);pointer-events:auto;animation:sk-pop 0.25s ease';
  } else if (cardAt === 'bottom') {
    cardWrap  = 'position:absolute;left:0;right:0;bottom:0;pointer-events:none';
    cardInner = 'background:#fff;border-radius:24px 24px 0 0;padding:20px 20px 40px;pointer-events:auto;animation:sk-sheet 0.28s cubic-bezier(0.32,0.72,0,1)';
  } else {
    cardWrap  = 'position:absolute;left:0;right:0;top:0;pointer-events:none';
    cardInner = 'background:#fff;border-radius:0 0 24px 24px;padding:52px 20px 24px;pointer-events:auto;animation:sk-tour-top 0.28s cubic-bezier(0.32,0.72,0,1)';
  }

  const skipBtn = isLast
    ? '<span></span>'
    : `<span id="sk-tour-skip" style="font-size:15px;color:rgba(60,60,67,0.4);cursor:pointer;padding:8px 4px">Пропустить</span>`;

  const nextBtn = `<div id="sk-tour-next" style="height:46px;padding:0 26px;background:#0a84ff;border-radius:14px;color:#fff;font-size:15px;font-weight:600;display:flex;align-items:center;cursor:pointer">${isLast ? 'Начать' : 'Далее'}</div>`;

  const card = `
    <div style="${cardWrap}">
      <div style="${cardInner}">
        <div style="display:flex;gap:5px;margin-bottom:14px">${dots}</div>
        <div style="font-size:20px;font-weight:700;color:#1c1c1e;letter-spacing:-0.3px;line-height:1.2">${s.title}</div>
        <div style="font-size:15px;color:rgba(60,60,67,0.65);margin-top:7px;line-height:1.5">${s.body}</div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:20px">
          ${skipBtn}
          ${nextBtn}
        </div>
      </div>
    </div>`;

  tourEl = document.createElement('div');
  tourEl.id = 'sk-tour-overlay';
  tourEl.style.cssText = 'position:absolute;inset:0;z-index:90';
  tourEl.innerHTML = overlayHtml + ringHtml + card;

  _appEl.appendChild(tourEl);

  document.getElementById('sk-tour-next').addEventListener('click', () => {
    const cur = STEPS[currentStep];
    currentStep++;

    if (currentStep >= STEPS.length) { finishTour(); return; }

    if (cur.onBeforeNext) {
      // null out before navigation so render() inside onBeforeNext doesn't re-attach old overlay
      tourEl = null;
      cur.onBeforeNext();
      // app has re-rendered with new screen DOM; now draw next step on top
    }

    renderTour();
  });

  const skipEl = document.getElementById('sk-tour-skip');
  if (skipEl) skipEl.addEventListener('click', finishTour);
}

function finishTour() {
  markDone();
  if (tourEl) { tourEl.remove(); tourEl = null; }
}

export function getTourNode() { return tourEl; }

export function initTour(appEl, fns = {}) {
  if (isDone()) return;
  _appEl = appEl;
  _fns = fns;
  currentStep = 0;
  renderTour();
}
