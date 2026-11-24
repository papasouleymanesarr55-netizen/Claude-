/**
 * Transformation de la base nationale IRVE (schéma etalab/schema-irve-statique) :
 * une ligne = un point de charge ; on regroupe par station et on découpe en tuiles.
 * Fonctions pures, testées sur un échantillon réel (ingestion/irve/fixtures/sample.csv).
 */

export const TILE_ZOOM = 11;

/** Enregistrement compact d'une station, tel que publié dans les tuiles. */
export interface StationRecord {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  /** Puissance maximale (kW), null si non renseignée. */
  powerKw: number | null;
  points: number;
  connectors: string[];
  access: 'libre' | 'reserve' | null;
  /** Horaires bruts si l'accès n'est pas 24 h/24, sinon null. */
  hours: string | null;
  free: boolean | null;
  /** Tarification en texte libre telle que publiée, null si absente. */
  pricing: string | null;
  operator: string | null;
  updatedAt: string | null;
}

export type RejectReason =
  'coordonnees-absentes' | 'coordonnees-hors-france' | 'identifiant-absent';

type Raw = Record<string, string | undefined>;

/** Emprises (ouest, sud, est, nord) de la France métropolitaine et d'outre-mer. */
const FRANCE_BOXES: [number, number, number, number][] = [
  [-5.5, 41.2, 10.0, 51.3], // métropole et Corse
  [-63.3, 14.3, -60.7, 18.2], // Antilles (Guadeloupe, Martinique, Saint-Martin, Saint-Barthélemy)
  [-54.7, 2.0, -51.5, 6.0], // Guyane
  [55.1, -21.5, 55.9, -20.8], // La Réunion
  [44.9, -13.1, 45.4, -12.5], // Mayotte
  [-56.5, 46.7, -56.0, 47.2], // Saint-Pierre-et-Miquelon
];

export function inFrance(lat: number, lng: number): boolean {
  return FRANCE_BOXES.some(([w, s, e, n]) => lng >= w && lng <= e && lat >= s && lat <= n);
}

const clean = (v: string | undefined): string => (v ?? '').trim();
const bool = (v: string | undefined): boolean | null => {
  const s = clean(v).toLowerCase();
  if (s === 'true' || s === '1') return true;
  if (s === 'false' || s === '0') return false;
  return null;
};

/** Puissance en kW ; les valeurs manifestement en W sont converties, les aberrantes ignorées. */
export function parsePower(v: string | undefined): number | null {
  const n = Number.parseFloat(clean(v).replace(',', '.'));
  if (!Number.isFinite(n) || n <= 0) return null;
  const kw = n > 1000 ? n / 1000 : n;
  return kw > 400 ? null : Math.round(kw * 10) / 10;
}

const CONNECTORS: [string, string][] = [
  ['prise_type_combo_ccs', 'CCS'],
  ['prise_type_2', 'Type 2'],
  ['prise_type_chademo', 'CHAdeMO'],
  ['prise_type_ef', 'E/F'],
  ['prise_type_autre', 'Autre'],
];

export interface PointRow {
  stationId: string;
  pointId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  powerKw: number | null;
  connectors: string[];
  access: 'libre' | 'reserve' | null;
  hours: string | null;
  free: boolean | null;
  pricing: string | null;
  operator: string | null;
  updatedAt: string | null;
}

/** Date du jour (AAAA-MM-JJ) : les dates de mise à jour postérieures sont ignorées. */
const today = () => new Date().toISOString().slice(0, 10);

