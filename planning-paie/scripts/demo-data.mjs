// Données de démonstration (octobre 2026) pour les captures d'écran.
const shifts = [
  {
    id: 'm',
    name: 'Matin',
    start: 360,
    end: 840,
    pause: 30,
    rate: 12.5,
    color: '#d99a00',
    employer: 'Boulangerie Martin',
  },
  {
    id: 's',
    name: 'Soir',
    start: 840,
    end: 1320,
    pause: 30,
    rate: 12.5,
    color: '#2f7de1',
    employer: 'Hôtel du Parc',
  },
  {
    id: 'n',
    name: 'Nuit',
    start: 1320,
    end: 360,
    pause: 30,
    rate: 13.4,
    color: '#8b5cf6',
    employer: 'Clinique Saint-Jean',
  },
];
const plan = {
  '01': 'm',
  '02': 'm',
  '05': 's',
  '06': 's',
  '07': 's',
  '08': 'm',
  '09': 'm',
  12: 'n',
  13: 'n',
  14: 'n',
  15: 'm',
  16: 'm',
  19: 'm',
  20: 'm',
  21: 's',
  22: 's',
  23: 's',
  26: 'm',
  27: 'm',
  28: 'n',
  29: 'n',
  30: 'm',
  31: 'n',
};
const days = {};
for (const [d, s] of Object.entries(plan)) days[`2026-10-${d}`] = { shiftId: s };
days['2026-10-16'] = { shiftId: 'm', end: 900, note: 'Inventaire' };
days['2026-10-24'] = { start: 540, end: 720, pause: 0, rate: 12.5, note: 'Formation' };

export function demoState(overrides = {}, rulesOverrides = {}) {
  return JSON.stringify({
    state: {
      shifts,
      days,
      settings: {
        charges: 22,
        lastRate: 12.5,
        syncCal: false,
        reminder: 0,
        language: 'fr',
        theme: 'light',
        premium: false,
        devPremium: false,
        ...overrides,
      },
      rules: {
        enabled: false,
        overtime: {
          enabled: true,
          weeklyThreshold: 35,
          tier1Hours: 8,
          tier1Rate: 25,
          tier2Rate: 50,
        },
        night: { rate: 0, start: 1260, end: 360 },
        sundayRate: 0,
        holidayRate: 0,
        alsaceMoselle: false,
        extraHolidays: [],
        stacking: 'max',
        ...rulesOverrides,
      },
      onboarded: true,
    },
    version: 1,
  });
}
