# ADR 0001 — Socle technique front-end

- Statut : accepté
- Date : 2026-11-22

## Contexte

SaaS automobile centré sur une carte interactive (France puis Europe). Budget initial ≤ 300 €.
Objectifs : maintenabilité, coût quasi nul au départ, aucune donnée fictive présentée comme réelle.

## Décision

- **Vite + React 19 + TypeScript strict** (SPA). Le dashboard n'a pas besoin de rendu serveur ;
  un site marketing SEO pourra être séparé plus tard.
- **Tailwind CSS v4**, palette exposée en design tokens (`src/styles/tokens.css`).
- **i18n dès le départ** (`react-i18next`, `fr` par défaut).
- **Marque centralisée** dans `src/config/brand.ts` (nom provisoire, jamais codé en dur ailleurs).
- **Variables d'environnement validées** par Zod (`src/config/env.ts`).
- **Qualité** : ESLint (strict), Prettier, Vitest + Testing Library, Playwright (desktop, tablette,
  mobile), CI GitHub Actions.

## Conséquences

- Coût d'outillage : 0 €.
- TypeScript reste en 6.0 : `typescript-eslint` ne supporte pas encore TypeScript 7.
- Prochaines ADR : cartographie (MapLibre + OpenFreeMap), back-end (Supabase/PostGIS),
  hébergement (Cloudflare Pages), sources de données.
