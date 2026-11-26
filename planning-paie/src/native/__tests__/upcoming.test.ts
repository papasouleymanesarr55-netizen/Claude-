import { upcomingReminders, occurrencesBetween } from '../upcoming';
import type { Shift } from '../../domain/types';

const night: Shift = {
  id: 'n',
  name: 'Nuit',
  start: 1320,
  end: 360,
  pause: 30,
  rate: 13,
  color: '#000',
};
const morning: Shift = {
  id: 'm',
  name: 'Matin',
  start: 480,
  end: 960,
  pause: 30,
  rate: 13,
  color: '#000',
};

describe('postes à venir', () => {
  it('fait finir un poste de nuit le lendemain', () => {
    const [o] = occurrencesBetween(
      [night],
      { '2026-10-31': { shiftId: 'n' } },
      '2026-10-01',
      '2026-11-30',
      '',
    );
    expect(o!.startsAt).toEqual(new Date(2026, 9, 31, 22, 0));
    expect(o!.endsAt).toEqual(new Date(2026, 10, 1, 6, 0));
  });

  it('programme au plus 60 rappels, uniquement dans le futur', () => {
    const days: Record<string, { shiftId: string }> = {};
    for (let i = 1; i <= 28; i++) {
      for (const m of ['10', '11', '12'])
        days[`2026-${m}-${String(i).padStart(2, '0')}`] = { shiftId: 'm' };
    }
    const now = new Date(2026, 9, 10, 7, 45); // 10 oct. 7 h 45
    const list = upcomingReminders(
      [morning],
      days,
      { before: 30, eve: false, day: false, dayTime: 420 },
      now,
      60,
    );
    expect(list).toHaveLength(60);
    // Le rappel du 10 oct. (7 h 30) est passé : le premier est le 11 oct. à 7 h 30.
    expect(list[0]!.fireAt).toEqual(new Date(2026, 9, 11, 7, 30));
  });
});

describe('rappels la veille et le jour J', () => {
  const days = { '2026-10-12': { shiftId: 'm' }, '2026-10-13': { shiftId: 'n' } };
  const now = new Date(2026, 9, 10, 12, 0);

  it('programme la veille (24 h avant) et le jour J à l’heure choisie, dans l’ordre', () => {
    const list = upcomingReminders(
      [morning, night],
      days,
      { before: 60, eve: true, day: true, dayTime: 7 * 60 },
      now,
    );
    expect(list.map((r) => [r.kind, r.fireAt])).toEqual([
      ['eve', new Date(2026, 9, 11, 8, 0)], // Matin du 12 à 8 h
      ['day', new Date(2026, 9, 12, 7, 0)],
      ['before', new Date(2026, 9, 12, 7, 0)],
      ['eve', new Date(2026, 9, 12, 22, 0)], // Nuit du 13 à 22 h
      ['day', new Date(2026, 9, 13, 7, 0)],
      ['before', new Date(2026, 9, 13, 21, 0)],
    ]);
  });

  it('avance le rappel du jour J si le poste commence avant l’heure choisie', () => {
    const early: Shift = { ...morning, id: 'e', start: 5 * 60, end: 12 * 60 };
    const list = upcomingReminders(
      [early],
      { '2026-10-12': { shiftId: 'e' } },
      { before: 0, eve: false, day: true, dayTime: 7 * 60 },
      now,
    );
    expect(list).toHaveLength(1);
    expect(list[0]!.fireAt).toEqual(new Date(2026, 9, 12, 4, 0));
  });

  it('ignore les rappels déjà passés et respecte la limite', () => {
    const list = upcomingReminders(
      [morning],
      { '2026-10-11': { shiftId: 'm' } },
      { before: 30, eve: true, day: true, dayTime: 7 * 60 },
      new Date(2026, 9, 10, 9, 0),
      2,
    );
    // La veille (10 oct. 8 h) est passée ; restent jour J 7 h et 7 h 30.
    expect(list.map((r) => r.kind)).toEqual(['day', 'before']);
  });
});
