// Screen templates — return HTML strings with the exact inline styles from the
// СтройКонтроль design. Interactivity is wired through data-action / data-input
// attributes (see app.js for the delegated handlers).
import { STAGES, CATS, CAT_COLOR } from './data.js';
import { fmt, fmtShort, total, unpaid, totalObligations, margin, previewNote, otherNotesCount, catStyle, badge, barColor, esc } from './helpers.js';

const avatar = (letter, bg, size = 28, ml = 0, border = true) =>
  `<span style="width:${size}px;height:${size}px;border-radius:50%;background:${bg};color:#fff;font-size:${size === 28 ? 13 : 12}px;font-weight:600;display:flex;align-items:center;justify-content:center;${border ? 'border:2px solid var(--bg);' : ''}${ml ? `margin-left:${ml}px;` : ''}">${letter}</span>`;

const headerAvatars = () =>
  `<div style="display:flex">${avatar('Т', '#0a84ff')}${avatar('Г', '#ff9500', 28, -9)}</div>`;

const objectAvatars = () =>
  `<div style="display:flex;align-items:center;gap:6px">` +
  `<span style="width:26px;height:26px;border-radius:50%;background:#0a84ff;color:#fff;font-size:calc(12*var(--sk-u));font-weight:600;display:flex;align-items:center;justify-content:center">Т</span>` +
  `<span style="width:26px;height:26px;border-radius:50%;background:#ff9500;color:#fff;font-size:calc(12*var(--sk-u));font-weight:600;display:flex;align-items:center;justify-content:center">Г</span></div>`;

// «?» — перезапуск демо-тура из шапки
const tourBtn = () =>
  `<div data-action="startTour" title="Тур" style="width:34px;height:34px;border-radius:50%;background:var(--seg);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:calc(16*var(--sk-u));font-weight:700;color:#0a84ff;flex-shrink:0">?</div>`;

// ⚙ — настройки (тема + размер шрифта)
const settingsBtn = () =>
  `<div data-action="openSettings" title="Настройки" style="width:34px;height:34px;border-radius:50%;background:var(--seg);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:calc(17*var(--sk-u));flex-shrink:0">⚙</div>`;

const backChevron = (label, action) =>
  `<div data-action="${action}" style="display:flex;align-items:center;gap:2px;cursor:pointer;color:#0a84ff;margin-left:-4px">
     <svg width="11" height="18" viewBox="0 0 11 18" fill="none"><path d="M9 2L2 9l7 7" stroke="#0a84ff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
     <span style="font-size:calc(17*var(--sk-u));letter-spacing:-0.3px">${label}</span>
   </div>`;

// ░░░░░ СПИСОК ОБЪЕКТОВ ░░░░░
export function listScreen(state) {
  const homes = state.homes.filter((h) => !h.archived); // архивные скрыты из главного списка
  const allTotal = homes.reduce((s, h) => s + total(h), 0);
  const allOblig = totalObligations(homes);

  const cards = homes.map((h, _hi) => {
    const tot = total(h);
    const up = unpaid(h);
    const hasPrice = h.type === 'contract' && h.price;
    const pct = hasPrice ? Math.round((tot / h.price) * 100) : null;
    const col = pct != null ? barColor(pct) : '#0a84ff';
    const unpaidLabel = up > 0 ? 'к оплате ' + fmt(up) : null;

    let rightCol;
    if (hasPrice) {
      rightCol = `<div style="font-size:calc(13*var(--sk-u));font-weight:600;color:${col}">${pct}%</div>
         <div style="font-size:calc(12*var(--sk-u));color:rgba(var(--label),0.5);margin-top:1px">из ${fmt(h.price)}</div>`;
    } else if (h.type === 'spec' && h.price) {
      const m = margin(h);
      rightCol = `<div style="font-size:calc(14*var(--sk-u));font-weight:700;color:#248a43">+${fmt(m)}</div>
         <div style="font-size:calc(12*var(--sk-u));color:rgba(var(--label),0.5);margin-top:1px">маржа · цена ${fmtShort(h.price)}</div>`;
    } else {
      rightCol = `<div style="font-size:calc(12*var(--sk-u));color:rgba(var(--label),0.5);max-width:120px">Цена продажи не задана</div>`;
    }

    const progress = hasPrice
      ? `<div style="margin-top:10px;height:6px;border-radius:3px;background:var(--track);overflow:hidden">
           <div style="height:100%;border-radius:3px;width:${Math.min(pct || 0, 100)}%;background:${col}"></div>
         </div>`
      : '';

    return `
      <div ${_hi === 0 ? 'id="sk-tour-card"' : ''} data-action="openHome" data-id="${h.id}" style="margin:0 16px 12px;background:var(--card);border-radius:20px;padding:16px 16px 14px;box-shadow:0 1px 2px rgba(0,0,0,0.04);cursor:pointer">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px">
          <div style="min-width:0">
            <div style="font-size:calc(17*var(--sk-u));font-weight:600;color:var(--text);letter-spacing:-0.3px;line-height:1.2">${esc(h.name)}</div>
            <div style="font-size:calc(13*var(--sk-u));color:rgba(var(--label),0.6);margin-top:2px">${esc(h.address)}</div>
          </div>
          <span style="${badge(h.type)}">${h.type === 'contract' ? 'По договору' : 'На продажу'}</span>
        </div>
        <div style="margin-top:14px;display:flex;align-items:flex-end;justify-content:space-between;gap:12px">
          <div>
            <div style="font-size:calc(12*var(--sk-u));color:rgba(var(--label),0.6);font-weight:500">Себестоимость</div>
            <div style="font-size:calc(27*var(--sk-u));font-weight:700;letter-spacing:-0.7px;color:var(--text);line-height:1.05;margin-top:1px">${fmt(tot)}</div>
          </div>
          <div style="text-align:right;flex-shrink:0">${rightCol}</div>
        </div>
        ${progress}
        <div style="margin-top:13px;padding-top:12px;border-top:0.5px solid rgba(var(--label),0.1);display:flex;align-items:center;justify-content:space-between;gap:8px">
          <div style="display:flex;align-items:center;gap:6px;min-width:0">
            <span style="width:6px;height:6px;border-radius:50%;background:#0a84ff;flex-shrink:0"></span>
            <span style="font-size:calc(13*var(--sk-u));color:var(--text);font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc((h.stages || STAGES)[h.stageIndex])}</span>
            <span style="font-size:calc(13*var(--sk-u));color:rgba(var(--label),0.4)">· ${h.stageIndex + 1} из ${(h.stages || STAGES).length}</span>
          </div>
          ${unpaidLabel ? `<span style="font-size:calc(12*var(--sk-u));font-weight:600;color:#c2410c;background:rgba(255,149,0,0.13);padding:3px 8px;border-radius:999px;white-space:nowrap;flex-shrink:0">${esc(unpaidLabel)}</span>` : ''}
        </div>
      </div>`;
  }).join('');

  return `
    <div style="padding-bottom:120px">
      <div style="padding:56px 20px 6px;display:flex;align-items:flex-end;justify-content:space-between">
        <div style="font-size:calc(34*var(--sk-u));font-weight:700;letter-spacing:-0.6px;color:var(--text)">Объекты</div>
        <div style="display:flex;align-items:center;gap:9px;padding-bottom:6px">
          ${settingsBtn()}
          ${tourBtn()}
          ${headerAvatars()}
        </div>
      </div>
      <div id="sk-tour-summary" style="margin:14px 16px 8px;background:var(--invert);border-radius:22px;padding:18px 20px 16px;color:#fff;box-shadow:0 8px 24px rgba(0,0,0,0.16)">
        <div style="font-size:calc(13*var(--sk-u));font-weight:500;color:rgba(235,235,245,0.6);letter-spacing:-0.1px">Себестоимость всех объектов</div>
        <div style="font-size:calc(36*var(--sk-u));font-weight:700;letter-spacing:-1px;margin-top:3px;line-height:1.05">${fmt(allTotal)}</div>
        <div style="font-size:calc(12*var(--sk-u));color:rgba(235,235,245,0.45);margin-top:5px">обновлено только что</div>
        <div style="height:0.5px;background:rgba(235,235,245,0.14);margin:13px 0 11px"></div>
        <div style="display:flex;align-items:center;justify-content:space-between">
          <span style="font-size:calc(14*var(--sk-u));color:rgba(235,235,245,0.7)">Всего к оплате</span>
          <span style="font-size:calc(18*var(--sk-u));font-weight:700;letter-spacing:-0.3px;color:#ffb340">${fmt(allOblig)}</span>
        </div>
      </div>
      <div style="font-size:calc(13*var(--sk-u));color:rgba(var(--label),0.6);padding:14px 24px 8px;letter-spacing:-0.08px">ОБЪЕКТЫ · ${homes.length}</div>
      ${cards}
    </div>`;
}

