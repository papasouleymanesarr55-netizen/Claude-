import {
  buildDayEntry,
  computeMonth,
  computePeriod,
  durationHours,
  grossFor,
  netFrom,
  resolveDay,
} from '../calc';
import { parseHHMM } from '../time';
import { DEFAULT_RULES, type PayRules, type Shift } from '../types';

const t = (s: string) => parseHHMM(s)!;
const morning: Shift = {
  id: 'm',
  name: 'Matin',
  start: t('08:00'),
  end: t('16:00'),
  pause: 30,
  rate: 12.5,
  color: '#d99a00',
};
const night: Shift = { ...morning, id: 'n', name: 'Nuit', start: t('22:00'), end: t('06:00') };
const legal: PayRules = { ...DEFAULT_RULES, enabled: true };

describe('cas de test obligatoires (§6)', () => {
  it('1. 08:00–16:00, pause 30, 12,50 €/h → 7,5 h et 93,75 €', () => {
    expect(durationHours(t('08:00'), t('16:00'), 30)).toBe(7.5);
    expect(grossFor(t('08:00'), t('16:00'), 30, 12.5)).toBe(93.75);
  });

  it('2. 22:00–06:00, pause 30 → 7,5 h (passage de minuit)', () => {
    expect(durationHours(t('22:00'), t('06:00'), 30)).toBe(7.5);
  });

  it('3. semaine ISO de 40 h avec règle légale → 5 h majorées à 25 %', () => {
    const eight: Shift = { ...morning, id: 'e', start: t('08:00'), end: t('16:00'), pause: 0 };
    // Lundi 5 → vendredi 9 octobre 2026 : 5 × 8 h = 40 h.
    const days = Object.fromEntries(
      ['05', '06', '07', '08', '09'].map((d) => [`2026-10-${d}`, { shiftId: 'e' }]),
    );
    const res = computeMonth({ shifts: [eight], days, rules: legal, advanced: true }, 2026, 9);
    expect(res.hours).toBe(40);
    expect(res.overtime1Hours).toBeCloseTo(5);
    expect(res.overtime2Hours).toBe(0);
    expect(res.base).toBe(500);
    expect(res.premium).toBe(15.63); // 5 h × 12,50 × 25 % = 15,625
    expect(res.gross).toBe(515.63);
  });

  it('4. poste du 31 octobre 22:00–06:00 → compté dans octobre', () => {
    const input = {
      shifts: [night],
      days: { '2026-10-31': { shiftId: 'n' } },
      rules: legal,
      advanced: false,
    };
    expect(computeMonth(input, 2026, 9).hours).toBe(7.5);
    expect(computeMonth(input, 2026, 10).hours).toBe(0);
    expect(computeMonth({ ...input, advanced: true }, 2026, 9).hours).toBe(7.5);
  });
});

describe('durées et montants', () => {
  it('ne renvoie jamais de durée négative', () => {
    expect(durationHours(t('08:00'), t('09:00'), 120)).toBe(0);
  });
  it('fin = début compte 24 h', () => {
    expect(durationHours(t('08:00'), t('08:00'), 0)).toBe(24);
  });
  it('calcule le net estimé', () => {
    expect(netFrom(100, 22)).toBe(78);
    expect(netFrom(93.75, 22)).toBe(73.13);
  });
});

describe('fiche du jour', () => {
  it("n'enregistre que les valeurs qui diffèrent du poste", () => {
    expect(
      buildDayEntry(morning, { start: t('09:00'), end: t('16:00'), pause: 30, rate: 12.5 }),
    ).toEqual({ shiftId: 'm', start: t('09:00') });
  });
  it('accepte un jour sans poste', () => {
    const e = buildDayEntry(undefined, { start: 600, end: 720, pause: 0, rate: 11, note: ' x ' });
    expect(e).toEqual({ start: 600, end: 720, pause: 0, rate: 11, note: 'x' });
    const r = resolveDay('2026-10-01', e, new Map());
    expect(r?.customized).toBe(true);
  });
  it('hérite du poste et détecte une modification', () => {
    const map = new Map([['m', morning]]);
    expect(resolveDay('2026-10-01', { shiftId: 'm' }, map)?.customized).toBe(false);
    const r = resolveDay('2026-10-01', { shiftId: 'm', rate: 13 }, map);
    expect(r?.customized).toBe(true);
    expect(r?.rate).toBe(13);
    expect(r?.start).toBe(morning.start);
  });
  it('ignore un poste supprimé', () => {
    expect(resolveDay('2026-10-01', { shiftId: 'x' }, new Map())).toBeNull();
  });
});

