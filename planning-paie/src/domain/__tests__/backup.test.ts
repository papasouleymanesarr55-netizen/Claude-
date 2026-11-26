import { exportBackup, parseBackup } from '../backup';
import { DEFAULT_RULES } from '../types';

/** Fichier tel que produit par le prototype web planning-paie.html. */
const PROTOTYPE = JSON.stringify({
  v: 1,
  shifts: [
    {
      id: 'a1',
      name: 'Matin',
      start: '08:00',
      end: '16:00',
      pause: 30,
      rate: 12.5,
      color: '#d99a00',
    },
    { id: 'b2', name: 'Nuit', start: '22:00', end: '06:00', pause: 30, rate: 13, color: '#2f7de1' },
  ],
  days: {
    '2026-10-05': { s: 'a1' },
    '2026-10-06': {
      s: 'a1',
      start: '09:00',
      end: '17:00',
      pause: 30,
      rate: 13,
      note: 'Inventaire',
    },
    '2026-10-07': { s: 'b2' },
    '2026-10-08': { start: '10:00', end: '12:00', pause: 0, rate: 11 },
  },
  net: 22,
  rate: 12.5,
});

describe('import / export', () => {
  it('5. importe un fichier du prototype web avec jours et postes identiques', () => {
    const r = parseBackup(PROTOTYPE);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.skippedDays).toBe(0);
    expect(r.data.shifts).toEqual([
      { id: 'a1', name: 'Matin', start: 480, end: 960, pause: 30, rate: 12.5, color: '#d99a00' },
      { id: 'b2', name: 'Nuit', start: 1320, end: 360, pause: 30, rate: 13, color: '#2f7de1' },
    ]);
    expect(r.data.days).toEqual({
      '2026-10-05': { shiftId: 'a1' },
      '2026-10-06': {
        shiftId: 'a1',
        start: 540,
        end: 1020,
        pause: 30,
        rate: 13,
        note: 'Inventaire',
      },
      '2026-10-07': { shiftId: 'b2' },
      '2026-10-08': { start: 600, end: 720, pause: 0, rate: 11 },
    });
    expect(r.data.charges).toBe(22);
    expect(r.data.lastRate).toBe(12.5);
  });

  it("l'export se relit à l'identique (aller-retour)", () => {
    const first = parseBackup(PROTOTYPE);
    if (!first.ok) throw new Error('import');
    const file = exportBackup({
      shifts: first.data.shifts,
      days: first.data.days,
      charges: 22,
      lastRate: 12.5,
      rules: DEFAULT_RULES,
    });
    expect(file.days['2026-10-06']).toEqual({
      s: 'a1',
      start: '09:00',
      end: '17:00',
      pause: 30,
      rate: 13,
      note: 'Inventaire',
    });
    const again = parseBackup(JSON.stringify(file));
    expect(again.ok && again.data.days).toEqual(first.data.days);
    expect(again.ok && again.data.shifts).toEqual(first.data.shifts);
    expect(again.ok && again.data.rules).toEqual(DEFAULT_RULES);
  });

  it('refuse les fichiers invalides sans rien modifier', () => {
    expect(parseBackup('pas du json')).toEqual({ ok: false, error: 'notJson' });
    expect(parseBackup('{"foo":1}')).toEqual({ ok: false, error: 'notBackup' });
    expect(
      parseBackup('{"shifts":[{"name":"X","start":"99:00","end":"10:00"}],"days":{}}'),
    ).toEqual({ ok: false, error: 'badShift' });
    expect(parseBackup('{"shifts":[],"days":{}}')).toEqual({ ok: false, error: 'empty' });
  });

  it('ignore les jours invalides et les compte', () => {
    const r = parseBackup(
      JSON.stringify({
        shifts: [{ id: 'a', name: 'A', start: '08:00', end: '12:00' }],
        days: { '2026-02-30': { s: 'a' }, '2026-10-01': { s: 'zzz' }, '2026-10-02': 'a' },
      }),
    );
    expect(r.ok && r.skippedDays).toBe(2);
    expect(r.ok && r.data.days).toEqual({ '2026-10-02': { shiftId: 'a' } });
  });
});
