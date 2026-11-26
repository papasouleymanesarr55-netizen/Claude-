import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { formatHours } from '../domain/format';
import { toHHMM } from '../domain/time';
import { currentI18n, fill } from '../i18n';
import { selectPremium, useAppStore } from '../store/store';
import { upcomingReminders } from './upcoming';

export const CHANNEL_ID = 'rappels-postes';
/** iOS limite à 64 notifications locales programmées : on en garde 60. */
export const MAX_SCHEDULED = 60;

let configured = false;

export function configureNotifications(): void {
  if (configured || Platform.OS === 'web') return;
  configured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

async function ensureChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: currentI18n().t.calendarEvent.channel,
    // eslint-disable-next-line import/namespace
    importance: Notifications.AndroidImportance.HIGH,
  });
}

/** Demande l'autorisation (à appeler quand l'utilisateur active les rappels). */
export async function requestReminderPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  await ensureChannel();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const res = await Notifications.requestPermissionsAsync();
  return res.granted;
}

/**
 * Annule puis reprogramme les rappels des prochains postes.
 * Ne fait rien (hormis l'annulation) si Premium est inactif ou si le rappel est sur « Aucun ».
 */
export async function rescheduleReminders(now = new Date()): Promise<number> {
  if (Platform.OS === 'web') return 0;
  const state = useAppStore.getState();
  await Notifications.cancelAllScheduledNotificationsAsync();
  const { reminder, reminderEve, reminderDay, reminderDayTime } = state.settings;
  const any = reminder > 0 || reminderEve || reminderDay;
  if (!any || !selectPremium(state)) return 0;
  const perm = await Notifications.getPermissionsAsync();
  if (!perm.granted) return 0;
  await ensureChannel();
  const { t, lang } = currentI18n();
  const list = upcomingReminders(
    state.shifts,
    state.days,
    { before: reminder, eve: reminderEve, day: reminderDay, dayTime: reminderDayTime },
    now,
    MAX_SCHEDULED,
    t.day.customShift,
  );
  for (const { occurrence, fireAt, kind } of list) {
    const hours = `${toHHMM(occurrence.day.start)}–${toHHMM(occurrence.day.end)}`;
    const title =
      kind === 'eve'
        ? fill(t.calendarEvent.eveTitle, { name: occurrence.title, hours })
        : kind === 'day'
          ? fill(t.calendarEvent.dayTitle, { name: occurrence.title, hours })
          : fill(t.calendarEvent.reminderTitle, {
              name: occurrence.title,
              delay: formatHours(reminder / 60, lang),
            });
    const body =
      (kind === 'before'
        ? fill(t.calendarEvent.reminderBody, { time: toHHMM(occurrence.day.start) })
        : (occurrence.day.employer ?? '')) +
      (occurrence.day.note ? ` · ${occurrence.day.note}` : '');
    await Notifications.scheduleNotificationAsync({
      content: { title, body: body.replace(/^ · /, '') },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fireAt,
        channelId: CHANNEL_ID,
      },
    });
  }
  return list.length;
}
