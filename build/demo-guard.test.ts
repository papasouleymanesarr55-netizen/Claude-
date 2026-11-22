import { describe, expect, it } from 'vitest';
import { assertDemoAllowed, DEMO_MARKER, findDemoLeaks, isDemoEnabled } from './demo-guard';

describe('demo-guard', () => {
  it('refuse un build de production avec les données de démonstration', () => {
    expect(() => assertDemoAllowed('build', 'production', true)).toThrow(
      /Build de production refusé/,
    );
  });

  it('autorise le build de démonstration et le build de production sans démo', () => {
    expect(() => assertDemoAllowed('build', 'demo', true)).not.toThrow();
    expect(() => assertDemoAllowed('build', 'production', false)).not.toThrow();
    expect(() => assertDemoAllowed('serve', 'development', true)).not.toThrow();
  });

  it('détecte le jeu de démonstration dans les fichiers générés', () => {
    expect(findDemoLeaks({ 'a.js': 'ok', 'b.js': `x="${DEMO_MARKER}"` })).toEqual(['b.js']);
    expect(findDemoLeaks({ 'a.js': 'ok' })).toEqual([]);
  });

  it('active la démo uniquement pour la valeur "true"', () => {
    expect(isDemoEnabled('true')).toBe(true);
    expect(isDemoEnabled('1')).toBe(false);
    expect(isDemoEnabled(undefined)).toBe(false);
  });
});
