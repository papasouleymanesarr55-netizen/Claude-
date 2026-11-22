import type { Plugin } from 'vite';

/** Chaîne présente uniquement dans le jeu de données de démonstration. */
export const DEMO_MARKER = '__DEMO_DATASET__';

export function isDemoEnabled(flag: string | undefined): boolean {
  return flag === 'true';
}

/**
 * Interdit le mode démo pour un build de production.
 * Les builds de démonstration passent par `--mode demo`.
 */
export function assertDemoAllowed(command: 'build' | 'serve', mode: string, demo: boolean): void {
  if (command === 'build' && mode === 'production' && demo) {
    throw new Error(
      '[demo-guard] Build de production refusé : VITE_DEMO_DATA=true. ' +
        'Les données de démonstration ne doivent jamais être livrées en production. ' +
        'Utilisez `npm run build:demo` pour un build de démonstration.',
    );
  }
}

/** Vérifie qu'aucun fichier généré en production ne contient le jeu de démonstration. */
export function findDemoLeaks(files: Record<string, string>): string[] {
  return Object.entries(files)
    .filter(([, code]) => code.includes(DEMO_MARKER))
    .map(([name]) => name);
}

export function demoGuard(mode: string, demo: boolean): Plugin {
  return {
    name: 'demo-guard',
    apply: 'build',
    configResolved(config) {
      assertDemoAllowed(config.command, mode, demo);
    },
    generateBundle(_options, bundle) {
      if (mode !== 'production') return;
      const files: Record<string, string> = {};
      for (const [name, chunk] of Object.entries(bundle)) {
        if (chunk.type === 'chunk') files[name] = chunk.code;
      }
      const leaks = findDemoLeaks(files);
      if (leaks.length > 0) {
        this.error(
          `[demo-guard] Données de démonstration détectées dans le build de production : ${leaks.join(', ')}`,
        );
      }
    },
  };
}