// ░░░░░ ОБЪЕКТ ░░░░░
export function objectScreen(state) {
  const h = state.homes.find((x) => x.id === state.homeId);
  if (!h) return '';
  const tot = total(h);
  const up = unpaid(h);
  const isContract = h.type === 'contract';
  const hasPrice = isContract && h.price;
  const pct = hasPrice ? Math.round((tot / h.price) * 100) : null;
  const col = pct != null ? barColor(pct) : '#0a84ff';

  // hero: price progress + warning OR spec margin
  let heroExtra = '';
  if (hasPrice) {
    const warnLabel = pct >= 85 ? 'Бюджет на исходе: себестоимость близко к стоимости по договору' : null;
    heroExtra = `
      <div style="margin-top:15px;display:flex;align-items:center;justify-content:space-between">
        <span style="font-size:calc(13*var(--sk-u));color:rgba(var(--label),0.6)">Стоимость по договору ${fmt(h.price)}</span>
        <span style="font-size:calc(14*var(--sk-u));font-weight:700;color:${col}">${pct}%</span>
      </div>
      <div style="margin-top:8px;height:8px;border-radius:4px;background:var(--track);overflow:hidden">
        <div style="height:100%;border-radius:4px;width:${Math.min(pct, 100)}%;background:${col}"></div>
      </div>
      ${warnLabel ? `
      <div id="sk-tour-warn" style="margin-top:11px;display:flex;align-items:center;gap:8px;background:rgba(255,149,0,0.1);border-radius:12px;padding:9px 11px">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M12 2L1 21h22L12 2z" fill="#ff9500"/><rect x="11" y="9" width="2" height="6" rx="1" fill="#fff"/><circle cx="12" cy="18" r="1.2" fill="#fff"/></svg>
        <span style="font-size:calc(13*var(--sk-u));color:#9a5b00;font-weight:500;line-height:1.3">${warnLabel}</span>
      </div>` : ''}`;
  } else if (h.type === 'spec' && h.price) {
    const m = margin(h);
    heroExtra = `
      <div style="margin-top:15px;display:flex;align-items:center;justify-content:space-between">
        <span style="font-size:calc(13*var(--sk-u));color:rgba(var(--label),0.6)">Цена продажи ${fmt(h.price)}</span>
        <span style="font-size:calc(12*var(--sk-u));font-weight:600;padding:3px 9px;border-radius:7px;background:rgba(255,149,0,0.14);color:#b56b00">На продажу</span>
      </div>
      <div style="margin-top:11px;background:rgba(52,199,89,0.1);border-radius:12px;padding:11px 13px;display:flex;align-items:center;justify-content:space-between">
        <span style="font-size:calc(14*var(--sk-u));color:var(--text);font-weight:500">Маржа</span>
        <span style="font-size:calc(20*var(--sk-u));font-weight:700;letter-spacing:-0.4px;color:#248a43">+${fmt(m)}</span>
      </div>`;
  } else if (h.type === 'spec') {
    heroExtra = `<div style="margin-top:14px;font-size:calc(13*var(--sk-u));color:rgba(var(--label),0.6);line-height:1.4">Объект на продажу — клиента нет. Цена и маржа задаются во вкладке «Продажа».</div>`;
  }

  // segmented tabs
  const tabs = isContract
    ? [['expenses', 'Расходы'], ['crews', 'Бригады'], ['stages', 'Этапы'], ['client', 'Оплаты']]
    : [['expenses', 'Расходы'], ['crews', 'Бригады'], ['stages', 'Этапы'], ['sale', 'Продажа']];
  const segBase = 'flex:1;text-align:center;padding:10px 4px;border-radius:7px;font-size:calc(13*var(--sk-u));letter-spacing:-0.1px;cursor:pointer;';
  const segs = tabs.map(([k, l]) => {
    const active = state.tab === k;
    const style = active
      ? segBase + 'font-weight:600;color:var(--text);background:var(--card);box-shadow:0 1px 3px rgba(0,0,0,0.12)'
      : segBase + 'font-weight:500;color:rgba(var(--label),0.6);background:transparent';
    return `<div data-action="setTab" data-tab="${k}" style="${style}">${l}</div>`;
  }).join('');

  const tabContent = objectTab(state, h);

  return `
    <div style="padding-bottom:120px">
      <div style="padding:54px 16px 0;display:flex;align-items:center;justify-content:space-between">
        ${backChevron('Объекты', 'back')}
        <div style="display:flex;align-items:center;gap:9px">
          ${settingsBtn()}
          ${tourBtn()}
          ${objectAvatars()}
        </div>
      </div>
      <div style="padding:14px 20px 4px">
        <div style="display:flex;align-items:center;gap:8px">
          <div style="font-size:calc(28*var(--sk-u));font-weight:700;letter-spacing:-0.5px;color:var(--text);line-height:1.1">${esc(h.name)}</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:5px">
          <span style="${badge(h.type)}">${h.type === 'contract' ? 'По договору' : 'На продажу'}</span>
          <span style="font-size:calc(13*var(--sk-u));color:rgba(var(--label),0.6)">${esc(h.address)}</span>
        </div>
      </div>
      <div id="sk-tour-cost" style="margin:12px 16px 0;background:var(--card);border-radius:22px;padding:18px 20px;box-shadow:0 1px 2px rgba(0,0,0,0.04)">
        <div style="font-size:calc(13*var(--sk-u));font-weight:500;color:rgba(var(--label),0.6)">Себестоимость</div>
        <div style="font-size:calc(38*var(--sk-u));font-weight:700;letter-spacing:-1.2px;color:var(--text);line-height:1.02;margin-top:2px">${fmt(tot)}</div>
        ${up > 0 ? `<div style="font-size:calc(13*var(--sk-u));color:#c2410c;font-weight:500;margin-top:4px">из них к оплате поставщикам ${fmt(up)}</div>` : ''}
        ${heroExtra}
      </div>
      ${notesStrip(state, h)}
      <div id="sk-tour-tabs" style="margin:18px 16px 0;background:var(--seg);border-radius:9px;padding:2px;display:flex;gap:2px">${segs}</div>
      ${tabContent}
    </div>`;
}

