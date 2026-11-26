import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { formatNumber, parseDecimal } from '../domain/format';
import { isDayKey, normalizeTimeInput, toHHMM } from '../domain/time';
import type { PayRules } from '../domain/types';
import { useI18n } from '../i18n';
import { selectPremium, useAppStore } from '../store/store';
import {
  Button,
  Card,
  Divider,
  Field,
  FieldRow,
  SectionTitle,
  Segmented,
  SwitchRow,
  useDraft,
} from '../ui/kit';
import { useTheme } from '../ui/theme';

/** Champ numérique validé à la sortie (bornes incluses). */
function NumberField({
  label,
  value,
  min,
  max,
  onCommit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onCommit: (v: number) => void;
}) {
  const { lang } = useI18n();
  const { text, setText, reset } = useDraft(value, (v) => formatNumber(v, lang));
  const parsed = parseDecimal(text);
  const valid = parsed !== null && parsed >= min && parsed <= max;
  return (
    <Field
      label={label}
      value={text}
      onChangeText={setText}
      error={!valid}
      keyboardType="decimal-pad"
      maxLength={6}
      selectTextOnFocus
      onBlur={() => {
        if (valid) onCommit(parsed);
        reset();
      }}
    />
  );
}

function TimeCommitField({
  label,
  value,
  onCommit,
}: {
  label: string;
  value: number;
  onCommit: (v: number) => void;
}) {
  const { text, setText, reset } = useDraft(value, toHHMM);
  const parsed = normalizeTimeInput(text);
  return (
    <Field
      label={label}
      value={text}
      onChangeText={setText}
      error={parsed === null}
      maxLength={5}
      selectTextOnFocus
      onBlur={() => {
        if (parsed !== null) onCommit(parsed);
        reset();
      }}
    />
  );
}

export default function RulesScreen() {
  const theme = useTheme();
  const { t } = useI18n();
  const premium = useAppStore(selectPremium);
  const rules = useAppStore((s) => s.rules);
  const setRules = useAppStore((s) => s.setRules);
  const [newHoliday, setNewHoliday] = useState('');

  if (!premium) return <Redirect href="/premium" />;

  const ot = (patch: Partial<PayRules['overtime']>) =>
    setRules({ overtime: { ...rules.overtime, ...patch } });
  const night = (patch: Partial<PayRules['night']>) =>
    setRules({ night: { ...rules.night, ...patch } });

  const addHoliday = () => {
    const key = newHoliday.trim();
    if (!isDayKey(key) || rules.extraHolidays.includes(key)) return;
    setRules({ extraHolidays: [...rules.extraHolidays, key].sort() });
    setNewHoliday('');
  };

  return (
    <ScrollView
      testID="rules"
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Card>
        <SwitchRow
          testID="rules-enabled"
          label={t.rules.enabled}
          value={rules.enabled}
          onChange={(enabled) => setRules({ enabled })}
        />
      </Card>
      <Text style={[styles.warning, { color: theme.textMuted }]}>{t.rules.warning}</Text>

      <View
        style={{ opacity: rules.enabled ? 1 : 0.5 }}
        pointerEvents={rules.enabled ? 'auto' : 'none'}
      >
        <SectionTitle>{t.rules.overtime}</SectionTitle>
        <Card style={styles.pad}>
          <SwitchRow
            label={t.rules.overtimeEnabled}
            value={rules.overtime.enabled}
            onChange={(enabled) => ot({ enabled })}
          />
          <FieldRow>
            <NumberField
              label={t.rules.threshold}
              value={rules.overtime.weeklyThreshold}
              min={0}
              max={168}
              onCommit={(weeklyThreshold) => ot({ weeklyThreshold })}
            />
            <NumberField
              label={t.rules.tier1Hours}
              value={rules.overtime.tier1Hours}
              min={0}
              max={168}
              onCommit={(tier1Hours) => ot({ tier1Hours })}
            />
          </FieldRow>
          <FieldRow>
            <NumberField
              label={t.rules.tier1Rate}
              value={rules.overtime.tier1Rate}
              min={0}
              max={500}
              onCommit={(tier1Rate) => ot({ tier1Rate })}
            />
            <NumberField
              label={t.rules.tier2Rate}
              value={rules.overtime.tier2Rate}
              min={0}
              max={500}
              onCommit={(tier2Rate) => ot({ tier2Rate })}
            />
          </FieldRow>
        </Card>

        <SectionTitle>{t.rules.night}</SectionTitle>
        <Card style={styles.pad}>
          <NumberField
            label={t.rules.nightRate}
            value={rules.night.rate}
            min={0}
            max={500}
            onCommit={(rate) => night({ rate })}
          />
          <FieldRow>
            <TimeCommitField
              label={t.rules.nightStart}
              value={rules.night.start}
              onCommit={(start) => night({ start })}
            />
            <TimeCommitField
              label={t.rules.nightEnd}
              value={rules.night.end}
              onCommit={(end) => night({ end })}
            />
          </FieldRow>
          <FieldRow>
            <NumberField
              label={t.rules.sundayRate}
              value={rules.sundayRate}
              min={0}
              max={500}
              onCommit={(sundayRate) => setRules({ sundayRate })}
            />
            <NumberField
              label={t.rules.holidayRate}
              value={rules.holidayRate}
              min={0}
              max={500}
              onCommit={(holidayRate) => setRules({ holidayRate })}
            />
          </FieldRow>
        </Card>

        <SectionTitle>{t.rules.stacking}</SectionTitle>
        <Card>
          <Segmented<PayRules['stacking']>
            label={t.rules.stacking}
            value={rules.stacking}
            onChange={(stacking) => setRules({ stacking })}
            options={[
              { value: 'max', label: t.rules.stackMax },
              { value: 'sum', label: t.rules.stackSum },
            ]}
          />
        </Card>

        <SectionTitle>{t.rules.holidays}</SectionTitle>
        <Card style={styles.pad}>
          <SwitchRow
            label={t.rules.alsace}
            value={rules.alsaceMoselle}
            onChange={(alsaceMoselle) => setRules({ alsaceMoselle })}
          />
          <Divider />
          <View style={[styles.row, { alignItems: 'flex-end', marginTop: 8 }]}>
            <View style={{ flex: 1 }}>
              <Field
                label={t.rules.extra}
                value={newHoliday}
                onChangeText={setNewHoliday}
                placeholder={t.rules.extraPlaceholder}
                maxLength={10}
                error={newHoliday.length === 10 && !isDayKey(newHoliday)}
              />
            </View>
            <Button label={t.rules.add} onPress={addHoliday} style={{ marginBottom: 12 }} />
          </View>
          {rules.extraHolidays.map((k) => (
            <View key={k} style={styles.holiday}>
              <Text style={{ color: theme.text, flex: 1, fontSize: 16 }}>{k}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${t.common.delete} ${k}`}
                onPress={() =>
                  setRules({ extraHolidays: rules.extraHolidays.filter((x) => x !== k) })
                }
                style={styles.remove}
              >
                <Text style={{ color: theme.danger, fontSize: 18 }}>✕</Text>
              </Pressable>
            </View>
          ))}
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 14, paddingBottom: 48, maxWidth: 720, width: '100%', alignSelf: 'center' },
  pad: { paddingVertical: 8 },
  row: { flexDirection: 'row', gap: 10 },
  warning: { fontSize: 13, lineHeight: 18, marginTop: 10, marginHorizontal: 4 },
  holiday: { flexDirection: 'row', alignItems: 'center', minHeight: 44 },
  remove: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
