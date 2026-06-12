// Screen templates — return HTML strings with the exact inline styles from the
// СтройКонтроль design. Interactivity is wired through data-action / data-input
// attributes (see app.js for the delegated handlers).
import { STAGES, CATS, CAT_COLOR } from './data.js';
import { fmt, fmtShort, total, unpaid, crewRemain, totalObligations, margin, catStyle, badge, barColor, esc } from './helpers.js';

const avatar = (letter, bg, size = 28, ml = 0, border = true) =>
  `<span style="width:${size}px;height:${size}px;border-radius:50%;background:${bg};color:#fff;font-size:${size === 28 ? 13 : 12}px;font-weight:600;display:flex;align-items:center;justify-content:center;${border ? 'border:2px solid #f2f2f7;' : ''}${ml ? `margin-left:${ml}px;` : ''}">${letter}</span>`;

const headerAvatars = () =>
  `<div style="display:flex">${avatar('Т', '#0a84ff')}${avatar('Г', '#ff9500', 28, -9)}</div>`;

const objectAvatars = () =>
  `<div style="display:flex;align-items:center;gap:6px">` +
  `<span style="width:26px;height:26px;border-radius:50%;background:#0a84ff;color:#fff;font-size:12px;font-weight:600;display:flex;align-items:center;justify-content:center">Т</span>` +
  `<span style="width:26px;height:26px;border-radius:50%;background:#ff9500;color:#fff;font-size:12px;font-weight:600;display:flex;align-items:center;justify-content:center">Г</span></div>`;

// «?» — перезапуск демо-тура из шапки
const tourBtn = () =>
  `<div data-action="startTour" title="Тур" style="width:28px;height:28px;border-radius:50%;background:rgba(118,118,128,0.14);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:15px;font-weight:700;color:#0a84ff;flex-shrink:0">?</div>`;

const backChevron = (label, action) =>
  `<div data-action="${action}" style="display:flex;align-items:center;gap:2px;cursor:pointer;color:#0a84ff;margin-left:-4px">
     <svg width="11" height="18" viewBox="0 0 11 18" fill="none"><path d="M9 2L2 9l7 7" stroke="#0a84ff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
     <span style="font-size:17px;letter-spacing:-0.3px">${label}</span>
   </div>`;

