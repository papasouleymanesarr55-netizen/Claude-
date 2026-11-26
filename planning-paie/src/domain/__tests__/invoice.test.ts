import { computeMonth } from '../calc';
import { advanceCounter, invoiceLines, nextInvoiceNumber } from '../invoice';
import { recapByEmployer } from '../recap';
import { DEFAULT_RULES, type Shift } from '../types';

const s = (id: string, rate: number, start: number, end: number): Shift => ({
  id,
  name: id,
  start,
  end,
  pause: 0,
  rate,
  color: '#000',
  employer: 'Alpha',
});

describe('facture', () => {
  it('regroupe les heures par poste et par taux, total = brut du récap', () => {
    const shifts = [s('Matin', 12.5, 480, 960), s('Nuit', 14, 1320, 360)];
    const days = {
      '2026-11-02': { shiftId: 'Matin' },
      '2026-11-03': { shiftId: 'Matin' },
      '2026-11-04': { shiftId: 'Matin', rate: 15 },
      '2026-11-05': { shiftId: 'Nuit' },
    };
    const summary = computeMonth({ shifts, days, rules: DEFAULT_RULES, advanced: false }, 2026, 10);
    const recap = recapByEmployer(summary, shifts, days, 22, 'Perso').employers[0]!;
    const lines = invoiceLines(recap, 'Majorations');
    expect(lines).toEqual([
      { label: 'Matin', hours: 16, rate: 12.5, amount: 200 },
      { label: 'Matin', hours: 8, rate: 15, amount: 120 },
      { label: 'Nuit', hours: 8, rate: 14, amount: 112 },
    ]);
    expect(lines.reduce((t, l) => t + l.amount, 0)).toBe(recap.gross);
  });

  it('ajoute une ligne de majorations en calcul avancé', () => {
    const shifts = [s('Long', 10, 480, 1080)]; // 10 h
    const days = Object.fromEntries(
      ['02', '03', '04', '05'].map((d) => [`2026-11-${d}`, { shiftId: 'Long' }]),
    );
    const rules = { ...DEFAULT_RULES, enabled: true };
    const summary = computeMonth({ shifts, days, rules, advanced: true }, 2026, 10);
    const recap = recapByEmployer(summary, shifts, days, 22, 'Perso').employers[0]!;
    const lines = invoiceLines(recap, 'Majorations');
    expect(lines[1]).toEqual({ label: 'Majorations', hours: null, rate: null, amount: 12.5 });
    expect(lines.reduce((t, l) => t + l.amount, 0)).toBe(recap.gross);
  });

  it('numérote 2026-001, 2026-002… et repart à 1 chaque année', () => {
    const now = new Date(2026, 10, 26);
    expect(nextInvoiceNumber({ year: 2026, next: 1 }, now)).toBe('2026-001');
    expect(nextInvoiceNumber({ year: 2025, next: 40 }, now)).toBe('2026-001');
    expect(advanceCounter({ year: 2026, next: 1 }, '2026-001')).toEqual({ year: 2026, next: 2 });
    expect(advanceCounter({ year: 2025, next: 40 }, '2026-001')).toEqual({ year: 2026, next: 2 });
    expect(advanceCounter({ year: 2026, next: 5 }, 'FAC-12')).toEqual({ year: 2026, next: 5 });
  });
});
