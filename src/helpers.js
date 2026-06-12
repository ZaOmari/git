// Pure helpers ported from the design's DCLogic methods.
import { CAT_COLOR } from './data.js';

export const fmt = (n) => Math.round(n).toLocaleString('ru-RU') + ' ₽';
export const fmtShort = (n) => Math.round(n).toLocaleString('ru-RU');

// Себестоимость = base + all expenses + all crew payouts.
export const total = (h) => {
  const exp = h.expenses.reduce((s, e) => s + e.amount, 0);
  const crew = h.crews.reduce((s, c) => s + c.payouts.reduce((p, x) => p + x.a, 0), 0);
  return h.base + exp + crew;
};

export const unpaid = (h) =>
  h.expenses.filter((e) => !e.paid).reduce((s, e) => s + e.amount, 0);

// Сколько ещё должны бригадам по объекту (сумма остатков договорено − выплачено).
export const crewRemain = (h) =>
  h.crews.reduce((s, c) => {
    const paid = c.payouts.reduce((a, x) => a + x.a, 0);
    return s + Math.max(c.agreed - paid, 0);
  }, 0);

// Всего к оплате по объекту: поставщикам (к оплате) + остаток по бригадам.
export const obligations = (h) => unpaid(h) + crewRemain(h);
export const totalObligations = (homes) => homes.reduce((s, h) => s + obligations(h), 0);

// Маржа дома на продажу: цена продажи − себестоимость (null, если цены нет).
export const margin = (h) => (h.type === 'spec' && h.price ? h.price - total(h) : null);

export const catStyle = (cat) => {
  const c = CAT_COLOR[cat] || CAT_COLOR['Прочее'];
  return `font-size:11px;font-weight:600;padding:2px 8px;border-radius:7px;background:${c[0]};color:${c[1]}`;
};

export const badge = (type) =>
  type === 'contract'
    ? 'font-size:11px;font-weight:600;padding:3px 9px;border-radius:7px;background:rgba(10,132,255,0.12);color:#0a6fd6;white-space:nowrap;flex-shrink:0'
    : 'font-size:11px;font-weight:600;padding:3px 9px;border-radius:7px;background:rgba(255,149,0,0.14);color:#b56b00;white-space:nowrap;flex-shrink:0';

// progress/over-budget color: red >=100%, amber >=85%, otherwise blue.
export const barColor = (pct) => (pct >= 100 ? '#ff3b30' : pct >= 85 ? '#ff9500' : '#0a84ff');

// Escape text before injecting into innerHTML (seed data is clean, but
// user-entered expense/act text could contain markup).
export const esc = (s) =>
  String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
