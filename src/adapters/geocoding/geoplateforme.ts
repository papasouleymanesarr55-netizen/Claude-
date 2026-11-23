import { z } from 'zod';
import {
  ProviderError,
  type GeocodingKind,
  type GeocodingProvider,
  type GeocodingResult,
} from '@/core/providers/types';

/**
 * Géocodage de la Géoplateforme (IGN, Base Adresse Nationale).
 * Gratuit, sans clé, Licence Ouverte 2.0 (réutilisation commerciale autorisée).
 * Limite annoncée : 50 requêtes/s par adresse IP.
 */
const BASE_URL = 'https://data.geopf.fr/geocodage';

const featureSchema = z.object({
  geometry: z.object({ coordinates: z.tuple([z.number(), z.number()]) }),
  properties: z.object({
    label: z.string(),
    name: z.string().optional(),
    postcode: z.string().optional(),
    city: z.string().optional(),
    context: z.string().optional(),
    type: z.string(),
    id: z.string().optional(),
  }),
});
const responseSchema = z.object({ features: z.array(z.unknown()) });

const KINDS: Record<string, GeocodingKind> = {
  housenumber: 'address',
  street: 'street',
  municipality: 'municipality',
  locality: 'locality',
};

function toResult(raw: unknown): GeocodingResult | null {
  const parsed = featureSchema.safeParse(raw);
  if (!parsed.success) return null;
  const { geometry, properties: p } = parsed.data;
  const kind = KINDS[p.type];
  if (!kind) return null;
  const [lng, lat] = geometry.coordinates;
  const place = [p.postcode, p.city].filter(Boolean).join(' ');
  return {
    id: p.id ?? `${p.type}:${p.label}`,
    label: kind === 'municipality' ? p.label : (p.name ?? p.label),
    context: kind === 'municipality' ? (p.context ?? place) : place || (p.context ?? ''),
    kind,
    position: { lat, lng },
  };
}

async function request(path: string, params: Record<string, string>, signal?: AbortSignal) {
  const url = `${BASE_URL}/${path}?${new URLSearchParams(params)}`;
  let res: Response;
  try {
    res = await fetch(url, signal ? { signal } : {});
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError')
      throw new ProviderError('geoplateforme', 'aborted', 'Requête annulée');
    throw new ProviderError('geoplateforme', 'network', 'Service de géocodage injoignable');
  }
  if (res.status === 429)
    throw new ProviderError('geoplateforme', 'rate-limit', 'Trop de requêtes de géocodage');
  if (!res.ok) throw new ProviderError('geoplateforme', 'http', `Géocodage : HTTP ${res.status}`);
  const body = responseSchema.safeParse(await res.json());
  if (!body.success)
    throw new ProviderError('geoplateforme', 'invalid-data', 'Réponse de géocodage invalide');
  return body.data.features.map(toResult).filter((r): r is GeocodingResult => r !== null);
}

export const geoplateformeGeocoder: GeocodingProvider = {
  info: {
    id: 'geoplateforme',
    name: 'Géoplateforme – Base Adresse Nationale',
    producer: 'IGN',
    licence: 'Licence Ouverte 2.0',
    licenceUrl: 'https://www.etalab.gouv.fr/licence-ouverte-open-licence/',
    url: 'https://geoservices.ign.fr/documentation/services/services-geoplateforme/geocodage',
    updateFrequency: 'Continue',
    isDemo: false,
  },
  search(query, { near, limit = 5 }, signal) {
    const params: Record<string, string> = {
      q: query,
      limit: String(limit),
      autocomplete: '1',
      index: 'address',
    };
    if (near) {
      params.lat = near.lat.toFixed(4);
      params.lon = near.lng.toFixed(4);
    }
    return request('search', params, signal);
  },
  async reverse(position, signal) {
    const results = await request(
      'reverse',
      { lat: position.lat.toFixed(5), lon: position.lng.toFixed(5), limit: '1', index: 'address' },
      signal,
    );
    return results[0] ?? null;
  },
};
