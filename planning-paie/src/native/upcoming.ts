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

export type ReminderKind = 'before' | 'eve' | 'day';

export interface ReminderOptions {
  /** Minutes avant le début (0 = aucun). */
  before: number;
  /** La veille : 24 h avant le début. */
  eve: boolean;
  /** Le jour J à `dayTime` (si cette heure tombe après le début : 1 h avant le début). */
  day: boolean;
  dayTime: number;
}

/** Heure du rappel « jour J » d'un poste. */
export function dayOfFireAt(o: Occurrence, dayTime: number): Date {
  const at = new Date(o.startsAt);
  at.setHours(Math.floor(dayTime / 60), dayTime % 60, 0, 0);
  if (at.getTime() < o.startsAt.getTime()) return at;
  return new Date(o.startsAt.getTime() - 60 * 60000);
}

/**
 * Rappels à programmer, tous types confondus, dans l'ordre chronologique :
 * seuls ceux dans le futur sont gardés, dans la limite de `limit`.
 */
export function upcomingReminders(
  shifts: readonly Shift[],
  days: Readonly<Record<DayKey, DayEntry>>,
  options: ReminderOptions,
  now: Date,
  limit = 60,
  fallbackTitle = '',
): { occurrence: Occurrence; fireAt: Date; kind: ReminderKind }[] {
  const from = dayKey(now);
  const to = addDays(from, 400);
  const out: { occurrence: Occurrence; fireAt: Date; kind: ReminderKind }[] = [];
  for (const o of occurrencesBetween(shifts, days, addDays(from, -1), to, fallbackTitle)) {
    const start = o.startsAt.getTime();
    const candidates: [ReminderKind, Date][] = [];
    if (options.eve) candidates.push(['eve', new Date(start - 24 * 3600000)]);
    if (options.day) candidates.push(['day', dayOfFireAt(o, options.dayTime)]);
    if (options.before > 0) candidates.push(['before', new Date(start - options.before * 60000)]);
    for (const [kind, fireAt] of candidates) {
      if (fireAt.getTime() > now.getTime()) out.push({ occurrence: o, fireAt, kind });
    }
    // Les postes sont triés : on peut s'arrêter dès qu'on a largement assez de rappels.
    if (out.length >= limit * 3) break;
  }
  out.sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime());
  return out.slice(0, limit);
}
