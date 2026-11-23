import { z } from 'zod';
import { fetchJson } from '@/core/providers/http';
import { ProviderError, type PlacesProvider } from '@/core/providers/types';
import type { Place } from '@/features/places/types';

/**
 * Prix des carburants en France – flux instantané v2 (DGCCRF, via data.economie.gouv.fr).
 * Licence Ouverte 2.0 : réutilisation commerciale autorisée, mention de la source obligatoire.
 * Flux mis à jour toutes les 10 minutes. Quota anonyme observé : 50 000 appels/jour.
 * Les horodatages publiés sont des heures légales françaises : ils sont affichés tels quels.
 */
const ENDPOINT =
  'https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix-des-carburants-en-france-flux-instantane-v2/records';
const MAX_RESULTS = 100; // limite par requête de l'API
export const FUEL_CACHE_TTL_MS = 10 * 60_000;
/** Au-delà, le prix est signalé comme ancien. */
const STALE_AFTER_MS = 3 * 24 * 3600_000;

/** Ordre d'affichage : le premier carburant disponible est mis en avant sur la fiche. */
export const FUELS = [
  { key: 'gazole', label: 'Gazole' },
  { key: 'e10', label: 'SP95-E10' },
  { key: 'sp95', label: 'SP95' },
  { key: 'sp98', label: 'SP98' },
  { key: 'e85', label: 'E85' },
  { key: 'gplc', label: 'GPLc' },
] as const;
type FuelKey = (typeof FUELS)[number]['key'];

const num = z.number().nullable().optional();
const str = z.string().nullable().optional();
const recordSchema = z.object({
  id: z.number(),
  adresse: str,
  cp: str,
  ville: str,
  pop: str,
  geom: z.object({ lon: z.number(), lat: z.number() }),
  gazole_prix: num,
  gazole_maj: str,
  e10_prix: num,
  e10_maj: str,
  sp95_prix: num,
  sp95_maj: str,
  sp98_prix: num,
  sp98_maj: str,
  e85_prix: num,
  e85_maj: str,
  gplc_prix: num,
  gplc_maj: str,
  carburants_rupture_temporaire: str,
  carburants_rupture_definitive: str,
  services_service: z
    .union([z.string(), z.array(z.string())])
    .nullable()
    .optional(),
  horaires_automate_24_24: str,
});
const responseSchema = z.object({ total_count: z.number(), results: z.array(z.unknown()) });

export interface FuelPrice {
  fuel: string;
  amount: number;
  /** Horodatage publié (heure légale française), au format « AAAA-MM-JJTHH:MM ». */
  updatedAt: string;
}

/** « 2026-11-23T07:32:00+00:00 » → « 2026-11-23T07:32 » (heure publiée, sans conversion). */
function publishedTime(raw: string): string {
  return raw.slice(0, 16);
}

/** Âge approximatif d'un relevé (heure de Paris ≈ UTC+1/+2) : utilisé seulement pour l'alerte « ancien ». */
function ageMs(published: string, now: number): number {
  return now - Date.parse(`${published}:00+01:00`);
}

export function formatPublished(published: string): string {
  const [date = '', time = ''] = published.split('T');
  const [, month, day] = date.split('-');
  return `${day}/${month} ${time}`;
}

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/(^|[\s'/-])(\p{L})/gu, (_, sep: string, c: string) => sep + c.toUpperCase());
}

export function toPlace(raw: unknown, now = Date.now()): Place | null {
  const parsed = recordSchema.safeParse(raw);
  if (!parsed.success) return null;
  const r = parsed.data;
  const unavailable =
    `${r.carburants_rupture_temporaire ?? ''};${r.carburants_rupture_definitive ?? ''}`
      .split(';')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

  const prices: FuelPrice[] = [];
  for (const { key, label } of FUELS) {
    const amount = r[`${key}_prix` as `${FuelKey}_prix`];
    const maj = r[`${key}_maj` as `${FuelKey}_maj`];
    if (amount == null || !maj || amount <= 0) continue;
    if (unavailable.includes(label.toLowerCase()) || unavailable.includes(key)) continue;
    prices.push({ fuel: label, amount, updatedAt: publishedTime(maj) });
  }
  if (prices.length === 0) return null;

  const main = prices[0];
  if (!main) return null;
  const latest =
    prices
      .map((p) => p.updatedAt)
      .sort()
      .at(-1) ?? main.updatedAt;
  const stale = ageMs(main.updatedAt, now) > STALE_AFTER_MS;
  const services = Array.isArray(r.services_service)
    ? r.services_service
    : (r.services_service ?? '').split('//').filter(Boolean);
  const street = r.adresse ? titleCase(r.adresse.trim()) : 'Adresse non communiquée';

  return {
    id: `fuel-${r.id}`,
    name: street,
    category: 'fuel',
    position: { lat: r.geom.lat, lng: r.geom.lon },
    address: [r.cp, r.ville ? titleCase(r.ville) : null].filter(Boolean).join(' '),
    price: { amount: main.amount, unit: 'L', decimals: 3 },
    details: [
      { label: 'Carburant', value: main.fuel, unit: null },
      {
        label: 'Relevé',
        value: formatPublished(main.updatedAt).slice(0, 5),
        unit: null,
        hint: `Prix relevé le ${formatPublished(main.updatedAt).replace(' ', ' à ')}${stale ? ' (relevé ancien)' : ''}`,
        tone: stale ? 'warning' : undefined,
      },
    ],
    services: [
      ...prices.slice(1).map((p) => `${p.fuel} ${p.amount.toFixed(3).replace('.', ',')} €`),
      ...(r.horaires_automate_24_24 === 'Oui' ? ['Automate 24/24'] : []),
      ...services.slice(0, 2),
    ],
    openingHours: null,
    fuelPrices: prices,
    source: {
      name: 'Prix des carburants (DGCCRF)',
      isDemo: false,
      updatedAt: latest,
    },
  };
}

export const fuelGouvProvider: PlacesProvider = {
  info: {
    id: 'prix-carburants',
    name: 'Prix des carburants',
    producer: 'DGCCRF (ministère de l’Économie)',
    licence: 'Licence Ouverte 2.0',
    licenceUrl: 'https://www.etalab.gouv.fr/licence-ouverte-open-licence/',
    url: 'https://data.economie.gouv.fr/explore/dataset/prix-des-carburants-en-france-flux-instantane-v2/',
    updateFrequency: 'Toutes les 10 minutes',
    isDemo: false,
  },
  categories: ['fuel'],
  cacheTtlMs: FUEL_CACHE_TTL_MS,
  async nearby({ center, radiusM }, signal) {
    const point = `geom'POINT(${center.lng.toFixed(5)} ${center.lat.toFixed(5)})'`;
    const params = new URLSearchParams({
      where: `within_distance(geom, ${point}, ${Math.ceil(radiusM / 100) / 10}km)`,
      order_by: `distance(geom, ${point})`,
      limit: String(MAX_RESULTS),
    });
    const json = await fetchJson('prix-carburants', `${ENDPOINT}?${params}`, signal);
    const body = responseSchema.safeParse(json);
    if (!body.success)
      throw new ProviderError('prix-carburants', 'invalid-data', 'Réponse invalide');
    const now = Date.now();
    return body.data.results.map((r) => toPlace(r, now)).filter((p): p is Place => p !== null);
  },
};
