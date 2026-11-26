# Publier Planning Paie sur l'App Store et Google Play

Ce guide liste **ce que vous devez faire vous-même** (comptes, paiements, validations), dans l'ordre.
Le code, les icônes, les textes et les réglages techniques sont déjà prêts.

**Délai réaliste** : environ **1 semaine pour l'iPhone** et **3 à 4 semaines pour Android**
(Google impose en général un test fermé de 14 jours aux nouveaux comptes personnels).

Vous avez besoin d'un ordinateur (Windows, Mac ou Linux) : **aucun Mac n'est nécessaire**,
les applications sont compilées dans le cloud par Expo (EAS).

---

## Étape 1 — Ouvrir les comptes (à lancer en premier, ils prennent des jours)

| #   | Compte              | Où                                           | Coût              | Délai                                 |
| --- | ------------------- | -------------------------------------------- | ----------------- | ------------------------------------- |
| 1.1 | Apple Developer     | https://developer.apple.com/programs/enroll/ | 99 €/an           | 1 à 2 jours (vérification d'identité) |
| 1.2 | Google Play Console | https://play.google.com/console/signup       | 25 $ une fois     | 2 à 7 jours (pièce d'identité)        |
| 1.3 | Expo                | https://expo.dev/signup                      | gratuit           | 2 min                                 |
| 1.4 | RevenueCat          | https://app.revenuecat.com/signup            | gratuit au départ | 2 min                                 |

Conseils :