// ░░░░░ СПИСОК ОБЪЕКТОВ ░░░░░
export function listScreen(state) {
  const homes = state.homes;
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
      rightCol = `<div style="font-size:13px;font-weight:600;color:${col}">${pct}%</div>
         <div style="font-size:12px;color:rgba(60,60,67,0.5);margin-top:1px">из ${fmt(h.price)}</div>`;
    } else if (h.type === 'spec' && h.price) {
      const m = margin(h);
      rightCol = `<div style="font-size:14px;font-weight:700;color:#248a43">+${fmt(m)}</div>
         <div style="font-size:12px;color:rgba(60,60,67,0.5);margin-top:1px">маржа · цена ${fmtShort(h.price)}</div>`;
    } else {
      rightCol = `<div style="font-size:12px;color:rgba(60,60,67,0.5);max-width:120px">Цена продажи не задана</div>`;
    }

    const progress = hasPrice
      ? `<div style="margin-top:10px;height:6px;border-radius:3px;background:#e9e9ee;overflow:hidden">
           <div style="height:100%;border-radius:3px;width:${Math.min(pct || 0, 100)}%;background:${col}"></div>
         </div>`
      : '';

    return `
      <div ${_hi === 0 ? 'id="sk-tour-card"' : ''} data-action="openHome" data-id="${h.id}" style="margin:0 16px 12px;background:#fff;border-radius:20px;padding:16px 16px 14px;box-shadow:0 1px 2px rgba(0,0,0,0.04);cursor:pointer">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px">
          <div style="min-width:0">
            <div style="font-size:17px;font-weight:600;color:#1c1c1e;letter-spacing:-0.3px;line-height:1.2">${esc(h.name)}</div>
            <div style="font-size:13px;color:rgba(60,60,67,0.6);margin-top:2px">${esc(h.address)}</div>
          </div>
          <span style="${badge(h.type)}">${h.type === 'contract' ? 'По договору' : 'На продажу'}</span>
        </div>
        <div style="margin-top:14px;display:flex;align-items:flex-end;justify-content:space-between;gap:12px">
          <div>
            <div style="font-size:12px;color:rgba(60,60,67,0.6);font-weight:500">Себестоимость</div>
            <div style="font-size:27px;font-weight:700;letter-spacing:-0.7px;color:#1c1c1e;line-height:1.05;margin-top:1px">${fmt(tot)}</div>
          </div>
          <div style="text-align:right;flex-shrink:0">${rightCol}</div>
        </div>
        ${progress}
        <div style="margin-top:13px;padding-top:12px;border-top:0.5px solid rgba(60,60,67,0.1);display:flex;align-items:center;justify-content:space-between;gap:8px">
          <div style="display:flex;align-items:center;gap:6px;min-width:0">
            <span style="width:6px;height:6px;border-radius:50%;background:#0a84ff;flex-shrink:0"></span>
            <span style="font-size:13px;color:#1c1c1e;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(STAGES[h.stageIndex])}</span>
            <span style="font-size:13px;color:rgba(60,60,67,0.4)">· ${h.stageIndex + 1} из ${STAGES.length}</span>
          </div>
          ${unpaidLabel ? `<span style="font-size:12px;font-weight:600;color:#c2410c;background:rgba(255,149,0,0.13);padding:3px 8px;border-radius:999px;white-space:nowrap;flex-shrink:0">${esc(unpaidLabel)}</span>` : ''}
        </div>
      </div>`;
  }).join('');

  return `
    <div style="padding-bottom:120px">
      <div style="padding:56px 20px 6px;display:flex;align-items:flex-end;justify-content:space-between">
        <div style="font-size:34px;font-weight:700;letter-spacing:-0.6px;color:#1c1c1e">Объекты</div>
        <div style="display:flex;align-items:center;gap:8px;padding-bottom:6px">
          ${tourBtn()}
          <div style="display:flex;align-items:center;gap:5px;background:rgba(52,199,89,0.12);padding:4px 9px 4px 7px;border-radius:999px">
            <span style="width:7px;height:7px;border-radius:50%;background:#34c759;box-shadow:0 0 0 2px rgba(52,199,89,0.25)"></span>
            <span style="font-size:12px;font-weight:600;color:#248a43;letter-spacing:-0.1px">Синхр.</span>
          </div>
          ${headerAvatars()}
        </div>
      </div>
      <div id="sk-tour-summary" style="margin:14px 16px 8px;background:#1c1c1e;border-radius:22px;padding:18px 20px 16px;color:#fff;box-shadow:0 8px 24px rgba(0,0,0,0.16)">
        <div style="font-size:13px;font-weight:500;color:rgba(235,235,245,0.6);letter-spacing:-0.1px">Себестоимость всех объектов</div>
        <div style="font-size:36px;font-weight:700;letter-spacing:-1px;margin-top:3px;line-height:1.05">${fmt(allTotal)}</div>
        <div style="font-size:12px;color:rgba(235,235,245,0.45);margin-top:5px">обновлено только что</div>
        <div style="height:0.5px;background:rgba(235,235,245,0.14);margin:13px 0 11px"></div>
        <div style="display:flex;align-items:center;justify-content:space-between">
          <span style="font-size:14px;color:rgba(235,235,245,0.7)">Всего к оплате</span>
          <span style="font-size:18px;font-weight:700;letter-spacing:-0.3px;color:#ffb340">${fmt(allOblig)}</span>
        </div>
      </div>
      <div style="font-size:13px;color:rgba(60,60,67,0.6);padding:14px 24px 8px;letter-spacing:-0.08px">ОБЪЕКТЫ · ${homes.length}</div>
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
        <span style="font-size:13px;color:rgba(60,60,67,0.6)">Стоимость по договору ${fmt(h.price)}</span>
        <span style="font-size:14px;font-weight:700;color:${col}">${pct}%</span>
      </div>
      <div style="margin-top:8px;height:8px;border-radius:4px;background:#e9e9ee;overflow:hidden">
        <div style="height:100%;border-radius:4px;width:${Math.min(pct, 100)}%;background:${col}"></div>
      </div>
      ${warnLabel ? `
      <div id="sk-tour-warn" style="margin-top:11px;display:flex;align-items:center;gap:8px;background:rgba(255,149,0,0.1);border-radius:12px;padding:9px 11px">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M12 2L1 21h22L12 2z" fill="#ff9500"/><rect x="11" y="9" width="2" height="6" rx="1" fill="#fff"/><circle cx="12" cy="18" r="1.2" fill="#fff"/></svg>
        <span style="font-size:13px;color:#9a5b00;font-weight:500;line-height:1.3">${warnLabel}</span>
      </div>` : ''}`;
  } else if (h.type === 'spec' && h.price) {
    const m = margin(h);
    heroExtra = `
      <div style="margin-top:15px;display:flex;align-items:center;justify-content:space-between">
        <span style="font-size:13px;color:rgba(60,60,67,0.6)">Цена продажи ${fmt(h.price)}</span>
        <span style="font-size:12px;font-weight:600;padding:3px 9px;border-radius:7px;background:rgba(255,149,0,0.14);color:#b56b00">На продажу</span>
      </div>
      <div style="margin-top:11px;background:rgba(52,199,89,0.1);border-radius:12px;padding:11px 13px;display:flex;align-items:center;justify-content:space-between">
        <span style="font-size:14px;color:#1c1c1e;font-weight:500">Маржа</span>
        <span style="font-size:20px;font-weight:700;letter-spacing:-0.4px;color:#248a43">+${fmt(m)}</span>
      </div>`;
  } else if (h.type === 'spec') {
    heroExtra = `<div style="margin-top:14px;font-size:13px;color:rgba(60,60,67,0.6);line-height:1.4">Объект на продажу — клиента нет. Цена и маржа задаются во вкладке «Продажа».</div>`;
  }

  // segmented tabs (+ Заметки)
  const tabs = isContract
    ? [['expenses', 'Расходы'], ['crews', 'Бригады'], ['stages', 'Этапы'], ['notes', 'Заметки'], ['client', 'Оплаты']]
    : [['expenses', 'Расходы'], ['crews', 'Бригады'], ['stages', 'Этапы'], ['notes', 'Заметки'], ['sale', 'Продажа']];
  const segBase = 'flex:1;text-align:center;padding:7px 3px;border-radius:7px;font-size:12.5px;letter-spacing:-0.2px;cursor:pointer;';
  const segs = tabs.map(([k, l]) => {
    const active = state.tab === k;
    const style = active
      ? segBase + 'font-weight:600;color:#1c1c1e;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.12)'
      : segBase + 'font-weight:500;color:rgba(60,60,67,0.6);background:transparent';
    return `<div data-action="setTab" data-tab="${k}" style="${style}">${l}</div>`;
  }).join('');

  const tabContent = objectTab(state, h);

  return `
    <div style="padding-bottom:120px">
      <div style="padding:54px 16px 0;display:flex;align-items:center;justify-content:space-between">
        ${backChevron('Объекты', 'back')}
        <div style="display:flex;align-items:center;gap:8px">
          ${tourBtn()}
          ${objectAvatars()}
        </div>
      </div>
      <div style="padding:14px 20px 4px">
        <div style="display:flex;align-items:center;gap:8px">
          <div style="font-size:28px;font-weight:700;letter-spacing:-0.5px;color:#1c1c1e;line-height:1.1">${esc(h.name)}</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:5px">
          <span style="${badge(h.type)}">${h.type === 'contract' ? 'По договору' : 'На продажу'}</span>
          <span style="font-size:13px;color:rgba(60,60,67,0.6)">${esc(h.address)}</span>
        </div>
      </div>
      <div id="sk-tour-cost" style="margin:12px 16px 0;background:#fff;border-radius:22px;padding:18px 20px;box-shadow:0 1px 2px rgba(0,0,0,0.04)">
        <div style="font-size:13px;font-weight:500;color:rgba(60,60,67,0.6)">Себестоимость</div>
        <div style="font-size:38px;font-weight:700;letter-spacing:-1.2px;color:#1c1c1e;line-height:1.02;margin-top:2px">${fmt(tot)}</div>
        ${up > 0 ? `<div style="font-size:13px;color:#c2410c;font-weight:500;margin-top:4px">из них к оплате поставщикам ${fmt(up)}</div>` : ''}
        ${heroExtra}
      </div>
      <div id="sk-tour-tabs" style="margin:18px 16px 0;background:rgba(118,118,128,0.12);border-radius:9px;padding:2px;display:flex;gap:2px">${segs}</div>
      ${tabContent}
    </div>`;
}

