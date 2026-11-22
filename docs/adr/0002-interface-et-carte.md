# ADR 0002 — Interface principale, carte et données de démonstration

- Statut : accepté
- Date : 2026-11-22

## Décisions

1. **Carte : MapLibre GL JS + OpenFreeMap.** Gratuit, open source, sans clé. Le style sombre
   d'OpenFreeMap est recoloré à notre palette au chargement (`transformStyle`), sans maintenir de
   copie du style. La carte est chargée à la demande (lazy) pour alléger le premier affichage.
2. **Marqueurs HTML** rendus par React (portails), car le volume reste faible. À partir de quelques
   centaines de points (étape 5), on passera à une couche GeoJSON avec regroupement (clusters).
3. **Accès aux données par un contrat unique** (`DataSource`). La démo l'implémente aujourd'hui,
   Supabase l'implémentera demain, sans modifier les composants.
4. **État dans l'URL** (`?cat=`, `?q=`, `?place=`) : liens partageables, retour arrière cohérent.
5. **Responsive** : sidebar complète (≥ 1280 px), en icônes (768–1279 px), barre de navigation
   inférieure et panneau de liste glissant sur mobile. Le panneau véhicule passe en tiroir sous
   1280 px.
6. **Pas de bibliothèque d'animation ni de gestion d'état** : transitions CSS et état React suffisent.
7. **Police Outfit auto-hébergée** (`@fontsource-variable/outfit`, licence OFL) : aucun appel à
   Google Fonts.
8. **Données de démonstration impossibles à livrer en production** (voir `docs/data-sources.md`).

## Écarts assumés avec la référence visuelle

- Pas de batterie, d'autonomie restante ni de température en direct : cela exige une connexion au
  véhicule. On affiche uniquement des valeurs déclarées.
- Pas de tracé d'itinéraire ni de courbe de consommation : ce serait des données inventées.
- Silhouette de véhicule générique en SVG, sans marque ni photo.
