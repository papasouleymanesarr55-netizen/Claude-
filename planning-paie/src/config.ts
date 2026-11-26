import Constants from 'expo-constants';

/**
 * Adresses publiques des documents légaux (GitHub Pages par défaut).
 * À adapter dans app.json > expo.extra si l'adresse change (voir PUBLISH.md).
 */
const extra = (Constants.expoConfig?.extra ?? {}) as { privacyUrl?: string; termsUrl?: string };

export const PRIVACY_URL = extra.privacyUrl ?? 'https://planningpaie.github.io/privacy.html';
export const TERMS_URL = extra.termsUrl ?? 'https://planningpaie.github.io/terms.html';
export const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';
