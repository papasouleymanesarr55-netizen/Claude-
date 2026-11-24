import { readFileSync } from 'node:fs';
import { test as base, expect } from '@playwright/test';

const geoFixture = (name: string): unknown =>
  JSON.parse(
    readFileSync(
      new URL(`../src/adapters/geocoding/fixtures/${name}.json`, import.meta.url),
      'utf8',
    ),
  );

/**
 * Les tests n'appellent pas le serveur de tuiles : le style OpenFreeMap est remplacé
 * par un fond uni, pour des tests rapides et indépendants du réseau.
 */
export const ATTRIBUTION =
  '<a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> <a href="https://www.openmaptiles.org/" target="_blank">&copy; OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>';

const stubStyle = {
  version: 8,
  sources: { openmaptiles: { type: 'vector', url: 'https://tiles.openfreemap.org/planet' } },
  layers: [
    { id: 'background', type: 'background', paint: { 'background-color': '#1a201d' } },
    // Une couche doit utiliser la source pour que MapLibre charge son TileJSON (et l'attribution).
    { id: 'water', type: 'fill', source: 'openmaptiles', 'source-layer': 'water' },
  ],
};

/** Réponse TileJSON identique à celle d'OpenFreeMap (attribution comprise), sans tuiles. */
const stubTileJson = {
  tilejson: '3.0.0',
  tiles: ['https://tiles.openfreemap.org/planet/test/{z}/{x}/{y}.pbf'],
  attribution: ATTRIBUTION,
  minzoom: 0,
  maxzoom: 14,
  vector_layers: [{ id: 'water', fields: {} }],
};

const fuelFixture = (city: 'paris' | 'lyon'): unknown =>
  JSON.parse(
    readFileSync(
      new URL(`../src/adapters/places/fixtures/fuel-${city}.json`, import.meta.url),
      'utf8',
    ),
  );

const irveFixture = (path: string): string =>
  readFileSync(new URL(`./fixtures/irve/v1/${path}`, import.meta.url), 'utf8');

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route('https://tiles.openfreemap.org/**', (route) => {
      const url = route.request().url();
      if (url.includes('/styles/')) return route.fulfill({ json: stubStyle });
      if (url.endsWith('/planet')) return route.fulfill({ json: stubTileJson });
      // Tuile vectorielle vide (valide).
      return route.fulfill({ status: 200, contentType: 'application/x-protobuf', body: '' });
    });
    // Prix des carburants simulés à partir de réponses réelles enregistrées (Paris, Lyon).
    await page.route('https://data.economie.gouv.fr/**', (route) => {
      const where = new URL(route.request().url()).searchParams.get('where') ?? '';
      return route.fulfill({ json: fuelFixture(where.includes('POINT(4.') ? 'lyon' : 'paris') });
    });
    // Bornes IRVE : tuiles construites à partir d'un échantillon réel (ingestion/irve/fixtures).
    await page.route('**/data/irve/v1/**', (route) => {
      const path = new URL(route.request().url()).pathname.split('/data/irve/v1/')[1] ?? '';
      try {
        return route.fulfill({ body: irveFixture(path), contentType: 'application/json' });
      } catch {
        return route.fulfill({ status: 404, body: '' });
      }
    });
    // Géocodage IGN simulé à partir de réponses réelles enregistrées.
    await page.route('https://data.geopf.fr/geocodage/**', (route) => {
      const url = new URL(route.request().url());
      const name = url.pathname.endsWith('/reverse')
        ? 'reverse'
        : /^\d{5}$/.test(url.searchParams.get('q') ?? '')
          ? 'search-postcode'
          : /rue/i.test(url.searchParams.get('q') ?? '')
            ? 'search-address'
            : 'search-city';
      return route.fulfill({ json: geoFixture(name) });
    });
    await use(page);
  },
});

export { expect };

export const isMobile = (width: number | undefined) => (width ?? 1280) < 768;
