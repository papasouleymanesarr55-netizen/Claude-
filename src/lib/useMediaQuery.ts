import { useSyncExternalStore } from 'react';

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window.matchMedia !== 'function') return () => {};
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    () => (typeof window.matchMedia === 'function' ? window.matchMedia(query).matches : true),
    () => true,
  );
}

export const MQ_TABLET_UP = '(min-width: 768px)';
export const MQ_DESKTOP_UP = '(min-width: 1280px)';