// ░░░░░ ПОЛОСА ЗАМЕТОК (под себестоимостью) ░░░░░
// Свёрнуто — одна строка с превью закреплённой/свежей заметки + быстрый «+».
// Раскрыто — аккордеон со всеми заметками и закреплением (одна закреплённая).
function notesStrip(state, h) {
  const notes = h.notes || [];
  const hasNotes = notes.length > 0;
  const open = state.notesOpen && hasNotes;
  const pv = previewNote(h);
  const moreN = otherNotesCount(h);
  const rowAction = hasNotes ? 'toggleNotes' : 'openNote';

  const previewHtml = pv
    ? `<span style="color:var(--text);font-weight:500">${esc(pv.text)}</span>${moreN ? `<span style="color:rgba(var(--label),0.45)"> · ещё ${moreN}</span>` : ''}`
    : `<span style="color:rgba(var(--label),0.4)">Заметок нет</span>`;

  const plusBtn = `<div data-action="openNote" title="Добавить заметку" style="width:30px;height:30px;border-radius:50%;background:rgba(10,132,255,0.1);display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#0a84ff" stroke-width="2.4" stroke-linecap="round"/></svg></div>`;

  const chevron = hasNotes
    ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" style="transform:rotate(${open ? 180 : 0}deg);transition:transform .2s;flex-shrink:0"><path d="M6 9l6 6 6-6" stroke="rgba(var(--label),0.4)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`
    : '';

  const collapsedRow = `
    <div data-action="${rowAction}" style="display:flex;align-items:center;gap:10px;min-height:52px;padding:8px 10px 8px 14px;cursor:pointer">
      <span style="font-size:calc(15*var(--sk-u));flex-shrink:0">📌</span>
      <div style="flex:1;min-width:0;font-size:calc(14*var(--sk-u));white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${previewHtml}</div>
      ${plusBtn}
      ${chevron}
    </div>`;

  let expanded = '';
  if (open) {
    const sorted = [...notes].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    const items = sorted.map((n, idx) => {
      const last = idx === sorted.length - 1;
      const pinStyle = n.pinned
        ? 'background:rgba(10,132,255,0.12)'
        : 'background:transparent;opacity:0.38';
      const metaBits = [esc(n.date)];
      if (n.photo) metaBits.push('фото');
      if (n.pinned) metaBits.push('закреплено');
      return `
        <div style="display:flex;align-items:flex-start;gap:10px;padding:12px 14px;${last ? '' : 'border-bottom:0.5px solid rgba(var(--label),0.08)'}">
          <div data-action="togglePin" data-id="${n.id}" title="Закрепить" style="width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;font-size:calc(14*var(--sk-u));${pinStyle}">📌</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:calc(15*var(--sk-u));color:var(--text);line-height:1.35">${esc(n.text)}</div>
            <div style="font-size:calc(12*var(--sk-u));color:rgba(var(--label),0.5);margin-top:3px">${metaBits.join(' · ')}</div>
          </div>
        </div>`;
    }).join('');
    expanded = `
      <div style="border-top:0.5px solid rgba(var(--label),0.1);max-height:300px;overflow-y:auto">${items}</div>
      <div data-action="toggleNotes" style="text-align:center;padding:10px;font-size:calc(14*var(--sk-u));color:#0a84ff;cursor:pointer;border-top:0.5px solid rgba(var(--label),0.08)">Свернуть</div>`;
  }

  return `<div id="sk-tour-notes" style="margin:12px 16px 0;background:var(--card);border-radius:16px;box-shadow:0 1px 2px rgba(0,0,0,0.04);overflow:hidden">${collapsedRow}${expanded}</div>`;
}

function objectTab(state, h) {
  const tab = state.tab;

  if (tab === 'expenses') {
    let splitTagged = false;
    const rows = h.expenses.map((e, i) => {
      const last = i === h.expenses.length - 1;
      const paidStyle = e.paid
        ? 'display:inline-block;margin-top:3px;font-size:calc(11*var(--sk-u));font-weight:600;color:#248a43'
        : 'display:inline-block;margin-top:3px;font-size:calc(11*var(--sk-u));font-weight:600;color:#c2410c';
      const meta = e.date + ' · ' + (e.who === 'Т' ? 'Таня' : 'Гриша');
      const tags =
        (e.cat ? `<span style="${catStyle(e.cat)}">${esc(e.cat)}</span>` : '') +
        `<span style="font-size:calc(12*var(--sk-u));color:rgba(var(--label),0.5)">${esc(meta)}</span>` +
        (e.photo ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="2" y="6" width="20" height="15" rx="3" stroke="rgba(var(--label),0.45)" stroke-width="2"/><circle cx="12" cy="13" r="3.5" stroke="rgba(var(--label),0.45)" stroke-width="2"/><path d="M8 6l1.5-2.5h5L16 6" stroke="rgba(var(--label),0.45)" stroke-width="2" stroke-linejoin="round"/></svg>` : '') +
        (e.split ? `<span style="font-size:calc(11*var(--sk-u));color:#5856d6;font-weight:600;background:rgba(88,86,214,0.1);padding:2px 6px;border-radius:6px">делёж</span>` : '');
      // первая запись с делением — якорь тура
      const anchor = (e.split && !splitTagged) ? (splitTagged = true, ' id="sk-tour-split"') : '';
      return `
        <div${anchor} style="padding:13px 16px;${last ? '' : 'border-bottom:0.5px solid rgba(var(--label),0.08)'}">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
            <div style="min-width:0;flex:1">
              <div style="font-size:calc(15*var(--sk-u));color:var(--text);line-height:1.3;font-weight:450">${esc(e.text)}</div>
              <div style="display:flex;align-items:center;gap:7px;margin-top:6px;flex-wrap:wrap">${tags}</div>
            </div>
            <div style="text-align:right;flex-shrink:0">
              <div style="font-size:calc(16*var(--sk-u));font-weight:600;color:var(--text)">${fmt(e.amount)}</div>
              <span style="${paidStyle}">${e.paid ? 'оплачено' : 'к оплате'}</span>
            </div>
          </div>
        </div>`;
    }).join('');
    return `<div id="sk-tour-expenses" style="margin:14px 16px 0;background:var(--card);border-radius:18px;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,0.04)">${rows}</div>`;
  }

  if (tab === 'crews') {
    let remainTagged = false;
    const badgePill = (color, bg) => `font-size:calc(12*var(--sk-u));font-weight:600;color:${color};background:${bg};padding:3px 9px;border-radius:999px;white-space:nowrap;flex-shrink:0`;
    const cards = h.crews.map((c) => {
      const paid = c.payouts.reduce((s, x) => s + x.a, 0);
      const hasAgreed = !!c.agreed;
      const remain = hasAgreed ? c.agreed - paid : 0;
      let badgeHtml = '';
      if (hasAgreed && remain > 0) badgeHtml = `<span style="${badgePill('#c2410c', 'rgba(255,149,0,0.13)')}">остаток ${fmt(remain)}</span>`;
      else if (hasAgreed && remain === 0) badgeHtml = `<span style="${badgePill('#248a43', 'rgba(52,199,89,0.13)')}">закрыто</span>`;
      else if (hasAgreed) badgeHtml = `<span style="${badgePill('#4a48b8', 'rgba(88,86,214,0.13)')}">переплата ${fmt(-remain)}</span>`;
      else badgeHtml = `<span style="${badgePill('rgba(var(--label),0.7)', 'var(--seg)')}">разовая</span>`;

      const payoutChips = c.payouts.map((p) =>
        `<span style="font-size:calc(13*var(--sk-u));color:var(--text);background:var(--bg);border-radius:9px;padding:5px 10px;font-weight:500">${esc(p.d + ' — ' + fmtShort(p.a) + ' ₽')}</span>`
      ).join('');
      const moneyLine = hasAgreed
        ? `Договорились: ${fmt(c.agreed)} · выплачено ${fmt(paid)}`
        : `Выплачено: ${fmt(paid)}`;
      const crewLine = c.crew ? `<div style="font-size:calc(13*var(--sk-u));color:rgba(var(--label),0.5);margin-top:2px">Бригада: ${esc(c.crew)}</div>` : '';
      const anchor = (hasAgreed && remain > 0 && !remainTagged) ? (remainTagged = true, ' id="sk-tour-remain"') : '';
      return `
        <div${anchor} style="background:var(--card);border-radius:18px;padding:15px 16px;margin-bottom:11px;box-shadow:0 1px 2px rgba(0,0,0,0.04)">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px">
            <div style="font-size:calc(16*var(--sk-u));font-weight:600;color:var(--text);line-height:1.25">${esc(c.work)}</div>
            ${badgeHtml}
          </div>
          ${crewLine}
          <div style="font-size:calc(13*var(--sk-u));color:rgba(var(--label),0.6);margin-top:4px">${moneyLine}</div>
          <div style="margin-top:11px;display:flex;flex-wrap:wrap;gap:7px">
            ${payoutChips}
            <span data-action="openPayout" data-id="${c.id}" style="display:inline-flex;align-items:center;gap:5px;font-size:calc(14*var(--sk-u));color:#0a84ff;border:1px dashed rgba(10,132,255,0.4);border-radius:11px;padding:9px 14px;font-weight:600;cursor:pointer"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#0a84ff" stroke-width="2.6" stroke-linecap="round"/></svg>Выплата</span>
          </div>
        </div>`;
    }).join('');
    const newBtn = `
      <div data-action="openPayout" style="margin-top:2px;min-height:50px;background:var(--card);border-radius:15px;display:flex;align-items:center;justify-content:center;gap:7px;color:#0a84ff;font-size:calc(16*var(--sk-u));font-weight:600;cursor:pointer;box-shadow:0 1px 2px rgba(0,0,0,0.04)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#0a84ff" stroke-width="2.4" stroke-linecap="round"/></svg>Выплата по новой работе
      </div>`;
    return `<div style="margin:14px 16px 0">${cards}${newBtn}</div>`;
  }

  if (tab === 'stages') {
    const stages = h.stages || STAGES;
    const rows = stages.map((name, i) => {
      const done = i < h.stageIndex, current = i === h.stageIndex;
      const dotStyle = done
        ? 'width:24px;height:24px;border-radius:50%;background:#0a84ff;color:#fff;font-size:calc(13*var(--sk-u));font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0'
        : current
          ? 'width:24px;height:24px;border-radius:50%;background:var(--card);border:3px solid #0a84ff;display:flex;flex-shrink:0;box-sizing:border-box'
          : 'width:24px;height:24px;border-radius:50%;background:var(--card);border:2px solid rgba(var(--label),0.18);display:flex;flex-shrink:0;box-sizing:border-box';
      const weight = current ? '700' : '500';
      const textColor = current || done ? '#1c1c1e' : 'rgba(var(--label),0.5)';
      const lineColor = done ? '#0a84ff' : 'rgba(var(--label),0.12)';
      const connector = i < stages.length - 1
        ? `<span style="width:2px;height:22px;background:${lineColor};margin-top:3px"></span>` : '';
      const actBtn = current
        ? `<div id="sk-tour-act" data-action="openAct" style="display:inline-flex;align-items:center;gap:6px;margin-top:9px;background:#0a84ff;color:#fff;font-size:calc(14*var(--sk-u));font-weight:600;padding:8px 14px;border-radius:11px;cursor:pointer">
             <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M5 3h10l4 4v14H5V3z" stroke="#fff" stroke-width="2" stroke-linejoin="round"/><path d="M14 3v5h5M8 13h8M8 17h5" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>
             Сформировать акт
           </div>` : '';
      return `
        <div style="display:flex;align-items:flex-start;gap:14px;padding:9px 0;position:relative">
          <div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0">
            <span style="${dotStyle}">${done ? '✓' : ''}</span>
            ${connector}
          </div>
          <div style="padding-top:1px;flex:1">
            <div style="font-size:calc(15*var(--sk-u));font-weight:${weight};color:${textColor};line-height:1.3">${esc(name)}</div>
            ${actBtn}
          </div>
        </div>`;
    }).join('');
    return `<div style="margin:14px 16px 0;background:var(--card);border-radius:18px;padding:6px 18px 14px;box-shadow:0 1px 2px rgba(0,0,0,0.04)">${rows}</div>`;
  }

  if (tab === 'client') {
    const hasPrice = h.type === 'contract' && h.price;
    const cVnes = h.clientPayments.reduce((s, p) => s + p.a, 0);
    const cPct = hasPrice ? Math.round((cVnes / h.price) * 100) : 0;
    const rows = h.clientPayments.map((p, idx) => {
      const last = idx === h.clientPayments.length - 1;
      return `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:13px 16px;${last ? '' : 'border-bottom:0.5px solid rgba(var(--label),0.08)'}">
          <div>
            <div style="font-size:calc(15*var(--sk-u));color:var(--text);font-weight:500">${esc(p.d)}</div>
            ${p.escrow ? `<div style="font-size:calc(12*var(--sk-u));color:#5856d6;font-weight:600;margin-top:2px">эскроу · внутреннее</div>` : ''}
          </div>
          <div style="font-size:calc(16*var(--sk-u));font-weight:600;color:var(--text)">${fmt(p.a)}</div>
        </div>`;
    }).join('');
    return `
      <div style="margin:14px 16px 0">
        <div style="background:var(--card);border-radius:18px;padding:16px 18px;box-shadow:0 1px 2px rgba(0,0,0,0.04)">
          <div style="display:flex;align-items:flex-end;justify-content:space-between">
            <div>
              <div style="font-size:calc(12*var(--sk-u));color:rgba(var(--label),0.6);font-weight:500">Внесено клиентом</div>
              <div style="font-size:calc(26*var(--sk-u));font-weight:700;letter-spacing:-0.6px;color:var(--text);margin-top:1px">${fmt(cVnes)}</div>
            </div>
            <div style="text-align:right">
              <div style="font-size:calc(13*var(--sk-u));font-weight:600;color:#0a84ff">${cPct}%</div>
              <div style="font-size:calc(12*var(--sk-u));color:rgba(var(--label),0.5)">из ${hasPrice ? fmt(h.price) : '—'}</div>
            </div>
          </div>
          <div style="margin-top:9px;height:8px;border-radius:4px;background:var(--track);overflow:hidden">
            <div style="height:100%;border-radius:4px;width:${Math.min(cPct, 100)}%;background:#0a84ff"></div>
          </div>
          <div style="margin-top:9px;font-size:calc(13*var(--sk-u));color:rgba(var(--label),0.6)">Осталось внести: <span style="color:var(--text);font-weight:600">${hasPrice ? fmt(Math.max(h.price - cVnes, 0)) : '—'}</span></div>
        </div>
        <div style="font-size:calc(13*var(--sk-u));color:rgba(var(--label),0.6);padding:16px 8px 8px;letter-spacing:-0.08px">ВНЕСЕНИЯ</div>
        <div style="background:var(--card);border-radius:18px;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,0.04)">${rows}</div>
      </div>`;
  }

  if (tab === 'sale') {
    const m = margin(h);
    return `
      <div style="margin:14px 16px 0;background:var(--card);border-radius:18px;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,0.04)">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:15px 18px;border-bottom:0.5px solid rgba(var(--label),0.1)">
          <span style="font-size:calc(15*var(--sk-u));color:var(--text)">Себестоимость</span>
          <span style="font-size:calc(16*var(--sk-u));font-weight:600;color:var(--text)">${fmt(total(h))}</span>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;padding:15px 18px;border-bottom:0.5px solid rgba(var(--label),0.1)">
          <span style="font-size:calc(15*var(--sk-u));color:var(--text)">Цена продажи</span>
          <span style="font-size:calc(16*var(--sk-u));font-weight:600;color:var(--text)">${h.price ? fmt(h.price) : '<span style="color:#0a84ff;font-weight:500">задать</span>'}</span>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;padding:15px 18px">
          <span style="font-size:calc(15*var(--sk-u));color:var(--text)">Маржа</span>
          ${m != null
            ? `<span style="font-size:calc(18*var(--sk-u));font-weight:700;color:#248a43">+${fmt(m)}</span>`
            : `<span style="font-size:calc(16*var(--sk-u));color:rgba(var(--label),0.4)">— цена не задана</span>`}
        </div>
      </div>
      <div style="margin:12px 24px 0;font-size:calc(13*var(--sk-u));color:rgba(var(--label),0.5);line-height:1.45">Маржа = цена продажи − себестоимость. Считается автоматически.</div>`;
  }
  return '';
}

