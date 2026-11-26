import { StyleSheet, Text, View } from 'react-native';

import { formatNumber, parseDecimal } from '../domain/format';
import { useI18n } from '../i18n';
import { useAppStore } from '../store/store';
import { Button, Field, useDraft } from './kit';
import { Sheet } from './Sheet';
import { useTheme } from './theme';

export const CHARGES_MIN = 0;
export const CHARGES_MAX = 60;
export const CHARGES_STEP = 0.5;

export function clampCharges(v: number): number {
  const stepped = Math.round(v / CHARGES_STEP) * CHARGES_STEP;
  return Math.min(CHARGES_MAX, Math.max(CHARGES_MIN, stepped));
}

/** Réglage des charges salariales (0 à 60 %, pas de 0,5). */
export function ChargesControl() {
  const theme = useTheme();
  const { t, lang } = useI18n();
  const charges = useAppStore((s) => s.settings.charges);
  const setSettings = useAppStore((s) => s.setSettings);
  const { text, setText, reset } = useDraft(charges, (v) => formatNumber(v, lang, 1));
  const commit = (v: number) => setSettings({ charges: clampCharges(v) });
  return (
    <View>
      <View style={styles.row}>
        <Button
          label="−"
          variant="secondary"
          accessibilityLabel={`${t.settings.charges} −0,5`}
          onPress={() => commit(charges - CHARGES_STEP)}
          style={styles.step}
        />
        <View style={{ flex: 1 }}>
          <Field
            testID="charges-input"
            label={`${t.settings.charges} (%)`}
            value={text}
            onChangeText={setText}
            onBlur={() => {
              const v = parseDecimal(text);
              if (v !== null) commit(v);
              reset();
            }}
            keyboardType="decimal-pad"
            maxLength={4}
            style={{ textAlign: 'center' }}
          />
        </View>
        <Button
          label="+"
          variant="secondary"
          accessibilityLabel={`${t.settings.charges} +0,5`}
          onPress={() => commit(charges + CHARGES_STEP)}
          style={styles.step}
        />
      </View>
      <Text style={{ color: theme.textMuted, fontSize: 13 }}>{t.settings.chargesHelp}</Text>
    </View>
  );
}

export function ChargesSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t } = useI18n();
  if (!visible) return null;
  return (
    <Sheet
      visible
      title={t.settings.charges}
      onClose={onClose}
      footer={<Button label={t.common.ok} onPress={onClose} style={{ flex: 1 }} />}
    >
      <ChargesControl />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  step: { width: 56, marginBottom: 12 },
});
