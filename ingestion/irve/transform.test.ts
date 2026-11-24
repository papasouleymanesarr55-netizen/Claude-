// @vitest-environment node
import { readFileSync } from 'node:fs';
import { parse } from 'csv-parse/sync';
import { describe, expect, it } from 'vitest';
import {
  groupByTile,
  inFrance,
  parsePower,
  parseRow,
  StationAggregator,
  tileOf,
} from './transform';

const rows = parse(readFileSync(new URL('./fixtures/sample.csv', import.meta.url)), {
  columns: true,
}) as Record<string, string>[];

describe('ingestion IRVE (échantillon réel)', () => {
  it('rejette les lignes hors de France ou sans coordonnées, garde les autres', () => {
    const results = rows.map((r) => parseRow(r));
    const rejects = results.filter((r) => typeof r === 'string');
    expect(rejects).toEqual(['coordonnees-hors-france', 'coordonnees-hors-france']);
    expect(results.length - rejects.length).toBe(85);
  });

  it('regroupe les points de charge par station', () => {
    const agg = new StationAggregator();
    for (const r of rows.map((r) => parseRow(r))) if (typeof r !== 'string') agg.add(r);
    const stations = agg.records();
    expect(stations).toHaveLength(15);
    expect(stations.reduce((n, s) => n + s.points, 0)).toBe(85);
    for (const s of stations) {
      expect(inFrance(s.lat, s.lng)).toBe(true);
      expect(s.points).toBeGreaterThan(0);
      expect(s.id).not.toBe('');
    }
  });

  it('ne compte pas deux fois le même point de charge', () => {
    const agg = new StationAggregator();
    const row = parseRow(rows[0] ?? {});
    if (typeof row === 'string') throw new Error('ligne invalide');
    agg.add(row);
    agg.add(row);
    expect(agg.records()[0]?.points).toBe(1);
  });

  it('ignore une date de mise à jour dans le futur (donnée incohérente)', () => {
    const base = rows.find((r) => typeof parseRow(r) !== 'string') ?? {};
    const future = parseRow({ ...base, date_maj: '2099-01-01' }, '2026-11-24');
    const past = parseRow({ ...base, date_maj: '2026-11-20' }, '2026-11-24');
    expect(typeof future !== 'string' && future.updatedAt).toBeNull();
    expect(typeof past !== 'string' && past.updatedAt).toBe('2026-11-20');
  });

  it('normalise la puissance (W → kW, valeurs aberrantes ignorées)', () => {
    expect(parsePower('22.0')).toBe(22);
    expect(parsePower('22000')).toBe(22);
    expect(parsePower('0.0')).toBeNull();
    expect(parsePower('9999')).toBe(10);
    expect(parsePower('5000000')).toBeNull();
    expect(parsePower('abc')).toBeNull();
  });

  it('reconnaît la France d’outre-mer', () => {
    expect(inFrance(-20.88, 55.45)).toBe(true); // La Réunion
    expect(inFrance(14.6, -61.07)).toBe(true); // Martinique
    expect(inFrance(51.5, -0.12)).toBe(false); // Londres
  });

  it('découpe en tuiles « slippy map »', () => {
    expect(tileOf(48.8675, 2.3637, 11)).toEqual({ x: 1037, y: 704 });
    const agg = new StationAggregator();
    for (const r of rows.map((r) => parseRow(r))) if (typeof r !== 'string') agg.add(r);
    const tiles = groupByTile(agg.records());
    expect([...tiles.keys()].sort()).toEqual(['1037/704', '1051/730']);
  });
});
