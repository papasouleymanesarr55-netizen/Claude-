import { Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  PACKAGE_TYPE,
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesPackage,
} from 'react-native-purchases';

import { useAppStore } from '../store/store';

/** Identifiant du droit d'accès configuré dans RevenueCat. */
export const ENTITLEMENT_ID = 'premium';

/** Identifiants des produits à créer dans App Store Connect et Google Play Console. */
export const PRODUCT_IDS = {
  monthly: 'planningpaie_premium_monthly',
  annual: 'planningpaie_premium_annual',
  lifetime: 'planningpaie_premium_lifetime',
} as const;

const IOS_KEY = process.env.EXPO_PUBLIC_RC_IOS_KEY ?? '';
const ANDROID_KEY = process.env.EXPO_PUBLIC_RC_ANDROID_KEY ?? '';

function apiKey(): string {
  if (Platform.OS === 'ios') return IOS_KEY;
  if (Platform.OS === 'android') return ANDROID_KEY;
  return '';
}

/** Mode simulé : pas de clé RevenueCat (développement, web, tests). */
export function isSimulated(): boolean {
  return !apiKey();
}

let initialized = false;

function applyCustomerInfo(info: CustomerInfo): boolean {
  const active = info.entitlements.active[ENTITLEMENT_ID] !== undefined;
  useAppStore.getState().setSettings({ premium: active });
  return active;
}

/** Configure RevenueCat une fois au démarrage, puis suit les changements d'abonnement. */
export async function initPurchases(): Promise<void> {
  if (initialized || isSimulated()) return;
  initialized = true;
  try {
    if (__DEV__) await Purchases.setLogLevel(LOG_LEVEL.WARN);
    Purchases.configure({ apiKey: apiKey() });
    Purchases.addCustomerInfoUpdateListener(applyCustomerInfo);
    applyCustomerInfo(await Purchases.getCustomerInfo());
  } catch {
    // Hors-ligne : on garde le dernier état connu (settings.premium).
  }
}

export type PlanKind = 'monthly' | 'annual' | 'lifetime';

export interface Plan {
  kind: PlanKind;
  price: string;
  trialDays?: number;
  pkg?: PurchasesPackage;
}

function kindOf(p: PurchasesPackage): PlanKind | null {
  if (p.packageType === PACKAGE_TYPE.MONTHLY) return 'monthly';
  if (p.packageType === PACKAGE_TYPE.ANNUAL) return 'annual';
  if (p.packageType === PACKAGE_TYPE.LIFETIME) return 'lifetime';
  return null;
}

function trialDays(p: PurchasesPackage): number | undefined {
  const intro = p.product.introPrice;
  if (!intro || intro.price !== 0) return undefined;
  const unit = intro.periodUnit;
  const n = intro.periodNumberOfUnits * intro.cycles;
  if (unit === 'DAY') return n;
  if (unit === 'WEEK') return n * 7;
  if (unit === 'MONTH') return n * 30;
  return undefined;
}

/** Offres simulées, affichées sans compte RevenueCat (prix par défaut du projet). */
const SIMULATED_PLANS: Plan[] = [
  { kind: 'monthly', price: '1,99 €' },
  { kind: 'annual', price: '9,99 €', trialDays: 7 },
  { kind: 'lifetime', price: '19,99 €' },
];

export type LoadPlansResult =
  { ok: true; plans: Plan[] } | { ok: false; reason: 'offline' | 'empty' };

export async function loadPlans(): Promise<LoadPlansResult> {
  if (isSimulated())
    return __DEV__ ? { ok: true, plans: SIMULATED_PLANS } : { ok: false, reason: 'empty' };
  try {
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    if (!current) return { ok: false, reason: 'empty' };
    const plans: Plan[] = [];
    for (const p of current.availablePackages) {
      const kind = kindOf(p);
      if (kind) plans.push({ kind, price: p.product.priceString, trialDays: trialDays(p), pkg: p });
    }
    const order: PlanKind[] = ['annual', 'monthly', 'lifetime'];
    plans.sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind));
    return plans.length ? { ok: true, plans } : { ok: false, reason: 'empty' };
  } catch {
    return { ok: false, reason: 'offline' };
  }
}

export type PurchaseOutcome = 'success' | 'cancelled' | 'pending' | 'offline' | 'error';

function errorOutcome(e: unknown): PurchaseOutcome {
  const code = (e as { code?: string } | null)?.code;
  if (code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) return 'cancelled';
  if (code === PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR) return 'pending';
  if (
    code === PURCHASES_ERROR_CODE.NETWORK_ERROR ||
    code === PURCHASES_ERROR_CODE.OFFLINE_CONNECTION_ERROR
  )
    return 'offline';
  return 'error';
}

export async function purchase(plan: Plan): Promise<PurchaseOutcome> {
  if (isSimulated()) {
    if (!__DEV__) return 'error';
    useAppStore.getState().setSettings({ devPremium: true });
    return 'success';
  }
  if (!plan.pkg) return 'error';
  try {
    const { customerInfo } = await Purchases.purchasePackage(plan.pkg);
    return applyCustomerInfo(customerInfo) ? 'success' : 'pending';
  } catch (e) {
    return errorOutcome(e);
  }
}

export type RestoreOutcome = 'restored' | 'none' | 'offline' | 'error';

export async function restore(): Promise<RestoreOutcome> {
  if (isSimulated()) return useAppStore.getState().settings.devPremium ? 'restored' : 'none';
  try {
    const info = await Purchases.restorePurchases();
    return applyCustomerInfo(info) ? 'restored' : 'none';
  } catch (e) {
    return errorOutcome(e) === 'offline' ? 'offline' : 'error';
  }
}
