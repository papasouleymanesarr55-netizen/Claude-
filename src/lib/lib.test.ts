import { describe, expect, it } from 'vitest';
import { directionsUrl } from './directions';
import { formatDistance, formatPrice } from './format';
import { distanceMeters } from './geo';

describe('distanceMeters', () => {
  it('vaut 0 pour un même point', () => {
    expect(distanceMeters({ lat: 48.8, lng: 2.3 }, { lat: 48.8, lng: 2.3 })).toBe(0);
  });

  it('calcule Paris – Lyon à environ 392 km', () => {
    const d = distanceMeters({ lat: 48.8566, lng: 2.3522 }, { lat: 45.764, lng: 4.8357 });
    expect(d / 1000).toBeGreaterThan(388);
    expect(d / 1000).toBeLessThan(396);
  });
});

describe('formatDistance', () => {
  it('affiche les mètres sous 1 km, arrondis à la dizaine', () => {
    expect(formatDistance(654)).toEqual({ value: '650', unit: 'm' });
    expect(formatDistance(3)).toEqual({ value: '10', unit: 'm' });
  });

  it('affiche une décimale sous 10 km, aucune au-delà', () => {
    expect(formatDistance(1520)).toEqual({ value: '1,5', unit: 'km' });
    expect(formatDistance(12_400)).toEqual({ value: '12', unit: 'km' });
  });
});

describe('formatPrice', () => {
  it('formate en euros avec unité', () => {
    expect(formatPrice(1.789, 'L')).toEqual({ value: '1,79', unit: '€/L' });
    expect(formatPrice(12, '')).toEqual({ value: '12,00', unit: '€' });
  });
});

describe('directionsUrl', () => {
  const pos = { lat: 48.8675, lng: 2.3637 };
  it('génère les liens Google Maps, Waze et Apple Plans', () => {
    expect(directionsUrl('google', pos)).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=48.867500,2.363700',
    );
    expect(directionsUrl('waze', pos)).toBe(
      'https://waze.com/ul?ll=48.867500,2.363700&navigate=yes',
    );
    expect(directionsUrl('apple', pos)).toBe('https://maps.apple.com/?daddr=48.867500,2.363700');
  });
});
