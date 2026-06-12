// Seed data, stage templates and category palette — tuned for the Таня/Гриша
// demo so every step of the script has something concrete to show.
// In production this is replaced by the Supabase realtime store (see README).

export const STAGES = [
  'Подготовка участка', 'Фундамент', 'Стены', 'Кровля', 'Внутр. отделка',
  'Наружная отделка', 'Инженерка внутри', 'Инженерка снаружи', 'Сдача',
];

export const CATS = ['Материалы', 'Работа', 'Техника', 'Логистика', 'Прочее'];

// category -> [chip background, chip text color]
export const CAT_COLOR = {
  'Материалы': ['rgba(10,132,255,0.12)', '#0a6fd6'],
  'Работа':    ['rgba(88,86,214,0.12)', '#4a48b8'],
  'Техника':   ['rgba(255,149,0,0.13)', '#b56b00'],
  'Логистика': ['rgba(48,176,199,0.14)', '#1c7e90'],
  'Прочее':    ['rgba(60,60,67,0.1)',   '#5a5a60'],
};

export function seedHomes() {
  return [
    {
      id: 'sosnovaya', name: 'Дом на Сосновой', short: 'Сосновая', address: 'КП Сосновый Бор, уч. 14',
      type: 'contract', price: 8500000, base: 1820000, stageIndex: 2,
      expenses: [
        { id: 'e1', date: '08.06', text: 'Бетон М300, 26 м³ — перекрытие', amount: 312000, cat: 'Материалы', paid: true, who: 'Г', photo: true },
        { id: 'e2', date: '06.06', text: 'Кирпич облицовочный, 4 поддона', amount: 268000, cat: 'Материалы', paid: false, who: 'Г', photo: true },
        { id: 'e3', date: '04.06', text: 'Газобетон D500, 2 палеты + клей', amount: 286000, cat: 'Материалы', paid: true, who: 'Г', photo: true },
        { id: 'e4', date: '02.06', text: 'Аренда автокрана, 1 смена', amount: 42000, cat: 'Техника', paid: true, who: 'Г' },
        { id: 'e5', date: '28.05', text: 'Доставка ЖБИ (делёж: Сосновая + Лесной)', amount: 18500, cat: 'Логистика', paid: true, who: 'Т', split: true },
      ],
      crews: [
        { id: 'c1', work: 'Заливка фундамента', agreed: 280000, payouts: [{ d: '15.05', a: 140000 }, { d: '30.05', a: 140000 }] },
        { id: 'c2', work: 'Кладка стен, 1 этаж', agreed: 520000, payouts: [{ d: '05.06', a: 200000 }] },
      ],
      clientPayments: [{ d: '12 апр', a: 2500000, escrow: true }, { d: '20 мая', a: 2000000, escrow: true }],
      notes: [
        { id: 'n1', date: '06.06', text: 'Ключи у прораба, заезд со стороны леса', photo: true },
      ],
    },
    {
      id: 'berezovaya', name: 'Дом на продажу, Берёзовая 12', short: 'Берёзовая 12', address: 'ул. Берёзовая, 12',
      // spec (на продажу): `price` здесь — цена продажи; маржа = цена − себестоимость
      type: 'spec', price: 3200000, base: 1660000, stageIndex: 3,
      expenses: [
        { id: 'e6', date: '07.06', text: 'Металлочерепица + комплектующие', amount: 198000, cat: 'Материалы', paid: true, who: 'Г', photo: true },
        { id: 'e7', date: '01.06', text: 'Пиломатериал на стропила', amount: 142000, cat: 'Материалы', paid: true, who: 'Г', photo: true },
        { id: 'e8', date: '24.05', text: 'Доставка ЖБИ (делёж)', amount: 18500, cat: 'Логистика', paid: true, who: 'Т', split: true },
      ],
      crews: [{ id: 'c3', work: 'Монтаж кровли', agreed: 240000, payouts: [{ d: '06.06', a: 120000 }] }],
      clientPayments: [],
      notes: [
        { id: 'n2', date: '02.06', text: 'Показ покупателям в субботу в 12:00', photo: false },
      ],
    },
    {
      id: 'lesnoy', name: 'Коттедж в Лесном', short: 'Лесной', address: 'д. Лесная, уч. 3',
      type: 'contract', price: 14200000, base: 11300000, stageIndex: 4,
      expenses: [
        { id: 'e9', date: '09.06', text: 'Тёплый пол, трубы + коллектор', amount: 176000, cat: 'Материалы', paid: true, who: 'Г', photo: true },
        { id: 'e10', date: '05.06', text: 'Гипсокартон, профиль, крепёж', amount: 128000, cat: 'Материалы', paid: false, who: 'Г' },
        { id: 'e11', date: '31.05', text: 'Электрика, кабель + автоматы', amount: 214000, cat: 'Материалы', paid: true, who: 'Т', photo: true },
        { id: 'e12', date: '03.06', text: 'Доставка ЖБИ (делёж: Сосновая + Лесной)', amount: 21000, cat: 'Логистика', paid: true, who: 'Т', split: true },
      ],
      crews: [
        // одна бригада с остатком…
        { id: 'c4', work: 'Внутренняя отделка', agreed: 980000, payouts: [{ d: '01.06', a: 400000 }] },
        // …и одна «закрыто» (договорено = выплачено)
        { id: 'c5', work: 'Электромонтаж', agreed: 320000, payouts: [{ d: '02.06', a: 200000 }, { d: '08.06', a: 120000 }] },
      ],
      clientPayments: [{ d: '10 мар', a: 5000000, escrow: true }, { d: '15 апр', a: 4000000, escrow: true }, { d: '22 мая', a: 3000000, escrow: false }],
      notes: [
        { id: 'n3', date: '07.06', text: 'Код от ворот — 4471', photo: false },
        { id: 'n4', date: '05.06', text: 'Не шуметь до 9:00 — просьба соседей', photo: false },
      ],
    },
  ];
}
