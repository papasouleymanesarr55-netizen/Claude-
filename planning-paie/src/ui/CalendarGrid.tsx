import { format } from 'date-fns';
import { memo, useCallback, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { resolveDay, type PeriodSummary } from '../domain/calc';
import { formatHours, formatHoursShort, formatMoney } from '../domain/format';
import { addDays, dayKey, isoWeek, isoWeekStart, parseDayKey } from '../domain/time';
import type { DayKey } from '../domain/types';
import { fill, useI18n } from '../i18n';
import { useAppStore } from '../store/store';
import { capitalize } from './DaySheet';
import { readableOn, useTheme, withAlpha } from './theme';

export const DOUBLE_TAP_MS = 450;

interface Props {
  year: number;
  month0: number;
  summary: PeriodSummary;
  selected: DayKey | null;
  todayKey: DayKey;
  onSelect: (key: DayKey) => void;
  onDoubleTap: (key: DayKey) => void;
}

interface CellInfo {
  key: DayKey;
  day: number;
  inMonth: boolean;
  label?: string;
  color?: string;
  duration?: string;
  customized: boolean;
  a11y: string;
}

export function CalendarGrid({
  year,
  month0,
  summary,
  selected,
  todayKey,
  onSelect,
  onDoubleTap,
}: Props) {
  const theme = useTheme();
  const { t, lang, locale } = useI18n();
  const shifts = useAppStore((s) => s.shifts);
  const days = useAppStore((s) => s.days);
  const lastTap = useRef<{ key: DayKey; at: number } | null>(null);

  const weeks = useMemo(() => {
    const first = dayKey(new Date(year, month0, 1, 12));
    const last = dayKey(new Date(year, month0 + 1, 0, 12));
    const map = new Map(shifts.map((s) => [s.id, s]));
    const rows: { week: number; cells: CellInfo[] }[] = [];
    for (let start = isoWeekStart(first); start <= last; start = addDays(start, 7)) {
      const cells: CellInfo[] = [];
      for (let i = 0; i < 7; i++) {
        const key = addDays(start, i);
        const date = parseDayKey(key);
        const inMonth = date.getMonth() === month0;
        const dateLabel = capitalize(format(date, 'EEEE d MMMM', { locale }));
        const r = inMonth ? resolveDay(key, days[key], map) : null;
        const pay = summary.days[key];
        if (r && pay) {
          const duration = formatHours(pay.hours, lang);
          const amount = formatMoney(pay.gross, lang).replace('€', 'euros');
          cells.push({
            key,
            day: date.getDate(),
            inMonth,
            label: r.shift?.name ?? '✎',
            color: r.shift?.color,
            duration: formatHoursShort(pay.hours),
            customized: r.customized,
            a11y: r.shift
              ? fill(t.day.a11yShift, { date: dateLabel, name: r.shift.name, duration, amount }) +
                (r.customized ? `, ${t.day.modified}` : '') +
                (r.note ? `, ${r.note}` : '')
              : fill(t.day.a11yCustom, { date: dateLabel, duration, amount }),
          });
        } else {
          cells.push({ key, day: date.getDate(), inMonth, customized: false, a11y: dateLabel });
        }
      }
      rows.push({ week: isoWeek(parseDayKey(start)).week, cells });
    }
    return rows;
  }, [year, month0, shifts, days, summary, lang, locale, t]);

  const handlePress = useCallback(
    (key: DayKey) => {
      const now = Date.now();
      const prev = lastTap.current;
      if (prev && prev.key === key && now - prev.at < DOUBLE_TAP_MS) {
        lastTap.current = null;
        onDoubleTap(key);
        return;
      }
      lastTap.current = { key, at: now };
      onSelect(key);
    },
    [onSelect, onDoubleTap],
  );

  return (
    <View testID="calendar-grid">
      <View style={styles.row}>
        <Text
          style={[styles.weekHead, { color: theme.textMuted }]}
          maxFontSizeMultiplier={1.2}
          importantForAccessibility="no"
        >
          {t.month.weekShort}
        </Text>
        {t.weekdaysShort.map((d, i) => (
          <Text
            key={i}
            style={[styles.dayHead, { color: theme.textMuted }]}
            maxFontSizeMultiplier={1.2}
            importantForAccessibility="no"
          >
            {d}
          </Text>
        ))}
      </View>
      {weeks.map((w) => (
        <View key={w.cells[0]!.key} style={styles.row}>
          <Text
            style={[styles.weekNum, { color: theme.textMuted }]}
            maxFontSizeMultiplier={1.2}
            accessibilityLabel={fill(t.month.weekA11y, { week: w.week })}
          >
            {w.week}
          </Text>
          {w.cells.map((c) => (
            <DayCell
              key={c.key}
              info={c}
              selected={c.key === selected}
              today={c.key === todayKey}
              onPress={handlePress}
              hint={t.day.a11yHint}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const DayCell = memo(function DayCell({
  info,
  selected,
  today,
  onPress,
  hint,
}: {
  info: CellInfo;
  selected: boolean;
  today: boolean;
  onPress: (key: DayKey) => void;
  hint: string;
}) {
  const theme = useTheme();
  if (!info.inMonth) return <View style={styles.cell} importantForAccessibility="no" />;
  const bg = info.color ? withAlpha(info.color, theme.dark ? 0.35 : 0.18) : theme.surface;
  const tag = info.color ?? theme.textMuted;
  return (
    <Pressable
      testID={`day-${info.key}`}
      onPress={() => onPress(info.key)}
      accessibilityRole="button"
      accessibilityLabel={info.a11y}
      accessibilityHint={hint}
      accessibilityState={{ selected }}
      style={[
        styles.cell,
        styles.cellBox,
        {
          backgroundColor: bg,
          borderColor: selected ? theme.selected : theme.border,
          borderWidth: selected ? 2.5 : StyleSheet.hairlineWidth,
        },
      ]}
    >
      <View style={styles.cellTop}>
        <Text
          maxFontSizeMultiplier={1.2}
          style={[
            styles.dayNum,
            { color: theme.text },
            today && { textDecorationLine: 'underline', fontWeight: '800', color: theme.accent },
          ]}
        >
          {info.day}
        </Text>
        {info.customized && info.color ? (
          <Text maxFontSizeMultiplier={1.2} style={[styles.pencil, { color: theme.text }]}>
            ✎
          </Text>
        ) : null}
      </View>
      {info.label ? (
        <>
          <View
            style={[styles.tag, { backgroundColor: info.color ?? 'transparent', borderColor: tag }]}
          >
            <Text
              numberOfLines={1}
              maxFontSizeMultiplier={1.15}
              style={[styles.tagText, { color: info.color ? readableOn(info.color) : theme.text }]}
            >
              {info.label}
            </Text>
          </View>
          <Text maxFontSizeMultiplier={1.15} style={[styles.duration, { color: theme.text }]}>
            {info.duration}
          </Text>
        </>
      ) : null}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'stretch' },
  weekHead: { width: 26, textAlign: 'center', fontSize: 12, fontWeight: '700', paddingVertical: 4 },
  dayHead: { flex: 1, textAlign: 'center', fontSize: 13, fontWeight: '700', paddingVertical: 4 },
  weekNum: {
    width: 26,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 11,
    fontWeight: '600',
    alignSelf: 'center',
  },
  cell: { flex: 1, minHeight: 66, margin: 1.5 },
  cellBox: { borderRadius: 8, paddingHorizontal: 3, paddingVertical: 3 },
  cellTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dayNum: { fontSize: 14, fontWeight: '600' },
  pencil: { fontSize: 11 },
  tag: { borderRadius: 4, paddingHorizontal: 2, marginTop: 2, borderWidth: 0 },
  tagText: { fontSize: 10, fontWeight: '700', textAlign: 'center' },
  duration: { fontSize: 11, textAlign: 'center', marginTop: 2, fontWeight: '600' },
});
