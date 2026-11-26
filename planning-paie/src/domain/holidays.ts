import { addDays, dayKey } from './time';
import type { DayKey } from './types';

/** Dimanche de Pâques (algorithme de Meeus/Jones/Butcher, calendrier grégorien). */
export function easterSunday(year: number): DayKey {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return dayKey(new Date(year, month - 1, day, 12));
}

export type HolidayId =
  | 'newYear'
  | 'goodFriday'
  | 'easterMonday'
  | 'labourDay'
  | 'victory1945'
  | 'ascension'
  | 'whitMonday'
  | 'bastilleDay'
  | 'assumption'
  | 'allSaints'
  | 'armistice'
  | 'christmas'
  | 'stStephen';

/** Jours fériés légaux en France métropolitaine pour une année. */
export function frenchHolidays(year: number, alsaceMoselle = false): Map<DayKey, HolidayId> {
  const easter = easterSunday(year);
  const p = (m: number, d: number) =>
    `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const list: [DayKey, HolidayId][] = [
    [p(1, 1), 'newYear'],
    [addDays(easter, 1), 'easterMonday'],
    [p(5, 1), 'labourDay'],
    [p(5, 8), 'victory1945'],
    [addDays(easter, 39), 'ascension'],
    [addDays(easter, 50), 'whitMonday'],
    [p(7, 14), 'bastilleDay'],
    [p(8, 15), 'assumption'],
    [p(11, 1), 'allSaints'],
    [p(11, 11), 'armistice'],
    [p(12, 25), 'christmas'],
  ];
  if (alsaceMoselle) {
    list.push([addDays(easter, -2), 'goodFriday'], [p(12, 26), 'stStephen']);
  }
  return new Map(list);
}

const cache = new Map<string, Map<DayKey, HolidayId>>();

export function isHoliday(key: DayKey, alsaceMoselle: boolean, extra: readonly DayKey[]): boolean {
  if (extra.includes(key)) return true;
  const year = Number(key.slice(0, 4));
  const cacheKey = `${year}-${alsaceMoselle ? 1 : 0}`;
  let map = cache.get(cacheKey);
  if (!map) {
    map = frenchHolidays(year, alsaceMoselle);
    cache.set(cacheKey, map);
  }
  return map.has(key);
}