// ░░░░░ АКТ ░░░░░
export function actScreen(state) {
  const a = state.act;
  const field = (label, key, value, extra = '') =>
    `<label style="display:block;padding:11px 16px;${key === 'sum' ? '' : 'border-bottom:0.5px solid rgba(var(--label),0.1)'}">
       <span style="font-size:calc(12*var(--sk-u));color:rgba(var(--label),0.6);font-weight:500">${label}</span>
       <input value="${esc(value)}" data-input="act-${key}" ${extra} style="width:100%;border:none;outline:none;font-size:calc(16*var(--sk-u));color:var(--text);margin-top:3px;background:transparent;font-family:inherit" />
     </label>`;

  const saveStyle = 'height:52px;border-radius:15px;display:flex;align-items:center;justify-content:center;gap:9px;color:#fff;font-size:calc(17*var(--sk-u));font-weight:600;cursor:pointer;' +
    (state.signed ? 'background:#0a84ff' : 'background:rgba(10,132,255,0.45)');

  return `
    <div style="padding-bottom:120px">
      <div style="padding:54px 16px 0;display:flex;align-items:center;justify-content:space-between">
        ${backChevron('Объект', 'closeAct')}
      </div>
      <div style="padding:14px 20px 2px">
        <div style="font-size:calc(28*var(--sk-u));font-weight:700;letter-spacing:-0.5px;color:var(--text)">Акт приёма работ</div>
        <div style="font-size:calc(13*var(--sk-u));color:rgba(var(--label),0.6);margin-top:3px">Реквизиты заполняются вручную</div>
      </div>
      <div style="margin:14px 16px 0;background:var(--card);border-radius:18px;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,0.04)">
        ${field('Заказчик', 'client', a.client, 'placeholder="ФИО клиента"')}
        ${field('Объект', 'object', a.object)}
        ${field('Этап / работы', 'works', a.works)}
        ${field('Сумма, ₽', 'sum', a.sum, 'inputmode="numeric" placeholder="0"')}
      </div>
      <div style="font-size:calc(13*var(--sk-u));color:rgba(var(--label),0.6);padding:18px 24px 8px;letter-spacing:-0.08px">ИСПОЛНИТЕЛЬ</div>
      <div style="margin:0 16px;background:var(--card);border-radius:18px;padding:14px 16px;box-shadow:0 1px 2px rgba(0,0,0,0.04)">
        ${(() => { const r = state.requisites || {};
          return `<div style="font-size:calc(16*var(--sk-u));color:var(--text);font-weight:500">${esc(r.form ? r.form + ' · ' : '')}${esc(r.name || 'Реквизиты не заданы')}</div>
            ${r.inn ? `<div style="font-size:calc(13*var(--sk-u));color:rgba(var(--label),0.6);margin-top:3px">ИНН ${esc(r.inn)}${r.extra ? ' · ' + esc(r.extra) : ''}</div>` : ''}`;
        })()}
        <div data-action="openReqFromAct" style="font-size:calc(13*var(--sk-u));color:#0a84ff;margin-top:8px;cursor:pointer">Изменить в Настройках</div>
      </div>
      <div style="font-size:calc(13*var(--sk-u));color:rgba(var(--label),0.6);padding:18px 24px 8px;letter-spacing:-0.08px">ПОДПИСЬ КЛИЕНТА</div>
      <div style="margin:0 16px;background:var(--card);border-radius:18px;padding:12px;box-shadow:0 1px 2px rgba(0,0,0,0.04)">
        <div style="position:relative;border:1.5px dashed rgba(var(--label),0.2);border-radius:12px;background:var(--card2);height:150px;touch-action:none">
          <canvas id="sk-sig" style="width:100%;height:150px;display:block;touch-action:none"></canvas>
          <div id="sk-sig-ph" style="position:absolute;inset:0;display:${state.signed ? 'none' : 'flex'};align-items:center;justify-content:center;pointer-events:none;font-size:calc(14*var(--sk-u));color:rgba(var(--label),0.3)">Подпись пальцем</div>
        </div>
        <div style="display:flex;justify-content:flex-end;margin-top:8px">
          <span data-action="clearSig" style="font-size:calc(14*var(--sk-u));color:#0a84ff;cursor:pointer;padding:4px 8px">Очистить</span>
        </div>
      </div>
      <div style="padding:18px 16px 0">
        <div id="sk-save-act" data-action="saveAct" style="${saveStyle}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 3h10l4 4v14H5V3z" stroke="#fff" stroke-width="2" stroke-linejoin="round"/><path d="M14 3v5h5" stroke="#fff" stroke-width="2" stroke-linejoin="round"/></svg>
          Сохранить PDF · на почту
        </div>
        <div style="text-align:center;font-size:calc(12*var(--sk-u));color:rgba(var(--label),0.5);margin-top:9px">PDF сохранится в приложении и уйдёт на почту</div>
      </div>
    </div>`;
}

