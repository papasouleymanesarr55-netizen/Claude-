import { Platform } from 'react-native';

import { useAppStore } from '../store/store';

/**
 * Vidéo publicitaire « à la demande » (AdMob), uniquement dans la version gratuite.
 *
 * DÉSACTIVÉE PAR DÉFAUT. Elle ne s'active qu'au build, avec EXPO_PUBLIC_ADS_ENABLED=1 et les
 * identifiants AdMob (voir PUBLISH.md). Sans cela, le SDK Google n'est même pas inclus dans
 * l'application (voir react-native.config.js et app.config.js) et ce module ne charge rien.
 */
export const ADS_BUILD_ENABLED = process.env.EXPO_PUBLIC_ADS_ENABLED === '1';

/** Durée du déblocage obtenu en regardant une vidéo. */
export const AD_PASS_MS = 24 * 60 * 60 * 1000;

const REWARDED_UNIT =
  Platform.OS === 'ios'
    ? process.env.EXPO_PUBLIC_ADMOB_REWARDED_IOS
    : process.env.EXPO_PUBLIC_ADMOB_REWARDED_ANDROID;

export function adsAvailable(): boolean {
  return ADS_BUILD_ENABLED && Platform.OS !== 'web';
}

type AdsModule = typeof import('react-native-google-mobile-ads');

function lib(): AdsModule {
  // Chargement paresseux : le module natif n'existe que si les pubs sont activées au build.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('react-native-google-mobile-ads') as AdsModule;
}

let initialized = false;

/**
 * Recueille le consentement RGPD (formulaire Google UMP, affiché seulement si nécessaire),
 * puis initialise le SDK. Renvoie false si aucune publicité ne peut être demandée.
 */
async function ensureConsent(): Promise<{ ok: boolean; nonPersonalized: boolean }> {
  const { AdsConsent } = lib();
  const info = await AdsConsent.gatherConsent();
  if (!info.canRequestAds) return { ok: false, nonPersonalized: true };
  if (!initialized) {
    await lib().default().initialize();
    initialized = true;
  }
  let nonPersonalized = true;
  try {
    nonPersonalized = !(await AdsConsent.getUserChoices()).selectPersonalisedAds;
  } catch {
    // Hors Europe, pas de choix TCF : on reste en publicités non personnalisées.
  }
  return { ok: true, nonPersonalized };
}

export type RewardOutcome = 'rewarded' | 'closed' | 'unavailable' | 'no-consent' | 'error';

/** Affiche une vidéo récompensée ; si elle est regardée jusqu'au bout, débloque les exports 24 h. */
export async function watchRewardedVideo(): Promise<RewardOutcome> {
  if (!adsAvailable()) return 'unavailable';
  try {
    const consent = await ensureConsent();
    if (!consent.ok) return 'no-consent';
    const { RewardedAd, RewardedAdEventType, AdEventType, TestIds } = lib();
    const unit = __DEV__ ? TestIds.REWARDED : REWARDED_UNIT;
    if (!unit) return 'unavailable';
    const ad = RewardedAd.createForAdRequest(unit, {
      requestNonPersonalizedAdsOnly: consent.nonPersonalized,
    });
    const outcome = await new Promise<RewardOutcome>((resolve) => {
      let earned = false;
      const timer = setTimeout(() => finish('unavailable'), 15000);
      const subs: (() => void)[] = [];
      function finish(o: RewardOutcome) {
        clearTimeout(timer);
        subs.forEach((u) => u());
        resolve(o);
      }
      subs.push(
        ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
          clearTimeout(timer);
          ad.show().catch(() => finish('unavailable'));
        }),
        ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
          earned = true;
        }),
        ad.addAdEventListener(AdEventType.CLOSED, () => finish(earned ? 'rewarded' : 'closed')),
        ad.addAdEventListener(AdEventType.ERROR, () => finish('unavailable')),
      );
      ad.load();
    });
    if (outcome === 'rewarded') {
      useAppStore.getState().setSettings({ adPassUntil: Date.now() + AD_PASS_MS });
    }
    return outcome;
  } catch {
    return 'error';
  }
}

/** Rouvre le formulaire de confidentialité Google (obligatoire : l'utilisateur peut changer d'avis). */
export async function openAdPrivacyOptions(): Promise<void> {
  if (!adsAvailable()) return;
  const { AdsConsent } = lib();
  await AdsConsent.requestInfoUpdate();
  await AdsConsent.showPrivacyOptionsForm();
}
