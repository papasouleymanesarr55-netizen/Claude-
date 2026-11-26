/** Minutes depuis minuit (0–1439). */
export type Minutes = number;

/** Clé de jour au format YYYY-MM-DD (heure locale). */
export type DayKey = string;

export interface Shift {
  id: string;
  name: string;
  start: Minutes;
  end: Minutes;
  /** Pause non payée, en minutes. */
  pause: number;
  /** Taux horaire brut en euros. */
  rate: number;
  color: string;
}

/** Saisie d'un jour : les champs absents héritent du poste. */
export interface DayEntry {
  shiftId?: string;
  start?: Minutes;
  end?: Minutes;
  pause?: number;
  rate?: number;
  note?: string;
}

/** Valeurs effectives d'un jour, après héritage du poste. */
export interface ResolvedDay {
  key: DayKey;
  shift?: Shift;
  start: Minutes;
  end: Minutes;
  pause: number;
  rate: number;
  note?: string;
  /** Vrai si au moins une valeur diffère du poste (ou jour sans poste). */
  customized: boolean;
}

export type StackingRule = 'max' | 'sum';

/** Règles du calcul avancé (Premium). Tous les pourcentages sont en %. */
export interface PayRules {
  enabled: boolean;
  overtime: {
    enabled: boolean;
    /** Seuil hebdomadaire (semaine ISO) en heures. */
    weeklyThreshold: number;
    /** Nombre d'heures au premier taux. */
    tier1Hours: number;
    tier1Rate: number;
    tier2Rate: number;
  };
  night: { rate: number; start: Minutes; end: Minutes };
  sundayRate: number;
  holidayRate: number;
  /** Ajoute le Vendredi saint et le 26 décembre (Alsace-Moselle). */
  alsaceMoselle: boolean;
  /** Jours fériés ajoutés à la main. */
  extraHolidays: DayKey[];
  stacking: StackingRule;
}

export const DEFAULT_RULES: PayRules = {
  enabled: false,
  overtime: { enabled: true, weeklyThreshold: 35, tier1Hours: 8, tier1Rate: 25, tier2Rate: 50 },
  night: { rate: 0, start: 21 * 60, end: 6 * 60 },
  sundayRate: 0,
  holidayRate: 0,
  alsaceMoselle: false,
  extraHolidays: [],
  stacking: 'max',
};

export const SHIFT_COLORS = ['#d99a00', '#2f7de1', '#2e9d5b', '#c2410c', '#8b5cf6', '#db2777'];
