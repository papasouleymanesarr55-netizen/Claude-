export type Lang = 'fr' | 'en';

const money = new Map<Lang, Intl.NumberFormat>();
const decimal = new Map<string, Intl.NumberFormat>();

function moneyFormatter(lang: Lang): Intl.NumberFormat {
  let f = money.get(lang);
  if (!f) {
    f = new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : 'en-GB', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    money.set(lang, f);
  }
  return f;
}

/** Remplace les espaces insécables par des espaces normales (affichage et tests stables). */
export function plainSpaces(s: string): string {
  return s.replace(/[  ]/g, ' ');
}

/** « 1 234,56 € » (fr) ou « €1,234.56 » (en). */
export function formatMoney(value: number, lang: Lang = 'fr'): string {
  return plainSpaces(moneyFormatter(lang).format(value));
}

export function formatNumber(value: number, lang: Lang = 'fr', maxDigits = 2): string {
  const id = `${lang}-${maxDigits}`;
  let f = decimal.get(id);
  if (!f) {
    f = new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : 'en-GB', {
      maximumFractionDigits: maxDigits,
    });
    decimal.set(id, f);
  }
  return plainSpaces(f.format(value));
}

/** 7.5 → « 7 h 30 » ; 8 → « 8 h » (fr) ; « 7h30 » / « 8h » (en). */
export function formatHours(hours: number, lang: Lang = 'fr'): string {
  const total = Math.round(hours * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  const sep = lang === 'fr' ? ' h' : 'h';
  if (m === 0) return `${h}${sep}`;
  return `${h}${sep}${lang === 'fr' ? ' ' : ''}${String(m).padStart(2, '0')}`;
}

/** Version courte pour les cellules du calendrier : « 7h30 ». */
export function formatHoursShort(hours: number): string {
  const total = Math.round(hours * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
}

/** Saisie utilisateur « 12,50 » ou « 12.5 » → 12.5 ; null si invalide. */
export function parseDecimal(input: string): number | null {
  const s = input.trim().replace(/\s/g, '').replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
