import type { LatLng } from './geo';

export type DirectionsProvider = 'google' | 'waze' | 'apple';

/** Liens profonds vers les applications de navigation (aucune API, aucun coût). */
export function directionsUrl(provider: DirectionsProvider, { lat, lng }: LatLng): string {
  const coords = `${lat.toFixed(6)},${lng.toFixed(6)}`;
  switch (provider) {
    case 'google':
      return `https://www.google.com/maps/dir/?api=1&destination=${coords}`;
    case 'waze':
      return `https://waze.com/ul?ll=${coords}&navigate=yes`;
    case 'apple':
      return `https://maps.apple.com/?daddr=${coords}`;
  }
}

export const directionsProviders: { id: DirectionsProvider; label: string }[] = [
  { id: 'google', label: 'Google Maps' },
  { id: 'waze', label: 'Waze' },
  { id: 'apple', label: 'Apple Plans' },
];
