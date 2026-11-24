/**
 * Ingestion de la base nationale IRVE consolidée (transport.data.gouv.fr).
 *
 *   npm run ingest:irve                    # télécharge le fichier en vigueur
 *   npm run ingest:irve -- --input f.csv   # depuis un fichier local
 *   options : --out <dossier> (défaut public/data/irve/v1)
 *
 * Garde-fous : validation ligne par ligne, rejets journalisés, refus de publier
 * si le volume chute de plus de 20 % par rapport au jeu précédent.
 */
import {
  createReadStream,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { Readable } from 'node:stream';
import { parse } from 'csv-parse';
import {
  groupByTile,
  parseRow,
  StationAggregator,
  TILE_ZOOM,
  type RejectReason,
} from './transform';

const SOURCE_URL =
  'https://proxy.transport.data.gouv.fr/resource/consolidation-transport-irve-statique';
const DATASET_URL =
  'https://transport.data.gouv.fr/datasets/base-nationale-des-points-de-recharge-pour-vehicules-electriques-en-france-irve';
const MIN_VOLUME_RATIO = 0.8;

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function openSource(input: string | undefined): Promise<NodeJS.ReadableStream> {
  if (input) return createReadStream(input);
  const res = await fetch(SOURCE_URL, { redirect: 'error' });
  if (!res.ok || !res.body) throw new Error(`Téléchargement IRVE impossible : HTTP ${res.status}`);
  return Readable.fromWeb(res.body as import('node:stream/web').ReadableStream);
}

async function main() {
  const input = arg('input');
  const out = arg('out') ?? 'public/data/irve/v1';
  const aggregator = new StationAggregator();
  const rejected: Partial<Record<RejectReason, number>> = {};
  const rejectLog: string[] = ['raison,id_station,latitude,longitude'];
  let rows = 0;

  const parser = (await openSource(input)).pipe(
    parse({ columns: true, skip_empty_lines: true, relax_column_count: true, bom: true }),
  );
  for await (const raw of parser as AsyncIterable<Record<string, string>>) {
    rows++;
    const row = parseRow(raw);
    if (typeof row === 'string') {
      rejected[row] = (rejected[row] ?? 0) + 1;
      if (rejectLog.length < 5000)
        rejectLog.push(
          [row, raw.id_station_itinerance, raw.consolidated_latitude, raw.consolidated_longitude]
            .map((v) => `"${(v ?? '').replace(/"/g, '""')}"`)
            .join(','),
        );
      continue;
    }
    aggregator.add(row);
  }

  const stations = aggregator.records();
  const previous = join(out, 'manifest.json');
  if (existsSync(previous)) {
    const prev = JSON.parse(readFileSync(previous, 'utf8')) as { stations?: number };
    if (prev.stations && stations.length < prev.stations * MIN_VOLUME_RATIO) {
      throw new Error(
        `Volume suspect : ${stations.length} stations contre ${prev.stations} précédemment. Publication annulée.`,
      );
    }
  }
  if (stations.length === 0) throw new Error('Aucune station valide : publication annulée.');

  // Écriture dans un dossier temporaire puis remplacement atomique du jeu publié.
  const tmp = `${out}.tmp`;
  rmSync(tmp, { recursive: true, force: true });
  const tiles = groupByTile(stations);
  for (const [key, list] of tiles) {
    const file = join(tmp, `${TILE_ZOOM}`, `${key}.json`);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, JSON.stringify(list));
  }
  const updatedAt =
    stations
      .map((s) => s.updatedAt ?? '')
      .sort()
      .at(-1) ?? null;
  const manifest = {
    version: 1,
    zoom: TILE_ZOOM,
    source: 'Base nationale consolidée IRVE – données statiques',
    producer: 'transport.data.gouv.fr (Point d’Accès National)',
    licence: 'Licence Ouverte 2.0',
    licenceUrl: 'https://www.etalab.gouv.fr/licence-ouverte-open-licence/',
    datasetUrl: DATASET_URL,
    sourceUrl: SOURCE_URL,
    dataUpdatedAt: updatedAt,
    generatedAt: new Date().toISOString(),
    rows,
    stations: stations.length,
    points: stations.reduce((n, s) => n + s.points, 0),
    rejected,
    tiles: [...tiles.keys()].sort(),
  };
  writeFileSync(join(tmp, 'manifest.json'), JSON.stringify(manifest));
  mkdirSync('ingestion/out', { recursive: true });
  writeFileSync('ingestion/out/irve-rejets.csv', rejectLog.join('\n'));
  rmSync(out, { recursive: true, force: true });
  mkdirSync(dirname(out), { recursive: true });
  renameSync(tmp, out);

  console.log(
    `IRVE : ${rows} lignes, ${manifest.stations} stations, ${manifest.points} points, ` +
      `${tiles.size} tuiles, rejets ${JSON.stringify(rejected)}`,
  );
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
