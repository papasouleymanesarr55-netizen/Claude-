import { round2 } from './calc';
import type { EmployerRecap } from './recap';

/** Coordonnées de l'émetteur (vous), pour les factures. */
export interface Issuer {
  name: string;
  address: string;
  siret: string;
  email: string;
  phone: string;
  /** Mention TVA, ex. « TVA non applicable, art. 293 B du CGI ». */
  vatMention: string;
  /** Délai de paiement en jours. */
  paymentDays: number;
  iban: string;
}

export interface Billing {
  issuer: Issuer;
  /** Adresse de chaque client, par nom d'entreprise. */
  clients: Record<string, { address: string }>;
  /** Prochain numéro de facture pour l'année indiquée (numérotation continue). */
  counter: { year: number; next: number };
}

export const DEFAULT_VAT_MENTION = 'TVA non applicable, art. 293 B du CGI';

export function defaultBilling(year = new Date().getFullYear()): Billing {
  return {
    issuer: {
      name: '',
      address: '',
      siret: '',
      email: '',
      phone: '',
      vatMention: DEFAULT_VAT_MENTION,
      paymentDays: 30,
      iban: '',
    },
    clients: {},
    counter: { year, next: 1 },
  };
}

/** Numéro proposé : « 2026-001 », remis à 1 chaque nouvelle année. */
export function nextInvoiceNumber(counter: Billing['counter'], now = new Date()): string {
  const year = now.getFullYear();
  const n = counter.year === year ? counter.next : 1;
  return `${year}-${String(n).padStart(3, '0')}`;
}

/** Compteur après émission d'une facture portant `number` (si c'est un numéro de la série). */
export function advanceCounter(counter: Billing['counter'], number: string): Billing['counter'] {
  const m = /^(\d{4})-(\d+)$/.exec(number.trim());
  if (!m) return counter;
  const year = Number(m[1]);
  const n = Number(m[2]);
  if (year > counter.year) return { year, next: n + 1 };
  if (year === counter.year) return { year, next: Math.max(counter.next, n + 1) };
  return counter;
}

export interface InvoiceLine {
  label: string;
  /** Quantité en heures (null pour une ligne forfaitaire). */
  hours: number | null;
  rate: number | null;
  amount: number;
}

/**
 * Lignes de facture d'une entreprise : une ligne par poste et par taux horaire,
 * plus une ligne de majorations éventuelle. Le total est égal au brut du récap.
 */
export function invoiceLines(recap: EmployerRecap, premiumLabel: string): InvoiceLine[] {
  const map = new Map<string, InvoiceLine>();
  for (const d of recap.days) {
    const label = d.day.shift?.name ?? '';
    const key = `${label}|${d.day.rate}`;
    let line = map.get(key);
    if (!line) {
      line = { label, hours: 0, rate: d.day.rate, amount: 0 };
      map.set(key, line);
    }
    line.hours = (line.hours ?? 0) + d.hours;
  }
  const lines = [...map.values()].map((l) => ({
    ...l,
    amount: round2((l.hours ?? 0) * (l.rate ?? 0)),
  }));
  // Écart d'arrondi (les jours sont arrondis un par un) : reporté sur la dernière ligne.
  const base = round2(recap.gross - recap.premium);
  const sum = round2(lines.reduce((s, l) => s + l.amount, 0));
  const last = lines[lines.length - 1];
  if (last && sum !== base) last.amount = round2(last.amount + base - sum);
  if (recap.premium > 0) {
    lines.push({ label: premiumLabel, hours: null, rate: null, amount: recap.premium });
  }
  return lines;
}
