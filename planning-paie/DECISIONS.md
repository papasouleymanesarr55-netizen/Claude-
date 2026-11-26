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

## Récap par entreprise (ajouté à votre demande)

26. **Entreprise / mission** : champ facultatif sur chaque poste (ex. « Matin » chez Boulangerie Martin).
    Un jour peut changer d'entreprise depuis sa fiche (seul l'écart est enregistré). Les noms déjà
    utilisés sont proposés en un toucher. Les jours sans entreprise sont regroupés dans
    « Sans entreprise ».
27. **Écran « Récap »** (bouton en haut de l'écran du mois, et Réglages > Mes données) : pour chaque
    entreprise, heures, jours, brut, net estimé, détail par poste et liste des jours ; puis le total
    général. **Consultation gratuite ; export PDF et Excel du récap en Premium**, comme les autres
    exports. Facile à rendre gratuit si vous préférez.
28. **Heures supplémentaires par employeur** : avec le calcul avancé, le seuil de 35 h s'applique
    séparément à chaque entreprise (un contrat = un seuil), et non au cumul de toutes.
29. **Taux** : chaque entreprise garde le taux horaire de ses postes ; pas de taux « par entreprise »
    distinct, pour ne pas avoir deux endroits où saisir le même chiffre.

## Publicité, factures et rappels (ajoutés à votre demande)

30. **Publicité désactivée par défaut, et absente du code compilé** : le SDK Google n'est intégré
    que si la variable `EXPO_PUBLIC_ADS_ENABLED=1` est définie au build (sinon il est exclu de
    l'application, ce qui évite aussi un plantage au démarrage sans compte AdMob).
31. **Format** : uniquement une **vidéo « avec récompense » à la demande**. Elle débloque **les exports
    PDF/Excel pendant 24 h** (feuille d'heures, tableau, récap). Elle ne débloque pas la facture,
    le calcul avancé, le calendrier ni les rappels, qui restent Premium. Aucune pub en Premium.
32. **Consentement** : formulaire Google (UMP) affiché **au premier clic sur « Regarder une vidéo »**,
    pas au lancement de l'application. Publicités **non personnalisées** si l'utilisateur refuse
    (ou hors cadre TCF). Pas de demande de suivi Apple (ATT) : moins de revenus, mais pas de pop-up
    supplémentaire et une étiquette « pas de suivi ». Le formulaire reste accessible dans
    Réglages > Confidentialité des publicités.
33. **Relevé ou facture** (Premium) : bouton sur chaque entreprise du Récap.
    - _Relevé d'heures_ (salariés) : détail des jours, total des heures, brut estimé, cases de signature.
    - _Facture_ (indépendants) : numéro `AAAA-001` continu (remis à 1 chaque année, modifiable),
      date d'émission, période, échéance (30 jours par défaut), émetteur avec SIRET, client et adresse,
      une ligne par poste et par taux, total HT, mention TVA (par défaut « TVA non applicable,
      art. 293 B du CGI »), pénalités de retard et indemnité de 40 €. **La TVA n'est pas calculée** :
      l'export convient aux micro-entrepreneurs en franchise, pas encore aux assujettis.
    - Le numéro n'avance que lorsque la facture est réellement créée. L'adresse du client est mémorisée.
34. **Rappels** (Premium) : en plus du rappel « X min avant », deux options cumulables :
    **la veille** (exactement 24 h avant le début) et **le jour J** à une heure choisie (7 h par défaut ;
    si le poste commence plus tôt, le rappel arrive 1 h avant le début). Les 60 rappels les plus proches
    sont programmés, tous types confondus (limite iOS).
35. **Données** : version 2 du stockage (migration automatique, sans perte). Les coordonnées de
    facturation sont incluses dans la sauvegarde JSON.

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
