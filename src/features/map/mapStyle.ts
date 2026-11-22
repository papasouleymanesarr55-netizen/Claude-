import type { StyleSpecification } from 'maplibre-gl';

/**
 * Fond de carte : OpenFreeMap (tuiles vectorielles OpenMapTiles, données OpenStreetMap).
 * Gratuit, sans clé ni inscription. L'attribution est fournie par la source et affichée
 * en permanence par le contrôle d'attribution (obligation ODbL / OpenMapTiles).
 */
export const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/dark';

/** Palette carto dérivée des tokens de l'interface. */
const palette = {
  background: '#1a201d',
  residential: '#1c221f',
  park: '#1c2621',
  water: '#141b19',
  building: '#202723',
  buildingOutline: '#262e2a',
  roadMinor: '#272f2b',
  roadMajor: '#2f3833',
  roadMajorCasing: '#343e38',
  motorway: '#38433d',
  rail: '#2a322e',
  label: '#7d8882',
  labelMuted: '#5f6a64',
  halo: '#151816',
};

type Paint = Record<string, unknown>;

const overrides: Record<string, Paint> = {
  background: { 'background-color': palette.background },
  water: { 'fill-color': palette.water },
  landuse_residential: { 'fill-color': palette.residential, 'fill-opacity': 0.6 },
  landuse_park: { 'fill-color': palette.park },
  landcover_wood: { 'fill-color': palette.park },
  building: { 'fill-color': palette.building, 'fill-outline-color': palette.buildingOutline },
  highway_path: { 'line-color': palette.roadMinor },
  highway_minor: { 'line-color': palette.roadMinor, 'line-opacity': 1 },
  highway_major_casing: { 'line-color': palette.roadMajorCasing },
  highway_major_inner: { 'line-color': palette.roadMajor },
  highway_major_subtle: { 'line-color': palette.roadMajor },
  highway_motorway_casing: { 'line-color': palette.roadMajorCasing },
  highway_motorway_inner: { 'line-color': palette.motorway },
  highway_motorway_subtle: { 'line-color': palette.motorway },
  railway: { 'line-color': palette.rail },
  railway_transit: { 'line-color': palette.rail },
  railway_minor: { 'line-color': palette.rail },
};

const labelLayers = /^(place_|highway_name|water_name)/;

/** Applique la palette au style OpenFreeMap sans toucher à sa structure. */
export function applyBrandPalette(style: StyleSpecification): StyleSpecification {
  return {
    ...style,
    layers: style.layers.map((layer) => {
      const paint = overrides[layer.id];
      if (paint) return { ...layer, paint: { ...layer.paint, ...paint } } as typeof layer;
      if (layer.type === 'symbol' && labelLayers.test(layer.id)) {
        return {
          ...layer,
          paint: {
            ...layer.paint,
            'text-color': layer.id.startsWith('highway') ? palette.labelMuted : palette.label,
            'text-halo-color': palette.halo,
            'text-halo-width': 1.2,
          },
        } as typeof layer;
      }
      return layer;
    }),
  };
}
