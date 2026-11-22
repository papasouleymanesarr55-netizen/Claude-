# Sources de données, cartographie et licences

## Règles du produit

- Chaque établissement affiche sa source et, dès qu'on la connaît, sa date de mise à jour.
- Une information absente s'affiche « Non communiqué ». Elle n'est jamais estimée ni inventée.
- Les données de démonstration (développement uniquement) sont étiquetées « Démo » partout,
  avec un bandeau permanent. Elles ne peuvent pas être livrées en production (voir plus bas).

## Fond de carte : OpenFreeMap

| Élément        | Valeur                                                                                              |
| -------------- | --------------------------------------------------------------------------------------------------- |
| Service        | Instance publique OpenFreeMap : `https://tiles.openfreemap.org`                                     |
| Style          | `styles/dark`, recoloré à la palette du produit au chargement (`src/features/map/mapStyle.ts`)      |
| Moteur         | MapLibre GL JS (licence BSD-3-Clause)                                                               |
| Coût           | Gratuit, sans inscription, sans clé d'API, sans cookie                                              |
| Limites        | Aucune limite de vues ou de requêtes annoncée. Financement par dons, sans garantie de service (SLA) |
| Hors périmètre | Pas de géocodage, pas de calcul d'itinéraire, pas d'images statiques                                |

**Attribution obligatoire**, affichée en permanence sur la carte par le contrôle d'attribution de
MapLibre. Le texte est fourni par la source de tuiles elle-même (TileJSON) :

> [OpenFreeMap](https://openfreemap.org) [© OpenMapTiles](https://www.openmaptiles.org/) Data from [OpenStreetMap](https://www.openstreetmap.org/copyright)

Elle reste visible à tous les formats. Sur mobile, la carte s'arrête au-dessus du panneau de liste
pour ne jamais la masquer. Un test de bout en bout vérifie sa présence.

**Évolution prévue** : pour un trafic important ou un engagement de disponibilité, on auto-hébergera
les tuiles. OpenFreeMap publie chaque semaine la planète complète en MBTiles et PMTiles, qu'on peut
servir depuis un stockage objet (Cloudflare R2, environ 5 €/mois).

**Sources consultées** : le README officiel du projet
(`github.com/hyperknot/openfreemap`) et la réponse TileJSON du serveur de tuiles. Les pages
`openfreemap.org/tos` et `openstreetmap.org/copyright` n'étaient pas accessibles depuis
l'environnement de développement. Elles devront être relues avant la mise en production (étape 8).

## OpenStreetMap (ODbL)

- Les données OSM sont sous licence **Open Database License (ODbL)**. Toute utilisation publique
  impose de créditer OpenStreetMap avec un lien vers `openstreetmap.org/copyright`. C'est fait sur
  la carte, et sera repris dans les mentions légales (étape 8).
- Afficher des tuiles (produit dérivé) n'impose pas de partager notre code.
- Si nous **extrayons et redistribuons** des données OSM (garages, lavages, pneus), la base dérivée
  devra rester sous ODbL (partage à l'identique). Ce point sera traité à l'étape 4.

## Données métier (à brancher à l'étape 4)

| Catégorie              | Source                                                    | Licence             |
| ---------------------- | --------------------------------------------------------- | ------------------- |
| Bornes de recharge     | Base nationale consolidée IRVE (data.gouv.fr)             | Licence Ouverte 2.0 |
| Carburants             | Flux « Prix des carburants » (data.economie.gouv.fr)      | Licence Ouverte     |
| Parkings               | Base nationale des lieux de stationnement + OpenStreetMap | LO / ODbL           |
| Garages, lavage, pneus | OpenStreetMap (extrait Geofabrik France)                  | ODbL                |
| Géocodage              | Géoplateforme IGN / Base Adresse Nationale                | Licence Ouverte     |

## Itinéraires

Le bouton « Itinéraire » ouvre Google Maps, Waze ou Apple Plans par **lien profond** : aucune API,
aucun coût, aucune donnée transmise par nos serveurs. Il est désactivé sur les lieux de
démonstration, qui sont fictifs.

## Garde-fou « données de démonstration »

- Les données fictives se trouvent uniquement dans `src/features/demo/demoSource.ts`, chargé si
  `VITE_DEMO_DATA=true`.
- `npm run build` (production) **échoue** si `VITE_DEMO_DATA=true` (`build/demo-guard.ts`).
- En production, la constante `__DEMO_DATA__` vaut `false` : le module de démonstration est éliminé
  du bundle. Le plugin vérifie en plus qu'aucun fichier généré ne contient le marqueur du jeu de
  démonstration.
- La CI vérifie les deux cas à chaque push.
- Les builds de démonstration utilisent `npm run build:demo` et ne doivent pas être déployés en
  production.
