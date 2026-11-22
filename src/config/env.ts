import { z } from 'zod';

/** Variables d'environnement publiques (préfixe VITE_), validées au démarrage. */
const schema = z.object({
  MODE: z.enum(['development', 'production', 'test']),
  VITE_SUPABASE_URL: z.url().optional(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1).optional(),
});

export type Env = z.infer<typeof schema>;

export function parseEnv(source: Record<string, unknown>): Env {
  const result = schema.safeParse(source);
  if (!result.success) {
    throw new Error(`Configuration invalide : ${z.prettifyError(result.error)}`);
  }
  return result.data;
}

export const env = parseEnv(import.meta.env);
