import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';

import { addDays, dayKey } from '../domain/time';
import { currentI18n } from '../i18n';
import { useAppStore } from '../store/store';
import { occurrencesBetween } from './upcoming';

export type SyncResult =
  { ok: true; count: number } | { ok: false; reason: 'denied' | 'unsupported' | 'error' };

const CAL_COLOR = '#2348c4';

export async function requestCalendarPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const current = await Calendar.getCalendarPermissions();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  return (await Calendar.requestCalendarPermissions()).granted;
}

async function findOrCreateCalendar(): Promise<Calendar.ExpoCalendar> {
  const { calendarId, setCalendarId } = useAppStore.getState();
  const name = currentI18n().t.calendarEvent.calendarName;
  const all = await Calendar.getCalendars(Calendar.EntityTypes.EVENT);
  const existing =
    all.find((c) => c.id === calendarId) ??
    all.find((c) => c.title === name && c.allowsModifications);
  if (existing) {
    if (existing.id !== calendarId) setCalendarId(existing.id);
    return existing;
  }
  let created: Calendar.ExpoCalendar;
  if (Platform.OS === 'ios') {
    const source =
      all.find((c) => c.source?.type === 'local')?.source ??
      Calendar.getDefaultCalendarSync().source;
    created = await Calendar.createCalendar({
      title: name,
      color: CAL_COLOR,
      entityType: Calendar.EntityTypes.EVENT,
      sourceId: source.id,
      source,
      name,
    });
  } else {
    created = await Calendar.createCalendar({
      title: name,
      color: CAL_COLOR,
      entityType: Calendar.EntityTypes.EVENT,
      name,
      ownerAccount: 'Planning Paie',
      accessLevel: Calendar.CalendarAccessLevel.OWNER,
      source: { isLocalAccount: true, name: 'Planning Paie', type: Calendar.SourceType.LOCAL },
    });
  }
  setCalendarId(created.id);
  return created;
}

/**
 * Recrée les événements du calendrier « Planning Paie » sur [−2 mois ; +12 mois].
 * Les anciens événements de la plage sont supprimés d'abord : aucun doublon.
 */
export async function syncCalendar(now = new Date()): Promise<SyncResult> {
  if (Platform.OS === 'web') return { ok: false, reason: 'unsupported' };
  try {
    if (!(await requestCalendarPermission())) return { ok: false, reason: 'denied' };
    const cal = await findOrCreateCalendar();
    const fromDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const toDate = new Date(now.getFullYear(), now.getMonth() + 13, 0, 23, 59, 59);
    const existing = await cal.listEvents(fromDate, new Date(toDate.getTime() + 86400000));
    for (const e of existing) await e.delete();

    const { shifts, days } = useAppStore.getState();
    const { t } = currentI18n();
    const list = occurrencesBetween(
      shifts,
      days,
      dayKey(fromDate),
      addDays(dayKey(toDate), 0),
      t.day.customShift,
    );
    for (const o of list) {
      await cal.createEvent({
        title: o.title,
        startDate: o.startsAt,
        endDate: o.endsAt,
        notes: o.day.note ?? '',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
    }
    return { ok: true, count: list.length };
  } catch (e) {
    if (__DEV__) console.warn('syncCalendar', e);
    return { ok: false, reason: 'error' };
  }
}
