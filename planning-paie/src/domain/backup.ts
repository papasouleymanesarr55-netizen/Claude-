import { isDayKey, parseHHMM, toHHMM } from './time';
import { DEFAULT_RULES, SHIFT_COLORS } from './types';
import type { DayEntry, DayKey, PayRules, Shift } from './types';

/** Format de sauvegarde, compatible avec le prototype web (v: 1). */
export interface BackupFile {
  v: 1;
  app?: string;
  exportedAt?: string;
  shifts: {
    id: string;
    name: string;
    start: string;
    end: string;
    pause: number;
    rate: number;
    color: string;
    employer?: string;
  }[];
  days: Record<
    DayKey,
    {
      s?: string;
      start?: string;
      end?: string;
      pause?: number;
      rate?: number;
      note?: string;
      employer?: string;
    }
  >;
  net: number;
  rate: number;
  rules?: PayRules;
}

export interface BackupData {
  shifts: Shift[];
  days: Record<DayKey, DayEntry>;
  charges?: number;
  lastRate?: number;
  rules?: PayRules;
}

export function exportBackup(
  data: Required<Omit<BackupData, 'rules'>> & { rules: PayRules },
  now = new Date(),
): BackupFile {
  const days: BackupFile['days'] = {};
  for (const key of Object.keys(data.days).sort()) {
    const e = data.days[key]!;
    const out: BackupFile['days'][string] = {};
    if (e.shiftId) out.s = e.shiftId;
    if (e.start !== undefined) out.start = toHHMM(e.start);
    if (e.end !== undefined) out.end = toHHMM(e.end);
    if (e.pause !== undefined) out.pause = e.pause;
    if (e.rate !== undefined) out.rate = e.rate;
    if (e.note) out.note = e.note;
    if (e.employer !== undefined) out.employer = e.employer;
    days[key] = out;
  }
  return {
    v: 1,
    app: 'planning-paie',
    exportedAt: now.toISOString(),
    shifts: data.shifts.map((s) => ({
      id: s.id,
      name: s.name,
      start: toHHMM(s.start),
      end: toHHMM(s.end),
      pause: s.pause,
      rate: s.rate,
      color: s.color,
      ...(s.employer ? { employer: s.employer } : {}),
    })),
    days,
    net: data.charges,
    rate: data.lastRate,
    rules: data.rules,
  };
}

export type ImportError = 'notJson' | 'notBackup' | 'badShift' | 'tooLarge' | 'empty';

export type ImportResult =
  { ok: true; data: BackupData; skippedDays: number } | { ok: false; error: ImportError };

const MAX_SIZE = 5 * 1024 * 1024;
const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function num(v: unknown, min: number, max: number): number | undefined {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v.replace(',', '.')) : v;
  if (typeof n !== 'number' || !Number.isFinite(n) || n < min || n > max) return undefined;
  return n;
}

function time(v: unknown): number | undefined {
  if (typeof v === 'string') return parseHHMM(v) ?? undefined;
  if (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v < 1440) return v;
  return undefined;
}

function parseRules(v: unknown): PayRules | undefined {
  if (!isObject(v)) return undefined;
  const o = isObject(v.overtime) ? v.overtime : {};
  const n = isObject(v.night) ? v.night : {};
  const d = DEFAULT_RULES;
  return {
    enabled: typeof v.enabled === 'boolean' ? v.enabled : d.enabled,
    overtime: {
      enabled: typeof o.enabled === 'boolean' ? o.enabled : d.overtime.enabled,
      weeklyThreshold: num(o.weeklyThreshold, 0, 168) ?? d.overtime.weeklyThreshold,
      tier1Hours: num(o.tier1Hours, 0, 168) ?? d.overtime.tier1Hours,
      tier1Rate: num(o.tier1Rate, 0, 500) ?? d.overtime.tier1Rate,
      tier2Rate: num(o.tier2Rate, 0, 500) ?? d.overtime.tier2Rate,
    },
    night: {
      rate: num(n.rate, 0, 500) ?? d.night.rate,
      start: time(n.start) ?? d.night.start,
      end: time(n.end) ?? d.night.end,
    },
    sundayRate: num(v.sundayRate, 0, 500) ?? d.sundayRate,
    holidayRate: num(v.holidayRate, 0, 500) ?? d.holidayRate,
    alsaceMoselle: v.alsaceMoselle === true,
    extraHolidays: Array.isArray(v.extraHolidays)
      ? v.extraHolidays.filter((k): k is string => typeof k === 'string' && isDayKey(k))
      : [],
    stacking: v.stacking === 'sum' ? 'sum' : 'max',
  };
}

