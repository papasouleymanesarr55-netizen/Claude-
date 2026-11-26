# Fiches des stores (français)

Textes prêts à copier-coller. Les longueurs maximales sont respectées.

## Commun

- **Nom de l'app** (30 car. max) : `Planning Paie – Heures & Paie`
- **Catégorie** : Productivité (secondaire : Finance sur l'App Store)
- **Âge** : 4+ (Apple) · Tout public / PEGI 3 (Google, questionnaire IARC : aucune case cochée)
- **Prix** : gratuit, avec achats intégrés
- **Contact / site** : l'adresse de votre page GitHub Pages (voir PUBLISH.md)
- **Politique de confidentialité** : `…/privacy.html` de cette même page

## App Store (Apple)

- **Sous-titre** (30) : `Planning, heures et salaire`
- **Mots-clés** (100, séparés par des virgules, sans espace) :
  `planning,horaires,travail,salaire,paie,heures sup,poste,nuit,brut,net,semaine,calendrier,agenda`
- **Texte promotionnel** (170) :
  `Notez vos postes en quelques touches et voyez tout de suite combien vous toucherez à la fin du mois. Sans publicité, sans compte.`

## Google Play

- **Description courte** (80) :
  `Planning de travail et salaire du mois : saisie rapide, brut et net estimés.`

## Description longue (les deux stores)

```
Planning Paie, c'est votre planning de travail et votre paie du mois au même endroit.

SAISIE ULTRA-RAPIDE
• Touchez un poste (Matin, Soir, Nuit…) : il s'ajoute au jour choisi et le jour suivant est sélectionné. Un mois se remplit en moins d'une minute.
• « Repos » vide le jour et passe au suivant.
• Double-touchez une date pour modifier ce seul jour : horaires, pause, taux horaire, note.

VOTRE PAIE EN DIRECT
• Le taux horaire brut se saisit directement dans le poste.
• Brut à percevoir ce mois, net estimé, heures et jours travaillés, toujours visibles.
• Numéros de semaine sur chaque ligne du calendrier.
• Postes de nuit gérés (passage de minuit).

SIMPLE ET RESPECTUEUX
• Aucune publicité, aucun compte, aucun suivi.
• Vos données restent sur votre téléphone. Sauvegarde et restauration par fichier pour changer d'appareil.
• Thème sombre, grandes polices, compatible lecteur d'écran.

PREMIUM (facultatif)
• Heures supplémentaires par semaine (seuils et taux réglables).
• Majorations de nuit, du dimanche et des jours fériés (fériés français calculés automatiquement).
• Synchronisation avec le calendrier du téléphone.
• Rappel avant chaque poste.
• Feuille d'heures PDF et tableau pour Excel.
Abonnement 1,99 €/mois ou 9,99 €/an (7 jours d'essai), ou achat unique 19,99 €. Résiliable à tout moment depuis votre compte Apple ou Google.

Important : les montants sont des estimations indicatives et non contractuelles. Seule votre fiche de paie fait foi.
```

## Notes de version 1.0.0

```
Première version : planning mensuel avec numéros de semaine, saisie rapide, modification d'un jour par double-touche, calcul du brut et du net estimé, sauvegarde par fichier, thème sombre.
```

## Captures d'écran (6 par plateforme)

Fichiers prêts dans `store/screenshots/ios/` (1290 × 2796, iPhone 6,7 pouces) et
`store/screenshots/android/` (1080 × 2400). Ordre et légende conseillée :

| #   | Fichier                        | Légende à ajouter (facultatif)            |
| --- | ------------------------------ | ----------------------------------------- |
| 1   | `1-planning-du-mois.png`       | Votre mois et votre paie en un coup d'œil |
| 2   | `2-modifier-un-jour.png`       | Double-touchez un jour pour l'ajuster     |
| 3   | `3-poste-et-taux-horaire.png`  | Le taux horaire saisi avec le poste       |
| 4   | `4-heures-sup-majorations.png` | Heures sup et majorations (Premium)       |
| 5   | `5-theme-sombre.png`           | Thème sombre                              |
| 6   | `6-sauvegarde-et-reglages.png` | Sauvegarde, export PDF et Excel           |

Ces captures sont rendues à partir du code de l'application (version web, données de démonstration).
Elles sont fidèles à l'écran, mais la police système peut légèrement différer : idéalement,
remplacez-les par des captures faites sur un téléphone avec le build de test (même ordre, mêmes données).
Pour l'App Store, si la console exige le format 6,9 pouces (1320 × 2868), Apple accepte de réutiliser
celles-ci si vous cochez l'option de mise à l'échelle ; sinon, capturez-les sur un iPhone 16 Pro Max / 17 Pro Max.

## Confidentialité — App Store (« Confidentialité de l'app »)

- Collectez-vous des données ? **Oui** (uniquement à cause des achats intégrés via RevenueCat).
- Type : **Achats > Historique des achats**.
  - Utilisation : **Fonctionnalité de l'app** uniquement.
  - Liée à l'identité de l'utilisateur : **Non**.
  - Utilisée pour le suivi : **Non**.
- Aucune autre catégorie (pas de contact, localisation, identifiants publicitaires, diagnostics, etc.).
- Chiffrement (export) : déjà déclaré « non » dans `app.json` (`usesNonExemptEncryption: false`).

## Sécurité des données — Google Play

- L'app collecte-t-elle ou partage-t-elle des données ? **Oui**.
- **Informations financières > Historique des achats** : collectées, **non partagées**,
  traitement **non éphémère**, collecte **obligatoire** pour Premium, finalité **Fonctionnalité de l'app**.
- Données chiffrées en transit : **Oui**.
- Possibilité de demander la suppression : **Oui** (Réglages > Effacer toutes mes données ; aucune donnée
  de planning n'est envoyée).
- Publicité : **Non**. Identifiant publicitaire : **Non** (permission AD_ID bloquée).
- Public cible : **18 ans et plus** (application destinée aux salariés).
- Appli d'actualités / santé / finance réglementée : **Non**.

## Note pour la vérification Apple (App Review)

```
Aucun compte n'est nécessaire. Premium se teste avec un compte Sandbox. Les montants sont des estimations indicatives calculées localement à partir des horaires et du taux horaire saisis par l'utilisateur ; l'application ne remplace pas une fiche de paie. Le bouton « Restaurer mes achats » est dans l'écran Premium et dans les Réglages.
```
