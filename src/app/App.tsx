import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { DataProvider } from '@/features/data/DataProvider';
import { routes } from './routes';

export function App() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { refetchOnWindowFocus: false } },
      }),
  );
  const router = useMemo(() => createBrowserRouter(routes), []);
  return (
    <QueryClientProvider client={queryClient}>
      <DataProvider>
        <RouterProvider router={router} />
      </DataProvider>
    </QueryClientProvider>
  );
}