/**
 * Lit et valide un fichier de sauvegarde (application ou prototype web).
 * Ne modifie rien : l'appelant remplace les données seulement si `ok`.
 */
export function parseBackup(text: string): ImportResult {
  if (text.length > MAX_SIZE) return { ok: false, error: 'tooLarge' };
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'notJson' };
  }
  if (!isObject(raw) || !Array.isArray(raw.shifts) || !isObject(raw.days)) {
    return { ok: false, error: 'notBackup' };
  }

  const shifts: Shift[] = [];
  const ids = new Set<string>();
  for (let i = 0; i < raw.shifts.length; i++) {
    const s: unknown = raw.shifts[i];
    if (!isObject(s)) return { ok: false, error: 'badShift' };
    const start = time(s.start);
    const end = time(s.end);
    const name = typeof s.name === 'string' ? s.name.trim().slice(0, 40) : '';
    if (start === undefined || end === undefined || !name) return { ok: false, error: 'badShift' };
    let id = typeof s.id === 'string' && s.id ? s.id : `import-${i}`;
    if (ids.has(id)) id = `${id}-${i}`;
    ids.add(id);
    shifts.push({
      id,
      name,
      start,
      end,
      pause: num(s.pause, 0, 1439) ?? 0,
      rate: num(s.rate, 0, 10000) ?? 0,
      color:
        typeof s.color === 'string' && HEX.test(s.color)
          ? s.color
          : SHIFT_COLORS[i % SHIFT_COLORS.length]!,
      ...(typeof s.employer === 'string' && s.employer.trim()
        ? { employer: s.employer.trim().slice(0, 40) }
        : {}),
    });
  }

  const days: Record<DayKey, DayEntry> = {};
  let skipped = 0;
  for (const [key, value] of Object.entries(raw.days)) {
    const v: unknown = typeof value === 'string' ? { s: value } : value;
    if (!isDayKey(key) || !isObject(v)) {
      skipped++;
      continue;
    }
    const entry: DayEntry = {};
    if (typeof v.s === 'string' && ids.has(v.s)) entry.shiftId = v.s;
    const start = time(v.start);
    const end = time(v.end);
    const pause = num(v.pause, 0, 1439);
    const rate = num(v.rate, 0, 10000);
    if (start !== undefined) entry.start = start;
    if (end !== undefined) entry.end = end;
    if (pause !== undefined) entry.pause = pause;
    if (rate !== undefined) entry.rate = rate;
    if (typeof v.note === 'string' && v.note.trim()) entry.note = v.note.trim().slice(0, 60);
    if (typeof v.employer === 'string') entry.employer = v.employer.trim().slice(0, 40);
    const usable =
      entry.shiftId !== undefined || (entry.start !== undefined && entry.end !== undefined);
    if (!usable) {
      skipped++;
      continue;
    }
    days[key] = entry;
  }

  if (shifts.length === 0 && Object.keys(days).length === 0) return { ok: false, error: 'empty' };

  const data: BackupData = { shifts, days };
  const charges = num(raw.net, 0, 100);
  if (charges !== undefined) data.charges = charges;
  const lastRate = num(raw.rate, 0, 10000);
  if (lastRate !== undefined) data.lastRate = lastRate;
  const rules = parseRules(raw.rules);
  if (rules) data.rules = rules;
  return { ok: true, data, skippedDays: skipped };
}
