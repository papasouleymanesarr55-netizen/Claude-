import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useI18n } from '../i18n';
import { adsAvailable, watchRewardedVideo } from '../native/ads';
import { selectExportsUnlocked, useAppStore } from '../store/store';
import { notify } from './dialogs';
import { Button } from './kit';
import { Sheet } from './Sheet';
import { useTheme } from './theme';

/** Choix proposé à la version gratuite : vidéo (exports 24 h) ou Premium. */
function UnlockSheet({ onClose, onUnlocked }: { onClose: () => void; onUnlocked: () => void }) {
  const theme = useTheme();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);

  const watch = async () => {
    setLoading(true);
    const outcome = await watchRewardedVideo();
    setLoading(false);
    if (outcome === 'rewarded') {
      notify(t.ads.rewarded);
      onUnlocked();
      return;
    }
    notify(
      outcome === 'closed'
        ? t.ads.notFinished
        : outcome === 'no-consent'
          ? t.ads.noConsent
          : t.ads.unavailable,
    );
  };

  return (
    <Sheet visible testID="unlock-sheet" title={t.ads.unlockTitle} onClose={onClose}>
      <Text style={[styles.text, { color: theme.text }]}>{t.ads.unlockText}</Text>
      <View style={styles.buttons}>
        <Button
          testID="unlock-video"
          label={t.ads.watch}
          onPress={() => void watch()}
          disabled={loading}
        />
        <Button
          testID="unlock-premium"
          label={t.ads.goPremium}
          variant="secondary"
          onPress={() => {
            onClose();
            router.push('/premium');
          }}
        />
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={theme.accent} />
            <Text style={{ color: theme.textMuted }}>{t.ads.loading}</Text>
          </View>
        ) : null}
      </View>
    </Sheet>
  );
}

/**
 * Protège un export : l'exécute si Premium (ou débloqué par vidéo), sinon propose la vidéo
 * (si les publicités sont activées) ou l'écran Premium.
 */
export function useExportGate(): { run: (fn: () => void) => void; sheet: ReactNode } {
  const [pending, setPending] = useState<(() => void) | null>(null);
  const run = (fn: () => void) => {
    if (selectExportsUnlocked(useAppStore.getState())) fn();
    else if (adsAvailable()) setPending(() => fn);
    else router.push('/premium');
  };
  const sheet = pending ? (
    <UnlockSheet
      onClose={() => setPending(null)}
      onUnlocked={() => {
        const fn = pending;
        setPending(null);
        fn();
      }}
    />
  ) : null;
  return { run, sheet };
}

const styles = StyleSheet.create({
  text: { fontSize: 16, lineHeight: 22, marginBottom: 14 },
  buttons: { gap: 10, paddingBottom: 8 },
  loading: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
});
