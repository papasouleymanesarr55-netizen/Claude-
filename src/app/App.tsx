import { useMemo } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { DataProvider } from '@/features/data/DataProvider';
import { routes } from './routes';

export function App() {
  const router = useMemo(() => createBrowserRouter(routes), []);
  return (
    <DataProvider>
      <RouterProvider router={router} />
    </DataProvider>
  );
}
