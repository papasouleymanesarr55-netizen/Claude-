import { useQueries, useQuery } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { loadProviders, type ProviderSetup } from '@/core/providers/registry';
import type { AreaQuery, GeocodingProvider, ProviderInfo } from '@/core/providers/types';
import { areaCacheKey, DEFAULT_RADIUS_M } from '@/features/location/area';
import {
  GeolocationFailure,
  requestDevicePosition,
  type GeolocationErrorKind,
} from '@/features/location/geolocation';
import type { CategoryId, PlaceWithDistance } from '@/features/places/types';
import type { Vehicle } from '@/features/vehicles/types';
import { distanceMeters, type LatLng } from '@/lib/geo';
import type { ReferenceLocation } from './types';

/**
 * - loading : configuration ou première réponse en cours
 * - needs-location : aucune position choisie (géolocalisation ou recherche)
 * - unavailable : aucun fournisseur configuré pour ce build
 * - error : tous les fournisseurs ont échoué
 */
export type DataStatus = 'loading' | 'needs-location' | 'ready' | 'unavailable' | 'error';

export type GeolocationStatus = 'idle' | 'pending' | 'granted' | 'error';

export interface DataState {
  status: DataStatus;
  isDemo: boolean;
  location: ReferenceLocation | null;
  area: AreaQuery | null;
  places: PlaceWithDistance[];
  vehicles: Vehicle[];
  /** Catégories réellement couvertes par un fournisseur. */
  categories: CategoryId[];
  providers: ProviderInfo[];
  geocoding: GeocodingProvider | null;
  /** Fournisseurs en échec : leurs données sont absentes, jamais remplacées. */
  failedProviders: ProviderInfo[];
  geolocation: { status: GeolocationStatus; error: GeolocationErrorKind | null };
  requestGeolocation: () => void;
  setLocation: (location: ReferenceLocation) => void;
  setRadius: (radiusM: number) => void;
  /** Relance la recherche autour d'un autre centre (déplacement de la carte). */
  searchArea: (center: LatLng) => void;
  retry: () => void;
}

const noop = () => {};

const initialState: DataState = {
  status: 'loading',
  isDemo: false,
  location: null,
  area: null,
  places: [],
  vehicles: [],
  categories: [],
  providers: [],
  geocoding: null,
  failedProviders: [],
  geolocation: { status: 'idle', error: null },
  requestGeolocation: noop,
  setLocation: noop,
  setRadius: noop,
  searchArea: noop,
  retry: noop,
};

const DataContext = createContext<DataState>(initialState);

export function DataProvider({
  children,
  load = loadProviders,
}: {
  children: ReactNode;
  load?: () => Promise<ProviderSetup>;
}) {
  const setupQuery = useQuery({
    queryKey: ['provider-setup'],
    queryFn: load,
    staleTime: Infinity,
    retry: false,
  });
  const setup = setupQuery.data;

  const [userLocation, setUserLocation] = useState<ReferenceLocation | null>(null);
  const [areaCenter, setAreaCenter] = useState<LatLng | null>(null);
  const [radiusM, setRadiusM] = useState(DEFAULT_RADIUS_M);
  const [geoStatus, setGeoStatus] = useState<GeolocationStatus>('idle');
  const [geoError, setGeoError] = useState<GeolocationErrorKind | null>(null);

  const location = userLocation ?? setup?.defaultLocation ?? null;
  const area = useMemo<AreaQuery | null>(
    () => (location ? { center: areaCenter ?? location.position, radiusM } : null),
    [location, areaCenter, radiusM],
  );

  const providers = useMemo(() => setup?.places ?? [], [setup]);
  const results = useQueries({
    queries: providers.map((provider) => ({
      queryKey: ['places', provider.info.id, area ? areaCacheKey(area.center, area.radiusM) : null],
      queryFn: ({ signal }: { signal: AbortSignal }) => {
        if (!area) throw new Error('Zone non définie');
        return provider.nearby(area, signal);
      },
      enabled: area != null,
      staleTime: provider.cacheTtlMs,
      gcTime: Math.max(30 * 60_000, Number.isFinite(provider.cacheTtlMs) ? provider.cacheTtlMs : 0),
      retry: 1,
    })),
  });

  const geocoding = setup?.geocoding ?? null;
  const requestGeolocation = useCallback(() => {
    setGeoStatus('pending');
    setGeoError(null);
    requestDevicePosition()
      .then(({ position, accuracyM }) => {
        setUserLocation({ label: null, position, isDemo: false, source: 'device', accuracyM });
        setAreaCenter(null);
        setGeoStatus('granted');
        // Nom du lieu (facultatif) : en cas d'échec, « Votre position » reste affiché.
        geocoding
          ?.reverse(position)
          .then((place) => {
            if (!place) return;
            setUserLocation((current) =>
              current?.source === 'device' && current.position === position
                ? { ...current, label: place.label, context: place.context }
                : current,
            );
          })
          .catch(() => {});
      })
      .catch((e: unknown) => {
        setGeoStatus('error');
        setGeoError(e instanceof GeolocationFailure ? e.kind : 'unavailable');
      });
  }, [geocoding]);

  const setLocation = useCallback((loc: ReferenceLocation) => {
    setUserLocation(loc);
    setAreaCenter(null);
  }, []);

  const retry = useCallback(() => {
    results.forEach((r) => r.isError && void r.refetch());
  }, [results]);

  const value = useMemo<DataState>(() => {
    const failedProviders = providers.filter((_, i) => results[i]?.isError).map((p) => p.info);
    const origin = location?.position ?? null;
    const places: PlaceWithDistance[] = results.flatMap((r) =>
      (r.data ?? []).map((p) => ({
        ...p,
        distanceM: origin ? distanceMeters(origin, p.position) : null,
      })),
    );

    let status: DataStatus;
    if (setupQuery.isPending) status = 'loading';
    else if (setupQuery.isError || providers.length === 0) status = 'unavailable';
    else if (!area) status = 'needs-location';
    else if (results.some((r) => r.isPending) && places.length === 0) status = 'loading';
    else if (results.length > 0 && results.every((r) => r.isError)) status = 'error';
    else status = 'ready';

    return {
      status,
      isDemo: providers.some((p) => p.info.isDemo) || location?.isDemo === true,
      location,
      area,
      places,
      vehicles: setup?.vehicles ?? [],
      categories: setup?.categories ?? [],
      providers: providers.map((p) => p.info),
      geocoding,
      failedProviders,
      geolocation: { status: geoStatus, error: geoError },
      requestGeolocation,
      setLocation,
      setRadius: setRadiusM,
      searchArea: setAreaCenter,
      retry,
    };
  }, [
    setupQuery.isPending,
    setupQuery.isError,
    setup,
    providers,
    results,
    location,
    area,
    geoStatus,
    geoError,
    requestGeolocation,
    setLocation,
    retry,
    geocoding,
  ]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useData(): DataState {
  return useContext(DataContext);
}
