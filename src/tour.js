// Interactive demo tour — walks Таня/Гриша through the exact demo script.
// Auto-shown once on first launch; re-launchable any time via the «?» header
// button (startTour). It drives the real app: opening the expense form, saving
// a demo expense, switching tabs — so each highlight has live content.
// After each app render(), app.js re-attaches getTourNode() to keep it visible.

const STORAGE_KEY = 'sk-tour-v3';
const CARD_H = 230;
const PAD = 10;

let _appEl = null;
let _fns = {};
let currentStep = 0;
let tourEl = null;

// onBeforeNext: runs when the user taps «Далее», BEFORE the next step renders.
// It may navigate (which calls app render()), so tourEl is nulled first.
const STEPS = [
  {
    title: 'Одна картина по деньгам',
    body: 'Главное — себестоимость всех домов и сколько ещё должны. Одна картина по деньгам.',
    targetId: 'sk-tour-summary',
  },
  {
    title: 'Расход за 5 секунд',
    body: 'Купили материал? Жмёте плюс и пишете как говорите. Главное — не забыть записать, остальное приложение сделает само.',
    targetId: 'sk-fab-btn',
    forceCardAt: 'top',
    onBeforeNext: () => _fns.openSheet(),
  },
  {
    title: 'Пишете свободно',
    body: 'Пишете как удобно: бетон 26 кубов 312000. Категория необязательна.',
    targetId: 'sk-tour-desc',
    forceCardAt: 'top',
    onBeforeNext: () => _fns.saveDemo(),
  },
  {
    title: 'Себестоимость сразу обновилась',
    body: 'Сохранили — себестоимость сразу обновилась. И это видит второй партнёр.',
    targetId: 'sk-tour-cost',
    onBeforeNext: () => _fns.setTab('crews'),
  },
  {
    title: 'Бригады и остатки',
    body: 'По каждой бригаде: договорено, выплачено, остаток. Сразу видно, сколько ещё должны.',
    targetId: 'sk-tour-remain',
    onBeforeNext: () => _fns.setTab('expenses'),
  },
  {
    title: 'Делёж чека',
    body: 'Один чек на два дома? Делите сумму в пару тапов — материал кочует.',
    targetId: 'sk-tour-split',
    onBeforeNext: () => _fns.setTab('stages'),
  },
  {
    title: 'Акт с подписью',
    body: 'На встрече формируете акт, клиент расписывается пальцем, PDF уходит.',
    targetId: 'sk-tour-act',
  },
  {
    title: 'Бюджет на исходе',
    body: 'Себестоимость близко к стоимости по договору — приложение предупредит само.',
    targetId: 'sk-tour-warn',
  },
  {
    title: 'Заметки под рукой',
    body: 'Коды и договорённости — закреплены прямо под себестоимостью, всегда под рукой. Плюс рядом — быстрая запись.',
    targetId: 'sk-tour-notes',
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
  // ensure the target is scrolled into view before measuring
  const targetEl = s.targetId ? document.getElementById(s.targetId) : null;
  if (targetEl && targetEl.scrollIntoView) {
    try { targetEl.scrollIntoView({ block: 'center', behavior: 'instant' }); } catch { targetEl.scrollIntoView(); }
  }
  const rect = s.targetId ? getRelRect(s.targetId) : null;
  const isLast = currentStep === STEPS.length - 1;

  // card placement: forced → use it; no target → centered; target low → card at top; else → bottom
  const cardAt = s.forceCardAt
    || (!rect ? 'center' : rect.top > appH * 0.55 ? 'top' : 'bottom');

  const ov = 'position:absolute;background:rgba(0,0,0,0.5);pointer-events:none;';
  let overlayHtml = '';
  let ringHtml = '';

  if (cardAt === 'center' || !rect) {
    overlayHtml = `<div style="${ov}inset:0"></div>`;
  } else {
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
    `<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${i === currentStep ? '#0a84ff' : 'rgba(var(--label),0.18)'}"></span>`
  ).join('');

  let cardWrap, cardInner;
  if (cardAt === 'center' || !rect) {
    cardWrap  = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:24px;pointer-events:none';
    cardInner = 'background:var(--card);border-radius:22px;padding:26px 24px;width:100%;max-width:360px;box-shadow:0 8px 32px rgba(0,0,0,0.28);pointer-events:auto;animation:sk-pop 0.25s ease';
  } else if (cardAt === 'bottom') {
    cardWrap  = 'position:absolute;left:0;right:0;bottom:0;pointer-events:none';
    cardInner = 'background:var(--card);border-radius:24px 24px 0 0;padding:20px 20px 40px;pointer-events:auto;animation:sk-sheet 0.28s cubic-bezier(0.32,0.72,0,1)';
  } else {
    cardWrap  = 'position:absolute;left:0;right:0;top:0;pointer-events:none';
    cardInner = 'background:var(--card);border-radius:0 0 24px 24px;padding:52px 20px 24px;pointer-events:auto;animation:sk-tour-top 0.28s cubic-bezier(0.32,0.72,0,1)';
  }

  const counter = `<span style="font-size:calc(13*var(--sk-u));color:rgba(var(--label),0.4);font-weight:600">${currentStep + 1} / ${STEPS.length}</span>`;
  const skipBtn = isLast
    ? counter
    : `<span id="sk-tour-skip" style="font-size:calc(15*var(--sk-u));color:rgba(var(--label),0.45);cursor:pointer;padding:8px 4px">Пропустить</span>`;

  const nextBtn = `<div id="sk-tour-next" style="height:46px;padding:0 26px;background:#0a84ff;border-radius:14px;color:#fff;font-size:calc(15*var(--sk-u));font-weight:600;display:flex;align-items:center;cursor:pointer">${isLast ? 'Готово' : 'Далее'}</div>`;

  const card = `
    <div style="${cardWrap}">
      <div style="${cardInner}">
        <div style="display:flex;gap:5px;margin-bottom:14px">${dots}</div>
        <div style="font-size:calc(20*var(--sk-u));font-weight:700;color:var(--text);letter-spacing:-0.3px;line-height:1.2">${s.title}</div>
        <div style="font-size:calc(15*var(--sk-u));color:rgba(var(--label),0.65);margin-top:7px;line-height:1.5">${s.body}</div>
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
      // null out before navigation so render() inside onBeforeNext doesn't re-attach the old overlay
      tourEl = null;
      cur.onBeforeNext();
      // app has re-rendered with the new screen DOM; now draw the next step on top
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

// Auto-show once on first launch; always stores refs so the «?» button works later.
export function initTour(appEl, fns = {}) {
  _appEl = appEl;
  _fns = fns;
  if (isDone()) return;
  currentStep = 0;
  renderTour();
}

// Re-launch from the «?» header button (ignores the "seen once" flag).
export function startTour() {
  if (!_appEl) return;
  if (_fns.goList) _fns.goList();
  currentStep = 0;
  renderTour();
}
