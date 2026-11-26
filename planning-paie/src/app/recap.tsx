import { format } from 'date-fns';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { formatHours, formatMoney } from '../domain/format';
import { recapByEmployer, type EmployerRecap } from '../domain/recap';
import { parseDayKey, toHHMM } from '../domain/time';
import { fill, useI18n } from '../i18n';
import { exportRecapCsv, exportRecapPdf } from '../native/exports';
import { useMonthSummary } from '../store/selectors';
import { selectExportsUnlocked, selectPremium, useAppStore } from '../store/store';
import { InvoiceSheet } from '../ui/InvoiceSheet';
import { useExportGate } from '../ui/UnlockSheet';
import { capitalize } from '../ui/DaySheet';
import { notify } from '../ui/dialogs';
import { Button, Card, Divider, MIN_TOUCH } from '../ui/kit';
import { useTheme } from '../ui/theme';

export default function RecapScreen() {
  const theme = useTheme();
  const { t, lang, locale } = useI18n();
  const params = useLocalSearchParams<{ y?: string; m?: string }>();
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    const y = Number(params.y);
    const m = Number(params.m);
    return Number.isInteger(y) && Number.isInteger(m) && m >= 0 && m <= 11
      ? { year: y, month0: m }
      : { year: now.getFullYear(), month0: now.getMonth() };
  });
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);

  const shifts = useAppStore((s) => s.shifts);
  const days = useAppStore((s) => s.days);
  const charges = useAppStore((s) => s.settings.charges);
  const premium = useAppStore(selectPremium);
  const summary = useMonthSummary(cursor.year, cursor.month0);
  const recap = useMemo(
    () => recapByEmployer(summary, shifts, days, charges, t.day.customShift),
    [summary, shifts, days, charges, t],
  );

  const title = capitalize(
    format(new Date(cursor.year, cursor.month0, 1), 'LLLL yyyy', { locale }),
  );
  const move = (delta: number) => {
    const d = new Date(cursor.year, cursor.month0 + delta, 1, 12);
    setCursor({ year: d.getFullYear(), month0: d.getMonth() });
  };
  const money = (n: number) => formatMoney(n, lang);
  const hours = (n: number) => formatHours(n, lang);
  const named = recap.employers.filter((e) => e.employer).length;
  const dayUnit = useDayUnit();
  const onlyUnnamed = recap.employers.length > 0 && recap.employers.every((e) => !e.employer);

  const gate = useExportGate();
  const exportsUnlocked = useAppStore((s) => selectExportsUnlocked(s));
  const [invoiceFor, setInvoiceFor] = useState<string | null>(null);

  const doExport = (fn: (y: number, m: number) => Promise<void>) =>
    gate.run(() => {
      setBusy(true);
      fn(cursor.year, cursor.month0)
        .catch(() => notify(t.settings.exportError))
        .finally(() => setBusy(false));
    });

  return (
    <ScrollView
      testID="recap"
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={styles.content}
    >
      <View style={styles.monthRow}>
        <Pressable
          testID="recap-prev"
          onPress={() => move(-1)}
          accessibilityRole="button"
          accessibilityLabel={t.month.prev}
          style={styles.arrowBtn}
        >
          <Text style={[styles.arrow, { color: theme.accent }]}>‹</Text>
        </Pressable>
        <Text
          testID="recap-month"
          accessibilityRole="header"
          style={[styles.month, { color: theme.text }]}
        >
          {title}
        </Text>
        <Pressable
          testID="recap-next"
          onPress={() => move(1)}
          accessibilityRole="button"
          accessibilityLabel={t.month.next}
          style={styles.arrowBtn}
        >
          <Text style={[styles.arrow, { color: theme.accent }]}>›</Text>
        </Pressable>
      </View>
      <Text style={[styles.intro, { color: theme.textMuted }]}>{t.recap.intro}</Text>

      {recap.employers.length === 0 ? (
        <Text style={[styles.empty, { color: theme.textMuted }]}>{t.recap.empty}</Text>
      ) : (
        <>
          {recap.employers.map((e) => (
            <EmployerCard
              key={e.employer || '—'}
              recap={e}
              open={!!open[e.employer]}
              onToggle={() => setOpen((o) => ({ ...o, [e.employer]: !o[e.employer] }))}
              locked={!premium}
              onInvoice={() => (premium ? setInvoiceFor(e.employer) : router.push('/premium'))}
            />
          ))}

          <View
            testID="recap-total"
            accessible
            style={[styles.total, { backgroundColor: theme.accent }]}
          >
            <Text style={[styles.totalCaption, { color: theme.onAccent }]}>
              {t.recap.total}
              {named > 1 ? ` · ${fill(t.recap.totalEmployers, { count: named })}` : ''}
            </Text>
            <Text style={[styles.totalGross, { color: theme.onAccent }]}>
              {money(recap.total.gross)}
            </Text>
            <Text style={[styles.totalMeta, { color: theme.onAccent }]}>
              {t.recap.net} ≈ {money(recap.total.net)}
            </Text>
            <Text style={[styles.totalMeta, { color: theme.onAccent }]}>
              {hours(recap.total.hours)} · {dayUnit(recap.total.daysWorked)}
              {recap.total.premium > 0 ? ` · ${t.recap.premium} ${money(recap.total.premium)}` : ''}
            </Text>
            <Text style={[styles.indicative, { color: theme.onAccent }]}>
              {t.summary.indicative}
            </Text>
          </View>

          {onlyUnnamed ? (
            <Text style={[styles.hint, { color: theme.textMuted }]}>{t.recap.noEmployerHint}</Text>
          ) : null}

          <View style={styles.exports}>
            <Button
              testID="recap-pdf"
              label={`${t.recap.exportPdf}${exportsUnlocked ? '' : '  🔒'}`}
              onPress={() => doExport(exportRecapPdf)}
              disabled={busy}
            />
            <Button
              testID="recap-csv"
              label={`${t.recap.exportCsv}${exportsUnlocked ? '' : '  🔒'}`}
              variant="secondary"
              onPress={() => doExport(exportRecapCsv)}
              disabled={busy}
            />
          </View>
        </>
      )}
      {busy ? <ActivityIndicator color={theme.accent} style={{ marginTop: 12 }} /> : null}
      {gate.sheet}
      {invoiceFor !== null ? (
        <InvoiceSheet
          employer={invoiceFor}
          year={cursor.year}
          month0={cursor.month0}
          onClose={() => setInvoiceFor(null)}
        />
      ) : null}
    </ScrollView>
  );
}

