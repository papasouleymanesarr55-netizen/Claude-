import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { durationHours, grossFor } from '../domain/calc';
import { formatHours, formatMoney, formatNumber, parseDecimal } from '../domain/format';
import { normalizeTimeInput, toHHMM } from '../domain/time';
import { SHIFT_COLORS, type Shift } from '../domain/types';
import { fill, useI18n } from '../i18n';
import { useAppStore } from '../store/store';
import { ColorPicker } from './ColorPicker';
import { confirmAsync } from './dialogs';
import { Button, Field, FieldRow } from './kit';
import { Sheet } from './Sheet';
import { useTheme } from './theme';
import { TimeField } from './TimeField';

interface Props {
  /** `null` : fermé ; `'new'` : création ; sinon le poste à modifier. */
  target: Shift | 'new' | null;
  onClose: () => void;
}

interface Form {
  name: string;
  start: string;
  end: string;
  pause: string;
  rate: string;
  color: string;
}

export function parseShiftForm(f: Form): Omit<Shift, 'id'> | null {
  const name = f.name.trim().slice(0, 40);
  const start = normalizeTimeInput(f.start);
  const end = normalizeTimeInput(f.end);
  const pause = f.pause.trim() === '' ? 0 : parseDecimal(f.pause);
  const rate = parseDecimal(f.rate);
  if (!name || start === null || end === null || pause === null || rate === null) return null;
  if (pause > 1439 || rate > 10000) return null;
  return { name, start, end, pause: Math.round(pause), rate, color: f.color };
}

export function ShiftEditor({ target, onClose }: Props) {
  if (target === null) return null;
  return (
    <ShiftEditorForm key={target === 'new' ? 'new' : target.id} target={target} onClose={onClose} />
  );
}

function initialForm(target: Shift | 'new', lang: 'fr' | 'en'): Form {
  const { settings, shifts } = useAppStore.getState();
  if (target === 'new') {
    return {
      name: '',
      start: '08:00',
      end: '16:00',
      pause: '30',
      rate: formatNumber(settings.lastRate, lang),
      color: SHIFT_COLORS[shifts.length % SHIFT_COLORS.length]!,
    };
  }
  return {
    name: target.name,
    start: toHHMM(target.start),
    end: toHHMM(target.end),
    pause: String(target.pause),
    rate: formatNumber(target.rate, lang),
    color: target.color,
  };
}

function ShiftEditorForm({ target, onClose }: { target: Shift | 'new'; onClose: () => void }) {
  const theme = useTheme();
  const { t, lang } = useI18n();
  const addShift = useAppStore((s) => s.addShift);
  const updateShift = useAppStore((s) => s.updateShift);
  const deleteShift = useAppStore((s) => s.deleteShift);
  const [form, setForm] = useState<Form>(() => initialForm(target, lang));
  const [showError, setShowError] = useState(false);

  const parsed = useMemo(() => parseShiftForm(form), [form]);

  const set = (patch: Partial<Form>) => setForm({ ...form, ...patch });

  const save = () => {
    if (!parsed) {
      setShowError(true);
      return;
    }
    if (target === 'new') addShift(parsed);
    else updateShift(target.id, parsed);
    onClose();
  };

  const remove = async () => {
    if (target === 'new') return;
    const linked = Object.values(useAppStore.getState().days).filter(
      (d) => d.shiftId === target.id,
    ).length;
    const ok = await confirmAsync(
      fill(t.shift.deleteTitle, { name: target.name }),
      fill(t.shift.deleteMessage, { count: linked }),
      t.common.delete,
      t.common.cancel,
      true,
    );
    if (ok) {
      deleteShift(target.id);
      onClose();
    }
  };

  const preview = parsed
    ? fill(t.shift.preview, {
        duration: formatHours(durationHours(parsed.start, parsed.end, parsed.pause), lang),
        amount: formatMoney(grossFor(parsed.start, parsed.end, parsed.pause, parsed.rate), lang),
      })
    : t.shift.invalid;

  return (
    <Sheet
      visible
      testID="shift-editor"
      title={target === 'new' ? t.shift.newTitle : t.shift.editTitle}
      onClose={onClose}
      footer={
        <>
          <Button
            label={t.common.cancel}
            variant="secondary"
            onPress={onClose}
            style={styles.flex}
          />
          <Button testID="shift-save" label={t.common.save} onPress={save} style={styles.flex} />
        </>
      }
    >
      <Field
        testID="shift-name"
        label={t.shift.name}
        value={form.name}
        onChangeText={(name) => set({ name })}
        placeholder={t.shift.namePlaceholder}
        maxLength={40}
        error={showError && !form.name.trim()}
        autoFocus={target === 'new'}
        returnKeyType="next"
      />
      <FieldRow>
        <TimeField
          testID="shift-start"
          label={t.shift.start}
          value={form.start}
          onChange={(start) => set({ start })}
        />
        <TimeField
          testID="shift-end"
          label={t.shift.end}
          value={form.end}
          onChange={(end) => set({ end })}
        />
      </FieldRow>
      <FieldRow>
        <Field
          testID="shift-pause"
          label={t.shift.pause}
          value={form.pause}
          onChangeText={(pause) => set({ pause })}
          keyboardType="number-pad"
          maxLength={4}
          selectTextOnFocus
        />
        <Field
          testID="shift-rate"
          label={t.shift.rate}
          value={form.rate}
          onChangeText={(rate) => set({ rate })}
          keyboardType="decimal-pad"
          maxLength={8}
          selectTextOnFocus
          error={parseDecimal(form.rate) === null}
        />
      </FieldRow>
      <Text style={[styles.label, { color: theme.textMuted }]}>{t.shift.color}</Text>
      <ColorPicker value={form.color} onChange={(color) => set({ color })} />
      <View
        accessibilityLiveRegion="polite"
        style={[styles.preview, { backgroundColor: theme.accentSoft }]}
      >
        <Text testID="shift-preview" style={[styles.previewText, { color: theme.text }]}>
          {preview}
        </Text>
      </View>
      {target !== 'new' ? (
        <Button label={t.shift.delete} variant="danger" onPress={remove} style={styles.delete} />
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  label: { fontSize: 13, marginBottom: 6, fontWeight: '500' },
  preview: { borderRadius: 10, padding: 12, marginTop: 4 },
  previewText: { fontSize: 16, fontWeight: '600', textAlign: 'center' },
  delete: { marginTop: 14 },
});
