import type { PlacesProvider } from '@/core/providers/types';
import { fetchJson } from '@/core/providers/http';
import { ProviderError } from '@/core/providers/types';
import { radiusBounds } from '@/features/location/area';
import type { Place } from '@/features/places/types';
import { distanceMeters } from '@/lib/geo';
import type { StationRecord } from '../../../ingestion/irve/transform';

/**
 * Bornes de recharge : base nationale consolidée IRVE (données statiques), prétraitée par
 * `npm run ingest:irve` en tuiles servies par notre propre site. Aucune requête vers un tiers
 * depuis le navigateur. Licence Ouverte 2.0.
 *
 * Disponibilité : ces données sont STATIQUES. Aucune information « libre / occupée » n'est déduite.
 */
const BASE = `${import.meta.env.BASE_URL}data/irve/v1`;
export const IRVE_CACHE_TTL_MS = 24 * 3600_000;
const MAX_TILES = 48;

interface Manifest {
  version: number;
  zoom: number;
  dataUpdatedAt: string | null;
  tiles: string[];
}

let manifestPromise: Promise<Manifest> | null = null;
function loadManifest(signal?: AbortSignal): Promise<Manifest> {
  manifestPromise ??= (
    fetchJson('irve', `${BASE}/manifest.json`, signal) as Promise<Manifest>
  ).catch((e: unknown) => {
    manifestPromise = null;
    throw e;
  });
  return manifestPromise;
}

const tileCache = new Map<string, Promise<StationRecord[]>>();
function loadTile(zoom: number, key: string, signal?: AbortSignal): Promise<StationRecord[]> {
  const url = `${BASE}/${zoom}/${key}.json`;
  let p = tileCache.get(url);
  if (!p) {
    p = (fetchJson('irve', url, signal) as Promise<StationRecord[]>).catch((e: unknown) => {
      tileCache.delete(url);
      throw e;
    });
    tileCache.set(url, p);
  }
  return p;
}

/** Tuiles (clé « x/y ») qui recouvrent une emprise. */
export function tilesForBounds(
  [west, south, east, north]: [number, number, number, number],
  zoom: number,
): string[] {
  const n = 2 ** zoom;
  const tx = (lng: number) => Math.min(n - 1, Math.max(0, Math.floor(((lng + 180) / 360) * n)));
  const ty = (lat: number) => {
    const r = (lat * Math.PI) / 180;
    return Math.min(
      n - 1,
      Math.max(0, Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n)),
    );
  };
  const keys: string[] = [];
  for (let x = tx(west); x <= tx(east); x++)
    for (let y = ty(north); y <= ty(south); y++) keys.push(`${x}/${y}`);
  return keys;
}

const ACCESS: Record<string, string> = { libre: 'Accès libre', reserve: 'Accès réservé' };

export function toPlace(s: StationRecord): Place {
  const pricing = s.free === true ? 'Gratuit' : s.pricing ? 'Voir tarif' : null;
  return {
    id: `irve-${s.id}`,
    name: s.name,
    category: 'charging',
    position: { lat: s.lat, lng: s.lng },
    address: s.address,
    price: null,
    ...(pricing ? { priceNote: pricing } : {}),
    ...(s.pricing && s.free !== true ? { priceHint: s.pricing } : {}),
    details: [
      {
        label: 'Puissance',
        value: s.powerKw != null ? String(s.powerKw).replace('.', ',') : '—',
        unit: s.powerKw != null ? 'kW' : null,
      },
      { label: 'Points', value: String(s.points), unit: null },
    ],
    services: [
      ...s.connectors,
      ...(s.access ? [ACCESS[s.access] ?? ''] : []),
      ...(s.hours ? ['Horaires restreints'] : []),
      ...(s.operator ? [s.operator] : []),
    ].filter(Boolean),
    openingHours: s.hours,
    availability: null,
    source: {
      name: 'Base nationale IRVE (transport.data.gouv.fr)',
      isDemo: false,
      updatedAt: s.updatedAt,
    },
  };
}

export const irveStaticProvider: PlacesProvider = {
  info: {
    id: 'irve',
    name: 'Bornes de recharge (IRVE)',
    producer: 'transport.data.gouv.fr (Point d’Accès National)',
    licence: 'Licence Ouverte 2.0',
    licenceUrl: 'https://www.etalab.gouv.fr/licence-ouverte-open-licence/',
    url: 'https://transport.data.gouv.fr/datasets/base-nationale-des-points-de-recharge-pour-vehicules-electriques-en-france-irve',
    updateFrequency: 'Quotidienne (prétraitement)',
    isDemo: false,
  },
  categories: ['charging'],
  cacheTtlMs: IRVE_CACHE_TTL_MS,
  async nearby({ center, radiusM }, signal) {
    const manifest = await loadManifest(signal);
    const available = new Set(manifest.tiles);
    const keys = tilesForBounds(radiusBounds(center, radiusM), manifest.zoom).filter((k) =>
      available.has(k),
    );
    if (keys.length > MAX_TILES)
      throw new ProviderError('irve', 'invalid-data', 'Zone trop étendue pour les bornes');
    const tiles = await Promise.all(keys.map((k) => loadTile(manifest.zoom, k, signal)));
    return tiles
      .flat()
      .filter((s) => distanceMeters(center, { lat: s.lat, lng: s.lng }) <= radiusM)
      .map(toPlace);
  },
};

/** Réservé aux tests. */
export function __resetIrveCache() {
  manifestPromise = null;
  tileCache.clear();
}
