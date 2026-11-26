import { buildDayEntry, computeMonth, resolveDay } from '../calc';
import { parseBackup, exportBackup } from '../backup';
import { knownEmployers, recapByEmployer } from '../recap';
import { DEFAULT_RULES, type DayEntry, type Shift } from '../types';

const mk = (id: string, employer: string | undefined, hours: number, rate: number): Shift => ({
  id,
  name: id,
  start: 8 * 60,
  end: 8 * 60 + hours * 60,
  pause: 0,
  rate,
  color: '#000',
  employer,
});

// Exemple du besoin : 3 entreprises, 18 h, 22 h et 25 h dans le mois.
const a = mk('A6', 'Alpha', 6, 12); // 3 jours × 6 h = 18 h
const b = mk('B5', 'Bravo', 5.5, 13.5); // 4 jours × 5 h 30 = 22 h
const c = mk('C5', 'Charlie', 5, 15); // 5 jours × 5 h = 25 h
const days: Record<string, DayEntry> = {};
['02', '09', '16'].forEach((d) => (days[`2026-11-${d}`] = { shiftId: 'A6' }));
['03', '10', '17', '24'].forEach((d) => (days[`2026-11-${d}`] = { shiftId: 'B5' }));
['04', '11', '18', '25', '26'].forEach((d) => (days[`2026-11-${d}`] = { shiftId: 'C5' }));

describe('récapitulatif par entreprise', () => {
  const input = { shifts: [a, b, c], days, rules: DEFAULT_RULES, advanced: false };
  const summary = computeMonth(input, 2026, 10);
  const recap = recapByEmployer(summary, input.shifts, days, 22, 'Personnalisé');

  it('donne les heures et le montant de chaque entreprise', () => {
    expect(recap.employers.map((e) => [e.employer, e.hours, e.daysWorked, e.gross])).toEqual([
      ['Alpha', 18, 3, 216],
      ['Bravo', 22, 4, 297],
      ['Charlie', 25, 5, 375],
    ]);
    expect(recap.employers[0]!.net).toBe(168.48);
  });

  it('donne le total général', () => {
    expect(recap.total).toEqual({
      hours: 65,
      daysWorked: 12,
      premium: 0,
      gross: 888,
      net: 692.64,
    });
  });

  it('détaille les postes et les jours de chaque entreprise', () => {
    expect(recap.employers[1]!.lines).toEqual([{ label: 'B5', count: 4, hours: 22, gross: 297 }]);
    expect(recap.employers[1]!.days.map((d) => d.day.key)).toEqual([
      '2026-11-03',
      '2026-11-10',
      '2026-11-17',
      '2026-11-24',
    ]);
  });

  it('range les jours sans entreprise à part, en dernier', () => {
    const withCustom = { ...days, '2026-11-05': { start: 600, end: 720, pause: 0, rate: 10 } };
    const s = computeMonth({ ...input, days: withCustom }, 2026, 10);
    const r = recapByEmployer(s, input.shifts, withCustom, 22, 'Personnalisé');
    const last = r.employers[r.employers.length - 1]!;
    expect(last.employer).toBe('');
    expect(last.lines).toEqual([{ label: 'Personnalisé', count: 1, hours: 2, gross: 20 }]);
    expect(r.total.gross).toBe(908);
  });

  it("permet de changer l'entreprise d'un seul jour", () => {
    const entry = buildDayEntry(a, {
      start: a.start,
      end: a.end,
      pause: 0,
      rate: 12,
      employer: 'Delta',
    });
    expect(entry).toEqual({ shiftId: 'A6', employer: 'Delta' });
    const r = resolveDay('2026-11-02', entry, new Map([['A6', a]]));
    expect(r?.employer).toBe('Delta');
    expect(r?.customized).toBe(true);
    expect(
      buildDayEntry(a, { start: a.start, end: a.end, pause: 0, rate: 12, employer: 'Alpha' }),
    ).toEqual({ shiftId: 'A6' });
  });

  it('liste les entreprises connues', () => {
    expect(knownEmployers([a, b, c], { x: { employer: 'Delta' } })).toEqual([
      'Alpha',
      'Bravo',
      'Charlie',
      'Delta',
    ]);
  });
});

describe('heures supplémentaires par employeur', () => {
  it('ne cumule pas les heures de deux employeurs pour le seuil de 35 h', () => {
    const x = mk('X', 'Alpha', 8, 10);
    const y = mk('Y', 'Bravo', 8, 10);
    // Semaine du 2 au 8 nov. 2026 : 3 × 8 h chez Alpha + 3 × 8 h chez Bravo = 48 h au total.
    const d: Record<string, DayEntry> = {
      '2026-11-02': { shiftId: 'X' },
      '2026-11-03': { shiftId: 'X' },
      '2026-11-04': { shiftId: 'X' },
      '2026-11-05': { shiftId: 'Y' },
      '2026-11-06': { shiftId: 'Y' },
      '2026-11-07': { shiftId: 'Y' },
    };
    const rules = { ...DEFAULT_RULES, enabled: true };
    const s = computeMonth({ shifts: [x, y], days: d, rules, advanced: true }, 2026, 10);
    expect(s.overtime1Hours).toBe(0);
  });
});

describe('sauvegarde', () => {
  it("conserve l'entreprise des postes et des jours", () => {
    const file = exportBackup({
      shifts: [a],
      days: { '2026-11-02': { shiftId: 'A6', employer: 'Delta' } },
      charges: 22,
      lastRate: 12,
      rules: DEFAULT_RULES,
    });
    const r = parseBackup(JSON.stringify(file));
    expect(r.ok && r.data.shifts[0]!.employer).toBe('Alpha');
    expect(r.ok && r.data.days['2026-11-02']).toEqual({ shiftId: 'A6', employer: 'Delta' });
  });
});
