import type { DayKey, Minutes } from './types';

const HHMM = /^([01]?\d|2[0-3]):([0-5]\d)$/;

/** « 08:30 » → 510. Retourne null si le format est invalide. */
export function parseHHMM(value: string): Minutes | null {
  const m = HHMM.exec(value.trim());
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

/** 510 → « 08:30 ». */
export function toHHMM(minutes: Minutes): string {
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

export function dayKey(date: Date): DayKey {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const KEY = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isDayKey(value: string): boolean {
  const m = KEY.exec(value);
  if (!m) return false;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return dayKey(d) === value;
}

/** Date locale à midi (évite les surprises des changements d'heure). */
export function parseDayKey(key: DayKey): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1, 12);
}

export function addDays(key: DayKey, n: number): DayKey {
  const d = parseDayKey(key);
  d.setDate(d.getDate() + n);
  return dayKey(d);
}

/** Clé de mois « YYYY-MM ». */
export function monthOf(key: DayKey): string {
  return key.slice(0, 7);
}

export function daysInMonth(year: number, month0: number): number {
  return new Date(year, month0 + 1, 0).getDate();
}

/** Numéro de semaine ISO 8601 (semaine commençant le lundi). */
export function isoWeek(date: Date): { year: number; week: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - yearStart) / 86400000 + 1) / 7);
  return { year: d.getUTCFullYear(), week };
}

/** Lundi de la semaine ISO contenant ce jour. */
export function isoWeekStart(key: DayKey): DayKey {
  const d = parseDayKey(key);
  const day = d.getDay() || 7;
  return addDays(key, 1 - day);
}

/**
 * Saisie rapide d'une heure : « 8 » → 08:00, « 830 » → 08:30, « 0830 » → 08:30,
 * « 8h30 » / « 8:30 » / « 8.30 » → 08:30. Renvoie null si invalide.
 */
export function normalizeTimeInput(input: string): Minutes | null {
  const s = input.trim().toLowerCase().replace(/\s/g, '');
  if (!s) return null;
  let h: number;
  let m: number;
  const sep = /^(\d{1,2})[:h.,](\d{0,2})$/.exec(s);
  if (sep) {
    h = Number(sep[1]);
    m = sep[2] ? Number(sep[2].padEnd(2, '0')) : 0;
  } else if (/^\d{1,4}$/.test(s)) {
    if (s.length <= 2) {
      h = Number(s);
      m = 0;
    } else {
      h = Number(s.slice(0, s.length - 2));
      m = Number(s.slice(-2));
    }
  } else {
    return null;
  }
  if (h === 24 && m === 0) h = 0;
  if (h > 23 || m > 59) return null;
  return h * 60 + m;
}

/** Jour suivant dans le même mois (reste sur le dernier jour du mois sinon). */
export function nextInMonth(key: DayKey): DayKey {
  const next = addDays(key, 1);
  return next.slice(0, 7) === key.slice(0, 7) ? next : key;
}
