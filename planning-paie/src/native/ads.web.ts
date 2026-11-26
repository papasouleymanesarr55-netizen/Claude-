// Version web (aperçu navigateur) : AdMob n'existe que sur iOS et Android.
export const ADS_BUILD_ENABLED = false;
export const AD_PASS_MS = 24 * 60 * 60 * 1000;
export type RewardOutcome = 'rewarded' | 'closed' | 'unavailable' | 'no-consent' | 'error';

export function adsAvailable(): boolean {
  return false;
}

export async function watchRewardedVideo(): Promise<RewardOutcome> {
  return 'unavailable';
}

export async function openAdPrivacyOptions(): Promise<void> {}