// ░░░░░ FAB ░░░░░
export function fab(state, animate = false) {
  const show = (state.screen === 'list' || state.screen === 'object') && !state.sheet;
  if (!show) return '';
  const anim = animate ? 'animation:sk-pop 0.25s ease' : '';
  return `
    <div id="sk-fab-btn" data-action="openFab" style="position:absolute;right:18px;bottom:40px;z-index:30;display:flex;align-items:center;gap:9px;height:60px;padding:0 24px 0 20px;background:#0a84ff;border-radius:30px;box-shadow:0 6px 18px rgba(10,132,255,0.4),0 2px 5px rgba(0,0,0,0.12);cursor:pointer;${anim}">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/></svg>
      <span style="color:#fff;font-size:calc(18*var(--sk-u));font-weight:600;letter-spacing:-0.2px">Расход</span>
    </div>`;
}

// ░░░░░ ЛИСТ: НОВЫЙ РАСХОД ░░░░░
export function sheet(state, animate = false) {
  if (state.sheet !== 'expense') return '';
  const d = state.draft;
  const dimAnim = animate ? 'animation:sk-fade 0.25s ease' : '';
  const sheetAnim = animate ? 'animation:sk-sheet 0.32s cubic-bezier(0.32,0.72,0,1)' : '';

  const homeChips = state.homes.map((hm) => {
    const active = d.homeId === hm.id;
    const style = 'font-size:calc(14*var(--sk-u));font-weight:500;padding:8px 14px;border-radius:11px;cursor:pointer;white-space:nowrap;' +
      (active ? 'background:#0a84ff;color:#fff' : 'background:var(--card);color:var(--text);box-shadow:0 1px 2px rgba(0,0,0,0.04)');
    return `<div data-action="setDraftHome" data-id="${hm.id}" style="${style}">${esc(hm.short || hm.name)}</div>`;
  }).join('');

  const cats = state.categories && state.categories.length ? state.categories : CATS;
  const catChips = cats.map((c) => {
    const active = d.category === c;
    const cc = CAT_COLOR[c] || CAT_COLOR['Прочее'];
    const style = 'font-size:calc(14*var(--sk-u));font-weight:500;padding:8px 14px;border-radius:11px;cursor:pointer;white-space:nowrap;' +
      (active ? `background:${cc[1]};color:#fff` : 'background:var(--card);color:var(--text);box-shadow:0 1px 2px rgba(0,0,0,0.04)');
    return `<div data-action="setCategory" data-cat="${esc(c)}" style="${style}">${esc(c)}</div>`;
  }).join('');

  const psBase = 'flex:1;text-align:center;padding:10px 4px;border-radius:7px;font-size:calc(14*var(--sk-u));cursor:pointer;';
  const paidSegs =
    `<div data-action="setPaid" data-paid="true" style="${psBase + (d.paid ? 'font-weight:600;color:var(--text);background:var(--card);box-shadow:0 1px 3px rgba(0,0,0,0.12)' : 'font-weight:500;color:rgba(var(--label),0.6)')}">Оплачено</div>` +
    `<div data-action="setPaid" data-paid="false" style="${psBase + (!d.paid ? 'font-weight:600;color:var(--text);background:var(--card);box-shadow:0 1px 3px rgba(0,0,0,0.12)' : 'font-weight:500;color:rgba(var(--label),0.6)')}">К оплате</div>`;

  const splitToggle = 'width:51px;height:31px;border-radius:999px;padding:2px;display:flex;transition:all .2s;' +
    (d.split ? 'background:#34c759;justify-content:flex-end' : 'background:rgba(120,120,128,0.2);justify-content:flex-start');
  const splitKnob = 'width:27px;height:27px;border-radius:50%;background:var(--card);box-shadow:0 1px 3px rgba(0,0,0,0.2)';
  const photoLabel = d.photo ? 'прикреплено ✓' : 'добавить';
  const photoLabelStyle = d.photo ? 'font-size:calc(15*var(--sk-u));color:#248a43;font-weight:500' : 'font-size:calc(15*var(--sk-u));color:#0a84ff';
  const amountDisplay = d.amount ? Number(d.amount).toLocaleString('ru-RU') : '';

  return `
    <div style="position:absolute;inset:0;z-index:40">
      <div data-action="closeSheet" style="position:absolute;inset:0;background:rgba(0,0,0,0.32);${dimAnim}"></div>
      <div style="position:absolute;left:0;right:0;bottom:0;background:var(--bg);border-radius:26px 26px 0 0;padding:8px 0 30px;${sheetAnim};max-height:94%;overflow-y:auto;box-shadow:0 -8px 30px rgba(0,0,0,0.18)">
        <div style="width:38px;height:5px;border-radius:3px;background:rgba(var(--label),0.25);margin:0 auto 6px"></div>
        <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 18px 12px">
          <span data-action="closeSheet" style="font-size:calc(17*var(--sk-u));color:#0a84ff;cursor:pointer">Отмена</span>
          <span style="font-size:calc(17*var(--sk-u));font-weight:600;color:var(--text)">Новый расход</span>
          <span style="font-size:calc(17*var(--sk-u));color:rgba(var(--label),0.3);width:54px;text-align:right">·</span>
        </div>
        <div id="sk-tour-amount" style="margin:0 16px;background:var(--card);border-radius:18px;padding:18px 18px">
          <div style="font-size:calc(12*var(--sk-u));color:rgba(var(--label),0.6);font-weight:500">Сумма</div>
          <div style="display:flex;align-items:baseline;gap:6px;margin-top:2px">
            <input value="${esc(amountDisplay)}" data-input="amount" inputmode="numeric" placeholder="0" style="border:none;outline:none;font-size:calc(40*var(--sk-u));font-weight:700;letter-spacing:-1px;color:var(--text);background:transparent;font-family:inherit;width:100%;min-width:0;font-variant-numeric:tabular-nums" />
            <span style="font-size:calc(30*var(--sk-u));font-weight:600;color:rgba(var(--label),0.4)">₽</span>
          </div>
        </div>
        <div id="sk-tour-desc" style="margin:12px 16px 0;background:var(--card);border-radius:18px;padding:14px 18px">
          <textarea data-input="text" rows="2" placeholder="бетон, 26 кубов, доставка…" style="width:100%;border:none;outline:none;resize:none;font-size:calc(16*var(--sk-u));color:var(--text);background:transparent;font-family:inherit;line-height:1.4">${esc(d.text)}</textarea>
          <div style="font-size:calc(12*var(--sk-u));color:rgba(var(--label),0.45);margin-top:2px">Пишите как удобно — категория необязательна</div>
        </div>
        <div style="font-size:calc(13*var(--sk-u));color:rgba(var(--label),0.6);padding:16px 24px 7px;letter-spacing:-0.08px">ОБЪЕКТ</div>
        <div style="display:flex;gap:8px;padding:0 16px;flex-wrap:wrap">${homeChips}</div>
        <div style="font-size:calc(13*var(--sk-u));color:rgba(var(--label),0.6);padding:16px 24px 7px;letter-spacing:-0.08px">КАТЕГОРИЯ · необязательно</div>
        <div style="display:flex;gap:8px;padding:0 16px;flex-wrap:wrap">${catChips}</div>
        <div style="font-size:calc(13*var(--sk-u));color:rgba(var(--label),0.6);padding:16px 24px 7px;letter-spacing:-0.08px">СТАТУС</div>
        <div style="margin:0 16px;background:var(--seg);border-radius:9px;padding:2px;display:flex;gap:2px">${paidSegs}</div>
        <div style="margin:14px 16px 0;background:var(--card);border-radius:18px;overflow:hidden">
          <div data-action="toggleSplit" style="display:flex;align-items:center;justify-content:space-between;padding:13px 16px;border-bottom:0.5px solid rgba(var(--label),0.1);cursor:pointer">
            <span style="font-size:calc(16*var(--sk-u));color:var(--text)">Разделить между объектами</span>
            <span style="${splitToggle}"><span style="${splitKnob}"></span></span>
          </div>
          <div data-action="togglePhoto" style="display:flex;align-items:center;justify-content:space-between;padding:13px 16px;cursor:pointer">
            <span style="font-size:calc(16*var(--sk-u));color:var(--text)">Фото чека</span>
            <span style="${photoLabelStyle}">${photoLabel}</span>
          </div>
        </div>
        <div style="padding:18px 16px 0">
          <div data-action="saveExpense" style="height:52px;background:#0a84ff;border-radius:15px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:calc(17*var(--sk-u));font-weight:600;cursor:pointer">Сохранить расход</div>
          <div style="text-align:center;font-size:calc(12*var(--sk-u));color:rgba(var(--label),0.5);margin-top:8px">Сразу увидит Таня · сохраняется офлайн</div>
        </div>
      </div>
    </div>`;
}

