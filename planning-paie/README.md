# Planning Paie

Application iPhone et Android de planning de postes de travail avec calcul de la paie du mois
(brut, net estimé, heures supplémentaires et majorations en Premium).
Expo SDK 58 · React Native · TypeScript strict · expo-router · Zustand.

## Lancer l'application

Prérequis : Node.js 22 ou plus récent.

```bash
cd planning-paie
npm install
npm run web        # aperçu dans le navigateur (le plus simple)
npm start          # puis scanner le QR code (build de développement requis, voir ci-dessous)
```

Les modules natifs (RevenueCat, calendrier, notifications) ne sont pas tous présents dans Expo Go.
Pour tester sur téléphone, créez un build de développement ou de test :

```bash
npx eas-cli@latest build --profile development --platform ios      # simulateur iOS
npx eas-cli@latest build --profile preview --platform android      # APK à installer
```

Sans clé RevenueCat, l'application passe en **mode Premium simulé** en développement :
Réglages > Premium > « Premium simulé (développement) ». Ce mode est désactivé dans les builds
de production.

## Commandes

| Commande                                    | Rôle                                                           |
| ------------------------------------------- | -------------------------------------------------------------- |
| `npm test`                                  | Tests Jest (moteur de calcul, store, écran du mois, exports)   |
| `npm run typecheck`                         | `tsc --noEmit`                                                 |
| `npm run lint` / `npm run format`           | ESLint / Prettier                                              |
| `npm run verify`                            | Tout ce qui précède (lancé aussi par la CI GitHub)             |
| `node scripts/icons.mjs`                    | Régénère les icônes et l'écran de lancement                    |
| `node scripts/build-site.mjs`               | Régénère `site/`, `PRIVACY.md`, `TERMS.md` depuis `src/legal/` |
| `MODE=ios node scripts/screenshots.mjs`     | Captures 1290 × 2796 (après `npx expo export --platform web`)  |
| `MODE=android node scripts/screenshots.mjs` | Captures 1080 × 2400                                           |

## Structure

```
src/app/      écrans (expo-router) : mois, réglages, calcul avancé, Premium, documents légaux
src/domain/   logique pure et testée : calculs, semaines ISO, fériés, sauvegarde JSON, formats
src/store/    état persistant (Zustand + AsyncStorage, migrations versionnées)
src/ui/       composants : calendrier, palette, fiches poste et jour, thème
src/native/   calendrier, rappels, fichiers, PDF/CSV, achats RevenueCat
src/i18n/     traductions français / anglais
src/legal/    textes de confidentialité et conditions (source unique app + site)
site/         pages web publiques (GitHub Pages)
store/        captures d'écran pour les stores
```

Documents : `DECISIONS.md` (choix faits), `PUBLISH.md` (publication pas à pas),
`STORE_LISTING.md` (fiches des stores), `PRIVACY.md`, `TERMS.md`, `CHANGELOG.md`.
