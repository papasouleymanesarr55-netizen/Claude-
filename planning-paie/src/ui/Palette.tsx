import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { durationHours, grossFor } from '../domain/calc';
import { formatHours, formatHoursShort, formatMoney } from '../domain/format';
import type { Shift } from '../domain/types';
import { fill, useI18n } from '../i18n';
import { useAppStore } from '../store/store';
import { MIN_TOUCH } from './kit';
import { ShiftChip } from './ShiftChip';
import { useTheme } from './theme';

interface Props {
  editMode: boolean;
  onToggleEdit: () => void;
  onShift: (shift: Shift) => void;
  onRest: () => void;
  onThisDay: () => void;
  onAddShift: () => void;
  bottomInset: number;
}

export function Palette({
  editMode,
  onToggleEdit,
  onShift,
  onRest,
  onThisDay,
  onAddShift,
  bottomInset,
}: Props) {
  const theme = useTheme();
  const { t, lang } = useI18n();
  const shifts = useAppStore((s) => s.shifts);
  return (
    <View
      testID="palette"
      style={[
        styles.wrap,
        {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          paddingBottom: Math.max(bottomInset, 8),
        },
      ]}
    >
      <View style={styles.helpRow}>
        <Text style={[styles.help, { color: theme.textMuted }]}>
          {editMode ? t.palette.helpEdit : t.palette.help}
        </Text>
        <Pressable
          testID="edit-toggle"
          onPress={onToggleEdit}
          accessibilityRole="button"
          accessibilityLabel={editMode ? t.palette.done : t.palette.edit}
          style={styles.editBtn}
        >
          <Text style={[styles.editText, { color: theme.accent }]}>
            {editMode ? t.palette.done : t.palette.edit}
          </Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {shifts.map((s) => {
          const h = durationHours(s.start, s.end, s.pause);
          const amount = formatMoney(grossFor(s.start, s.end, s.pause, s.rate), lang);
          return (
            <ShiftChip
              key={s.id}
              testID={`chip-${s.name}`}
              label={(editMode ? '✎ ' : '') + s.name}
              sub={formatHoursShort(h)}
              sub2={amount}
              color={s.color}
              onPress={() => onShift(s)}
              accessibilityLabel={fill(t.palette.shiftA11y, {
                name: s.name,
                duration: formatHours(h, lang),
                amount,
              })}
            />
          );
        })}
        {!editMode ? (
          <>
            <ShiftChip
              testID="chip-rest"
              label={t.palette.rest}
              onPress={onRest}
              accessibilityLabel={t.palette.restA11y}
            />
            <ShiftChip
              testID="chip-thisday"
              label={t.palette.thisDay}
              onPress={onThisDay}
              accessibilityLabel={t.palette.thisDay}
            />
          </>
        ) : null}
        <ShiftChip
          testID="chip-add"
          label={t.palette.addShift}
          dashed
          onPress={onAddShift}
          accessibilityLabel={t.palette.addShift}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 6 },
  helpRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  help: { flex: 1, fontSize: 12 },
  editBtn: { minHeight: MIN_TOUCH, minWidth: MIN_TOUCH, justifyContent: 'center', paddingLeft: 8 },
  editText: { fontSize: 16, fontWeight: '700' },
  chips: { gap: 8, paddingHorizontal: 12, paddingBottom: 4 },
});