// ░░░░░ ЛИСТ: НОВАЯ ЗАМЕТКА ░░░░░
export function noteSheet(state, animate = false) {
  if (state.sheet !== 'note') return '';
  const d = state.noteDraft;
  const dimAnim = animate ? 'animation:sk-fade 0.25s ease' : '';
  const sheetAnim = animate ? 'animation:sk-sheet 0.32s cubic-bezier(0.32,0.72,0,1)' : '';
  const photoLabel = d.photo ? 'прикреплено ✓' : 'добавить';
  const photoLabelStyle = d.photo ? 'font-size:calc(15*var(--sk-u));color:#248a43;font-weight:500' : 'font-size:calc(15*var(--sk-u));color:#0a84ff';

  return `
    <div style="position:absolute;inset:0;z-index:40">
      <div data-action="closeSheet" style="position:absolute;inset:0;background:rgba(0,0,0,0.32);${dimAnim}"></div>
      <div style="position:absolute;left:0;right:0;bottom:0;background:var(--bg);border-radius:26px 26px 0 0;padding:8px 0 30px;${sheetAnim};max-height:94%;overflow-y:auto;box-shadow:0 -8px 30px rgba(0,0,0,0.18)">
        <div style="width:38px;height:5px;border-radius:3px;background:rgba(var(--label),0.25);margin:0 auto 6px"></div>
        <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 18px 12px">
          <span data-action="closeSheet" style="font-size:calc(17*var(--sk-u));color:#0a84ff;cursor:pointer">Отмена</span>
          <span style="font-size:calc(17*var(--sk-u));font-weight:600;color:var(--text)">Новая заметка</span>
          <span style="font-size:calc(17*var(--sk-u));color:rgba(var(--label),0.3);width:54px;text-align:right">·</span>
        </div>
        <div style="margin:0 16px;background:var(--card);border-radius:18px;padding:14px 18px">
          <textarea data-input="note-text" rows="3" placeholder="код от ворот, договорённость, что не забыть…" style="width:100%;border:none;outline:none;resize:none;font-size:calc(16*var(--sk-u));color:var(--text);background:transparent;font-family:inherit;line-height:1.4">${esc(d.text)}</textarea>
        </div>
        <div style="margin:14px 16px 0;background:var(--card);border-radius:18px;overflow:hidden">
          <div data-action="toggleNotePhoto" style="display:flex;align-items:center;justify-content:space-between;padding:13px 16px;cursor:pointer">
            <span style="font-size:calc(16*var(--sk-u));color:var(--text)">Фото</span>
            <span style="${photoLabelStyle}">${photoLabel}</span>
          </div>
        </div>
        <div style="padding:18px 16px 0">
          <div data-action="saveNote" style="height:52px;background:#0a84ff;border-radius:15px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:calc(17*var(--sk-u));font-weight:600;cursor:pointer">Сохранить заметку</div>
          <div style="text-align:center;font-size:calc(12*var(--sk-u));color:rgba(var(--label),0.5);margin-top:8px">Привязана к объекту · видит Таня</div>
        </div>
      </div>
    </div>`;
}

// ░░░░░ ЛИСТ: ВЫПЛАТА БРИГАДЕ ░░░░░
export function payoutSheet(state, animate = false) {
  if (state.sheet !== 'payout') return '';
  const d = state.payoutDraft || {};
  const dimAnim = animate ? 'animation:sk-fade 0.25s ease' : '';
  const sheetAnim = animate ? 'animation:sk-sheet 0.32s cubic-bezier(0.32,0.72,0,1)' : '';
  const amountDisplay = d.amount ? Number(d.amount).toLocaleString('ru-RU') : '';

  const crewChips = (state.crewsDir || []).map((name) => {
    const active = (d.crew || '') === name;
    const style = 'font-size:calc(14*var(--sk-u));font-weight:500;padding:8px 14px;border-radius:11px;cursor:pointer;white-space:nowrap;' +
      (active ? 'background:#0a84ff;color:#fff' : 'background:var(--card);color:var(--text);box-shadow:0 1px 2px rgba(0,0,0,0.04)');
    return `<div data-action="setPayoutCrew" data-crew="${esc(name)}" style="${style}">${esc(name)}</div>`;
  }).join('');

  return `
    <div style="position:absolute;inset:0;z-index:40">
      <div data-action="closeSheet" style="position:absolute;inset:0;background:rgba(0,0,0,0.32);${dimAnim}"></div>
      <div style="position:absolute;left:0;right:0;bottom:0;background:var(--bg);border-radius:26px 26px 0 0;padding:8px 0 30px;${sheetAnim};max-height:94%;overflow-y:auto;box-shadow:0 -8px 30px rgba(0,0,0,0.18)">
        <div style="width:38px;height:5px;border-radius:3px;background:rgba(var(--label),0.25);margin:0 auto 6px"></div>
        <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 18px 12px">
          <span data-action="closeSheet" style="font-size:calc(17*var(--sk-u));color:#0a84ff;cursor:pointer">Отмена</span>
          <span style="font-size:calc(17*var(--sk-u));font-weight:600;color:var(--text)">Выплата бригаде</span>
          <span style="font-size:calc(17*var(--sk-u));color:rgba(var(--label),0.3);width:54px;text-align:right">·</span>
        </div>

        <div style="margin:0 16px;background:var(--card);border-radius:18px;padding:18px 18px">
          <div style="font-size:calc(12*var(--sk-u));color:rgba(var(--label),0.6);font-weight:500">Сумма</div>
          <div style="display:flex;align-items:baseline;gap:6px;margin-top:2px">
            <input value="${esc(amountDisplay)}" data-input="payout-amount" inputmode="numeric" placeholder="0" style="border:none;outline:none;font-size:calc(40*var(--sk-u));font-weight:700;letter-spacing:-1px;color:var(--text);background:transparent;font-family:inherit;width:100%;min-width:0;font-variant-numeric:tabular-nums" />
            <span style="font-size:calc(30*var(--sk-u));font-weight:600;color:rgba(var(--label),0.4)">₽</span>
          </div>
        </div>

        <div style="font-size:calc(13*var(--sk-u));color:rgba(var(--label),0.6);padding:16px 24px 7px;letter-spacing:-0.08px">БРИГАДА</div>
        <div style="display:flex;gap:8px;padding:0 16px 10px;flex-wrap:wrap">${crewChips}</div>
        <div style="margin:0 16px;background:var(--card);border-radius:14px;padding:2px 14px">
          <input value="${esc(d.crew || '')}" data-input="payout-crew" placeholder="или впишите бригаду…" style="width:100%;border:none;outline:none;font-size:calc(16*var(--sk-u));color:var(--text);background:transparent;font-family:inherit;min-height:48px" />
        </div>

        <div style="font-size:calc(13*var(--sk-u));color:rgba(var(--label),0.6);padding:16px 24px 7px;letter-spacing:-0.08px">ЗА КАКУЮ РАБОТУ</div>
        <div style="margin:0 16px;background:var(--card);border-radius:14px;padding:2px 14px">
          <input value="${esc(d.work || '')}" data-input="payout-work" placeholder="напр. кладка стен, электромонтаж" style="width:100%;border:none;outline:none;font-size:calc(16*var(--sk-u));color:var(--text);background:transparent;font-family:inherit;min-height:48px" />
        </div>

        <div style="font-size:calc(13*var(--sk-u));color:rgba(var(--label),0.6);padding:16px 24px 7px;letter-spacing:-0.08px">ДАТА</div>
        <div style="margin:0 16px;background:var(--card);border-radius:14px;padding:2px 14px">
          <input value="${esc(d.date || '')}" data-input="payout-date" inputmode="numeric" placeholder="дд.мм" style="width:100%;border:none;outline:none;font-size:calc(16*var(--sk-u));color:var(--text);background:transparent;font-family:inherit;min-height:48px" />
        </div>

        <div style="padding:20px 16px 0">
          <div data-action="savePayout" style="height:52px;background:#0a84ff;border-radius:15px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:calc(17*var(--sk-u));font-weight:600;cursor:pointer">Сохранить выплату</div>
          <div style="text-align:center;font-size:calc(12*var(--sk-u));color:rgba(var(--label),0.5);margin-top:8px">Попадёт в расходы (Работа) и в себестоимость · видит Таня</div>
        </div>
      </div>
    </div>`;
}


// ░░░░░ ТОСТ ░░░░░
export function toast(state, animate = false) {
  if (!state.toast) return '';
  const anim = animate ? 'animation:sk-toast 0.3s ease;' : '';
  return `
    <div style="position:absolute;left:50%;bottom:118px;z-index:50;display:flex;align-items:center;gap:9px;background:var(--invert);color:#fff;padding:11px 18px;border-radius:999px;box-shadow:0 8px 24px rgba(0,0,0,0.3);${anim}white-space:nowrap">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#34c759"/><path d="M7 12.5l3 3 6-6.5" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <span style="font-size:calc(14*var(--sk-u));font-weight:500">${esc(state.toast)}</span>
    </div>`;
}

// ░░░░░░░░░░ ЭКРАН: НАСТРОЙКИ И УПРАВЛЕНИЕ ░░░░░░░░░░
const SK_CHEVR = '<svg width="9" height="15" viewBox="0 0 9 15" fill="none" style="flex-shrink:0"><path d="M1.5 1.5l6 6-6 6" stroke="rgba(var(--label),0.35)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const SK_CHECK = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7" stroke="#0a84ff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const skGroupHead = (t) =>
  `<div style="font-size:calc(13*var(--sk-u));color:rgba(var(--label),0.6);padding:20px 24px 8px;letter-spacing:-0.08px">${t}</div>`;

