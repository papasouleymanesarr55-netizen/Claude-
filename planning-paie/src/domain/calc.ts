import { isHoliday } from './holidays';
import { addDays, daysInMonth, isoWeekStart, parseDayKey } from './time';
import type { DayEntry, DayKey, Minutes, PayRules, ResolvedDay, Shift } from './types';

/** Arrondi au centime (arrondi commercial, insensible aux erreurs binaires). */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Amplitude en minutes ; si fin ≤ début, le poste passe minuit (+24 h). */
export function spanMinutes(start: Minutes, end: Minutes): number {
  return end > start ? end - start : end + 1440 - start;
}

/** Temps de travail effectif en minutes (jamais négatif). */
export function workedMinutes(start: Minutes, end: Minutes, pause: number): number {
  return Math.max(0, spanMinutes(start, end) - Math.max(0, pause));
}

/** Durée en heures. */
export function durationHours(start: Minutes, end: Minutes, pause: number): number {
  return workedMinutes(start, end, pause) / 60;
}

/** Brut d'un poste ou d'un jour, arrondi au centime. */
export function grossFor(start: Minutes, end: Minutes, pause: number, rate: number): number {
  return round2(durationHours(start, end, pause) * Math.max(0, rate));
}

export function resolveDay(
  key: DayKey,
  entry: DayEntry | undefined,
  shiftsById: ReadonlyMap<string, Shift>,
): ResolvedDay | null {
  if (!entry) return null;
  const shift = entry.shiftId ? shiftsById.get(entry.shiftId) : undefined;
  const start = entry.start ?? shift?.start;
  const end = entry.end ?? shift?.end;
  if (start === undefined || end === undefined) return null;
  const pause = entry.pause ?? shift?.pause ?? 0;
  const rate = entry.rate ?? shift?.rate ?? 0;
  const customized =
    !shift ||
    (entry.start !== undefined && entry.start !== shift.start) ||
    (entry.end !== undefined && entry.end !== shift.end) ||
    (entry.pause !== undefined && entry.pause !== shift.pause) ||
    (entry.rate !== undefined && entry.rate !== shift.rate) ||
    (entry.employer !== undefined && entry.employer !== (shift.employer ?? ''));
  const employer = (entry.employer ?? shift?.employer)?.trim() || undefined;
  return {
    key,
    shift,
    start,
    end,
    pause,
    rate,
    note: entry.note || undefined,
    employer,
    customized,
  };
}

/**
 * Construit la saisie d'un jour en ne gardant que les valeurs qui diffèrent du poste.
 */
export function buildDayEntry(
  shift: Shift | undefined,
  values: {
    start: Minutes;
    end: Minutes;
    pause: number;
    rate: number;
    note?: string;
    employer?: string;
  },
): DayEntry {
  const entry: DayEntry = {};
  if (shift) {
    entry.shiftId = shift.id;
    if (values.start !== shift.start) entry.start = values.start;
    if (values.end !== shift.end) entry.end = values.end;
    if (values.pause !== shift.pause) entry.pause = values.pause;
    if (values.rate !== shift.rate) entry.rate = values.rate;
  } else {
    entry.start = values.start;
    entry.end = values.end;
    entry.pause = values.pause;
    entry.rate = values.rate;
  }
  const employer = values.employer?.trim().slice(0, 40) ?? '';
  if (employer !== (shift?.employer ?? '')) entry.employer = employer;
  const note = values.note?.trim();
  if (note) entry.note = note.slice(0, 60);
  return entry;
}

export interface DayPay {
  key: DayKey;
  hours: number;
  base: number;
  premium: number;
  gross: number;
  overtime1Hours: number;
  overtime2Hours: number;
  nightHours: number;
  sundayHours: number;
  holidayHours: number;
}

