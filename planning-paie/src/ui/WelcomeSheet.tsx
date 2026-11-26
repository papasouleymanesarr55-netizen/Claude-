import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { formatNumber, parseDecimal } from '../domain/format';
import { useI18n } from '../i18n';
import { useAppStore } from '../store/store';
import { Button, Field } from './kit';
import { Sheet } from './Sheet';
import { useTheme } from './theme';

/** Premier lancement : le taux horaire brut est demandé dans la même séquence. */
export function WelcomeSheet() {
  const theme = useTheme();
  const { t, lang } = useI18n();
  const lastRate = useAppStore((s) => s.settings.lastRate);
  const complete = useAppStore((s) => s.completeOnboarding);
  const [rate, setRate] = useState(formatNumber(lastRate, lang));
  const value = parseDecimal(rate);
  const start = () => {
    if (value === null || value > 10000) return;
    complete(value, t.shift.defaults);
  };
  return (
    <Sheet
      visible
      testID="welcome"
      title={t.welcome.title}
      onClose={() => complete(value ?? lastRate, t.shift.defaults)}
      footer={
        <Button
          testID="welcome-start"
          label={t.welcome.start}
          onPress={start}
          disabled={value === null}
          style={{ flex: 1 }}
        />
      }
    >
      <Text style={[styles.text, { color: theme.text }]}>{t.welcome.text}</Text>
      <Field
        testID="welcome-rate"
        label={t.welcome.rate}
        value={rate}
        onChangeText={setRate}
        keyboardType="decimal-pad"
        maxLength={8}
        selectTextOnFocus
        error={value === null}
        onSubmitEditing={start}
      />
      <Text style={[styles.small, { color: theme.textMuted }]}>{t.welcome.privacy}</Text>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  text: { fontSize: 16, lineHeight: 22, marginBottom: 14 },
  small: { fontSize: 13, lineHeight: 18, marginBottom: 8 },
});