describe('calcul avancé', () => {
  const ten: Shift = {
    ...morning,
    id: 'd',
    start: t('08:00'),
    end: t('18:00'),
    pause: 0,
    rate: 10,
  };
  const week = (prefix: string, days: string[]) =>
    Object.fromEntries(days.map((d) => [`${prefix}-${d}`, { shiftId: 'd' }]));

  it('applique 25 % puis 50 % au-delà de 43 h', () => {
    // 5 × 10 h = 50 h : 35 normales, 8 à 25 %, 7 à 50 %.
    const days = week('2026-10', ['05', '06', '07', '08', '09']);
    const r = computeMonth({ shifts: [ten], days, rules: legal, advanced: true }, 2026, 9);
    expect(r.overtime1Hours).toBeCloseTo(8);
    expect(r.overtime2Hours).toBeCloseTo(7);
    expect(r.premium).toBe(8 * 10 * 0.25 + 7 * 10 * 0.5);
  });

  it('ignore le calcul avancé sans Premium', () => {
    const days = week('2026-10', ['05', '06', '07', '08', '09']);
    const r = computeMonth({ shifts: [ten], days, rules: legal, advanced: false }, 2026, 9);
    expect(r.premium).toBe(0);
    expect(r.gross).toBe(500);
  });

  it('compte la semaine entière à cheval sur deux mois', () => {
    // Semaine du lundi 28 sept. au dimanche 4 oct. 2026 ; 3 jours en septembre, 2 en octobre.
    const days = {
      ...week('2026-09', ['28', '29', '30']),
      ...week('2026-10', ['01', '02']),
    };
    const input = { shifts: [ten], days, rules: legal, advanced: true };
    const oct = computeMonth(input, 2026, 9);
    const sep = computeMonth(input, 2026, 8);
    expect(sep.overtime1Hours).toBe(0);
    expect(oct.overtime1Hours).toBeCloseTo(8);
    expect(oct.overtime2Hours).toBeCloseTo(7);
  });

  it('majore les heures de nuit, de dimanche et de jour férié', () => {
    const rules: PayRules = {
      ...legal,
      overtime: { ...legal.overtime, enabled: false },
      night: { start: t('21:00'), end: t('06:00'), rate: 20 },
      sundayRate: 50,
      holidayRate: 100,
    };
    const shift: Shift = { ...ten, start: t('20:00'), end: t('02:00') };
    // Samedi 31 oct. 2026 20:00 → dimanche 1er nov. (Toussaint) 02:00.
    const r = computePeriod(
      { shifts: [shift], days: { '2026-10-31': { shiftId: 'd' } }, rules, advanced: true },
      '2026-10-31',
      '2026-10-31',
    );
    const d = r.days['2026-10-31']!;
    expect(d.hours).toBe(6);
    expect(d.nightHours).toBeCloseTo(5);
    expect(d.sundayHours).toBeCloseTo(2);
    expect(d.holidayHours).toBeCloseTo(2);
    // 20–21 h : 0 % ; 21–24 h : 20 % (3 h) ; 0–2 h : max(20, 50, 100) = 100 % (2 h).
    expect(d.premium).toBe(3 * 10 * 0.2 + 2 * 10 * 1);
  });

  it('cumule les majorations si la règle « addition » est choisie', () => {
    const rules: PayRules = {
      ...legal,
      overtime: { ...legal.overtime, enabled: false },
      night: { start: t('00:00'), end: t('06:00'), rate: 20 },
      sundayRate: 50,
      stacking: 'sum',
    };
    const shift: Shift = { ...ten, start: t('00:00'), end: t('02:00') };
    const r = computePeriod(
      { shifts: [shift], days: { '2026-10-04': { shiftId: 'd' } }, rules, advanced: true },
      '2026-10-04',
      '2026-10-04',
    );
    expect(r.days['2026-10-04']!.premium).toBe(2 * 10 * 0.7);
  });

  it('répartit la pause sur le poste', () => {
    const rules: PayRules = {
      ...legal,
      overtime: { ...legal.overtime, enabled: false },
      night: { start: t('22:00'), end: t('06:00'), rate: 10 },
    };
    const shift: Shift = { ...ten, start: t('22:00'), end: t('06:00'), pause: 60 };
    const r = computePeriod(
      { shifts: [shift], days: { '2026-10-06': { shiftId: 'd' } }, rules, advanced: true },
      '2026-10-06',
      '2026-10-06',
    );
    expect(r.days['2026-10-06']!.hours).toBe(7);
    expect(r.days['2026-10-06']!.premium).toBe(7);
  });
});
