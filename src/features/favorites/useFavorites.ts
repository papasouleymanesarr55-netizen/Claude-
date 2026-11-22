import { useCallback, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'favorites:v1';
const listeners = new Set<() => void>();
let memory: string[] | null = null;

function read(): string[] {
  if (memory) return memory;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    memory = Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    memory = [];
  }
  return memory;
}

function write(ids: string[]) {
  memory = ids;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Stockage indisponible (navigation privée…) : on garde l'état en mémoire.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Favoris conservés dans le navigateur, du plus récent au plus ancien. */
export function useFavorites() {
  const ids = useSyncExternalStore(subscribe, read, () => []);

  const toggle = useCallback((id: string) => {
    const current = read();
    write(current.includes(id) ? current.filter((x) => x !== id) : [id, ...current]);
  }, []);

  const isFavorite = useCallback((id: string) => ids.includes(id), [ids]);

  return { ids, toggle, isFavorite };
}

/** Réservé aux tests. */
export function __resetFavorites() {
  memory = null;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
