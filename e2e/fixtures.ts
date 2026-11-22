import { test as base, expect } from '@playwright/test';

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

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route('https://tiles.openfreemap.org/**', (route) => {
      const url = route.request().url();
      if (url.includes('/styles/')) return route.fulfill({ json: stubStyle });
      if (url.endsWith('/planet')) return route.fulfill({ json: stubTileJson });
      // Tuile vectorielle vide (valide).
      return route.fulfill({ status: 200, contentType: 'application/x-protobuf', body: '' });
    });
    await use(page);
  },
});

export { expect };

export const isMobile = (width: number | undefined) => (width ?? 1280) < 768;
