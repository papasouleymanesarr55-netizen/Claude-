import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { routes } from '@/app/routes';
import { createDemoPlacesProvider } from '@/adapters/places/demo';
import type { ProviderSetup } from '@/core/providers/registry';
import { demoSource } from '@/features/demo/demoSource';
import { DataProvider } from '@/features/data/DataProvider';

export const emptySetup: ProviderSetup = {
  places: [],
  geocoding: null,
  categories: [],
  defaultLocation: null,
  vehicles: [],
};

const ALL = ['charging', 'fuel', 'parking', 'garage', 'wash', 'tyres'] as const;

/** Configuration de test déterministe : uniquement le jeu de démonstration, sans réseau. */
export async function demoOnlySetup(): Promise<ProviderSetup> {
  return {
    places: [createDemoPlacesProvider([...ALL])],
    geocoding: null,
    categories: [...ALL],
    defaultLocation: demoSource.location,
    vehicles: await demoSource.listVehicles(),
  };
}

function testQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
}

/** Rend l'application complète sur une URL donnée, avec des fournisseurs injectés. */
export function renderApp(url: string, load: () => Promise<ProviderSetup> = demoOnlySetup) {
  const router = createMemoryRouter(routes, { initialEntries: [url] });
  return {
    router,
    ...render(
      <QueryClientProvider client={testQueryClient()}>
        <DataProvider load={load}>
          <RouterProvider router={router} />
        </DataProvider>
      </QueryClientProvider>,
    ),
  };
}

export function renderWithRouter(ui: ReactElement, url = '/') {
  const router = createMemoryRouter([{ path: '*', element: ui }], { initialEntries: [url] });
  return render(<RouterProvider router={router} />);
}
