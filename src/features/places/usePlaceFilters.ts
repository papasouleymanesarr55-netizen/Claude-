import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { isCategoryId } from './categories';
import type { CategoryId } from './types';

/** Filtres stockés dans l'URL (?cat=charging,fuel&q=…), donc partageables. */
export function usePlaceFilters() {
  const [params, setParams] = useSearchParams();

  const categories = useMemo<CategoryId[]>(
    () => (params.get('cat') ?? '').split(',').filter(isCategoryId),
    [params],
  );
  const query = params.get('q') ?? '';
  const selectedId = params.get('place');

  const update = useCallback(
    (patch: Record<string, string | null>) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [k, v] of Object.entries(patch)) {
            if (v) next.set(k, v);
            else next.delete(k);
          }
          return next;
        },
        { replace: true },
      ),
    [setParams],
  );

  return {
    categories,
    query,
    selectedId,
    setCategories: (ids: CategoryId[]) => update({ cat: ids.join(',') || null }),
    setQuery: (q: string) => update({ q: q || null }),
    setSelectedId: (id: string | null) => update({ place: id }),
    reset: () => update({ cat: null, q: null }),
  };
}
