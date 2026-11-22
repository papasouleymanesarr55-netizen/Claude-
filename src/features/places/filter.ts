import type { CategoryId, PlaceWithDistance } from './types';

export interface PlaceFilter {
  categories: CategoryId[];
  query: string;
}

const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();

/** Filtre par catégories (liste vide = toutes) et par texte, puis trie par distance. */
export function filterPlaces(
  places: PlaceWithDistance[],
  { categories, query }: PlaceFilter,
  categoryLabel: (id: CategoryId) => string = (id) => id,
): PlaceWithDistance[] {
  const q = normalize(query);
  return places
    .filter((p) => categories.length === 0 || categories.includes(p.category))
    .filter((p) => {
      if (!q) return true;
      const haystack = normalize(
        [p.name, p.address, categoryLabel(p.category), ...p.services].join(' '),
      );
      return haystack.includes(q);
    })
    .sort((a, b) => (a.distanceM ?? Infinity) - (b.distanceM ?? Infinity));
}
