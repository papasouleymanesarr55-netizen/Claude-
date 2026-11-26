# Décisions prises à la place de l'utilisateur

Chaque choix ci-dessous a été fait sans vous demander, selon les défauts du brief. Tout est modifiable.

## Projet

1. **Emplacement** : le dépôt contenait déjà un autre projet (plateforme automobile). L'application
   est donc dans le sous-dossier `planning-paie/`, avec sa propre CI (`.github/workflows/planning-paie.yml`).
   Le projet existant a seulement été configuré pour ignorer ce dossier (Prettier, ESLint).
2. **Prototype absent** : `planning-paie.html` et les fichiers SwiftUI n'étaient pas dans le dépôt.
   La spécification du brief a servi de référence. Le format de sauvegarde suit exactement le brief (§5) ;
   l'import accepte aussi les horaires en minutes et les jours écrits `"date": "idPoste"`, au cas où.
3. **Versions** : Expo SDK 58 (dernière version stable au 26/11/2026), React Native 0.88, TypeScript 6.
4. **Noms dans le code en anglais** (`start`, `rate`…) au lieu de `debut`, `taux` : convention habituelle
   du code ; l'interface reste 100 % en français.

## Calculs

5. **Arrondi** : chaque jour est arrondi au centime, puis le mois est la somme des jours (comme les lignes
   d'une fiche de paie).
6. **Pause et majorations** : la pause est répartie sur toute la durée du poste (on ne sait pas à quelle
   heure elle est prise). Exemple : poste de nuit de 8 h avec 1 h de pause → 7 h payées, toutes « de nuit ».
7. **Cumul des majorations** : par défaut, **la plus élevée** s'applique pour chaque heure (réglable :
   « Les additionner »). Les heures supplémentaires entrent dans cette règle comme une majoration de plus.
8. **Heures supplémentaires** : calculées sur la **semaine ISO complète** (lundi–dimanche), même si elle
   commence dans le mois précédent ; ce sont les dernières heures de la semaine qui sont majorées.
   Défaut : seuil 35 h, 8 h à 25 %, puis 50 %. Nuit, dimanche, férié : **0 %** par défaut.
9. **Heures de nuit** : 21 h – 6 h par défaut (modifiable). Pour le dimanche et les fériés, c'est la date
   réelle de chaque heure qui compte (un poste du samedi 22 h au dimanche 6 h a 6 h « dimanche »).
10. **Jours fériés** : les 11 jours légaux ; option Alsace-Moselle (Vendredi saint, 26 décembre) ;
    ajout manuel de dates.
11. **Fin = début** : compté comme un poste de 24 h (règle « fin ≤ début → passe minuit »).
12. **Jour sans poste** : possible depuis la fiche du jour (« Personnalisé »), affiché ✎ dans le calendrier.

## Interface

13. **Premier lancement** : une fenêtre demande le taux horaire brut et crée 3 postes (Matin 6–14 h,
    Soir 14–22 h, Nuit 22–6 h, pause 30 min). Taux proposé : 12,50 € (modifiable immédiatement).
14. **Saisie de l'heure** : champ texte rapide (« 8 », « 830 », « 8h30 » → 08:00 / 08:30) plutôt qu'une
    roue de sélection, plus rapide pour saisir un mois.
15. **Saisie rapide en fin de mois** : le curseur reste sur le dernier jour (ne change pas de mois).
16. **Appliquer un poste** remplace les horaires personnalisés du jour mais **garde la note**.
17. **Synchronisation calendrier** : automatique (quelques secondes après chaque modification) quand
    elle est activée, plus le bouton « Synchroniser maintenant ». Les événements de la plage
    [−2 mois ; +12 mois] du calendrier « Planning Paie » sont supprimés puis recréés : aucun doublon.
18. **Excel** : export CSV au format Excel français (séparateur « ; », virgule décimale), sans
    dépendance supplémentaire. Un vrai fichier .xlsx pourra venir en v1.1.
19. **Icône** : calendrier blanc et pièce « € » jaune sur fond bleu (#2348C4), générée par script.

## Publication et monétisation

20. **Identifiant** : `fr.planningpaie.app` (iOS et Android). À changer **avant la première mise en ligne**
    seulement si vous avez votre propre nom de domaine.
21. **Produits** : `planningpaie_premium_monthly` (1,99 €/mois), `planningpaie_premium_annual`
    (9,99 €/an, essai 7 jours), `planningpaie_premium_lifetime` (19,99 €, achat unique).
    Droit d'accès RevenueCat : `premium`, offre `default`.
22. **Clés RevenueCat** : lues dans les variables `EXPO_PUBLIC_RC_IOS_KEY` et `EXPO_PUBLIC_RC_ANDROID_KEY`
    (clés publiques, non secrètes), à définir sur EAS. Sans clé : mode simulé en développement,
    « achats indisponibles » en production (aucun Premium gratuit par erreur).
23. **Étiquettes de confidentialité — écart avec le brief** : le brief demande « Aucune donnée collectée ».
    Ce n'est vrai que sans RevenueCat. RevenueCat conserve l'historique d'achat lié à un identifiant
    anonyme. Pour rester exact (et éviter un refus), `STORE_LISTING.md` déclare uniquement
    « Historique d'achat — fonctionnement de l'app — non lié à votre identité — pas de suivi ».
    Toutes les autres catégories : aucune collecte.
24. **Documents légaux** : nom de l'éditeur et e-mail de contact laissés **à compléter** dans
    `src/legal/publisher.json` (je n'ai pas inscrit vos coordonnées dans un document public sans accord).
    Adresse du site par défaut : `https://planningpaie.github.io` — à remplacer par la vôtre (voir PUBLISH.md).
25. **Numéros de build** : gérés par EAS (`appVersionSource: remote`, incrément automatique en production).