export interface PeriodSummary {
  hours: number;
  daysWorked: number;
  base: number;
  premium: number;
  gross: number;
  overtime1Hours: number;
  overtime2Hours: number;
  nightHours: number;
  sundayHours: number;
  holidayHours: number;
  days: Record<DayKey, DayPay>;
}

export function netFrom(gross: number, chargesPercent: number): number {
  const c = Math.min(100, Math.max(0, chargesPercent));
  return round2(gross * (1 - c / 100));
}

function inRange(m: number, start: number, end: number): boolean {
  if (start === end) return false;
  return start < end ? m >= start && m < end : m >= start || m < end;
}

/** Répartit `weight` minutes à partir de la position `pos` entre 3 tranches. */
function splitTiers(pos: number, weight: number, t0: number, t1: number): [number, number, number] {
  const endPos = pos + weight;
  const normal = Math.max(0, Math.min(endPos, t0) - pos);
  const tier1 = Math.max(0, Math.min(endPos, t1) - Math.max(pos, t0));
  const tier2 = Math.max(0, endPos - Math.max(pos, t1));
  return [normal, tier1, tier2];
}

function combine(rates: number[], stacking: PayRules['stacking']): number {
  if (rates.length === 0) return 0;
  return stacking === 'sum' ? rates.reduce((a, b) => a + b, 0) : Math.max(...rates);
}

/** Calcul avancé d'un jour, connaissant les minutes déjà travaillées dans la semaine ISO. */
function advancedDay(day: ResolvedDay, rules: PayRules, weekMinutesBefore: number): DayPay {
  const span = spanMinutes(day.start, day.end);
  const worked = workedMinutes(day.start, day.end, day.pause);
  const factor = span > 0 ? worked / span : 0;
  const t0 = rules.overtime.weeklyThreshold * 60;
  const t1 = t0 + rules.overtime.tier1Hours * 60;
  const nextKey = addDays(day.key, 1);
  const dateInfo = [day.key, nextKey].map((k) => ({
    sunday: parseDayKey(k).getDay() === 0,
    holiday: isHoliday(k, rules.alsaceMoselle, rules.extraHolidays),
  }));

  let pos = weekMinutesBefore;
  /** Somme des (minutes × pourcentage), convertie en euros à la fin pour limiter les erreurs d'arrondi. */
  let premium = 0;
  let o1 = 0;
  let o2 = 0;
  let night = 0;
  let sunday = 0;
  let holiday = 0;

  for (let i = 0; i < span; i++) {
    const abs = day.start + i;
    const info = dateInfo[abs >= 1440 ? 1 : 0]!;
    const isNight = inRange(abs % 1440, rules.night.start, rules.night.end);
    const flat: number[] = [];
    if (isNight && rules.night.rate > 0) flat.push(rules.night.rate);
    if (info.sunday && rules.sundayRate > 0) flat.push(rules.sundayRate);
    if (info.holiday && rules.holidayRate > 0) flat.push(rules.holidayRate);
    if (isNight) night += factor;
    if (info.sunday) sunday += factor;
    if (info.holiday) holiday += factor;

    if (rules.overtime.enabled) {
      const [n, a, b] = splitTiers(pos, factor, t0, t1);
      premium += n * combine(flat, rules.stacking);
      premium += a * combine([...flat, rules.overtime.tier1Rate], rules.stacking);
      premium += b * combine([...flat, rules.overtime.tier2Rate], rules.stacking);
      o1 += a;
      o2 += b;
    } else {
      premium += factor * combine(flat, rules.stacking);
    }
    pos += factor;
  }

  const base = round2((worked / 60) * Math.max(0, day.rate));
  const prem = round2((premium * Math.max(0, day.rate)) / 6000);
  return {
    key: day.key,
    hours: worked / 60,
    base,
    premium: prem,
    gross: round2(base + prem),
    overtime1Hours: o1 / 60,
    overtime2Hours: o2 / 60,
    nightHours: night / 60,
    sundayHours: sunday / 60,
    holidayHours: holiday / 60,
  };
}

