import { act, fireEvent, render, screen } from '@testing-library/react-native';

import MonthScreen from '../../app/index';
import { dayKey } from '../../domain/time';
import { initialState, useAppStore } from '../../store/store';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn() } }));
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
jest.mock('expo-haptics', () => ({ selectionAsync: jest.fn(() => Promise.resolve()) }));

const now = new Date();
const y = now.getFullYear();
const m = now.getMonth();
const k = (d: number) => dayKey(new Date(y, m, d, 12));

beforeEach(() => {
  useAppStore.setState({
    ...initialState(),
    hydrated: true,
    onboarded: true,
    settings: { ...initialState().settings, language: 'fr' },
    shifts: [
      { id: 'm', name: 'Matin', start: 480, end: 960, pause: 30, rate: 12.5, color: '#d99a00' },
      { id: 'n', name: 'Nuit', start: 1320, end: 360, pause: 30, rate: 12.5, color: '#2f7de1' },
    ],
  });
});

describe('écran du mois', () => {
  it('saisie rapide : le poste est appliqué puis le curseur avance d’un jour', async () => {
    await render(<MonthScreen />);
    await fireEvent.press(screen.getByTestId(`day-${k(1)}`));
    await fireEvent.press(screen.getByTestId('chip-Matin'));
    await fireEvent.press(screen.getByTestId('chip-Matin'));
    await fireEvent.press(screen.getByTestId('chip-Nuit'));
    await fireEvent.press(screen.getByTestId('chip-rest'));
    const days = useAppStore.getState().days;
    expect(days[k(1)]).toEqual({ shiftId: 'm' });
    expect(days[k(2)]).toEqual({ shiftId: 'm' });
    expect(days[k(3)]).toEqual({ shiftId: 'n' });
    expect(days[k(4)]).toBeUndefined();
    expect(screen.getByTestId('summary-gross')).toHaveTextContent('281,25 €');
  });

  it('ne sort pas du mois en fin de saisie', async () => {
    await render(<MonthScreen />);
    const last = new Date(y, m + 1, 0).getDate();
    await fireEvent.press(screen.getByTestId(`day-${k(last)}`));
    await fireEvent.press(screen.getByTestId('chip-Matin'));
    await fireEvent.press(screen.getByTestId('chip-Nuit'));
    expect(useAppStore.getState().days[k(last)]).toEqual({ shiftId: 'n' });
    expect(Object.keys(useAppStore.getState().days)).toHaveLength(1);
  });

  it('double-touche : ouvre la fiche du jour et n’enregistre que les écarts', async () => {
    useAppStore.getState().applyShift(k(5), 'm');
    await render(<MonthScreen />);
    await fireEvent.press(screen.getByTestId(`day-${k(5)}`));
    await fireEvent.press(screen.getByTestId(`day-${k(5)}`));
    expect(screen.getByTestId('day-sheet')).toBeTruthy();
    await fireEvent.changeText(screen.getByTestId('day-end'), '17:00');
    await fireEvent.changeText(screen.getByTestId('day-note'), 'Inventaire');
    expect(screen.getByTestId('day-preview')).toHaveTextContent(
      '8 h 30 · 106,25 € brut pour ce jour',
    );
    await fireEvent.press(screen.getByTestId('day-save'));
    expect(useAppStore.getState().days[k(5)]).toEqual({
      shiftId: 'm',
      end: 1020,
      note: 'Inventaire',
    });
    expect(screen.queryByTestId('day-sheet')).toBeNull();
  });

  it('deux touches espacées ne font que sélectionner', async () => {
    jest.useFakeTimers();
    await render(<MonthScreen />);
    await fireEvent.press(screen.getByTestId(`day-${k(6)}`));
    await act(async () => {
      jest.advanceTimersByTime(600);
    });
    await fireEvent.press(screen.getByTestId(`day-${k(6)}`));
    expect(screen.queryByTestId('day-sheet')).toBeNull();
    jest.useRealTimers();
  });

  it('crée un poste avec aperçu en direct', async () => {
    await render(<MonthScreen />);
    await fireEvent.press(screen.getByTestId('chip-add'));
    await fireEvent.changeText(screen.getByTestId('shift-name'), 'Journée');
    await fireEvent.changeText(screen.getByTestId('shift-start'), '9');
    await fireEvent.changeText(screen.getByTestId('shift-end'), '1700');
    await fireEvent.changeText(screen.getByTestId('shift-pause'), '60');
    await fireEvent.changeText(screen.getByTestId('shift-rate'), '13,00');
    expect(screen.getByTestId('shift-preview')).toHaveTextContent('7 h par poste · 91,00 € brut');
    await fireEvent.press(screen.getByTestId('shift-save'));
    const created = useAppStore.getState().shifts.find((s) => s.name === 'Journée');
    expect(created).toMatchObject({ start: 540, end: 1020, pause: 60, rate: 13 });
  });

  it('étiquette chaque jour pour les lecteurs d’écran', async () => {
    useAppStore.getState().applyShift(k(6), 'm');
    await render(<MonthScreen />);
    const label = screen.getByTestId(`day-${k(6)}`).props.accessibilityLabel as string;
    expect(label).toMatch(/poste Matin, 7 h 30, 93,75 euros/);
  });
});