// Каркас экрана настроек: шапка с «назад» + крупный заголовок + тело.
function skChrome(title, body, backLabel) {
  return `
    <div style="padding-bottom:120px">
      <div style="padding:54px 16px 0;display:flex;align-items:center">
        <div data-action="settingsBack" style="display:flex;align-items:center;gap:2px;cursor:pointer;color:#0a84ff;margin-left:-4px">
          <svg width="11" height="18" viewBox="0 0 11 18" fill="none"><path d="M9 2L2 9l7 7" stroke="#0a84ff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span style="font-size:calc(17*var(--sk-u));letter-spacing:-0.3px">${esc(backLabel || 'Назад')}</span>
        </div>
      </div>
      <div style="padding:14px 20px 6px"><div style="font-size:calc(28*var(--sk-u));font-weight:700;letter-spacing:-0.5px;color:var(--text)">${esc(title)}</div></div>
      ${body}
    </div>`;
}

const skNavRow = (label, view, sub, last) =>
  `<div data-action="settingsGo" data-view="${view}" style="display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:58px;padding:8px 18px;cursor:pointer;${last ? '' : 'border-bottom:0.5px solid rgba(var(--label),0.1)'}">
     <span style="font-size:calc(17*var(--sk-u));color:var(--text)">${esc(label)}</span>
     <span style="display:flex;align-items:center;gap:8px">${sub ? `<span style="font-size:calc(15*var(--sk-u));color:rgba(var(--label),0.5)">${esc(sub)}</span>` : ''}${SK_CHEVR}</span>
   </div>`;

const skActionRow = (label, action, last, danger) =>
  `<div data-action="${action}" style="display:flex;align-items:center;justify-content:space-between;min-height:58px;padding:8px 18px;cursor:pointer;${last ? '' : 'border-bottom:0.5px solid rgba(var(--label),0.1)'}">
     <span style="font-size:calc(17*var(--sk-u));color:${danger ? '#ff3b30' : 'var(--text)'}">${esc(label)}</span>
     ${danger ? '' : SK_CHEVR}
   </div>`;

const skCard = (inner) =>
  `<div style="margin:0 16px;background:var(--card);border-radius:16px;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,0.04)">${inner}</div>`;

const skBigBtn = (label, action, opts = {}) =>
  `<div data-action="${action}"${opts.id ? ` data-id="${opts.id}"` : ''} style="min-height:${opts.h || 52}px;padding:0 18px;display:flex;align-items:center;justify-content:center;gap:7px;border-radius:14px;cursor:pointer;font-size:calc(${opts.fs || 16}*var(--sk-u));font-weight:600;${opts.style || 'background:#0a84ff;color:#fff'}">${label}</div>`;

export function settingsScreen(state) {
  const v = state.settingsView || 'main';
  if (v === 'objects') return skObjects(state);
  if (v === 'objectForm') return skObjectForm(state);
  if (v === 'crews') return skList(state, 'crewsDir', 'Бригады', 'Постоянные бригады. Их можно выбрать при добавлении выплаты.');
  if (v === 'categories') return skList(state, 'categories', 'Категории расходов', 'Метки подсказываются при вводе расхода. Категория необязательна.');
  if (v === 'stages') return skList(state, 'stagesTemplate', 'Шаблон этапов', 'Предлагается новым объектам. У существующих объектов этапы свои.');
  if (v === 'requisites') return skRequisites(state);
  return skMain(state);
}

function skMain(state) {
  const themeOpts = [['auto', 'Авто'], ['light', 'Светлая'], ['dark', 'Тёмная']];
  const themeRows = themeOpts.map(([k, l], i) =>
    `<div data-action="setTheme" data-theme="${k}" style="display:flex;align-items:center;justify-content:space-between;min-height:56px;padding:0 18px;cursor:pointer;${i === themeOpts.length - 1 ? '' : 'border-bottom:0.5px solid rgba(var(--label),0.1)'}">
       <span style="font-size:calc(17*var(--sk-u));color:var(--text);font-weight:${state.theme === k ? '600' : '400'}">${l}</span>
       ${state.theme === k ? SK_CHECK : ''}
     </div>`).join('');

  const sizeOpts = [['normal', 'А', 16], ['large', 'А', 20], ['xlarge', 'А', 25]];
  const sizeBtns = sizeOpts.map(([k, l, fs]) =>
    `<div data-action="setFontScale" data-scale="${k}" style="flex:1;min-height:64px;display:flex;align-items:center;justify-content:center;border-radius:14px;cursor:pointer;font-weight:700;font-size:calc(${fs}*var(--sk-u));${state.fontScale === k ? 'background:#0a84ff;color:#fff' : 'background:var(--card);color:var(--text);box-shadow:0 1px 2px rgba(0,0,0,0.06)'}">${l}</div>`).join('');

  const activeCount = state.homes.filter((h) => !h.archived).length;
  const archived = state.homes.length - activeCount;
  const reqName = state.requisites && state.requisites.name ? (state.requisites.form || '') : 'не заданы';

  const body = `
    ${skGroupHead('ВНЕШНИЙ ВИД')}
    ${skCard(themeRows)}
    <div style="display:flex;gap:10px;padding:10px 16px 0">${sizeBtns}</div>
    <div style="font-size:calc(13*var(--sk-u));color:rgba(var(--label),0.5);padding:8px 24px 0;line-height:1.4">Обычный · крупный · очень крупный. Учитывается и размер текста в настройках телефона.</div>

    ${skGroupHead('УПРАВЛЕНИЕ')}
    ${skCard(
      skNavRow('Объекты', 'objects', archived ? `${activeCount} + ${archived} в архиве` : String(activeCount)) +
      skNavRow('Бригады', 'crews', String((state.crewsDir || []).length)) +
      skNavRow('Категории расходов', 'categories', String((state.categories || []).length)) +
      skNavRow('Шаблон этапов', 'stages', String((state.stagesTemplate || []).length)) +
      skNavRow('Реквизиты для актов', 'requisites', reqName, true)
    )}

    ${skGroupHead('ДАННЫЕ')}
    ${skCard(
      skActionRow('Резервная копия (выгрузка)', 'exportData') +
      skActionRow('Печать сводки (PDF)', 'printSummary') +
      skActionRow('Сбросить демо-данные', 'askResetDemo', true, true)
    )}

    ${skGroupHead('УЧАСТНИКИ')}
    ${skCard(
      `<div style="display:flex;align-items:center;justify-content:space-between;min-height:54px;padding:0 18px;border-bottom:0.5px solid rgba(var(--label),0.1)"><span style="font-size:calc(17*var(--sk-u));color:var(--text)">Таня</span><span style="font-size:calc(14*var(--sk-u));color:rgba(var(--label),0.5)">финансы, документы</span></div>
       <div style="display:flex;align-items:center;justify-content:space-between;min-height:54px;padding:0 18px"><span style="font-size:calc(17*var(--sk-u));color:var(--text)">Гриша</span><span style="font-size:calc(14*var(--sk-u));color:rgba(var(--label),0.5)">стройка, материалы</span></div>`
    )}
    <div style="font-size:calc(13*var(--sk-u));color:rgba(var(--label),0.5);padding:8px 24px 0;line-height:1.4">Оба — равноправные партнёры, данные общие.</div>`;

  return skChrome('Настройки', body, 'Готово');
}

function skObjects(state) {
  const cards = state.homes.map((h) => {
    const sub = h.type === 'contract'
      ? `По договору · ${esc(h.client || 'клиент не указан')} · ${fmt(h.price || 0)}`
      : `На продажу · цена ${h.price ? fmt(h.price) : '—'}`;
    return `
      <div style="margin:0 16px 12px;background:var(--card);border-radius:16px;padding:14px 16px;box-shadow:0 1px 2px rgba(0,0,0,0.04);${h.archived ? 'opacity:0.62' : ''}">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
          <div style="font-size:calc(17*var(--sk-u));font-weight:600;color:var(--text)">${esc(h.name)}</div>
          <span style="${badge(h.type)}">${h.type === 'contract' ? 'По договору' : 'На продажу'}</span>
        </div>
        <div style="font-size:calc(13*var(--sk-u));color:rgba(var(--label),0.6);margin-top:4px">${sub}${h.archived ? ' · в архиве' : ''}</div>
        <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
          ${skBigBtn('Изменить', 'objEdit', { id: h.id, h: 44, fs: 15, style: 'color:#0a84ff;background:rgba(10,132,255,0.1)' })}
          ${skBigBtn(h.archived ? 'Из архива' : 'В архив', 'objArchiveToggle', { id: h.id, h: 44, fs: 15, style: 'color:var(--text);background:var(--seg)' })}
          ${skBigBtn('Удалить', 'askObjDelete', { id: h.id, h: 44, fs: 15, style: 'color:#ff3b30;background:rgba(255,59,48,0.1)' })}
        </div>
      </div>`;
  }).join('');

  const body = `
    <div style="padding:0 16px 4px">
      ${skBigBtn('<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/></svg>Новый объект', 'objAddNew', { h: 52 })}
    </div>
    <div style="height:14px"></div>
    ${cards}`;
  return skChrome('Объекты', body, 'Настройки');
}

