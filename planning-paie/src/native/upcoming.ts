import { resolveDay } from '../domain/calc';
import { addDays, dayKey, parseDayKey } from '../domain/time';
import type { DayEntry, DayKey, ResolvedDay, Shift } from '../domain/types';

export interface Occurrence {
  day: ResolvedDay;
  startsAt: Date;
  endsAt: Date;
  title: string;
}

/** Date et heure locales de début/fin d'un jour résolu (fin le lendemain si besoin). */
export function occurrenceOf(day: ResolvedDay, fallbackTitle: string): Occurrence {
  const base = parseDayKey(day.key);
  const startsAt = new Date(
    base.getFullYear(),
    base.getMonth(),
    base.getDate(),
    Math.floor(day.start / 60),
    day.start % 60,
  );
  const endBase = day.end > day.start ? base : parseDayKey(addDays(day.key, 1));
  const endsAt = new Date(
    endBase.getFullYear(),
    endBase.getMonth(),
    endBase.getDate(),
    Math.floor(day.end / 60),
    day.end % 60,
  );
  return { day, startsAt, endsAt, title: day.shift?.name ?? fallbackTitle };
}

/** Tous les postes entre deux jours inclus, dans l'ordre chronologique. */
export function occurrencesBetween(
  shifts: readonly Shift[],
  days: Readonly<Record<DayKey, DayEntry>>,
  from: DayKey,
  to: DayKey,
  fallbackTitle: string,
): Occurrence[] {
  const map = new Map(shifts.map((s) => [s.id, s]));
  return Object.keys(days)
    .filter((k) => k >= from && k <= to)
    .sort()
    .map((k) => resolveDay(k, days[k], map))
    .filter((d): d is ResolvedDay => d !== null)
    .map((d) => occurrenceOf(d, fallbackTitle));
}

/** Rappels à programmer : prochains postes dont l'heure de rappel est dans le futur. */
export function upcomingReminders(
  shifts: readonly Shift[],
  days: Readonly<Record<DayKey, DayEntry>>,
  minutesBefore: number,
  now: Date,
  limit = 60,
  fallbackTitle = '',
): { occurrence: Occurrence; fireAt: Date }[] {
  const from = dayKey(now);
  const to = addDays(from, 400);
  const out: { occurrence: Occurrence; fireAt: Date }[] = [];
  for (const o of occurrencesBetween(shifts, days, addDays(from, -1), to, fallbackTitle)) {
    const fireAt = new Date(o.startsAt.getTime() - minutesBefore * 60000);
    if (fireAt.getTime() <= now.getTime()) continue;
    out.push({ occurrence: o, fireAt });
    if (out.length >= limit) break;
  }
  return out;
}
