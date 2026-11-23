import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { routes } from '@/app/routes';
import { loadProviders, type ProviderSetup } from '@/core/providers/registry';
import { DataProvider } from '@/features/data/DataProvider';

export const emptySetup: ProviderSetup = {
  places: [],
  geocoding: null,
  categories: [],
  defaultLocation: null,
  vehicles: [],
};

function testQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
}

/** Rend l'application complète sur une URL donnée, avec des fournisseurs injectés. */
export function renderApp(url: string, load: () => Promise<ProviderSetup> = loadProviders) {
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