export function parseRow(raw: Raw, maxDate: string = today()): PointRow | RejectReason {
  const lat = Number.parseFloat(clean(raw.consolidated_latitude));
  const lng = Number.parseFloat(clean(raw.consolidated_longitude));
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0))
    return 'coordonnees-absentes';
  if (!inFrance(lat, lng)) return 'coordonnees-hors-france';
  const stationId = clean(raw.id_station_itinerance) || clean(raw.id_station_local);
  if (!stationId) return 'identifiant-absent';
  const access = clean(raw.condition_acces).toLowerCase();
  const hours = clean(raw.horaires);
  const pricing = clean(raw.tarification);
  const updatedAt = clean(raw.date_maj);
  return {
    stationId,
    pointId:
      clean(raw.id_pdc_itinerance) || clean(raw.id_pdc_local) || `${stationId}#${lat},${lng}`,
    name: clean(raw.nom_station) || clean(raw.nom_enseigne) || 'Station de recharge',
    address: clean(raw.adresse_station),
    lat: Math.round(lat * 1e5) / 1e5,
    lng: Math.round(lng * 1e5) / 1e5,
    powerKw: parsePower(raw.puissance_nominale),
    connectors: CONNECTORS.filter(([col]) => bool(raw[col]) === true).map(([, label]) => label),
    access: access.includes('libre') ? 'libre' : access.includes('réservé') ? 'reserve' : null,
    hours: !hours || hours === '24/7' || /00:00-23:5\d/.test(hours) ? null : hours,
    free: bool(raw.gratuit),
    pricing: pricing && pricing.toLowerCase() !== 'inconnu' ? pricing.slice(0, 300) : null,
    operator: clean(raw.nom_enseigne) || clean(raw.nom_operateur) || null,
    updatedAt:
      /^\d{4}-\d{2}-\d{2}/.test(updatedAt) && updatedAt.slice(0, 10) <= maxDate
        ? updatedAt.slice(0, 10)
        : null,
  };
}

/** Regroupe les points de charge par station (points distincts, puissance max, prises…). */
export class StationAggregator {
  private stations = new Map<string, StationRecord & { pointIds: Set<string> }>();

  add(row: PointRow): void {
    const s = this.stations.get(row.stationId);
    if (!s) {
      this.stations.set(row.stationId, {
        id: row.stationId,
        name: row.name,
        address: row.address,
        lat: row.lat,
        lng: row.lng,
        powerKw: row.powerKw,
        points: 1,
        connectors: [...row.connectors],
        access: row.access,
        hours: row.hours,
        free: row.free,
        pricing: row.pricing,
        operator: row.operator,
        updatedAt: row.updatedAt,
        pointIds: new Set([row.pointId]),
      });
      return;
    }
    if (!s.pointIds.has(row.pointId)) {
      s.pointIds.add(row.pointId);
      s.points = s.pointIds.size;
    }
    if (row.powerKw != null && (s.powerKw == null || row.powerKw > s.powerKw))
      s.powerKw = row.powerKw;
    for (const c of row.connectors) if (!s.connectors.includes(c)) s.connectors.push(c);
    if (s.free === true && row.free === false) s.free = false;
    s.pricing ??= row.pricing;
    s.hours ??= row.hours;
    if (row.updatedAt && (!s.updatedAt || row.updatedAt > s.updatedAt)) s.updatedAt = row.updatedAt;
  }

  get size(): number {
    return this.stations.size;
  }

  records(): StationRecord[] {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return [...this.stations.values()].map(({ pointIds, ...rest }) => rest);
  }
}

/** Tuile « slippy map » contenant une position. */
export function tileOf(lat: number, lng: number, z = TILE_ZOOM): { x: number; y: number } {
  const n = 2 ** z;
  const x = Math.floor(((lng + 180) / 360) * n);
  const rad = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n);
  return { x: Math.min(n - 1, Math.max(0, x)), y: Math.min(n - 1, Math.max(0, y)) };
}

export function groupByTile(records: StationRecord[]): Map<string, StationRecord[]> {
  const tiles = new Map<string, StationRecord[]>();
  for (const r of records) {
    const { x, y } = tileOf(r.lat, r.lng);
    const key = `${x}/${y}`;
    const list = tiles.get(key);
    if (list) list.push(r);
    else tiles.set(key, [r]);
  }
  return tiles;
}
