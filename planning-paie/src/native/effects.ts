import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

import { selectPremium, useAppStore, type AppState as Store } from '../store/store';
import { syncCalendar } from './calendarSync';
import { initPurchases } from './purchases';
import { configureNotifications, rescheduleReminders } from './reminders';

const REMINDER_DELAY = 1500;
const CALENDAR_DELAY = 4000;

function relevant(s: Store) {
  return [
    s.shifts,
    s.days,
    s.settings.reminder,
    s.settings.reminderEve,
    s.settings.reminderDay,
    s.settings.reminderDayTime,
    s.settings.syncCal,
    selectPremium(s),
  ] as const;
}

/**
 * Effets natifs globaux : achats, rappels (reprogrammés à chaque modification et au retour
 * au premier plan) et synchronisation automatique du calendrier si elle est activée.
 */
export function useNativeEffects(): void {
  const hydrated = useAppStore((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated || Platform.OS === 'web') return;
    configureNotifications();
    void initPurchases();

    let reminderTimer: ReturnType<typeof setTimeout> | undefined;
    let calendarTimer: ReturnType<typeof setTimeout> | undefined;

    const schedule = (withCalendar: boolean) => {
      clearTimeout(reminderTimer);
      reminderTimer = setTimeout(
        () => void rescheduleReminders().catch(() => undefined),
        REMINDER_DELAY,
      );
      const s = useAppStore.getState();
      if (withCalendar && s.settings.syncCal && selectPremium(s)) {
        clearTimeout(calendarTimer);
        calendarTimer = setTimeout(() => void syncCalendar(), CALENDAR_DELAY);
      }
    };

    schedule(true);
    let prev = relevant(useAppStore.getState());
    const unsub = useAppStore.subscribe((s) => {
      const next = relevant(s);
      if (next.some((v, i) => v !== prev[i])) {
        prev = next;
        schedule(true);
      }
    });
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') schedule(false);
    });
    return () => {
      unsub();
      sub.remove();
      clearTimeout(reminderTimer);
      clearTimeout(calendarTimer);
    };
  }, [hydrated]);
}
