import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { dayKey, nextInMonth } from '../domain/time';
import type { DayKey, Shift } from '../domain/types';
import { useI18n } from '../i18n';
import { useMonthSummary } from '../store/selectors';
import { useAppStore } from '../store/store';
import { CalendarGrid } from '../ui/CalendarGrid';
import { ChargesSheet } from '../ui/ChargesSheet';
import { capitalize, DaySheet } from '../ui/DaySheet';
import { MIN_TOUCH } from '../ui/kit';
import { Palette } from '../ui/Palette';
import { ShiftEditor } from '../ui/ShiftEditor';
import { SummaryCard } from '../ui/SummaryCard';
import { useTheme } from '../ui/theme';
import { WelcomeSheet } from '../ui/WelcomeSheet';

function tap() {
  if (Platform.OS !== 'web') void Haptics.selectionAsync().catch(() => undefined);
}

export default function MonthScreen() {
  const theme = useTheme();
  const { t, locale } = useI18n();
  const insets = useSafeAreaInsets();
  const onboarded = useAppStore((s) => s.onboarded);
  const charges = useAppStore((s) => s.settings.charges);
  const applyShift = useAppStore((s) => s.applyShift);
  const clearDay = useAppStore((s) => s.clearDay);

  const todayKey = dayKey(new Date());
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month0: now.getMonth() };
  });
  const [selected, setSelected] = useState<DayKey>(todayKey);
  const [editMode, setEditMode] = useState(false);
  const [shiftTarget, setShiftTarget] = useState<Shift | 'new' | null>(null);
  const [dayOpen, setDayOpen] = useState<DayKey | null>(null);
  const [chargesOpen, setChargesOpen] = useState(false);

  const summary = useMonthSummary(cursor.year, cursor.month0);

  const moveMonth = (delta: number) => {
    const d = new Date(cursor.year, cursor.month0 + delta, 1, 12);
    setCursor({ year: d.getFullYear(), month0: d.getMonth() });
    const isCurrent =
      d.getFullYear() === new Date().getFullYear() && d.getMonth() === new Date().getMonth();
    setSelected(isCurrent ? todayKey : dayKey(d));
  };

  const onShift = useCallback(
    (shift: Shift) => {
      if (editMode) {
        setShiftTarget(shift);
        return;
      }
      applyShift(selected, shift.id);
      tap();
      setSelected(nextInMonth(selected));
    },
    [editMode, selected, applyShift],
  );

  const onRest = () => {
    clearDay(selected);
    tap();
    setSelected(nextInMonth(selected));
  };

  const title = useMemo(
    () => capitalize(format(new Date(cursor.year, cursor.month0, 1), 'LLLL yyyy', { locale })),
    [cursor, locale],
  );

  return (
    <View style={[styles.screen, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          testID="prev-month"
          onPress={() => moveMonth(-1)}
          accessibilityRole="button"
          accessibilityLabel={t.month.prev}
          style={styles.iconBtn}
        >
          <Text style={[styles.arrow, { color: theme.accent }]}>‹</Text>
        </Pressable>
        <Text
          testID="month-title"
          accessibilityRole="header"
          style={[styles.title, { color: theme.text }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {title}
        </Text>
        <Pressable
          testID="next-month"
          onPress={() => moveMonth(1)}
          accessibilityRole="button"
          accessibilityLabel={t.month.next}
          style={styles.iconBtn}
        >
          <Text style={[styles.arrow, { color: theme.accent }]}>›</Text>
        </Pressable>
        <Pressable
          testID="open-settings"
          onPress={() => router.push('/settings')}
          accessibilityRole="button"
          accessibilityLabel={t.month.settings}
          style={styles.iconBtn}
        >
          <Text style={[styles.gear, { color: theme.text }]}>⚙︎</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <SummaryCard
          gross={summary.gross}
          net={summary.net}
          hours={summary.hours}
          daysWorked={summary.daysWorked}
          premium={summary.premium}
          charges={charges}
          onCharges={() => setChargesOpen(true)}
        />
        <CalendarGrid
          year={cursor.year}
          month0={cursor.month0}
          summary={summary}
          selected={selected}
          todayKey={todayKey}
          onSelect={setSelected}
          onDoubleTap={(key) => {
            setSelected(key);
            setDayOpen(key);
          }}
        />
      </ScrollView>

      <Palette
        editMode={editMode}
        onToggleEdit={() => setEditMode((v) => !v)}
        onShift={onShift}
        onRest={onRest}
        onThisDay={() => setDayOpen(selected)}
        onAddShift={() => setShiftTarget('new')}
        bottomInset={insets.bottom}
      />

      <ShiftEditor target={shiftTarget} onClose={() => setShiftTarget(null)} />
      <DaySheet dayKey={dayOpen} onClose={() => setDayOpen(null)} />
      <ChargesSheet visible={chargesOpen} onClose={() => setChargesOpen(false)} />
      {!onboarded ? <WelcomeSheet /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 4 },
  title: { flex: 1, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  iconBtn: {
    minWidth: MIN_TOUCH,
    minHeight: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: { fontSize: 34, fontWeight: '600', lineHeight: 38 },
  gear: { fontSize: 24 },
  content: { padding: 10, paddingBottom: 16, maxWidth: 720, width: '100%', alignSelf: 'center' },
});
