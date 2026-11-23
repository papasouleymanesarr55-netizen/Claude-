import { describe, expect, it, vi } from 'vitest';
import { ProviderError } from '@/core/providers/types';
import { geoplateformeGeocoder } from './geoplateforme';
import address from './fixtures/search-address.json';
import city from './fixtures/search-city.json';
import postcode from './fixtures/search-postcode.json';
import reverse from './fixtures/reverse.json';

function respond(body: unknown, status = 200) {
  const fetchMock = vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('adaptateur Géoplateforme (réponses réelles enregistrées)', () => {
  it('normalise une adresse', async () => {
    const fetchMock = respond(address);
    const [first] = await geoplateformeGeocoder.search('10 rue de la paix paris', {
      near: { lat: 48.8675, lng: 2.3637 },
    });
    expect(first).toEqual({
      id: '75102_6998_00010',
      label: '10 Rue de la Paix',
      context: '75002 Paris',
      kind: 'address',
      position: { lat: 48.868989, lng: 2.33115 },
    });
    const url = new URL(String(fetchMock.mock.calls[0]?.[0 as never]));
    expect(url.origin + url.pathname).toBe('https://data.geopf.fr/geocodage/search');
    expect(url.searchParams.get('autocomplete')).toBe('1');
    expect(url.searchParams.get('lat')).toBe('48.8675');
  });

  it('reconnaît une ville et une recherche par code postal', async () => {
    respond(city);
    const [lyon] = await geoplateformeGeocoder.search('lyon', {});
    expect(lyon).toMatchObject({ label: 'Lyon', kind: 'municipality' });
    respond(postcode);
    const [arr] = await geoplateformeGeocoder.search('69003', {});
    expect(arr).toMatchObject({ label: 'Lyon 3e Arrondissement', kind: 'municipality' });
  });

  it('renvoie le nom du lieu pour une position (géocodage inverse)', async () => {
    respond(reverse);
    await expect(
      geoplateformeGeocoder.reverse({ lat: 48.8675, lng: 2.3637 }),
    ).resolves.toMatchObject({
      label: 'Place de la République',
      context: '75003 Paris',
    });
  });

  it('ignore les éléments mal formés sans échouer', async () => {
    respond({ features: [{ foo: 1 }, ...city.features] });
    const results = await geoplateformeGeocoder.search('lyon', {});
    expect(results.length).toBe(city.features.length);
  });

  it.each([
    [429, 'rate-limit'],
    [503, 'http'],
  ] as const)('traduit HTTP %i en erreur « %s »', async (status, kind) => {
    respond({}, status);
    await expect(geoplateformeGeocoder.search('lyon', {})).rejects.toMatchObject({ kind });
  });

  it('signale une panne réseau', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new TypeError('offline'))),
    );
    await expect(geoplateformeGeocoder.search('lyon', {})).rejects.toBeInstanceOf(ProviderError);
  });
});
