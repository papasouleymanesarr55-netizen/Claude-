import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { BackupData } from '../domain/backup';
import { newId } from '../domain/id';
import { DEFAULT_RULES, SHIFT_COLORS } from '../domain/types';
import type { DayEntry, DayKey, PayRules, Shift } from '../domain/types';

export type ThemeSetting = 'system' | 'light' | 'dark';
export type ReminderSetting = 0 | 30 | 60 | 120;

export interface Settings {
  /** Charges salariales en % (0–60). */
  charges: number;
  /** Dernier taux horaire saisi, proposé par défaut. */
  lastRate: number;
  syncCal: boolean;
  reminder: ReminderSetting;
  language: 'system' | 'fr' | 'en';
  theme: ThemeSetting;
  /** Dernier état Premium connu (fonctionnement hors-ligne). */
  premium: boolean;
  /** Premium simulé, utilisable uniquement en développement. */
  devPremium: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  charges: 22,
  lastRate: 12.5,
  syncCal: false,
  reminder: 0,
  language: 'system',
  theme: 'system',
  premium: false,
  devPremium: false,
};

export interface PersistedState {
  shifts: Shift[];
  days: Record<DayKey, DayEntry>;
  settings: Settings;
  rules: PayRules;
  onboarded: boolean;
  /** Identifiant du calendrier « Planning Paie » créé sur le téléphone. */
  calendarId?: string;
}

export interface AppState extends PersistedState {
  hydrated: boolean;
  addShift(shift: Omit<Shift, 'id'>): Shift;
  updateShift(id: string, patch: Partial<Omit<Shift, 'id'>>): void;
  /** Supprime le poste et vide les jours liés ; renvoie le nombre de jours vidés. */
  deleteShift(id: string): number;
  /** Applique un poste à un jour (la note éventuelle est conservée). */
  applyShift(key: DayKey, shiftId: string): void;
  setDay(key: DayKey, entry: DayEntry): void;
  clearDay(key: DayKey): void;
  setSettings(patch: Partial<Settings>): void;
  setRules(patch: Partial<PayRules>): void;
  setCalendarId(id: string | undefined): void;
  completeOnboarding(
    rate: number,
    names: { morning: string; evening: string; night: string },
  ): void;
  replaceAll(data: BackupData): void;
  resetAll(): void;
}

export const STORE_VERSION = 1;
export const STORAGE_KEY = 'planning-paie';

export function initialState(): PersistedState {
  return {
    shifts: [],
    days: {},
    settings: { ...DEFAULT_SETTINGS },
    rules: structuredCloneRules(DEFAULT_RULES),
    onboarded: false,
  };
}

function structuredCloneRules(r: PayRules): PayRules {
  return {
    ...r,
    overtime: { ...r.overtime },
    night: { ...r.night },
    extraHolidays: [...r.extraHolidays],
  };
}

/**
 * Migrations versionnées : chaque entrée transforme l'état de la version N-1 vers N.
 * Ne jamais modifier une migration publiée ; en ajouter une nouvelle.
 */
const migrations: Record<number, (state: Record<string, unknown>) => Record<string, unknown>> = {
  // v0 → v1 : complète les champs ajoutés après les premières versions de test.
  1: (s) => ({
    ...initialState(),
    ...s,
    settings: { ...DEFAULT_SETTINGS, ...((s.settings as object | undefined) ?? {}) },
    rules: { ...structuredCloneRules(DEFAULT_RULES), ...((s.rules as object | undefined) ?? {}) },
  }),
};

export function migrate(persisted: unknown, fromVersion: number): PersistedState {
  let state = (persisted ?? {}) as Record<string, unknown>;
  for (let v = fromVersion + 1; v <= STORE_VERSION; v++) {
    const step = migrations[v];
    if (step) state = step(state);
  }
  return state as unknown as PersistedState;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState(),
      hydrated: false,

      addShift(shift) {
        const created: Shift = { ...shift, id: newId() };
        set((s) => ({
          shifts: [...s.shifts, created],
          settings: { ...s.settings, lastRate: shift.rate },
        }));
        return created;
      },

      updateShift(id, patch) {
        set((s) => ({
          shifts: s.shifts.map((x) => (x.id === id ? { ...x, ...patch } : x)),
          settings: patch.rate !== undefined ? { ...s.settings, lastRate: patch.rate } : s.settings,
        }));
      },

      deleteShift(id) {
        const days = { ...get().days };
        let count = 0;
        for (const [k, e] of Object.entries(days)) {
          if (e.shiftId === id) {
            delete days[k];
            count++;
          }
        }
        set((s) => ({ shifts: s.shifts.filter((x) => x.id !== id), days }));
        return count;
      },

      applyShift(key, shiftId) {
        set((s) => {
          const note = s.days[key]?.note;
          const entry: DayEntry = note ? { shiftId, note } : { shiftId };
          return { days: { ...s.days, [key]: entry } };
        });
      },

      setDay(key, entry) {
        set((s) => ({
          days: { ...s.days, [key]: entry },
          settings: entry.rate !== undefined ? { ...s.settings, lastRate: entry.rate } : s.settings,
        }));
      },

      clearDay(key) {
        set((s) => {
          if (!(key in s.days)) return s;
          const days = { ...s.days };
          delete days[key];
          return { days };
        });
      },

      setSettings(patch) {
        set((s) => ({ settings: { ...s.settings, ...patch } }));
      },

      setRules(patch) {
        set((s) => ({ rules: { ...s.rules, ...patch } }));
      },

      setCalendarId(calendarId) {
        set({ calendarId });
      },

      completeOnboarding(rate, names) {
        const mk = (name: string, start: number, end: number, color: string): Shift => ({
          id: newId(),
          name,
          start,
          end,
          pause: 30,
          rate,
          color,
        });
        set((s) => ({
          onboarded: true,
          shifts:
            s.shifts.length > 0
              ? s.shifts
              : [
                  mk(names.morning, 6 * 60, 14 * 60, SHIFT_COLORS[0]!),
                  mk(names.evening, 14 * 60, 22 * 60, SHIFT_COLORS[1]!),
                  mk(names.night, 22 * 60, 6 * 60, SHIFT_COLORS[4]!),
                ],
          settings: { ...s.settings, lastRate: rate },
        }));
      },

      replaceAll(data) {
        set((s) => ({
          shifts: data.shifts,
          days: data.days,
          onboarded: true,
          rules: data.rules ?? s.rules,
          settings: {
            ...s.settings,
            charges: data.charges ?? s.settings.charges,
            lastRate: data.lastRate ?? s.settings.lastRate,
          },
        }));
      },

      resetAll() {
        const { settings } = get();
        set({
          ...initialState(),
          // L'état d'achat ne dépend pas des données locales.
          settings: { ...DEFAULT_SETTINGS, premium: settings.premium },
        });
      },
    }),
    {
      name: STORAGE_KEY,
      version: STORE_VERSION,
      storage: createJSONStorage(() => AsyncStorage),
      migrate,
      partialize: (s): PersistedState => ({
        shifts: s.shifts,
        days: s.days,
        settings: s.settings,
        rules: s.rules,
        onboarded: s.onboarded,
        calendarId: s.calendarId,
      }),
      onRehydrateStorage: () => () => {
        useAppStore.setState({ hydrated: true });
      },
    },
  ),
);

/** Premium effectif : achat confirmé, ou simulé en développement. */
export function selectPremium(s: AppState): boolean {
  return s.settings.premium || (__DEV__ && s.settings.devPremium);
}
