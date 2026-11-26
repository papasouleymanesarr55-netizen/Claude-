import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { parseBackup } from '../domain/backup';
import { APP_VERSION } from '../config';
import { fill, useI18n } from '../i18n';
import { requestCalendarPermission, syncCalendar } from '../native/calendarSync';
import { exportCsv, exportJson, exportPdf } from '../native/exports';
import { pickTextFile } from '../native/files';
import { isSimulated, restore } from '../native/purchases';
import { requestReminderPermission, rescheduleReminders } from '../native/reminders';
import {
  selectPremium,
  useAppStore,
  type ReminderSetting,
  type ThemeSetting,
} from '../store/store';
import { ChargesControl } from '../ui/ChargesSheet';
import { confirmAsync, notify } from '../ui/dialogs';
import { Card, Divider, Row, SectionTitle, Segmented, SwitchRow } from '../ui/kit';
import { useTheme } from '../ui/theme';

export default function SettingsScreen() {
  const theme = useTheme();
  const { t } = useI18n();
  const settings = useAppStore((s) => s.settings);
  const premium = useAppStore(selectPremium);
  const rulesEnabled = useAppStore((s) => s.rules.enabled);
  const setSettings = useAppStore((s) => s.setSettings);
  const [busy, setBusy] = useState(false);

  const now = new Date();
  const year = now.getFullYear();
  const month0 = now.getMonth();

  const requirePremium = (fn: () => void | Promise<void>) => () => {
    if (!premium) {
      router.push('/premium');
      return;
    }
    void fn();
  };

  const run = async (fn: () => Promise<void>, errorMessage: string) => {
    setBusy(true);
    try {
      await fn();
    } catch {
      notify(errorMessage);
    } finally {
      setBusy(false);
    }
  };

  const toggleSync = async (on: boolean) => {
    if (!premium) return router.push('/premium');
    if (!on) return setSettings({ syncCal: false });
    if (!(await requestCalendarPermission())) return notify(t.settings.syncDenied);
    setSettings({ syncCal: true });
    await syncNow();
  };

  const syncNow = async () => {
    setBusy(true);
    const res = await syncCalendar();
    setBusy(false);
    if (res.ok) notify(fill(t.settings.syncDone, { count: res.count }));
    else notify(res.reason === 'denied' ? t.settings.syncDenied : t.settings.syncError);
  };

  const setReminder = async (value: ReminderSetting) => {
    if (!premium) return router.push('/premium');
    if (value > 0 && !(await requestReminderPermission())) {
      notify(t.settings.reminderDenied);
      return;
    }
    setSettings({ reminder: value });
    void rescheduleReminders().catch(() => undefined);
  };

  const importBackup = async () => {
    let text: string | null;
    try {
      text = await pickTextFile();
    } catch {
      return notify(t.settings.importErrors.read);
    }
    if (text === null) return;
    const res = parseBackup(text);
    if (!res.ok) return notify(t.settings.importErrors[res.error]);
    const ok = await confirmAsync(
      t.settings.importTitle,
      fill(t.settings.importMessage, {
        shifts: res.data.shifts.length,
        days: Object.keys(res.data.days).length,
      }),
      t.common.ok,
      t.common.cancel,
      true,
    );
    if (!ok) return;
    useAppStore.getState().replaceAll(res.data);
    notify(
      t.settings.importDone,
      res.skippedDays ? fill(t.settings.importSkipped, { count: res.skippedDays }) : undefined,
    );
  };

  const resetAll = async () => {
    const ok = await confirmAsync(
      t.settings.resetTitle,
      t.settings.resetMessage,
      t.common.delete,
      t.common.cancel,
      true,
    );
    if (ok) {
      useAppStore.getState().resetAll();
      router.back();
    }
  };

  const doRestore = async () => {
    setBusy(true);
    const r = await restore();
    setBusy(false);
    notify(
      r === 'restored'
        ? t.settings.restoreDone
        : r === 'none'
          ? t.settings.restoreNone
          : r === 'offline'
            ? t.paywall.offline
            : t.paywall.error,
    );
  };

  const nativeOnly = Platform.OS !== 'web';

  return (
    <ScrollView
      testID="settings"
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={styles.content}
    >
      <SectionTitle>{t.settings.pay}</SectionTitle>
      <Card style={styles.pad}>
        <ChargesControl />
      </Card>
      <Card style={styles.gap}>
        <Row
          testID="open-rules"
          label={t.settings.advanced}
          detail={t.settings.advancedHelp}
          locked={!premium}
          onPress={() => router.push(premium ? '/rules' : '/premium')}
          right={
            <Text style={{ color: theme.textMuted }}>{premium && rulesEnabled ? '✓' : '›'}</Text>
          }
        />
      </Card>

      {nativeOnly ? (
        <>
          <SectionTitle>{t.settings.calendar}</SectionTitle>
          <Card>
            <SwitchRow
              label={t.settings.syncCal}
              value={premium && settings.syncCal}
              onChange={(v) => void toggleSync(v)}
              locked={!premium}
            />
            {premium && settings.syncCal ? (
              <>
                <Divider />
                <Row label={t.settings.syncNow} onPress={() => void syncNow()} />
              </>
            ) : null}
            <Divider />
            <Row label={t.settings.reminder} locked={!premium} />
            <Segmented<ReminderSetting>
              label={t.settings.reminder}
              value={premium ? settings.reminder : 0}
              onChange={(v) => void setReminder(v)}
              options={[
                { value: 0, label: t.settings.reminderNone },
                { value: 30, label: t.settings.reminder30 },
                { value: 60, label: t.settings.reminder60 },
                { value: 120, label: t.settings.reminder120 },
              ]}
            />
          </Card>
        </>
      ) : null}

      <SectionTitle>{t.settings.data}</SectionTitle>
      <Card>
        <Row
          testID="export-json"
          label={t.settings.export}
          onPress={() => void run(() => exportJson(), t.settings.exportError)}
        />
        <Divider />
        <Row testID="import-json" label={t.settings.import} onPress={() => void importBackup()} />
        <Divider />
        <Row
          label={t.settings.exportPdf}
          locked={!premium}
          onPress={requirePremium(() => run(() => exportPdf(year, month0), t.settings.exportError))}
        />
        <Divider />
        <Row
          label={t.settings.exportCsv}
          locked={!premium}
          onPress={requirePremium(() => run(() => exportCsv(year, month0), t.settings.exportError))}
        />
        <Divider />
        <Row label={t.settings.reset} danger onPress={() => void resetAll()} />
      </Card>

      <SectionTitle>{t.settings.appearance}</SectionTitle>
      <Card>
        <Row label={t.settings.theme} />
        <Segmented<ThemeSetting>
          label={t.settings.theme}
          value={settings.theme}
          onChange={(theme) => setSettings({ theme })}
          options={[
            { value: 'system', label: t.settings.themeSystem },
            { value: 'light', label: t.settings.themeLight },
            { value: 'dark', label: t.settings.themeDark },
          ]}
        />
        <Divider />
        <Row label={t.settings.language} />
        <Segmented<'system' | 'fr' | 'en'>
          label={t.settings.language}
          value={settings.language}
          onChange={(language) => setSettings({ language })}
          options={[
            { value: 'system', label: t.settings.languageSystem },
            { value: 'fr', label: 'Français' },
            { value: 'en', label: 'English' },
          ]}
        />
      </Card>

      <SectionTitle>{t.settings.premium}</SectionTitle>
      <Card>
        {premium ? (
          <Row label={t.settings.premiumActive} />
        ) : (
          <Row
            testID="open-premium"
            label={t.settings.premiumCta}
            onPress={() => router.push('/premium')}
          />
        )}
        <Divider />
        <Row label={t.settings.restore} onPress={() => void doRestore()} />
        {__DEV__ && isSimulated() ? (
          <>
            <Divider />
            <SwitchRow
              testID="dev-premium"
              label={t.settings.devPremium}
              value={settings.devPremium}
              onChange={(devPremium) => setSettings({ devPremium })}
            />
          </>
        ) : null}
      </Card>

      <SectionTitle>{t.settings.about}</SectionTitle>
      <Card>
        <Row
          label={t.settings.privacy}
          onPress={() => router.push({ pathname: '/legal', params: { doc: 'privacy' } })}
        />
        <Divider />
        <Row
          label={t.settings.terms}
          onPress={() => router.push({ pathname: '/legal', params: { doc: 'terms' } })}
        />
        <Divider />
        <Row label={fill(t.settings.version, { version: APP_VERSION })} />
      </Card>
      <Text style={[styles.disclaimer, { color: theme.textMuted }]}>{t.settings.disclaimer}</Text>

      {busy ? (
        <View style={styles.busy} pointerEvents="none">
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 14, paddingBottom: 48, maxWidth: 720, width: '100%', alignSelf: 'center' },
  pad: { paddingVertical: 12 },
  gap: { marginTop: 10 },
  disclaimer: { fontSize: 12, marginTop: 16, lineHeight: 17, textAlign: 'center' },
  busy: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
});
