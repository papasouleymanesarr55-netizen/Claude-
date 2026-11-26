import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatHours, formatMoney, formatNumber } from '../domain/format';
import { fill, useI18n } from '../i18n';
import { MIN_TOUCH } from './kit';
import { useTheme } from './theme';

interface Props {
  gross: number;
  net: number;
  hours: number;
  daysWorked: number;
  premium: number;
  charges: number;
  onCharges: () => void;
}

export function SummaryCard({ gross, net, hours, daysWorked, premium, charges, onCharges }: Props) {
  const theme = useTheme();
  const { t, lang } = useI18n();
  const hoursText = fill(daysWorked === 1 ? t.summary.hoursOne : t.summary.hours, {
    hours: formatHours(hours, lang),
    days: daysWorked,
  });
  return (
    <View
      testID="summary"
      style={[styles.card, { backgroundColor: theme.accent }]}
      accessible
      accessibilityLabel={`${t.summary.gross} : ${formatMoney(gross, lang)}. ${fill(t.summary.net, {
        amount: formatMoney(net, lang),
      })}. ${hoursText}. ${t.summary.indicative}`}
    >
      <View style={styles.top}>
        <Text style={[styles.caption, { color: theme.onAccent }]}>{t.summary.gross}</Text>
        <Pressable
          testID="charges-button"
          onPress={onCharges}
          accessibilityRole="button"
          accessibilityLabel={fill(t.summary.charges, { percent: formatNumber(charges, lang, 1) })}
          style={({ pressed }) => [styles.charges, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={[styles.chargesText, { color: theme.onAccent }]}>
            {fill(t.summary.charges, { percent: formatNumber(charges, lang, 1) })}
          </Text>
        </Pressable>
      </View>
      <Text
        testID="summary-gross"
        style={[styles.gross, { color: theme.onAccent }]}
        adjustsFontSizeToFit
        numberOfLines={1}
      >
        {formatMoney(gross, lang)}
      </Text>
      <Text testID="summary-net" style={[styles.net, { color: theme.onAccent }]}>
        {fill(t.summary.net, { amount: formatMoney(net, lang) })}
      </Text>
      <Text style={[styles.meta, { color: theme.onAccent }]}>
        {hoursText}
        {premium > 0
          ? ` · ${fill(t.summary.premiumLine, { amount: formatMoney(premium, lang) })}`
          : ''}
      </Text>
      <Text style={[styles.indicative, { color: theme.onAccent }]}>{t.summary.indicative}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 18, padding: 16, marginBottom: 10 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  caption: { flex: 1, fontSize: 14, fontWeight: '600', opacity: 0.95 },
  gross: { fontSize: 36, fontWeight: '800', marginTop: 2 },
  net: { fontSize: 17, fontWeight: '700', marginTop: 4 },
  meta: { fontSize: 14, marginTop: 4, opacity: 0.95 },
  indicative: { fontSize: 11, marginTop: 6, opacity: 0.85 },
  charges: {
    minHeight: MIN_TOUCH,
    paddingHorizontal: 12,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
  },
  chargesText: { fontSize: 13, fontWeight: '700' },
});
