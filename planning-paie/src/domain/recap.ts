import { netFrom, resolveDay, round2, type PeriodSummary } from './calc';
import type { DayEntry, DayKey, ResolvedDay, Shift } from './types';

export interface RecapLine {
  /** Nom du poste (ou « personnalisé »). */
  label: string;
  count: number;
  hours: number;
  gross: number;
}

export interface RecapDay {
  day: ResolvedDay;
  hours: number;
  gross: number;
}

export interface EmployerRecap {
  /** Nom de l'entreprise ; chaîne vide = « sans entreprise ». */
  employer: string;
  hours: number;
  daysWorked: number;
  base: number;
  premium: number;
  gross: number;
  net: number;
  /** Détail par poste, du plus d'heures au moins d'heures. */
  lines: RecapLine[];
  days: RecapDay[];
}

export interface Recap {
  employers: EmployerRecap[];
  total: { hours: number; daysWorked: number; premium: number; gross: number; net: number };
}

/**
 * Regroupe les jours d'une période par entreprise : heures, jours, brut, net estimé,
 * détail par poste et liste des jours. Les montants viennent de `summary` (calcul avancé inclus).
 */
export function recapByEmployer(
  summary: PeriodSummary,
  shifts: readonly Shift[],
  days: Readonly<Record<DayKey, DayEntry>>,
  charges: number,
  customLabel: string,
): Recap {
  const map = new Map(shifts.map((s) => [s.id, s]));
  const groups = new Map<string, EmployerRecap>();
  const workedDays = new Map<string, Set<DayKey>>();

  for (const key of Object.keys(summary.days).sort()) {
    const pay = summary.days[key]!;
    const day = resolveDay(key, days[key], map);
    if (!day) continue;
    const emp = day.employer ?? '';
    let g = groups.get(emp);
    if (!g) {
      g = {
        employer: emp,
        hours: 0,
        daysWorked: 0,
        base: 0,
        premium: 0,
        gross: 0,
        net: 0,
        lines: [],
        days: [],
      };
      groups.set(emp, g);
      workedDays.set(emp, new Set());
    }
    g.hours += pay.hours;
    g.base += pay.base;
    g.premium += pay.premium;
    g.gross += pay.gross;
    if (pay.hours > 0) workedDays.get(emp)!.add(key);
    g.days.push({ day, hours: pay.hours, gross: pay.gross });
    const label = day.shift?.name ?? customLabel;
    let line = g.lines.find((l) => l.label === label);
    if (!line) {
      line = { label, count: 0, hours: 0, gross: 0 };
      g.lines.push(line);
    }
    line.count += 1;
    line.hours += pay.hours;
    line.gross += pay.gross;
  }

  const employers = [...groups.values()].map((g) => {
    g.base = round2(g.base);
    g.premium = round2(g.premium);
    g.gross = round2(g.gross);
    g.net = netFrom(g.gross, charges);
    g.daysWorked = workedDays.get(g.employer)!.size;
    g.lines = g.lines
      .map((l) => ({ ...l, gross: round2(l.gross) }))
      .sort((a, b) => b.hours - a.hours);
    return g;
  });
  // Entreprises nommées par ordre alphabétique, « sans entreprise » à la fin.
  employers.sort((a, b) =>
    !a.employer ? 1 : !b.employer ? -1 : a.employer.localeCompare(b.employer, 'fr'),
  );

  const gross = round2(employers.reduce((s, e) => s + e.gross, 0));
  return {
    employers,
    total: {
      hours: employers.reduce((s, e) => s + e.hours, 0),
      daysWorked: new Set(employers.flatMap((e) => e.days.map((d) => d.day.key))).size,
      premium: round2(employers.reduce((s, e) => s + e.premium, 0)),
      gross,
      net: netFrom(gross, charges),
    },
  };
}

/** Noms d'entreprises déjà utilisés (pour les suggestions de saisie). */
export function knownEmployers(
  shifts: readonly Shift[],
  days: Readonly<Record<DayKey, DayEntry>>,
): string[] {
  const set = new Set<string>();
  for (const s of shifts) if (s.employer?.trim()) set.add(s.employer.trim());
  for (const d of Object.values(days)) if (d.employer?.trim()) set.add(d.employer.trim());
  return [...set].sort((a, b) => a.localeCompare(b, 'fr'));
}