function objectTab(state, h) {
  const tab = state.tab;

  if (tab === 'expenses') {
    let splitTagged = false;
    const rows = h.expenses.map((e, i) => {
      const last = i === h.expenses.length - 1;
      const paidStyle = e.paid
        ? 'display:inline-block;margin-top:3px;font-size:11px;font-weight:600;color:#248a43'
        : 'display:inline-block;margin-top:3px;font-size:11px;font-weight:600;color:#c2410c';
      const meta = e.date + ' · ' + (e.who === 'Т' ? 'Таня' : 'Гриша');
      const tags =
        (e.cat ? `<span style="${catStyle(e.cat)}">${esc(e.cat)}</span>` : '') +
        `<span style="font-size:12px;color:rgba(60,60,67,0.5)">${esc(meta)}</span>` +
        (e.photo ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="2" y="6" width="20" height="15" rx="3" stroke="rgba(60,60,67,0.45)" stroke-width="2"/><circle cx="12" cy="13" r="3.5" stroke="rgba(60,60,67,0.45)" stroke-width="2"/><path d="M8 6l1.5-2.5h5L16 6" stroke="rgba(60,60,67,0.45)" stroke-width="2" stroke-linejoin="round"/></svg>` : '') +
        (e.split ? `<span style="font-size:11px;color:#5856d6;font-weight:600;background:rgba(88,86,214,0.1);padding:2px 6px;border-radius:6px">делёж</span>` : '');
      // первая запись с делением — якорь тура
      const anchor = (e.split && !splitTagged) ? (splitTagged = true, ' id="sk-tour-split"') : '';
      return `
        <div${anchor} style="padding:13px 16px;${last ? '' : 'border-bottom:0.5px solid rgba(60,60,67,0.08)'}">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
            <div style="min-width:0;flex:1">
              <div style="font-size:15px;color:#1c1c1e;line-height:1.3;font-weight:450">${esc(e.text)}</div>
              <div style="display:flex;align-items:center;gap:7px;margin-top:6px;flex-wrap:wrap">${tags}</div>
            </div>
            <div style="text-align:right;flex-shrink:0">
              <div style="font-size:16px;font-weight:600;color:#1c1c1e">${fmt(e.amount)}</div>
              <span style="${paidStyle}">${e.paid ? 'оплачено' : 'к оплате'}</span>
            </div>
          </div>
        </div>`;
    }).join('');
    return `<div id="sk-tour-expenses" style="margin:14px 16px 0;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,0.04)">${rows}</div>`;
  }

  if (tab === 'crews') {
    let remainTagged = false;
    const cards = h.crews.map((c) => {
      const paid = c.payouts.reduce((s, x) => s + x.a, 0);
      const remain = c.agreed - paid;
      const remainStyle = remain > 0
        ? 'font-size:12px;font-weight:600;color:#c2410c;background:rgba(255,149,0,0.13);padding:3px 9px;border-radius:999px;white-space:nowrap;flex-shrink:0'
        : 'font-size:12px;font-weight:600;color:#248a43;background:rgba(52,199,89,0.13);padding:3px 9px;border-radius:999px;white-space:nowrap;flex-shrink:0';
      const payoutChips = c.payouts.map((p) =>
        `<span style="font-size:13px;color:#1c1c1e;background:#f2f2f7;border-radius:9px;padding:5px 10px;font-weight:500">${esc(p.d + ' — ' + fmtShort(p.a) + ' ₽')}</span>`
      ).join('');
      const anchor = (remain > 0 && !remainTagged) ? (remainTagged = true, ' id="sk-tour-remain"') : '';
      return `
        <div${anchor} style="background:#fff;border-radius:18px;padding:15px 16px;margin-bottom:11px;box-shadow:0 1px 2px rgba(0,0,0,0.04)">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px">
            <div style="font-size:16px;font-weight:600;color:#1c1c1e;line-height:1.25">${esc(c.work)}</div>
            <span style="${remainStyle}">${remain > 0 ? 'остаток ' + fmt(remain) : 'закрыто'}</span>
          </div>
          <div style="font-size:13px;color:rgba(60,60,67,0.6);margin-top:4px">Договорились: ${fmt(c.agreed)} · выплачено ${fmt(paid)}</div>
          <div style="margin-top:11px;display:flex;flex-wrap:wrap;gap:7px">
            ${payoutChips}
            <span data-action="addPayout" style="font-size:13px;color:#0a84ff;border:1px dashed rgba(10,132,255,0.4);border-radius:9px;padding:5px 10px;font-weight:500;cursor:pointer">+ выплата</span>
          </div>
        </div>`;
    }).join('');
    return `<div style="margin:14px 16px 0">${cards}</div>`;
  }

  if (tab === 'stages') {
    const rows = STAGES.map((name, i) => {
      const done = i < h.stageIndex, current = i === h.stageIndex;
      const dotStyle = done
        ? 'width:24px;height:24px;border-radius:50%;background:#0a84ff;color:#fff;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0'
        : current
          ? 'width:24px;height:24px;border-radius:50%;background:#fff;border:3px solid #0a84ff;display:flex;flex-shrink:0;box-sizing:border-box'
          : 'width:24px;height:24px;border-radius:50%;background:#fff;border:2px solid rgba(60,60,67,0.18);display:flex;flex-shrink:0;box-sizing:border-box';
      const weight = current ? '700' : '500';
      const textColor = current || done ? '#1c1c1e' : 'rgba(60,60,67,0.5)';
      const lineColor = done ? '#0a84ff' : 'rgba(60,60,67,0.12)';
      const connector = i < STAGES.length - 1
        ? `<span style="width:2px;height:22px;background:${lineColor};margin-top:3px"></span>` : '';
      const actBtn = current
        ? `<div id="sk-tour-act" data-action="openAct" style="display:inline-flex;align-items:center;gap:6px;margin-top:9px;background:#0a84ff;color:#fff;font-size:14px;font-weight:600;padding:8px 14px;border-radius:11px;cursor:pointer">
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
            <div style="font-size:15px;font-weight:${weight};color:${textColor};line-height:1.3">${esc(name)}</div>
            ${actBtn}
          </div>
        </div>`;
    }).join('');
    return `<div style="margin:14px 16px 0;background:#fff;border-radius:18px;padding:6px 18px 14px;box-shadow:0 1px 2px rgba(0,0,0,0.04)">${rows}</div>`;
  }

  if (tab === 'notes') {
    const notes = h.notes || [];
    const list = notes.length
      ? notes.map((n, idx) => {
          const last = idx === notes.length - 1;
          const photoTag = n.photo
            ? `<span style="display:inline-flex;align-items:center;gap:4px;font-size:12px;color:rgba(60,60,67,0.5);margin-top:6px">
                 <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="2" y="6" width="20" height="15" rx="3" stroke="rgba(60,60,67,0.45)" stroke-width="2"/><circle cx="12" cy="13" r="3.5" stroke="rgba(60,60,67,0.45)" stroke-width="2"/><path d="M8 6l1.5-2.5h5L16 6" stroke="rgba(60,60,67,0.45)" stroke-width="2" stroke-linejoin="round"/></svg>
                 фото
               </span>` : '';
          return `
            <div style="padding:13px 16px;${last ? '' : 'border-bottom:0.5px solid rgba(60,60,67,0.08)'}">
              <div style="font-size:15px;color:#1c1c1e;line-height:1.35">${esc(n.text)}</div>
              <div style="font-size:12px;color:rgba(60,60,67,0.5);margin-top:4px">${esc(n.date)} · ${n.photo ? 'с фото' : 'заметка'}</div>
              ${photoTag}
            </div>`;
        }).join('')
      : `<div style="padding:22px 16px;text-align:center;font-size:14px;color:rgba(60,60,67,0.45)">Пока нет заметок. Коды, договорённости — сюда.</div>`;
    return `
      <div id="sk-tour-notes" style="margin:14px 16px 0">
        <div style="background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,0.04)">${list}</div>
        <div data-action="openNote" style="margin-top:11px;height:48px;background:#fff;border-radius:15px;display:flex;align-items:center;justify-content:center;gap:7px;color:#0a84ff;font-size:16px;font-weight:600;cursor:pointer;box-shadow:0 1px 2px rgba(0,0,0,0.04)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#0a84ff" stroke-width="2.4" stroke-linecap="round"/></svg>
          Заметка
        </div>
      </div>`;
  }

  if (tab === 'client') {
    const hasPrice = h.type === 'contract' && h.price;
    const cVnes = h.clientPayments.reduce((s, p) => s + p.a, 0);
    const cPct = hasPrice ? Math.round((cVnes / h.price) * 100) : 0;
    const rows = h.clientPayments.map((p, idx) => {
      const last = idx === h.clientPayments.length - 1;
      return `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:13px 16px;${last ? '' : 'border-bottom:0.5px solid rgba(60,60,67,0.08)'}">
          <div>
            <div style="font-size:15px;color:#1c1c1e;font-weight:500">${esc(p.d)}</div>
            ${p.escrow ? `<div style="font-size:12px;color:#5856d6;font-weight:600;margin-top:2px">эскроу · внутреннее</div>` : ''}
          </div>
          <div style="font-size:16px;font-weight:600;color:#1c1c1e">${fmt(p.a)}</div>
        </div>`;
    }).join('');
    return `
      <div style="margin:14px 16px 0">
        <div style="background:#fff;border-radius:18px;padding:16px 18px;box-shadow:0 1px 2px rgba(0,0,0,0.04)">
          <div style="display:flex;align-items:flex-end;justify-content:space-between">
            <div>
              <div style="font-size:12px;color:rgba(60,60,67,0.6);font-weight:500">Внесено клиентом</div>
              <div style="font-size:26px;font-weight:700;letter-spacing:-0.6px;color:#1c1c1e;margin-top:1px">${fmt(cVnes)}</div>
            </div>
            <div style="text-align:right">
              <div style="font-size:13px;font-weight:600;color:#0a84ff">${cPct}%</div>
              <div style="font-size:12px;color:rgba(60,60,67,0.5)">из ${hasPrice ? fmt(h.price) : '—'}</div>
            </div>
          </div>
          <div style="margin-top:9px;height:8px;border-radius:4px;background:#e9e9ee;overflow:hidden">
            <div style="height:100%;border-radius:4px;width:${Math.min(cPct, 100)}%;background:#0a84ff"></div>
          </div>
          <div style="margin-top:9px;font-size:13px;color:rgba(60,60,67,0.6)">Осталось внести: <span style="color:#1c1c1e;font-weight:600">${hasPrice ? fmt(Math.max(h.price - cVnes, 0)) : '—'}</span></div>
        </div>
        <div style="font-size:13px;color:rgba(60,60,67,0.6);padding:16px 8px 8px;letter-spacing:-0.08px">ВНЕСЕНИЯ</div>
        <div style="background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,0.04)">${rows}</div>
      </div>`;
  }

  if (tab === 'sale') {
    const m = margin(h);
    return `
      <div style="margin:14px 16px 0;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,0.04)">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:15px 18px;border-bottom:0.5px solid rgba(60,60,67,0.1)">
          <span style="font-size:15px;color:#1c1c1e">Себестоимость</span>
          <span style="font-size:16px;font-weight:600;color:#1c1c1e">${fmt(total(h))}</span>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;padding:15px 18px;border-bottom:0.5px solid rgba(60,60,67,0.1)">
          <span style="font-size:15px;color:#1c1c1e">Цена продажи</span>
          <span style="font-size:16px;font-weight:600;color:#1c1c1e">${h.price ? fmt(h.price) : '<span style="color:#0a84ff;font-weight:500">задать</span>'}</span>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;padding:15px 18px">
          <span style="font-size:15px;color:#1c1c1e">Маржа</span>
          ${m != null
            ? `<span style="font-size:18px;font-weight:700;color:#248a43">+${fmt(m)}</span>`
            : `<span style="font-size:16px;color:rgba(60,60,67,0.4)">— цена не задана</span>`}
        </div>
      </div>
      <div style="margin:12px 24px 0;font-size:13px;color:rgba(60,60,67,0.5);line-height:1.45">Маржа = цена продажи − себестоимость. Считается автоматически.</div>`;
  }
  return '';
}

// ░░░░░ АКТ ░░░░░
export function actScreen(state) {
  const a = state.act;
  const field = (label, key, value, extra = '') =>
    `<label style="display:block;padding:11px 16px;${key === 'sum' ? '' : 'border-bottom:0.5px solid rgba(60,60,67,0.1)'}">
       <span style="font-size:12px;color:rgba(60,60,67,0.6);font-weight:500">${label}</span>
       <input value="${esc(value)}" data-input="act-${key}" ${extra} style="width:100%;border:none;outline:none;font-size:16px;color:#1c1c1e;margin-top:3px;background:transparent;font-family:inherit" />
     </label>`;

  const saveStyle = 'height:52px;border-radius:15px;display:flex;align-items:center;justify-content:center;gap:9px;color:#fff;font-size:17px;font-weight:600;cursor:pointer;' +
    (state.signed ? 'background:#0a84ff' : 'background:rgba(10,132,255,0.45)');

  return `
    <div style="padding-bottom:120px">
      <div style="padding:54px 16px 0;display:flex;align-items:center;justify-content:space-between">
        ${backChevron('Объект', 'closeAct')}
      </div>
      <div style="padding:14px 20px 2px">
        <div style="font-size:28px;font-weight:700;letter-spacing:-0.5px;color:#1c1c1e">Акт приёма работ</div>
        <div style="font-size:13px;color:rgba(60,60,67,0.6);margin-top:3px">Реквизиты заполняются вручную</div>
      </div>
      <div style="margin:14px 16px 0;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,0.04)">
        ${field('Заказчик', 'client', a.client, 'placeholder="ФИО клиента"')}
        ${field('Объект', 'object', a.object)}
        ${field('Этап / работы', 'works', a.works)}
        ${field('Сумма, ₽', 'sum', a.sum, 'inputmode="numeric" placeholder="0"')}
      </div>
      <div style="font-size:13px;color:rgba(60,60,67,0.6);padding:18px 24px 8px;letter-spacing:-0.08px">ПОДПИСЬ КЛИЕНТА</div>
      <div style="margin:0 16px;background:#fff;border-radius:18px;padding:12px;box-shadow:0 1px 2px rgba(0,0,0,0.04)">
        <div style="position:relative;border:1.5px dashed rgba(60,60,67,0.2);border-radius:12px;background:#fbfbfd;height:150px;touch-action:none">
          <canvas id="sk-sig" style="width:100%;height:150px;display:block;touch-action:none"></canvas>
          <div id="sk-sig-ph" style="position:absolute;inset:0;display:${state.signed ? 'none' : 'flex'};align-items:center;justify-content:center;pointer-events:none;font-size:14px;color:rgba(60,60,67,0.3)">Подпись пальцем</div>
        </div>
        <div style="display:flex;justify-content:flex-end;margin-top:8px">
          <span data-action="clearSig" style="font-size:14px;color:#0a84ff;cursor:pointer;padding:4px 8px">Очистить</span>
        </div>
      </div>
      <div style="padding:18px 16px 0">
        <div id="sk-save-act" data-action="saveAct" style="${saveStyle}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 3h10l4 4v14H5V3z" stroke="#fff" stroke-width="2" stroke-linejoin="round"/><path d="M14 3v5h5" stroke="#fff" stroke-width="2" stroke-linejoin="round"/></svg>
          Сохранить PDF · на почту
        </div>
        <div style="text-align:center;font-size:12px;color:rgba(60,60,67,0.5);margin-top:9px">PDF сохранится в приложении и уйдёт на почту</div>
      </div>
    </div>`;
}

// ░░░░░ FAB ░░░░░
export function fab(state, animate = false) {
  const show = (state.screen === 'list' || state.screen === 'object') && !state.sheet;
  if (!show) return '';
  const anim = animate ? 'animation:sk-pop 0.25s ease' : '';
  return `
    <div id="sk-fab-btn" data-action="openFab" style="position:absolute;right:18px;bottom:44px;z-index:30;display:flex;align-items:center;gap:9px;height:54px;padding:0 20px 0 17px;background:#0a84ff;border-radius:27px;box-shadow:0 6px 18px rgba(10,132,255,0.4),0 2px 5px rgba(0,0,0,0.12);cursor:pointer;${anim}">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/></svg>
      <span style="color:#fff;font-size:16px;font-weight:600;letter-spacing:-0.2px">Расход</span>
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
    const style = 'font-size:14px;font-weight:500;padding:8px 14px;border-radius:11px;cursor:pointer;white-space:nowrap;' +
      (active ? 'background:#0a84ff;color:#fff' : 'background:#fff;color:#1c1c1e;box-shadow:0 1px 2px rgba(0,0,0,0.04)');
    return `<div data-action="setDraftHome" data-id="${hm.id}" style="${style}">${esc(hm.short || hm.name)}</div>`;
  }).join('');

  const catChips = CATS.map((c) => {
    const active = d.category === c;
    const cc = CAT_COLOR[c];
    const style = 'font-size:14px;font-weight:500;padding:8px 14px;border-radius:11px;cursor:pointer;white-space:nowrap;' +
      (active ? `background:${cc[1]};color:#fff` : 'background:#fff;color:#1c1c1e;box-shadow:0 1px 2px rgba(0,0,0,0.04)');
    return `<div data-action="setCategory" data-cat="${esc(c)}" style="${style}">${esc(c)}</div>`;
  }).join('');

  const psBase = 'flex:1;text-align:center;padding:7px 4px;border-radius:7px;font-size:14px;cursor:pointer;';
  const paidSegs =
    `<div data-action="setPaid" data-paid="true" style="${psBase + (d.paid ? 'font-weight:600;color:#1c1c1e;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.12)' : 'font-weight:500;color:rgba(60,60,67,0.6)')}">Оплачено</div>` +
    `<div data-action="setPaid" data-paid="false" style="${psBase + (!d.paid ? 'font-weight:600;color:#1c1c1e;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.12)' : 'font-weight:500;color:rgba(60,60,67,0.6)')}">К оплате</div>`;

  const splitToggle = 'width:51px;height:31px;border-radius:999px;padding:2px;display:flex;transition:all .2s;' +
    (d.split ? 'background:#34c759;justify-content:flex-end' : 'background:rgba(120,120,128,0.2);justify-content:flex-start');
  const splitKnob = 'width:27px;height:27px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.2)';
  const photoLabel = d.photo ? 'прикреплено ✓' : 'добавить';
  const photoLabelStyle = d.photo ? 'font-size:15px;color:#248a43;font-weight:500' : 'font-size:15px;color:#0a84ff';
  const amountDisplay = d.amount ? Number(d.amount).toLocaleString('ru-RU') : '';

  return `
    <div style="position:absolute;inset:0;z-index:40">
      <div data-action="closeSheet" style="position:absolute;inset:0;background:rgba(0,0,0,0.32);${dimAnim}"></div>
      <div style="position:absolute;left:0;right:0;bottom:0;background:#f2f2f7;border-radius:26px 26px 0 0;padding:8px 0 30px;${sheetAnim};max-height:94%;overflow-y:auto;box-shadow:0 -8px 30px rgba(0,0,0,0.18)">
        <div style="width:38px;height:5px;border-radius:3px;background:rgba(60,60,67,0.25);margin:0 auto 6px"></div>
        <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 18px 12px">
          <span data-action="closeSheet" style="font-size:17px;color:#0a84ff;cursor:pointer">Отмена</span>
          <span style="font-size:17px;font-weight:600;color:#1c1c1e">Новый расход</span>
          <span style="font-size:17px;color:rgba(60,60,67,0.3);width:54px;text-align:right">·</span>
        </div>
        <div id="sk-tour-amount" style="margin:0 16px;background:#fff;border-radius:18px;padding:18px 18px">
          <div style="font-size:12px;color:rgba(60,60,67,0.6);font-weight:500">Сумма</div>
          <div style="display:flex;align-items:baseline;gap:6px;margin-top:2px">
            <input value="${esc(amountDisplay)}" data-input="amount" inputmode="numeric" placeholder="0" style="border:none;outline:none;font-size:40px;font-weight:700;letter-spacing:-1px;color:#1c1c1e;background:transparent;font-family:inherit;width:100%;min-width:0;font-variant-numeric:tabular-nums" />
            <span style="font-size:30px;font-weight:600;color:rgba(60,60,67,0.4)">₽</span>
          </div>
        </div>
        <div id="sk-tour-desc" style="margin:12px 16px 0;background:#fff;border-radius:18px;padding:14px 18px">
          <textarea data-input="text" rows="2" placeholder="бетон, 26 кубов, доставка…" style="width:100%;border:none;outline:none;resize:none;font-size:16px;color:#1c1c1e;background:transparent;font-family:inherit;line-height:1.4">${esc(d.text)}</textarea>
          <div style="font-size:12px;color:rgba(60,60,67,0.45);margin-top:2px">Пишите как удобно — категория необязательна</div>
        </div>
        <div style="font-size:13px;color:rgba(60,60,67,0.6);padding:16px 24px 7px;letter-spacing:-0.08px">ОБЪЕКТ</div>
        <div style="display:flex;gap:8px;padding:0 16px;flex-wrap:wrap">${homeChips}</div>
        <div style="font-size:13px;color:rgba(60,60,67,0.6);padding:16px 24px 7px;letter-spacing:-0.08px">КАТЕГОРИЯ · необязательно</div>
        <div style="display:flex;gap:8px;padding:0 16px;flex-wrap:wrap">${catChips}</div>
        <div style="font-size:13px;color:rgba(60,60,67,0.6);padding:16px 24px 7px;letter-spacing:-0.08px">СТАТУС</div>
        <div style="margin:0 16px;background:rgba(118,118,128,0.12);border-radius:9px;padding:2px;display:flex;gap:2px">${paidSegs}</div>
        <div style="margin:14px 16px 0;background:#fff;border-radius:18px;overflow:hidden">
          <div data-action="toggleSplit" style="display:flex;align-items:center;justify-content:space-between;padding:13px 16px;border-bottom:0.5px solid rgba(60,60,67,0.1);cursor:pointer">
            <span style="font-size:16px;color:#1c1c1e">Разделить между объектами</span>
            <span style="${splitToggle}"><span style="${splitKnob}"></span></span>
          </div>
          <div data-action="togglePhoto" style="display:flex;align-items:center;justify-content:space-between;padding:13px 16px;cursor:pointer">
            <span style="font-size:16px;color:#1c1c1e">Фото чека</span>
            <span style="${photoLabelStyle}">${photoLabel}</span>
          </div>
        </div>
        <div style="padding:18px 16px 0">
          <div data-action="saveExpense" style="height:52px;background:#0a84ff;border-radius:15px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:17px;font-weight:600;cursor:pointer">Сохранить расход</div>
          <div style="text-align:center;font-size:12px;color:rgba(60,60,67,0.5);margin-top:8px">Сразу увидит Таня · сохраняется офлайн</div>
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
  const photoLabelStyle = d.photo ? 'font-size:15px;color:#248a43;font-weight:500' : 'font-size:15px;color:#0a84ff';

  return `
    <div style="position:absolute;inset:0;z-index:40">
      <div data-action="closeSheet" style="position:absolute;inset:0;background:rgba(0,0,0,0.32);${dimAnim}"></div>
      <div style="position:absolute;left:0;right:0;bottom:0;background:#f2f2f7;border-radius:26px 26px 0 0;padding:8px 0 30px;${sheetAnim};max-height:94%;overflow-y:auto;box-shadow:0 -8px 30px rgba(0,0,0,0.18)">
        <div style="width:38px;height:5px;border-radius:3px;background:rgba(60,60,67,0.25);margin:0 auto 6px"></div>
        <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 18px 12px">
          <span data-action="closeSheet" style="font-size:17px;color:#0a84ff;cursor:pointer">Отмена</span>
          <span style="font-size:17px;font-weight:600;color:#1c1c1e">Новая заметка</span>
          <span style="font-size:17px;color:rgba(60,60,67,0.3);width:54px;text-align:right">·</span>
        </div>
        <div style="margin:0 16px;background:#fff;border-radius:18px;padding:14px 18px">
          <textarea data-input="note-text" rows="3" placeholder="код от ворот, договорённость, что не забыть…" style="width:100%;border:none;outline:none;resize:none;font-size:16px;color:#1c1c1e;background:transparent;font-family:inherit;line-height:1.4">${esc(d.text)}</textarea>
        </div>
        <div style="margin:14px 16px 0;background:#fff;border-radius:18px;overflow:hidden">
          <div data-action="toggleNotePhoto" style="display:flex;align-items:center;justify-content:space-between;padding:13px 16px;cursor:pointer">
            <span style="font-size:16px;color:#1c1c1e">Фото</span>
            <span style="${photoLabelStyle}">${photoLabel}</span>
          </div>
        </div>
        <div style="padding:18px 16px 0">
          <div data-action="saveNote" style="height:52px;background:#0a84ff;border-radius:15px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:17px;font-weight:600;cursor:pointer">Сохранить заметку</div>
          <div style="text-align:center;font-size:12px;color:rgba(60,60,67,0.5);margin-top:8px">Привязана к объекту · видит Таня</div>
        </div>
      </div>
    </div>`;
}

// ░░░░░ ТОСТ ░░░░░
export function toast(state, animate = false) {
  if (!state.toast) return '';
  const anim = animate ? 'animation:sk-toast 0.3s ease;' : '';
  return `
    <div style="position:absolute;left:50%;bottom:118px;z-index:50;display:flex;align-items:center;gap:9px;background:#1c1c1e;color:#fff;padding:11px 18px;border-radius:999px;box-shadow:0 8px 24px rgba(0,0,0,0.3);${anim}white-space:nowrap">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#34c759"/><path d="M7 12.5l3 3 6-6.5" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <span style="font-size:14px;font-weight:500">${esc(state.toast)}</span>
    </div>`;
}
