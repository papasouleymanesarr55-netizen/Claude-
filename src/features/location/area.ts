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

/** Emprise [ouest, sud, est, nord] qui contient le cercle de recherche. */
export function radiusBounds(center: LatLng, radiusM: number): [number, number, number, number] {
  const dLat = radiusM / 111_320;
  const dLng = radiusM / (111_320 * Math.cos((center.lat * Math.PI) / 180));
  return [center.lng - dLng, center.lat - dLat, center.lng + dLng, center.lat + dLat];
}