function useDayUnit() {
  const { t } = useI18n();
  return (n: number) => (n === 1 ? t.recap.dayUnitOne : fill(t.recap.dayUnit, { count: n }));
}

function EmployerCard({
  recap: e,
  open,
  onToggle,
  locked,
  onInvoice,
}: {
  recap: EmployerRecap;
  open: boolean;
  onToggle: () => void;
  locked: boolean;
  onInvoice: () => void;
}) {
  const theme = useTheme();
  const { t, lang, locale } = useI18n();
  const money = (n: number) => formatMoney(n, lang);
  const hours = (n: number) => formatHours(n, lang);
  const dayUnit = useDayUnit();
  const name = e.employer || t.recap.noEmployer;
  return (
    <Card style={styles.card}>
      <View
        testID={`recap-employer-${name}`}
        accessible
        accessibilityLabel={`${name} : ${hours(e.hours)}, ${dayUnit(e.daysWorked)}, ${t.recap.gross} ${money(e.gross)}, ${t.recap.net} ${money(e.net)}`}
      >
        <View style={styles.cardHead}>
          <Text
            style={[styles.employer, { color: e.employer ? theme.text : theme.textMuted }]}
            numberOfLines={2}
          >
            {name}
          </Text>
          <Text style={[styles.gross, { color: theme.text }]}>{money(e.gross)}</Text>
        </View>
        <Text style={[styles.meta, { color: theme.textMuted }]}>
          {hours(e.hours)} · {dayUnit(e.daysWorked)} · {t.recap.net} ≈ {money(e.net)}
          {e.premium > 0 ? ` · ${t.recap.premium} ${money(e.premium)}` : ''}
        </Text>
      </View>
      <Divider />
      {e.lines.map((l) => (
        <View key={l.label} style={styles.line}>
          <Text style={[styles.lineLabel, { color: theme.text }]}>
            {fill(t.recap.shiftLine, { name: l.label, count: l.count })}
          </Text>
          <Text style={[styles.lineValue, { color: theme.text }]}>
            {hours(l.hours)} · {money(l.gross)}
          </Text>
        </View>
      ))}
      <View style={styles.actions}>
        <Pressable
          onPress={onToggle}
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          style={styles.toggle}
        >
          <Text style={{ color: theme.accent, fontWeight: '600' }}>
            {open ? t.recap.hideDays : t.recap.showDays} ({e.days.length})
          </Text>
        </Pressable>
        <Pressable
          testID={`invoice-${name}`}
          onPress={onInvoice}
          accessibilityRole="button"
          style={[styles.invoiceBtn, { borderColor: theme.accent }]}
        >
          <Text style={{ color: theme.accent, fontWeight: '700' }}>
            {t.invoice.button}
            {locked ? '  🔒' : ''}
          </Text>
        </Pressable>
      </View>
      {open
        ? e.days.map((d) => (
            <View key={d.day.key} style={styles.dayRow}>
              <Text style={[styles.dayDate, { color: theme.text }]}>
                {capitalize(format(parseDayKey(d.day.key), 'EEE d', { locale }))}
              </Text>
              <Text style={[styles.dayShift, { color: theme.textMuted }]} numberOfLines={1}>
                {d.day.shift?.name ?? t.day.customShift} · {toHHMM(d.day.start)}–{toHHMM(d.day.end)}
              </Text>
              <Text style={[styles.dayValue, { color: theme.text }]}>
                {hours(d.hours)} · {money(d.gross)}
              </Text>
            </View>
          ))
        : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  content: { padding: 14, paddingBottom: 48, maxWidth: 720, width: '100%', alignSelf: 'center' },
  monthRow: { flexDirection: 'row', alignItems: 'center' },
  arrowBtn: {
    minWidth: MIN_TOUCH,
    minHeight: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: { fontSize: 34, fontWeight: '600', lineHeight: 38 },
  month: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '800' },
  intro: { textAlign: 'center', fontSize: 14, marginBottom: 12 },
  empty: { textAlign: 'center', fontSize: 16, marginTop: 40 },
  card: { marginBottom: 12, paddingVertical: 12 },
  cardHead: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  employer: { flex: 1, fontSize: 18, fontWeight: '800' },
  gross: { fontSize: 20, fontWeight: '800' },
  meta: { fontSize: 14, marginTop: 4, marginBottom: 10 },
  line: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, gap: 8 },
  lineLabel: { fontSize: 15, flex: 1 },
  lineValue: { fontSize: 15, fontWeight: '600' },
  toggle: { minHeight: MIN_TOUCH, justifyContent: 'center' },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  invoiceBtn: {
    minHeight: MIN_TOUCH,
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1.5,
    justifyContent: 'center',
  },
  dayRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, gap: 8 },
  dayDate: { width: 56, fontSize: 14, fontWeight: '600' },
  dayShift: { flex: 1, fontSize: 13 },
  dayValue: { fontSize: 14 },
  total: { borderRadius: 18, padding: 16, marginTop: 4 },
  totalCaption: { fontSize: 14, fontWeight: '700' },
  totalGross: { fontSize: 32, fontWeight: '800', marginTop: 2 },
  totalMeta: { fontSize: 15, marginTop: 4, fontWeight: '600' },
  indicative: { fontSize: 11, marginTop: 6, opacity: 0.85 },
  hint: { fontSize: 13, lineHeight: 18, marginTop: 12, textAlign: 'center' },
  exports: { gap: 10, marginTop: 16 },
});
