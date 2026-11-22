import { lazy, Suspense } from 'react';
import { cn } from '@/lib/cn';
import type { MapViewProps } from './MapView';

const MapView = lazy(() => import('./MapView'));

/** Charge MapLibre à la demande pour garder l'application légère au démarrage. */
export function LazyMapView(props: MapViewProps) {
  return (
    <Suspense
      fallback={<div className={cn('animate-pulse bg-[#1a201d]', props.className)} aria-hidden />}
    >
      <MapView {...props} />
    </Suspense>
  );
}
