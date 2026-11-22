import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { DataProvider } from '@/features/data/DataProvider';
import type { DataSource } from '@/features/data/types';
import { routes } from '@/app/routes';

/** Rend l'application complète sur une URL donnée, avec une source de données injectée. */
export function renderApp(url: string, load: () => Promise<DataSource | null>) {
  const router = createMemoryRouter(routes, { initialEntries: [url] });
  return {
    router,
    ...render(
      <DataProvider load={load}>
        <RouterProvider router={router} />
      </DataProvider>,
    ),
  };
}

export function renderWithRouter(ui: ReactElement, url = '/') {
  const router = createMemoryRouter([{ path: '*', element: ui }], { initialEntries: [url] });
  return render(<RouterProvider router={router} />);
}
