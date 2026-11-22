# Plateforme automobile (nom provisoire)

SaaS pour trouver bornes de recharge, parkings, stations-service, garages, lavage et pneus.
Marché initial : France.

## Démarrage

```bash
npm install
npm run dev
```

## Scripts

| Commande                             | Rôle                                                           |
| ------------------------------------ | -------------------------------------------------------------- |
| `npm run dev`                        | Serveur de développement                                       |
| `npm run build`                      | Build de production                                            |
| `npm run lint` / `npm run typecheck` | Qualité du code                                                |
| `npm test`                           | Tests unitaires (Vitest)                                       |
| `npm run e2e`                        | Tests de bout en bout (Playwright : desktop, tablette, mobile) |
| `npm run format`                     | Formatage Prettier                                             |

## Structure

```
src/app/        application, routes
src/layouts/    sidebar, barre supérieure, navigation mobile, panneau droit
src/components/ primitives d'interface (Card, Chip, Drawer…)
src/features/   carte, établissements, véhicules, favoris, données, démo
src/pages/      pages de l'application
src/lib/        utilitaires (distance, formats, liens d'itinéraire)
build/          garde-fou des données de démonstration
src/config/     marque (brand.ts) et variables d'environnement
src/styles/     design tokens et styles globaux
src/i18n/       traductions
e2e/            tests Playwright
docs/           décisions d'architecture (ADR) et sources de données
```

Le nom du produit est défini uniquement dans `src/config/brand.ts`.

## Données de démonstration

En développement (`npm run dev`), l'application affiche des **données fictives**, signalées par un
bandeau et un badge « Démo ». Le build de production les refuse. Voir `docs/data-sources.md` pour
les sources, les licences et le fonctionnement du garde-fou.
