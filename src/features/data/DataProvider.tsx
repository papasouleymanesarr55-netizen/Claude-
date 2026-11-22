import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { distanceMeters } from '@/lib/geo';
import type { PlaceWithDistance } from '@/features/places/types';
import type { Vehicle } from '@/features/vehicles/types';
import { loadDataSource } from './loadDataSource';
import type { DataSource, ReferenceLocation } from './types';

export type DataStatus = 'loading' | 'ready' | 'unavailable' | 'error';

export interface DataState {
  status: DataStatus;
  isDemo: boolean;
  location: ReferenceLocation | null;
  places: PlaceWithDistance[];
  vehicles: Vehicle[];
}

const initialState: DataState = {
  status: 'loading',
  isDemo: false,
  location: null,
  places: [],
  vehicles: [],
};

const DataContext = createContext<DataState>(initialState);

export function DataProvider({
  children,
  load = loadDataSource,
}: {
  children: ReactNode;
  load?: () => Promise<DataSource | null>;
}) {
  const [state, setState] = useState<DataState>(initialState);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const source = await load();
        if (cancelled) return;
        if (!source) {
          setState({ ...initialState, status: 'unavailable' });
          return;
        }
        const [places, vehicles] = await Promise.all([source.listPlaces(), source.listVehicles()]);
        if (cancelled) return;
        const origin = source.location.position;
        setState({
          status: 'ready',
          isDemo: source.kind === 'demo',
          location: source.location,
          vehicles,
          places: places.map((p) => ({ ...p, distanceM: distanceMeters(origin, p.position) })),
        });
      } catch {
        if (!cancelled) setState({ ...initialState, status: 'error' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const value = useMemo(() => state, [state]);
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useData(): DataState {
  return useContext(DataContext);
}
