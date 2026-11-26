import { format } from 'date-fns';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { buildDayEntry, durationHours, grossFor, resolveDay } from '../domain/calc';
import { formatHours, formatMoney, formatNumber, parseDecimal } from '../domain/format';
import { normalizeTimeInput, parseDayKey, toHHMM } from '../domain/time';
import type { DayKey } from '../domain/types';
import { fill, useI18n } from '../i18n';
import { useAppStore } from '../store/store';
import { Button, Field, FieldRow } from './kit';
import { Sheet } from './Sheet';
import { ShiftChip } from './ShiftChip';
import { useTheme } from './theme';
import { TimeField } from './TimeField';

interface Form {
  shiftId?: string;
  start: string;
  end: string;
  pause: string;
  rate: string;
  note: string;
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Fiche du jour : ouverte par double-touche sur une date ou par « Ce jour ». */
export function DaySheet({ dayKey, onClose }: { dayKey: DayKey | null; onClose: () => void }) {
  if (!dayKey) return null;
  return <DayForm key={dayKey} dayKey={dayKey} onClose={onClose} />;
}

function initialForm(dayKey: DayKey, lang: 'fr' | 'en'): Form {
  const state = useAppStore.getState();
  const map = new Map(state.shifts.map((s) => [s.id, s]));
  const day = resolveDay(dayKey, state.days[dayKey], map);
  const rate = state.settings.lastRate;
  if (day) {
    return {
      shiftId: day.shift?.id,
      start: toHHMM(day.start),
      end: toHHMM(day.end),
      pause: String(day.pause),
      rate: formatNumber(day.rate, lang),
      note: day.note ?? '',
    };
  }
  const first = state.shifts[0];
  return {
    shiftId: undefined,
    start: first ? toHHMM(first.start) : '08:00',
    end: first ? toHHMM(first.end) : '16:00',
    pause: first ? String(first.pause) : '0',
    rate: formatNumber(rate, lang),
    note: '',
  };
}

function DayForm({ dayKey, onClose }: { dayKey: DayKey; onClose: () => void }) {
  const theme = useTheme();
  const { t, lang, locale } = useI18n();
  const shifts = useAppStore((s) => s.shifts);
  const setDay = useAppStore((s) => s.setDay);
  const clearDay = useAppStore((s) => s.clearDay);
  const lastRate = useAppStore((s) => s.settings.lastRate);
  const [form, setForm] = useState<Form>(() => initialForm(dayKey, lang));

  const values = useMemo(() => {
    const start = normalizeTimeInput(form.start);
    const end = normalizeTimeInput(form.end);
    const pause = form.pause.trim() === '' ? 0 : parseDecimal(form.pause);
    const rate = parseDecimal(form.rate);
    if (start === null || end === null || pause === null || rate === null || pause > 1439)
      return null;
    return { start, end, pause: Math.round(pause), rate, note: form.note };
  }, [form]);

  const set = (patch: Partial<Form>) => setForm({ ...form, ...patch });

  const pickShift = (id: string | undefined) => {
    const s = shifts.find((x) => x.id === id);
    if (!s) {
      set({ shiftId: undefined });
      return;
    }
    set({
      shiftId: s.id,
      start: toHHMM(s.start),
      end: toHHMM(s.end),
      pause: String(s.pause),
      rate: formatNumber(s.rate, lang),
    });
  };

  const save = () => {
    if (!values) return;
    const shift = shifts.find((x) => x.id === form.shiftId);
    setDay(dayKey, buildDayEntry(shift, values));
    onClose();
  };

  const title = capitalize(format(parseDayKey(dayKey), 'EEEE d MMMM yyyy', { locale }));
  const preview = values
    ? fill(t.day.preview, {
        duration: formatHours(durationHours(values.start, values.end, values.pause), lang),
        amount: formatMoney(grossFor(values.start, values.end, values.pause, values.rate), lang),
      })
    : t.day.invalid;

  return (
    <Sheet
      visible
      testID="day-sheet"
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button
            testID="day-clear"
            label={t.day.clear}
            variant="secondary"
            onPress={() => {
              clearDay(dayKey);
              onClose();
            }}
            style={styles.flex}
          />
          <Button
            testID="day-save"
            label={t.common.save}
            onPress={save}
            disabled={!values}
            style={styles.flex}
          />
        </>
      }
    >
      <Text style={[styles.label, { color: theme.textMuted }]}>{t.day.shift}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
        keyboardShouldPersistTaps="handled"
      >
        {shifts.map((s) => (
          <ShiftChip
            key={s.id}
            label={s.name}
            color={s.color}
            active={form.shiftId === s.id}
            onPress={() => pickShift(s.id)}
            accessibilityLabel={s.name}
          />
        ))}
        <ShiftChip
          label={t.day.customShift}
          active={form.shiftId === undefined}
          dashed
          onPress={() => pickShift(undefined)}
          accessibilityLabel={t.day.customShift}
        />
      </ScrollView>
      <FieldRow>
        <TimeField
          testID="day-start"
          label={t.day.start}
          value={form.start}
          onChange={(start) => set({ start })}
        />
        <TimeField
          testID="day-end"
          label={t.day.end}
          value={form.end}
          onChange={(end) => set({ end })}
        />
      </FieldRow>
      <FieldRow>
        <Field
          testID="day-pause"
          label={t.day.pause}
          value={form.pause}
          onChangeText={(pause) => set({ pause })}
          keyboardType="number-pad"
          maxLength={4}
          selectTextOnFocus
        />
        <Field
          testID="day-rate"
          label={t.day.rate}
          value={form.rate}
          placeholder={formatNumber(lastRate, lang)}
          onChangeText={(rate) => set({ rate })}
          keyboardType="decimal-pad"
          maxLength={8}
          selectTextOnFocus
          error={parseDecimal(form.rate) === null}
        />
      </FieldRow>
      <Field
        testID="day-note"
        label={t.day.note}
        value={form.note}
        onChangeText={(note) => set({ note })}
        placeholder={t.day.notePlaceholder}
        maxLength={60}
      />
      <View
        accessibilityLiveRegion="polite"
        style={[styles.preview, { backgroundColor: theme.accentSoft }]}
      >
        <Text testID="day-preview" style={[styles.previewText, { color: theme.text }]}>
          {preview}
        </Text>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  label: { fontSize: 13, marginBottom: 6, fontWeight: '500' },
  chips: { gap: 8, paddingBottom: 12 },
  preview: { borderRadius: 10, padding: 12 },
  previewText: { fontSize: 16, fontWeight: '600', textAlign: 'center' },
});
