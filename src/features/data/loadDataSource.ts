import type { DataSource } from './types';

/**
 * Charge la source de données active.
 * `__DEMO_DATA__` est une constante de compilation : en production elle vaut `false`
 * et l'import du module de démonstration disparaît du bundle.
 * La source réelle (Supabase) sera branchée ici à l'étape 4.
 */
export async function loadDataSource(): Promise<DataSource | null> {
  if (__DEMO_DATA__) {
    const { demoSource } = await import('@/features/demo/demoSource');
    return demoSource;
  }
  return null;
}
