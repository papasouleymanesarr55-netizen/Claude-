import type { LatLng } from '@/lib/geo';

export const RADIUS_OPTIONS_KM = [2, 5, 10, 20] as const;
export const DEFAULT_RADIUS_M = 5_000;

/** Niveau de zoom qui montre à peu près le rayon de recherche. */
export function zoomForRadius(radiusM: number): number {
  return Math.min(16, Math.max(8, 15.3 - Math.log2(radiusM / 1000)));
}

/** Clé de cache : la position est arrondie (~100 m) pour réutiliser les réponses proches. */
export function areaCacheKey(center: LatLng, radiusM: number): string {
  return `${center.lat.toFixed(3)},${center.lng.toFixed(3)},${radiusM}`;
}