- Choisissez un compte **personnel** (pas d'entreprise) sauf si vous avez une société : c'est plus rapide.
- Sur Google Play, notez ce que la console affiche pour les **nouveaux comptes personnels** :
  à ce jour, un **test fermé avec au moins 12 testeurs pendant 14 jours** est demandé avant la
  production. Commencez à chercher 12 testeurs (famille, collègues) dès maintenant :
  il leur faut un compte Google et un téléphone Android.
- Dans App Store Connect, acceptez l'**accord « Apps payantes »** et remplissez **impôts et coordonnées
  bancaires** (menu « Accords, impôts et coordonnées bancaires »). Sans cela, les achats ne fonctionnent pas.
- Dans Google Play Console, créez un **profil de paiement** (Paramètres > Profil de paiement).

## Étape 2 — Vos informations dans l'application (10 min)

1. Ouvrez `src/legal/publisher.json` et remplacez :
   - `editor` par votre nom (ou nom commercial) ;
   - `email` par une adresse de contact (elle sera publique).
2. Si vous possédez un nom de domaine et voulez un autre identifiant que `fr.planningpaie.app`,
   changez `bundleIdentifier` et `package` dans `app.json` **maintenant** (impossible après publication).

## Étape 3 — Publier la page de confidentialité (15 min, gratuit)

1. Sur GitHub, créez un dépôt **public** nommé par exemple `planning-paie-site`.
2. Sur votre ordinateur, dans le dossier `planning-paie`, lancez `node scripts/build-site.mjs`
   (cela met à jour les pages avec vos informations de l'étape 2).
3. Téléversez **le contenu** du dossier `site/` dans ce dépôt (bouton « Add file > Upload files »).
4. Dans le dépôt : **Settings > Pages > Branch : main / (root) > Save**. Après 1 à 2 minutes, GitHub
   affiche l'adresse, du type `https://VOTRE-PSEUDO.github.io/planning-paie-site/`.
5. Dans `app.json`, remplacez les deux adresses `https://planningpaie.github.io/...` (section `extra`)
   par `https://VOTRE-PSEUDO.github.io/planning-paie-site/privacy.html` et `.../terms.html`.
6. Vérifiez que les deux pages s'ouvrent dans un navigateur.

## Étape 4 — Préparer l'ordinateur et Expo (15 min)

1. Installez **Node.js 22** (version « LTS ») : https://nodejs.org
2. Téléchargez le code (sur GitHub : bouton « Code > Download ZIP »), décompressez-le.
3. Ouvrez un terminal dans le dossier `planning-paie` puis tapez, une ligne à la fois :
   ```
   npm install
   npx eas-cli@latest login
   npx eas-cli@latest init
   ```
   `init` relie le projet à votre compte Expo (répondez « Yes »).

## Étape 5 — Créer l'application dans les deux stores (30 min)

**App Store Connect** (https://appstoreconnect.apple.com) > Apps > « + » > Nouvelle app :
plateforme iOS, nom `Planning Paie`, langue principale **Français**, identifiant de lot
`fr.planningpaie.app` (créez-le si on vous le demande), SKU `planningpaie`.
Notez le **numéro « Apple ID »** de l'app (Informations sur l'app) et collez-le dans `eas.json`
à la place de `À_REMPLACER_PAR_L_IDENTIFIANT_APP_STORE_CONNECT`.

**Google Play Console** > Créer une application : nom `Planning Paie`, langue **Français**,
type **Application**, **Gratuite**. Acceptez les déclarations.

## Étape 6 — Premiers builds (1 h, surtout de l'attente)

Dans le terminal :

```
npx eas-cli@latest build --profile production --platform android
npx eas-cli@latest build --profile production --platform ios
```

- Pour iOS, EAS vous demande de vous connecter à votre compte Apple : acceptez qu'il crée
  les certificats automatiquement.
- Chaque build prend 15 à 40 minutes. Le lien de suivi s'affiche dans le terminal.

Ensuite :

1. **Android — première fois à la main** (limite de Google) : téléchargez le fichier `.aab` depuis
   la page du build sur expo.dev, puis dans Play Console > Tester > **Tests internes** > Créer une
   version > importez le `.aab`. Les fois suivantes : `npx eas-cli@latest submit -p android`.
2. **iOS** : `npx eas-cli@latest submit -p ios` envoie le build vers **TestFlight**
   (10 à 30 min de traitement Apple). Installez l'app **TestFlight** sur votre iPhone pour l'essayer.

## Étape 7 — Créer les abonnements (30 min)

Identifiants à saisir **exactement** :

| Produit | Identifiant                     | Prix    | Type                                       |
| ------- | ------------------------------- | ------- | ------------------------------------------ |
| Mensuel | `planningpaie_premium_monthly`  | 1,99 €  | abonnement 1 mois                          |
| Annuel  | `planningpaie_premium_annual`   | 9,99 €  | abonnement 1 an, **essai gratuit 7 jours** |
| À vie   | `planningpaie_premium_lifetime` | 19,99 € | achat unique (non consommable)             |

- **Apple** : votre app > Monétisation > **Abonnements** > créer un groupe « Premium » et les deux
  abonnements (ajoutez l'essai via « Offre de lancement » > Gratuit, 1 semaine) ; puis
  **Achats intégrés** > Non consommable pour l'achat à vie. Renseignez un nom affiché et une
  description en français pour chacun.
- **Google** (possible seulement après l'étape 6) : Monétiser > Produits > **Abonnements** : créez les
  deux abonnements avec un forfait de base (mensuel / annuel, renouvellement automatique) ; ajoutez
  à l'annuel une **offre** « essai gratuit 7 jours ». Puis **Produits intégrés** : l'achat à vie.

## Étape 8 — Brancher RevenueCat (30 min)

1. Dans RevenueCat, créez un projet `Planning Paie`.
2. Ajoutez une app **App Store** (identifiant `fr.planningpaie.app`) et suivez leur guide pour la
   « clé d'achats intégrés » Apple (fichier .p8).
3. Ajoutez une app **Play Store** (identifiant `fr.planningpaie.app`) et suivez leur guide pour le
   « compte de service » Google (fichier .json).
4. **Products** : importez les 3 produits de chaque store.
5. **Entitlements** : créez `premium` et attachez-y les 6 produits.
6. **Offerings** : créez `default` (marquée « current ») avec 3 packages : **Monthly**, **Annual**,
   **Lifetime**, chacun relié au produit iOS et Android correspondant.
7. Dans « API keys », copiez la clé publique iOS (`appl_…`) et Android (`goog_…`), puis dans le terminal :
   ```
   npx eas-cli@latest env:create --name EXPO_PUBLIC_RC_IOS_KEY --value appl_VOTRE_CLE --environment production --environment preview --visibility plaintext
   npx eas-cli@latest env:create --name EXPO_PUBLIC_RC_ANDROID_KEY --value goog_VOTRE_CLE --environment production --environment preview --visibility plaintext
   ```
8. **Refaites les builds** de l'étape 6 (les clés sont intégrées au moment du build) et testez un
   achat avec un compte de test (Apple : « Sandbox » dans Réglages > App Store de l'iPhone ;
   Google : Paramètres > Test des licences).

## Étape 9 — Fiches des stores (1 h)

Tout est dans `STORE_LISTING.md` : nom, sous-titre, description, mots-clés, captures
(`store/screenshots/`), réponses de confidentialité, classification, note pour Apple.

- Apple : remplissez la page de version 1.0, « Confidentialité de l'app », « Classification par âge ».
- Google : Fiche principale, Classification du contenu (questionnaire), Public cible (18+),
  Sécurité des données, Annonces : non, Application gouvernementale : non.
- Icône 512 × 512 demandée par Google : utilisez `assets/icon.png` (le site redimensionne ;
  sinon, réduisez-la avec n'importe quel éditeur d'images).
- Bannière Google 1024 × 500 : obligatoire ; un fond bleu `#2348C4` avec l'icône au centre suffit.

## Étape 10 — Test fermé Google (14 jours)

Play Console > Tester > **Test fermé** > créer une liste de **12 testeurs ou plus** (adresses Gmail),
publiez-y la version, envoyez-leur le lien d'inscription. Ils doivent installer l'app et la garder
**14 jours**. Ensuite, Play Console propose « Demander l'accès à la production » (questionnaire
sur le test). Vérifiez sur place les conditions exactes, elles évoluent.

## Étape 11 — Envoyer en vérification

- **Apple** : sur la page de la version, choisissez le build, ajoutez les abonnements à la version
  (section « Achats intégrés et abonnements »), cliquez **Soumettre pour vérification**.
  Réponse en général sous 24 à 48 h.
- **Google** : après accès à la production, Production > Créer une version > « Envoyer pour examen ».
  Réponse en quelques jours.

## Publicité vidéo (facultatif, désactivée par défaut)

La version gratuite peut proposer une **vidéo à la demande** : l'utilisateur la regarde s'il le veut,
et les exports PDF/Excel sont débloqués 24 h. Jamais de bannière, jamais de pub imposée, rien en Premium.
Tant que vous ne faites pas les étapes ci-dessous, **le code publicitaire n'est même pas inclus**
dans l'application.

Je vous conseille d'attendre d'avoir quelques centaines d'utilisateurs : avant, cela rapporte
quelques euros et alourdit la validation.

1. Créez un compte **Google AdMob** (https://admob.google.com, gratuit) et liez-le à vos coordonnées
   de paiement (Google paie à partir de 70 € de gains).
2. Ajoutez deux applications (iOS et Android). Notez les deux **identifiants d'application**
   (`ca-app-pub-…~…`).
3. Pour chacune, créez un **bloc d'annonces « Avec récompense »** (récompense : 1). Notez les
   deux **identifiants de bloc** (`ca-app-pub-…/…`).
4. Dans AdMob > **Confidentialité et messages** : créez un message **RGPD** (Europe) pour les deux
   applications et publiez-le. C'est ce formulaire de consentement que l'application affiche.
5. Dans le terminal (tout sur une ligne par commande) :
   ```
   npx eas-cli@latest env:create --name EXPO_PUBLIC_ADS_ENABLED --value 1 --environment production --environment preview --visibility plaintext
   npx eas-cli@latest env:create --name ADMOB_IOS_APP_ID --value ca-app-pub-XXX~YYY --environment production --environment preview --visibility plaintext
   npx eas-cli@latest env:create --name ADMOB_ANDROID_APP_ID --value ca-app-pub-XXX~ZZZ --environment production --environment preview --visibility plaintext
   npx eas-cli@latest env:create --name EXPO_PUBLIC_ADMOB_REWARDED_IOS --value ca-app-pub-XXX/AAA --environment production --environment preview --visibility plaintext
   npx eas-cli@latest env:create --name EXPO_PUBLIC_ADMOB_REWARDED_ANDROID --value ca-app-pub-XXX/BBB --environment production --environment preview --visibility plaintext
   ```
6. Dans `src/legal/publisher.json`, passez `"adsEnabled"` à `true`, puis lancez
   `node scripts/build-site.mjs` et republiez le dossier `site/` (étape 3) : la politique de
   confidentialité décrit alors AdMob.
7. Dans les stores, **mettez à jour les déclarations** (section « Si la publicité est activée » de
   `STORE_LISTING.md`) **avant** d'envoyer le nouveau build.
8. Refaites un build, testez sur téléphone (en mode test, des vidéos de démonstration Google
   s'affichent), puis soumettez.

Pour désactiver : supprimez la variable `EXPO_PUBLIC_ADS_ENABLED` (ou mettez `0`), remettez
`adsEnabled` à `false`, refaites un build.

## Mises à jour suivantes

```
npx eas-cli@latest build --profile production --platform all
npx eas-cli@latest submit --platform all
```

Augmentez `version` dans `app.json` (ex. 1.0.1) à chaque nouvelle version publique ;
les numéros de build s'incrémentent tout seuls.

---

## Vérifications avant « prêt »

- [x] Achats intégrés : abonnement mensuel, annuel avec essai, achat à vie (étapes 7–8).
- [x] Bouton « Restaurer mes achats » (écran Premium et Réglages).
- [x] Prix, durée et renouvellement affichés avant l'achat, liens confidentialité et conditions.
- [x] Mention « estimation indicative, non contractuelle » (écran principal, PDF, conditions).
- [x] Export et suppression des données (Réglages > Mes données).
- [x] Publicité : désactivée par défaut ; si activée, uniquement à la demande, après consentement RGPD,
      avec accès permanent au formulaire (Réglages > Confidentialité des publicités).
- [x] Permissions demandées uniquement à l'activation, avec texte explicatif (calendrier, notifications).
- [ ] Coordonnées de l'éditeur complétées (étape 2) et pages publiées (étape 3).
- [ ] Achat testé en Sandbox sur un vrai téléphone (étape 8).

## Ce qui a été vérifié par Claude, et ce qui ne l'a pas été

- Vérifié : 63 tests automatiques (dont les 5 cas obligatoires du calcul), typage strict, lint,
  compilation de l'application, génération des projets natifs iOS/Android (`expo prebuild`) avec
  les permissions attendues, rendu de tous les écrans dans un navigateur (clair et sombre).
- **Non vérifié** : aucun test sur un vrai téléphone ni dans un simulateur iOS/Android (pas d'accès
  dans l'environnement de travail), ni sur la synchronisation calendrier, les notifications, l'export
  PDF natif et les achats réels. À tester avec le build de l'étape 6 avant la soumission.
