import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { fill, useI18n } from '../i18n';
import {
  isSimulated,
  loadPlans,
  purchase,
  restore,
  type LoadPlansResult,
  type Plan,
} from '../native/purchases';
import { selectPremium, useAppStore } from '../store/store';
import { notify } from '../ui/dialogs';
import { Button, MIN_TOUCH } from '../ui/kit';
import { useTheme } from '../ui/theme';

type Status = 'loading' | 'ready' | 'offline' | 'empty';

export default function PremiumScreen() {
  const theme = useTheme();
  const { t } = useI18n();
  const premium = useAppStore(selectPremium);
  const [status, setStatus] = useState<Status>('loading');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [chosen, setChosen] = useState<Plan['kind']>('annual');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const apply = useCallback((res: LoadPlansResult) => {
    if (res.ok) {
      setPlans(res.plans);
      setChosen(res.plans.find((p) => p.kind === 'annual')?.kind ?? res.plans[0]!.kind);
      setStatus('ready');
    } else {
      setStatus(res.reason);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    void loadPlans().then((res) => alive && apply(res));
    return () => {
      alive = false;
    };
  }, [apply]);

  const load = () => {
    setStatus('loading');
    void loadPlans().then(apply);
  };

  const store = Platform.OS === 'ios' ? 'Apple' : 'Google Play';
  const plan = plans.find((p) => p.kind === chosen);

  const buy = async () => {
    if (!plan) return;
    setBusy(true);
    setMessage(null);
    const outcome = await purchase(plan);
    setBusy(false);
    if (outcome === 'success') {
      notify(t.paywall.success);
      router.back();
    } else if (outcome === 'pending') setMessage(t.paywall.pending);
    else if (outcome === 'offline') setMessage(t.paywall.offline);
    else if (outcome === 'error') setMessage(t.paywall.error);
  };

  const doRestore = async () => {
    setBusy(true);
    const r = await restore();
    setBusy(false);
    if (r === 'restored') {
      notify(t.settings.restoreDone);
      router.back();
    } else
      setMessage(
        r === 'none'
          ? t.settings.restoreNone
          : r === 'offline'
            ? t.paywall.offline
            : t.paywall.error,
      );
  };

  const planTitle = (p: Plan) =>
    p.kind === 'monthly'
      ? t.paywall.monthly
      : p.kind === 'annual'
        ? t.paywall.annual
        : t.paywall.lifetime;
  const planPrice = (p: Plan) =>
    fill(
      p.kind === 'monthly'
        ? t.paywall.perMonth
        : p.kind === 'annual'
          ? t.paywall.perYear
          : t.paywall.once,
      { price: p.price },
    );

  return (
    <ScrollView
      testID="paywall"
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={styles.content}
    >
      <Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>
        {t.paywall.title}
      </Text>
      <Text style={[styles.subtitle, { color: theme.textMuted }]}>{t.paywall.subtitle}</Text>
      {t.paywall.features.map((f) => (
        <Text key={f} style={[styles.feature, { color: theme.text }]}>
          ✓ {f}
        </Text>
      ))}

      {premium ? (
        <Text style={[styles.info, { color: theme.success }]}>{t.paywall.already}</Text>
      ) : status === 'loading' ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.accent} />
          <Text style={{ color: theme.textMuted, marginTop: 8 }}>{t.paywall.loading}</Text>
        </View>
      ) : status === 'offline' || status === 'empty' ? (
        <View style={styles.center}>
          <Text style={[styles.info, { color: theme.text }]}>
            {status === 'offline' ? t.paywall.offline : t.paywall.unavailable}
          </Text>
          <Button label={t.common.retry} variant="secondary" onPress={load} />
        </View>
      ) : (
        <View accessibilityRole="radiogroup" style={styles.plans}>
          {plans.map((p) => {
            const active = p.kind === chosen;
            return (
              <Pressable
                key={p.kind}
                testID={`plan-${p.kind}`}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${planTitle(p)}, ${planPrice(p)}${
                  p.trialDays ? `, ${fill(t.paywall.trial, { days: p.trialDays })}` : ''
                }`}
                onPress={() => setChosen(p.kind)}
                style={[
                  styles.plan,
                  {
                    backgroundColor: active ? theme.accentSoft : theme.surface,
                    borderColor: active ? theme.accent : theme.border,
                  },
                ]}
              >
                <Text style={[styles.planTitle, { color: theme.text }]}>{planTitle(p)}</Text>
                <Text style={[styles.planPrice, { color: theme.text }]}>{planPrice(p)}</Text>
                {p.trialDays ? (
                  <Text style={{ color: theme.success, fontWeight: '600' }}>
                    {fill(t.paywall.trial, { days: p.trialDays })}
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
          <Button
            testID="buy"
            label={t.paywall.subscribe}
            onPress={() => void buy()}
            disabled={busy || !plan}
            style={{ marginTop: 6 }}
          />
        </View>
      )}

      {message ? (
        <Text accessibilityLiveRegion="polite" style={[styles.info, { color: theme.text }]}>
          {message}
        </Text>
      ) : null}

      <Button
        label={t.paywall.restore}
        variant="ghost"
        onPress={() => void doRestore()}
        disabled={busy}
      />
      <Text style={[styles.small, { color: theme.textMuted }]}>
        {fill(t.paywall.renewal, { store })}
      </Text>
      {isSimulated() && __DEV__ ? (
        <Text style={[styles.small, { color: theme.danger }]}>{t.paywall.simulated}</Text>
      ) : null}
      <View style={styles.links}>
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push({ pathname: '/legal', params: { doc: 'privacy' } })}
          style={styles.link}
        >
          <Text style={{ color: theme.accent }}>{t.settings.privacy}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push({ pathname: '/legal', params: { doc: 'terms' } })}
          style={styles.link}
        >
          <Text style={{ color: theme.accent }}>{t.settings.terms}</Text>
        </Pressable>
      </View>
      {busy ? <ActivityIndicator style={{ marginTop: 8 }} color={theme.accent} /> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 48, maxWidth: 560, width: '100%', alignSelf: 'center' },
  title: { fontSize: 26, fontWeight: '800', marginBottom: 6 },
  subtitle: { fontSize: 15, marginBottom: 14, lineHeight: 21 },
  feature: { fontSize: 16, marginBottom: 8, lineHeight: 22 },
  center: { alignItems: 'center', paddingVertical: 20, gap: 10 },
  plans: { gap: 10, marginTop: 16 },
  plan: { borderWidth: 2, borderRadius: 14, padding: 14, minHeight: MIN_TOUCH },
  planTitle: { fontSize: 16, fontWeight: '700' },
  planPrice: { fontSize: 18, fontWeight: '600', marginTop: 2 },
  info: { fontSize: 15, textAlign: 'center', marginVertical: 12, lineHeight: 21 },
  small: { fontSize: 12, lineHeight: 17, marginTop: 10, textAlign: 'center' },
  links: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 10 },
  link: { minHeight: MIN_TOUCH, justifyContent: 'center' },
});
