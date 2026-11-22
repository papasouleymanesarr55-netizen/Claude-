/**
 * JEU DE DONNÉES DE DÉMONSTRATION — FICTIF.
 *
 * Les établissements, prix et le véhicule ci-dessous sont inventés pour concevoir l'interface.
 * Ils sont placés sur des coordonnées de Paris mais ne correspondent à aucun établissement réel.
 * Ce module n'est chargé que si VITE_DEMO_DATA=true, et le build de production le refuse
 * (voir build/demo-guard.ts).
 */
import type { DataSource } from '@/features/data/types';
import type { CategoryId, Place, PlaceDetail, PlacePrice } from '@/features/places/types';
import type { Vehicle } from '@/features/vehicles/types';

/** Doit rester identique à DEMO_MARKER (build/demo-guard.ts). */
export const DEMO_DATASET_ID = '__DEMO_DATASET__';

const source = { name: 'Données de démonstration', isDemo: true, updatedAt: null };

const d = (label: string, value: string, unit: string | null = null): PlaceDetail => ({
  label,
  value,
  unit,
});

function place(
  id: string,
  name: string,
  category: CategoryId,
  lat: number,
  lng: number,
  address: string,
  price: PlacePrice | null,
  details: PlaceDetail[],
  services: string[],
  openingHours: string | null = null,
): Place {
  return {
    id: `demo-${id}`,
    name,
    category,
    position: { lat, lng },
    address,
    price,
    details,
    services,
    openingHours,
    source,
  };
}

