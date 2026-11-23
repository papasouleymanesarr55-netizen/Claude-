import { describe, expect, it, vi } from 'vitest';
import { loadProviders } from '@/core/providers/registry';
import { formatPublished, fuelGouvProvider, toPlace } from './fuel-gouv';
import paris from './fixtures/fuel-paris.json';
import lyon from './fixtures/fuel-lyon.json';

const NOW = Date.parse('2026-11-23T23:00:00Z');

function respond(body: unknown, status = 200) {
  const fetchMock = vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('adaptateur prix des carburants (réponses réelles enregistrées)', () => {
  it('interroge l’API par zone, triée par distance', async () => {
    const fetchMock = respond(paris);
    const places = await fuelGouvProvider.nearby({
      center: { lat: 48.8675, lng: 2.3637 },
      radiusM: 2000,
    });
    expect(places).toHaveLength(paris.results.length);
    const url = new URL(String(fetchMock.mock.calls[0]?.[0 as never]));
    expect(url.hostname).toBe('data.economie.gouv.fr');
    expect(url.searchParams.get('where')).toBe(
      "within_distance(geom, geom'POINT(2.36370 48.86750)', 2km)",
    );
    expect(url.searchParams.get('order_by')).toContain('distance(geom');
    expect(url.searchParams.get('limit')).toBe('100');
  });

  it('affiche prix, type de carburant et date du relevé, sans badge démo', () => {
    const place = toPlace(paris.results[0], NOW);
    expect(place).toMatchObject({
      id: 'fuel-75010003',
      name: '2/6 Rue Louis Blanc',
      category: 'fuel',
      address: '75010 Paris',
      price: { amount: 2.137, unit: 'L', decimals: 3 },
      details: [
        { label: 'Carburant', value: 'Gazole' },
        { label: 'Relevé', value: '23/11', hint: 'Prix relevé le 23/11 à 07:32' },
      ],
      source: { isDemo: false, name: 'Prix des carburants (DGCCRF)' },
    });
    expect(place?.fuelPrices?.map((p) => p.fuel)).toEqual(['Gazole', 'SP95-E10', 'SP98']);
  });

  it('exclut les carburants en rupture et signale un relevé ancien', () => {
    const record = {
      ...lyon.results[0],
      gazole_maj: '2026-11-01T08:00:00+00:00',
      carburants_rupture_temporaire: 'SP95',
    };
    const place = toPlace(record, NOW);
    expect(place?.details[1]).toMatchObject({ tone: 'warning' });
    expect(place?.details[1]?.hint).toContain('relevé ancien');
    expect(place?.fuelPrices?.some((p) => p.fuel === 'SP95')).toBe(false);
  });

  it('ignore une station sans aucun prix (aucune valeur inventée)', () => {
    const record = { ...paris.results[0], gazole_prix: null, e10_prix: null, sp98_prix: null };
    expect(toPlace(record, NOW)).toBeNull();
  });

  it('ignore un enregistrement mal formé', () => {
    expect(toPlace({ id: 'x' }, NOW)).toBeNull();
  });

  it.each([
    [429, 'rate-limit'],
    [500, 'http'],
  ] as const)('traduit HTTP %i en erreur « %s »', async (status, kind) => {
    respond({}, status);
    await expect(
      fuelGouvProvider.nearby({ center: { lat: 48.8, lng: 2.3 }, radiusM: 1000 }),
    ).rejects.toMatchObject({ kind });
  });

  it('formate l’heure publiée sans conversion de fuseau', () => {
    expect(formatPublished('2026-11-20T06:00')).toBe('20/11 06:00');
  });
});

describe('registre des fournisseurs', () => {
  it('branche les carburants réels et réserve la démo aux autres catégories', async () => {
    const setup = await loadProviders();
    const fuel = setup.places.find((p) => p.info.id === 'prix-carburants');
    const demo = setup.places.find((p) => p.info.isDemo);
    expect(fuel?.categories).toEqual(['fuel']);
    expect(demo?.categories).not.toContain('fuel');
    expect(setup.geocoding?.info.id).toBe('geoplateforme');
  });
});
