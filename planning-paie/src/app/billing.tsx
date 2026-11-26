import { Redirect } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { parseDecimal } from '../domain/format';
import { useI18n } from '../i18n';
import { selectPremium, useAppStore } from '../store/store';
import { Card, Field } from '../ui/kit';
import { useTheme } from '../ui/theme';

/** Coordonnées de l'émetteur imprimées sur les factures (Premium). */
export default function BillingScreen() {
  const theme = useTheme();
  const { t } = useI18n();
  const premium = useAppStore(selectPremium);
  const issuer = useAppStore((s) => s.billing.issuer);
  const setIssuer = useAppStore((s) => s.setIssuer);
  if (!premium) return <Redirect href="/premium" />;
  return (
    <ScrollView
      testID="billing"
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Card style={styles.card}>
        <Field
          testID="issuer-name"
          label={t.invoice.name}
          value={issuer.name}
          onChangeText={(name) => setIssuer({ name })}
          maxLength={80}
        />
        <Field
          testID="issuer-address"
          label={t.invoice.address}
          value={issuer.address}
          onChangeText={(address) => setIssuer({ address })}
          multiline
          maxLength={300}
          style={styles.multiline}
        />
        <Field
          testID="issuer-siret"
          label={t.invoice.siretField}
          value={issuer.siret}
          onChangeText={(siret) => setIssuer({ siret })}
          keyboardType="number-pad"
          maxLength={20}
        />
        <Field
          label={t.invoice.email}
          value={issuer.email}
          onChangeText={(email) => setIssuer({ email })}
          keyboardType="email-address"
          autoCapitalize="none"
          maxLength={120}
        />
        <Field
          label={t.invoice.phone}
          value={issuer.phone}
          onChangeText={(phone) => setIssuer({ phone })}
          keyboardType="phone-pad"
          maxLength={30}
        />
        <Field
          label={t.invoice.vat}
          value={issuer.vatMention}
          onChangeText={(vatMention) => setIssuer({ vatMention })}
          maxLength={120}
        />
        <Text style={[styles.help, { color: theme.textMuted }]}>{t.invoice.vatHelp}</Text>
        <Field
          label={t.invoice.paymentDays}
          value={String(issuer.paymentDays)}
          onChangeText={(v) => {
            const n = parseDecimal(v);
            if (n !== null && n <= 120) setIssuer({ paymentDays: Math.round(n) });
          }}
          keyboardType="number-pad"
          maxLength={3}
        />
        <Field
          label={t.invoice.ibanField}
          value={issuer.iban}
          onChangeText={(iban) => setIssuer({ iban })}
          autoCapitalize="characters"
          maxLength={40}
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 14, paddingBottom: 48, maxWidth: 720, width: '100%', alignSelf: 'center' },
  card: { paddingTop: 12 },
  multiline: { minHeight: 72, paddingTop: 10, textAlignVertical: 'top' },
  help: { fontSize: 13, lineHeight: 18, marginTop: -6, marginBottom: 12 },
});
