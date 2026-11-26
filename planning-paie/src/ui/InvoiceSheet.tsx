import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { nextInvoiceNumber } from '../domain/invoice';
import { useI18n } from '../i18n';
import { exportDocument, issuerComplete, type DocKind } from '../native/invoice';
import { useAppStore } from '../store/store';
import { notify } from './dialogs';
import { Button, Field, Segmented } from './kit';
import { Sheet } from './Sheet';
import { useTheme } from './theme';

interface Props {
  employer: string;
  year: number;
  month0: number;
  onClose: () => void;
}

/** Relevé d'heures (salarié) ou facture (indépendant) pour une entreprise et un mois (Premium). */
export function InvoiceSheet({ employer, year, month0, onClose }: Props) {
  const theme = useTheme();
  const { t } = useI18n();
  const billing = useAppStore((s) => s.billing);
  const [kind, setKind] = useState<DocKind>('statement');
  const [address, setAddress] = useState(billing.clients[employer]?.address ?? '');
  const [number, setNumber] = useState(() => nextInvoiceNumber(billing.counter));
  const [busy, setBusy] = useState(false);
  const missing = kind === 'invoice' && !issuerComplete(billing.issuer);

  const create = async () => {
    setBusy(true);
    try {
      await exportDocument({
        kind,
        employer,
        year,
        month0,
        number: number.trim(),
        clientAddress: address.trim(),
        issueDate: new Date(),
      });
      onClose();
    } catch {
      notify(t.settings.exportError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      visible
      testID="invoice-sheet"
      title={`${t.invoice.title} · ${employer || t.recap.noEmployer}`}
      onClose={onClose}
      footer={
        <Button
          testID="invoice-create"
          label={t.invoice.generate}
          onPress={() => void create()}
          disabled={busy || missing || (kind === 'invoice' && !number.trim())}
          style={{ flex: 1 }}
        />
      }
    >
      <Segmented<DocKind>
        label={t.invoice.title}
        value={kind}
        onChange={setKind}
        options={[
          { value: 'statement', label: t.invoice.typeStatement },
          { value: 'invoice', label: t.invoice.typeInvoice },
        ]}
      />
      <Text style={[styles.help, { color: theme.textMuted }]}>
        {kind === 'statement' ? t.invoice.statementHelp : t.invoice.invoiceHelp}
      </Text>
      <Field
        testID="invoice-address"
        label={t.invoice.clientAddress}
        value={address}
        onChangeText={setAddress}
        placeholder={t.invoice.clientAddressPlaceholder}
        multiline
        maxLength={300}
        style={styles.multiline}
      />
      {kind === 'invoice' ? (
        <>
          <Field
            testID="invoice-number"
            label={t.invoice.number}
            value={number}
            onChangeText={setNumber}
            maxLength={20}
          />
          <Text style={[styles.help, { color: theme.textMuted }]}>{t.invoice.numberHelp}</Text>
          {missing ? (
            <View style={[styles.warn, { borderColor: theme.danger }]}>
              <Text style={{ color: theme.text, marginBottom: 8 }}>{t.invoice.missingIssuer}</Text>
              <Button
                testID="invoice-complete-issuer"
                label={t.invoice.completeIssuer}
                variant="secondary"
                onPress={() => {
                  onClose();
                  router.push('/billing');
                }}
              />
            </View>
          ) : null}
        </>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  help: { fontSize: 13, lineHeight: 18, marginBottom: 12 },
  multiline: { minHeight: 72, paddingTop: 10, textAlignVertical: 'top' },
  warn: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 8 },
});
