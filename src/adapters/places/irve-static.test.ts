import { beforeEach, describe, expect, it, vi } from 'vitest';
import manifest from '../../../e2e/fixtures/irve/v1/manifest.json';
import paris from '../../../e2e/fixtures/irve/v1/11/1037/704.json';
import lyon from '../../../e2e/fixtures/irve/v1/11/1051/730.json';
import { __resetIrveCache, irveStaticProvider, tilesForBounds, toPlace } from './irve-static';

const FILES: Record<string, unknown> = {
  'manifest.json': manifest,
  '11/1037/704.json': paris,
  '11/1051/730.json': lyon,
};

function serveFixtures() {
  const fetchMock = vi.fn((url: string) => {
    const body = FILES[String(url).split('/data/irve/v1/')[1] ?? ''];
    return Promise.resolve(
      body ? new Response(JSON.stringify(body)) : new Response('', { status: 404 }),
    );
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

beforeEach(() => __resetIrveCache());

describe('adaptateur IRVE statique', () => {
  it('charge uniquement les tuiles de la zone et filtre par rayon', async () => {
    const fetchMock = serveFixtures();
    const places = await irveStaticProvider.nearby({
      center: { lat: 48.8675, lng: 2.3637 },
      radiusM: 1500,
    });
    expect(places.length).toBeGreaterThan(0);
    expect(places.every((p) => p.category === 'charging' && !p.source.isDemo)).toBe(true);
    const urls = fetchMock.mock.calls.map((c) => String(c[0]));
    expect(urls.some((u) => u.endsWith('manifest.json'))).toBe(true);
    expect(urls.some((u) => u.includes('/11/1051/'))).toBe(false); // tuile de Lyon non chargée
  });

  it('ne présente jamais de disponibilité déduite des données statiques', async () => {
    serveFixtures();
    const places = await irveStaticProvider.nearby({
      center: { lat: 45.758, lng: 4.835 },
      radiusM: 1000,
    });
    expect(places.length).toBeGreaterThan(0);
    expect(places.every((p) => p.availability === null)).toBe(true);
  });

  it('met en cache manifeste et tuiles', async () => {
    const fetchMock = serveFixtures();
    const area = { center: { lat: 48.8675, lng: 2.3637 }, radiusM: 1000 };
    await irveStaticProvider.nearby(area);
    const calls = fetchMock.mock.calls.length;
    await irveStaticProvider.nearby(area);
    expect(fetchMock.mock.calls.length).toBe(calls);
  });

  it('signale l’absence de données sans rien inventer', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('', { status: 404 }))),
    );
    await expect(
      irveStaticProvider.nearby({ center: { lat: 48.86, lng: 2.36 }, radiusM: 1000 }),
    ).rejects.toMatchObject({ kind: 'http' });
  });

  it('calcule les tuiles couvrant une emprise', () => {
    expect(tilesForBounds([2.35, 48.86, 2.37, 48.87], 11)).toEqual(['1037/704']);
  });

  it('affiche « Gratuit » ou « Voir tarif » sans inventer de prix', () => {
    const base = {
      id: 'X',
      name: 'Station',
      address: 'Adresse',
      lat: 48.8,
      lng: 2.3,
      powerKw: 22,
      points: 2,
      connectors: ['Type 2'],
      access: 'libre' as const,
      hours: null,
      free: true,
      pricing: null,
      operator: 'Op',
      updatedAt: '2026-11-20',
    };
    expect(toPlace(base)).toMatchObject({ price: null, priceNote: 'Gratuit' });
    const paid = toPlace({ ...base, free: false, pricing: '0,35 €/kWh' });
    expect(paid).toMatchObject({ price: null, priceNote: 'Voir tarif', priceHint: '0,35 €/kWh' });
    expect(toPlace({ ...base, free: null })).not.toHaveProperty('priceNote');
  });
});
