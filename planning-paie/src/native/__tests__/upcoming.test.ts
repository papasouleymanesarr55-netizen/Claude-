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
    const list = upcomingReminders([morning], days, 30, now, 60);
    expect(list).toHaveLength(60);
    // Le rappel du 10 oct. (7 h 30) est passé : le premier est le 11 oct. à 7 h 30.
    expect(list[0]!.fireAt).toEqual(new Date(2026, 9, 11, 7, 30));
  });
});