function simpleDay(day: ResolvedDay): DayPay {
  const worked = workedMinutes(day.start, day.end, day.pause);
  const base = round2((worked / 60) * Math.max(0, day.rate));
  return {
    key: day.key,
    hours: worked / 60,
    base,
    premium: 0,
    gross: base,
    overtime1Hours: 0,
    overtime2Hours: 0,
    nightHours: 0,
    sundayHours: 0,
    holidayHours: 0,
  };
}

export interface CalcInput {
  shifts: readonly Shift[];
  days: Readonly<Record<DayKey, DayEntry>>;
  rules: PayRules;
  /** Calcul avancé autorisé (Premium) et activé. */
  advanced: boolean;
}

/** Liste ordonnée des clés de jour de `from` à `to` inclus. */
export function keysBetween(from: DayKey, to: DayKey): DayKey[] {
  const out: DayKey[] = [];
  for (let k = from; k <= to; k = addDays(k, 1)) out.push(k);
  return out;
}

/**
 * Calcule la paie de chaque jour de [from ; to] et les totaux.
 * Un poste de nuit est rattaché à son jour de début. Les heures supplémentaires
 * se calculent par semaine ISO complète, même si elle déborde de la période.
 */
export function computePeriod(input: CalcInput, from: DayKey, to: DayKey): PeriodSummary {
  const shiftsById = new Map(input.shifts.map((s) => [s.id, s]));
  const advanced = input.advanced && input.rules.enabled;
  const result: PeriodSummary = {
    hours: 0,
    daysWorked: 0,
    base: 0,
    premium: 0,
    gross: 0,
    overtime1Hours: 0,
    overtime2Hours: 0,
    nightHours: 0,
    sundayHours: 0,
    holidayHours: 0,
    days: {},
  };

  const pays: DayPay[] = [];
  if (!advanced) {
    for (const key of keysBetween(from, to)) {
      const day = resolveDay(key, input.days[key], shiftsById);
      if (day) pays.push(simpleDay(day));
    }
  } else {
    const weekFrom = isoWeekStart(from);
    const weekTo = addDays(isoWeekStart(to), 6);
    // Les heures supplémentaires se comptent par employeur (un contrat = un seuil hebdomadaire).
    let weekMinutes = new Map<string, number>();
    for (const key of keysBetween(weekFrom, weekTo)) {
      if (key === isoWeekStart(key)) weekMinutes = new Map();
      const day = resolveDay(key, input.days[key], shiftsById);
      if (!day) continue;
      const emp = day.employer ?? '';
      const before = weekMinutes.get(emp) ?? 0;
      const pay = advancedDay(day, input.rules, before);
      weekMinutes.set(emp, before + workedMinutes(day.start, day.end, day.pause));
      if (key >= from && key <= to) pays.push(pay);
    }
  }

  for (const p of pays) {
    result.days[p.key] = p;
    result.hours += p.hours;
    if (p.hours > 0) result.daysWorked += 1;
    result.base += p.base;
    result.premium += p.premium;
    result.gross += p.gross;
    result.overtime1Hours += p.overtime1Hours;
    result.overtime2Hours += p.overtime2Hours;
    result.nightHours += p.nightHours;
    result.sundayHours += p.sundayHours;
    result.holidayHours += p.holidayHours;
  }
  result.base = round2(result.base);
  result.premium = round2(result.premium);
  result.gross = round2(result.gross);
  return result;
}

export function monthBounds(year: number, month0: number): { from: DayKey; to: DayKey } {
  const mm = String(month0 + 1).padStart(2, '0');
  const last = daysInMonth(year, month0);
  return { from: `${year}-${mm}-01`, to: `${year}-${mm}-${String(last).padStart(2, '0')}` };
}

export function computeMonth(input: CalcInput, year: number, month0: number): PeriodSummary {
  const { from, to } = monthBounds(year, month0);
  return computePeriod(input, from, to);
}
