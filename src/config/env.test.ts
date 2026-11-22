import { describe, expect, it } from 'vitest';
import { parseEnv } from './env';

describe('parseEnv', () => {
  it('accepte une configuration minimale', () => {
    expect(parseEnv({ MODE: 'development' }).MODE).toBe('development');
  });

  it('rejette une URL Supabase invalide', () => {
    expect(() => parseEnv({ MODE: 'production', VITE_SUPABASE_URL: 'pas-une-url' })).toThrow(
      /Configuration invalide/,
    );
  });
});