const places: Place[] = [
  place(
    'ch-republique',
    'Borne démo · République',
    'charging',
    48.8681,
    2.3646,
    'Place de la République, Paris 10e',
    { amount: 0.45, unit: 'kWh' },
    [d('Type', 'DC'), d('Points', '4')],
    ['50 kW', 'CCS', 'CB'],
    '24 h/24',
  ),
  place(
    'ch-canal',
    'Borne démo · Canal',
    'charging',
    48.8716,
    2.364,
    'Quai de Valmy, Paris 10e',
    { amount: 0.35, unit: 'kWh' },
    [d('Type', 'AC'), d('Points', '6')],
    ['22 kW', 'Type 2'],
    '24 h/24',
  ),
  place(
    'ch-bastille',
    'Borne démo · Bastille',
    'charging',
    48.8532,
    2.3692,
    'Boulevard Bourdon, Paris 4e',
    { amount: 0.59, unit: 'kWh' },
    [d('Type', 'DC'), d('Points', '6')],
    ['150 kW', 'CCS', 'CHAdeMO'],
    '24 h/24',
  ),
  place(
    'ch-gare-est',
    'Borne démo · Gare de l’Est',
    'charging',
    48.8766,
    2.3592,
    'Rue d’Alsace, Paris 10e',
    { amount: 0.52, unit: 'kWh' },
    [d('Type', 'DC'), d('Points', '8')],
    ['100 kW', 'CCS'],
    '24 h/24',
  ),
  place(
    'fu-oberkampf',
    'Station démo · Oberkampf',
    'fuel',
    48.865,
    2.3765,
    'Rue Oberkampf, Paris 11e',
    { amount: 1.79, unit: 'L' },
    [d('Carburant', 'Gazole'), d('Pistes', '4')],
    ['Boutique', 'Gonflage'],
    '6 h – 22 h',
  ),
  place(
    'fu-lenoir',
    'Station démo · Richard-Lenoir',
    'fuel',
    48.8597,
    2.3718,
    'Boulevard Richard-Lenoir, Paris 11e',
    { amount: 1.86, unit: 'L' },
    [d('Carburant', 'SP95-E10'), d('Pistes', '6')],
    ['Lavage', 'Boutique'],
    '24 h/24',
  ),
  place(
    'fu-belleville',
    'Station démo · Belleville',
    'fuel',
    48.8722,
    2.3768,
    'Boulevard de Belleville, Paris 11e',
    { amount: 1.82, unit: 'L' },
    [d('Carburant', 'Gazole'), d('Pistes', '2')],
    ['Gonflage'],
    '7 h – 21 h',
  ),
  place(
    'pk-temple',
    'Parking démo · Temple',
    'parking',
    48.8622,
    2.361,
    'Rue du Temple, Paris 3e',
    { amount: 2.9, unit: 'h' },
    [d('Places', '420'), d('Hauteur', '1,90', 'm')],
    ['Bornes', 'PMR', '24 h/24'],
    '24 h/24',
  ),
  place(
    'pk-chateau-eau',
    'Parking démo · Château-d’Eau',
    'parking',
    48.8723,
    2.356,
    'Rue du Château-d’Eau, Paris 10e',
    { amount: 3.2, unit: 'h' },
    [d('Places', '280'), d('Hauteur', '2,00', 'm')],
    ['Vélos', 'PMR'],
    '7 h – 23 h',
  ),
  place(
    'pk-calvaire',
    'Parking démo · Filles-du-Calvaire',
    'parking',
    48.863,
    2.3666,
    'Boulevard des Filles-du-Calvaire, Paris 3e',
    null,
    [d('Places', '150'), d('Hauteur', '1,85', 'm')],
    ['PMR'],
    null,
  ),
  place(
    'ga-parmentier',
    'Garage démo · Parmentier',
    'garage',
    48.8654,
    2.3746,
    'Avenue Parmentier, Paris 11e',
    null,
    [d('Spécialité', 'Mécanique'), d('Délai', '48', 'h')],
    ['Vidange', 'Freins', 'Diagnostic'],
    '8 h – 18 h',
  ),
  place(
    'ga-goncourt',
    'Garage démo · Goncourt',
    'garage',
    48.87,
    2.3707,
    'Rue du Faubourg-du-Temple, Paris 11e',
    null,
    [d('Spécialité', 'Électrique'), d('Délai', '72', 'h')],
    ['Batterie', 'Climatisation'],
    '9 h – 19 h',
  ),
  place(
    'wa-arts',
    'Lavage démo · Arts-et-Métiers',
    'wash',
    48.8655,
    2.356,
    'Rue Réaumur, Paris 3e',
    { amount: 12, unit: '' },
    [d('Type', 'Manuel'), d('Pistes', '3')],
    ['Aspirateur', 'Haute pression'],
    '8 h – 20 h',
  ),
  place(
    'wa-bonsergent',
    'Lavage démo · Bonsergent',
    'wash',
    48.8706,
    2.3612,
    'Boulevard de Magenta, Paris 10e',
    { amount: 18, unit: '' },
    [d('Type', 'Portique'), d('Durée', '8', 'min')],
    ['Séchage', 'Cire'],
    '7 h – 21 h',
  ),
  place(
    'ty-strasbourg',
    'Pneus démo · Strasbourg-Saint-Denis',
    'tyres',
    48.8696,
    2.354,
    'Boulevard de Strasbourg, Paris 10e',
    null,
    [d('Montage', 'Sur RDV'), d('Délai', '24', 'h')],
    ['Équilibrage', 'Géométrie'],
    '8 h 30 – 18 h',
  ),
];

const vehicles: Vehicle[] = [
  {
    id: 'demo-vehicle-1',
    name: 'Véhicule de démonstration',
    model: 'Citadine électrique',
    energy: 'electric',
    rangeKm: 410,
    connector: 'CCS',
    maxChargeKw: 100,
    isDemo: true,
  },
];

export const demoSource: DataSource & { datasetId: string } = {
  kind: 'demo',
  datasetId: DEMO_DATASET_ID,
  location: {
    label: 'Paris 10e',
    position: { lat: 48.8675, lng: 2.3637 },
    isDemo: true,
    source: 'demo',
  },
  listPlaces: () => Promise.resolve(places),
  listVehicles: () => Promise.resolve(vehicles),
};