function skObjectForm(state) {
  const f = state.objForm || { id: null, name: '', type: 'contract', client: '', price: '' };
  const isContract = f.type === 'contract';
  const segBase = 'flex:1;text-align:center;padding:11px 4px;border-radius:9px;font-size:calc(15*var(--sk-u));cursor:pointer;';
  const typeSeg =
    `<div data-action="setObjType" data-type="contract" style="${segBase}${isContract ? 'font-weight:600;color:var(--text);background:var(--card);box-shadow:0 1px 3px rgba(0,0,0,0.12)' : 'font-weight:500;color:rgba(var(--label),0.6)'}">По договору</div>` +
    `<div data-action="setObjType" data-type="spec" style="${segBase}${!isContract ? 'font-weight:600;color:var(--text);background:var(--card);box-shadow:0 1px 3px rgba(0,0,0,0.12)' : 'font-weight:500;color:rgba(var(--label),0.6)'}">На продажу</div>`;

  const inp = (label, key, value, extra = '') =>
    `<label style="display:block;padding:11px 16px;border-bottom:0.5px solid rgba(var(--label),0.1)">
       <span style="font-size:calc(12*var(--sk-u));color:rgba(var(--label),0.6);font-weight:500">${label}</span>
       <input value="${esc(value)}" data-input="${key}" ${extra} style="width:100%;border:none;outline:none;font-size:calc(17*var(--sk-u));color:var(--text);margin-top:4px;background:transparent;font-family:inherit;min-height:28px" />
     </label>`;

  const priceLabel = isContract ? 'Стоимость по договору, ₽' : 'Цена продажи, ₽';
  const priceDisplay = f.price ? Number(String(f.price).replace(/\D/g, '')).toLocaleString('ru-RU') : '';

  const body = `
    <div style="font-size:calc(13*var(--sk-u));color:rgba(var(--label),0.6);padding:8px 24px 8px;letter-spacing:-0.08px">ТИП</div>
    <div style="margin:0 16px;background:var(--seg);border-radius:11px;padding:2px;display:flex;gap:2px">${typeSeg}</div>
    <div style="height:14px"></div>
    ${skCard(
      inp('Название', 'obj-name', f.name, 'placeholder="напр. Дом на Озёрной"') +
      (isContract ? inp('Клиент', 'obj-client', f.client, 'placeholder="ФИО заказчика"') : '') +
      `<label style="display:block;padding:11px 16px">
         <span style="font-size:calc(12*var(--sk-u));color:rgba(var(--label),0.6);font-weight:500">${priceLabel}</span>
         <input value="${esc(priceDisplay)}" data-input="obj-price" inputmode="numeric" placeholder="0" style="width:100%;border:none;outline:none;font-size:calc(17*var(--sk-u));color:var(--text);margin-top:4px;background:transparent;font-family:inherit;min-height:28px" />
       </label>`
    )}
    <div style="padding:20px 16px 0">${skBigBtn(f.id ? 'Сохранить' : 'Создать объект', 'objSave', { h: 54, fs: 17 })}</div>`;
  return skChrome(f.id ? 'Изменить объект' : 'Новый объект', body, 'Объекты');
}

function skList(state, store, title, hint) {
  const items = state[store] || [];
  const rows = items.length
    ? items.map((it, idx) =>
        `<div style="display:flex;align-items:center;gap:8px;padding:6px 10px 6px 16px;${idx < items.length - 1 ? 'border-bottom:0.5px solid rgba(var(--label),0.1)' : ''}">
           <input value="${esc(it)}" data-input="edit" data-store="${store}" data-idx="${idx}" style="flex:1;min-width:0;border:none;outline:none;background:transparent;font-size:calc(16*var(--sk-u));color:var(--text);font-family:inherit;min-height:44px" />
           <div data-action="delAdminItem" data-store="${store}" data-idx="${idx}" title="Удалить" style="width:44px;height:44px;border-radius:11px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#ff3b30;font-size:calc(18*var(--sk-u));flex-shrink:0">✕</div>
         </div>`).join('')
    : `<div style="padding:20px 16px;text-align:center;color:rgba(var(--label),0.45);font-size:calc(14*var(--sk-u))">Пока пусто</div>`;

  const body = `
    ${hint ? `<div style="margin:0 24px 10px;font-size:calc(13*var(--sk-u));color:rgba(var(--label),0.55);line-height:1.4">${esc(hint)}</div>` : ''}
    ${skCard(rows)}
    <div style="display:flex;gap:10px;margin:14px 16px 0">
      <input value="${esc(state.adminDraft || '')}" data-input="adminDraft" placeholder="Добавить…" style="flex:1;min-height:52px;border:none;outline:none;background:var(--card);border-radius:14px;padding:0 16px;font-size:calc(16*var(--sk-u));color:var(--text);font-family:inherit;box-shadow:0 1px 2px rgba(0,0,0,0.04)" />
      <div data-action="addAdminItem" data-store="${store}" style="min-width:112px;min-height:52px;display:flex;align-items:center;justify-content:center;background:#0a84ff;color:#fff;border-radius:14px;font-size:calc(16*var(--sk-u));font-weight:600;cursor:pointer">Добавить</div>
    </div>`;
  return skChrome(title, body, 'Настройки');
}

function skRequisites(state) {
  const r = state.requisites || { form: 'ИП', name: '', inn: '', extra: '' };
  const forms = ['ИП', 'ООО', 'Самозанятый'];
  const segBase = 'flex:1;text-align:center;padding:11px 4px;border-radius:9px;font-size:calc(14*var(--sk-u));cursor:pointer;';
  const formSeg = forms.map((fm) =>
    `<div data-action="setReqForm" data-form="${fm}" style="${segBase}${r.form === fm ? 'font-weight:600;color:var(--text);background:var(--card);box-shadow:0 1px 3px rgba(0,0,0,0.12)' : 'font-weight:500;color:rgba(var(--label),0.6)'}">${fm}</div>`).join('');

  const inp = (label, key, value, last) =>
    `<label style="display:block;padding:11px 16px;${last ? '' : 'border-bottom:0.5px solid rgba(var(--label),0.1)'}">
       <span style="font-size:calc(12*var(--sk-u));color:rgba(var(--label),0.6);font-weight:500">${label}</span>
       <input value="${esc(value)}" data-input="${key}" style="width:100%;border:none;outline:none;font-size:calc(17*var(--sk-u));color:var(--text);margin-top:4px;background:transparent;font-family:inherit;min-height:28px" />
     </label>`;

  const body = `
    <div style="font-size:calc(13*var(--sk-u));color:rgba(var(--label),0.6);padding:8px 24px 8px;letter-spacing:-0.08px">ФОРМА</div>
    <div style="margin:0 16px;background:var(--seg);border-radius:11px;padding:2px;display:flex;gap:2px">${formSeg}</div>
    <div style="height:14px"></div>
    ${skCard(
      inp('Название / ФИО', 'req-name', r.name || '') +
      inp('ИНН', 'req-inn', r.inn || '') +
      inp('Доп. реквизиты', 'req-extra', r.extra || '', true)
    )}
    <div style="margin:14px 24px 0;font-size:calc(13*var(--sk-u));color:rgba(var(--label),0.5);line-height:1.45">Подставляются в акт как исполнитель. Реквизиты заказчика вводятся в самом акте.</div>`;
  return skChrome('Реквизиты для актов', body, 'Настройки');
}

// ░░░░░ ДИАЛОГ ПОДТВЕРЖДЕНИЯ ░░░░░
export function confirmDialog(state) {
  if (!state.confirm) return '';
  const c = state.confirm;
  return `
    <div style="position:absolute;inset:0;z-index:60">
      <div data-action="confirmNo" style="position:absolute;inset:0;background:rgba(0,0,0,0.45);animation:sk-fade 0.2s ease"></div>
      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:28px;pointer-events:none">
        <div style="background:var(--card);border-radius:20px;padding:22px 20px;max-width:320px;width:100%;pointer-events:auto;animation:sk-pop 0.2s ease;box-shadow:0 12px 40px rgba(0,0,0,0.35)">
          <div style="font-size:calc(16*var(--sk-u));color:var(--text);line-height:1.4;text-align:center">${esc(c.text)}</div>
          <div style="display:flex;gap:10px;margin-top:20px">
            <div data-action="confirmNo" style="flex:1;min-height:50px;display:flex;align-items:center;justify-content:center;border-radius:13px;background:var(--seg);color:var(--text);font-size:calc(16*var(--sk-u));font-weight:600;cursor:pointer">Отмена</div>
            <div data-action="confirmYes" style="flex:1;min-height:50px;display:flex;align-items:center;justify-content:center;border-radius:13px;background:#ff3b30;color:#fff;font-size:calc(16*var(--sk-u));font-weight:600;cursor:pointer">${esc(c.okLabel || 'Удалить')}</div>
          </div>
        </div>
      </div>
    </div>`;
}
