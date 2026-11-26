import { DEFAULT_RULES } from '../../domain/types';
import { DEFAULT_SETTINGS, initialState, migrate, selectPremium, useAppStore } from '../store';

const names = { morning: 'Matin', evening: 'Soir', night: 'Nuit' };

beforeEach(() => {
  useAppStore.setState({ ...initialState() });
});

describe('store', () => {
  it('crée trois postes au premier lancement avec le taux saisi', () => {
    useAppStore.getState().completeOnboarding(11.88, names);
    const s = useAppStore.getState();
    expect(s.onboarded).toBe(true);
    expect(s.shifts.map((x) => x.name)).toEqual(['Matin', 'Soir', 'Nuit']);
    expect(s.shifts.every((x) => x.rate === 11.88)).toBe(true);
    expect(s.settings.lastRate).toBe(11.88);
  });

  it('applique un poste en conservant la note du jour', () => {
    const st = useAppStore.getState();
    const a = st.addShift({ name: 'A', start: 480, end: 960, pause: 30, rate: 12, color: '#000' });
    st.setDay('2026-10-06', { start: 600, end: 700, note: 'RDV' });
    useAppStore.getState().applyShift('2026-10-06', a.id);
    expect(useAppStore.getState().days['2026-10-06']).toEqual({ shiftId: a.id, note: 'RDV' });
  });

  it('vide les jours liés quand un poste est supprimé', () => {
    const st = useAppStore.getState();
    const a = st.addShift({ name: 'A', start: 480, end: 960, pause: 30, rate: 12, color: '#000' });
    const b = st.addShift({ name: 'B', start: 480, end: 960, pause: 30, rate: 12, color: '#000' });
    st.applyShift('2026-10-01', a.id);
    st.applyShift('2026-10-02', a.id);
    st.applyShift('2026-10-03', b.id);
    expect(useAppStore.getState().deleteShift(a.id)).toBe(2);
    expect(Object.keys(useAppStore.getState().days)).toEqual(['2026-10-03']);
    expect(useAppStore.getState().shifts).toHaveLength(1);
  });

  it('retient le dernier taux saisi', () => {
    const a = useAppStore
      .getState()
      .addShift({ name: 'A', start: 0, end: 60, pause: 0, rate: 14.2, color: '#000' });
    expect(useAppStore.getState().settings.lastRate).toBe(14.2);
    useAppStore.getState().updateShift(a.id, { rate: 15 });
    expect(useAppStore.getState().settings.lastRate).toBe(15);
  });

  it('remet à zéro sans perdre l’état d’achat', () => {
    useAppStore.getState().setSettings({ premium: true, charges: 30 });
    useAppStore.getState().completeOnboarding(12, names);
    useAppStore.getState().resetAll();
    const s = useAppStore.getState();
    expect(s.shifts).toEqual([]);
    expect(s.onboarded).toBe(false);
    expect(s.settings.charges).toBe(22);
    expect(s.settings.premium).toBe(true);
  });

  it('remplace toutes les données lors d’un import', () => {
    useAppStore.getState().replaceAll({
      shifts: [{ id: 'x', name: 'X', start: 0, end: 60, pause: 0, rate: 10, color: '#000' }],
      days: { '2026-10-01': { shiftId: 'x' } },
      charges: 25,
    });
    const s = useAppStore.getState();
    expect(s.shifts).toHaveLength(1);
    expect(s.settings.charges).toBe(25);
    expect(s.onboarded).toBe(true);
  });

  it('active Premium simulé uniquement en développement', () => {
    useAppStore.getState().setSettings({ devPremium: true });
    expect(selectPremium(useAppStore.getState())).toBe(__DEV__);
  });
});

describe('migrations', () => {
  it('complète un état de version 0 sans perdre les données', () => {
    const old = {
      shifts: [{ id: 'a', name: 'A', start: 0, end: 60, pause: 0, rate: 10, color: '#000' }],
      days: { '2026-01-01': { shiftId: 'a' } },
      settings: { charges: 20 },
    };
    const m = migrate(old, 0);
    expect(m.shifts).toEqual(old.shifts);
    expect(m.days).toEqual(old.days);
    expect(m.settings).toEqual({ ...DEFAULT_SETTINGS, charges: 20 });
    expect(m.rules).toEqual(DEFAULT_RULES);
  });
  it('ne modifie pas un état déjà à jour', () => {
    const s = initialState();
    expect(migrate(s, 1)).toBe(s);
  });
});
