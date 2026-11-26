import { fireEvent, render, screen } from '@testing-library/react-native';

import RecapScreen from '../../app/recap';
import { initialState, useAppStore } from '../../store/store';
import { recapCsv, recapHtml } from '../../native/exports';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: (...a: unknown[]) => mockPush(...a), back: jest.fn() },
  useLocalSearchParams: () => ({ y: '2026', m: '10' }),
}));

const shift = (id: string, employer: string, hours: number, rate: number) => ({
  id,
  name: id,
  start: 480,
  end: 480 + hours * 60,
  pause: 0,
  rate,
  color: '#000',
  employer,
});

beforeEach(() => {
  mockPush.mockClear();
  const days: Record<string, { shiftId: string }> = {};
  ['02', '09', '16'].forEach((d) => (days[`2026-11-${d}`] = { shiftId: 'A' }));
  ['03', '10', '17', '24'].forEach((d) => (days[`2026-11-${d}`] = { shiftId: 'B' }));
  ['04', '11', '18', '25', '26'].forEach((d) => (days[`2026-11-${d}`] = { shiftId: 'C' }));
  useAppStore.setState({
    ...initialState(),
    hydrated: true,
    onboarded: true,
    settings: { ...initialState().settings, language: 'fr' },
    shifts: [
      shift('A', 'Alpha', 6, 12),
      shift('B', 'Bravo', 5.5, 13.5),
      shift('C', 'Charlie', 5, 15),
    ],
    days,
  });
});

describe('écran Récap', () => {
  it('affiche chaque entreprise puis le total général', async () => {
    await render(<RecapScreen />);
    expect(screen.getByTestId('recap-month')).toHaveTextContent('Novembre 2026');
    expect(screen.getByTestId('recap-employer-Alpha').props.accessibilityLabel).toBe(
      'Alpha : 18 h, 3 jours, Brut 216,00 €, Net estimé 168,48 €',
    );
    expect(screen.getByTestId('recap-employer-Bravo').props.accessibilityLabel).toContain('22 h');
    expect(screen.getByTestId('recap-employer-Charlie').props.accessibilityLabel).toContain(
      '375,00 €',
    );
    expect(screen.getByTestId('recap-total')).toHaveTextContent(/888,00 €/);
    expect(screen.getByTestId('recap-total')).toHaveTextContent(/65 h · 12 jours/);
  });

  it("change de mois et propose Premium pour l'export", async () => {
    await render(<RecapScreen />);
    await fireEvent.press(screen.getByTestId('recap-pdf'));
    expect(mockPush).toHaveBeenCalledWith('/premium');
    await fireEvent.press(screen.getByTestId('recap-prev'));
    expect(screen.getByTestId('recap-month')).toHaveTextContent('Octobre 2026');
    expect(screen.getByText('Aucun poste ce mois-ci.')).toBeTruthy();
  });
});

describe('export du récap', () => {
  it('produit un PDF avec sous-totaux par entreprise et total', () => {
    const html = recapHtml(2026, 10);
    expect(html).toContain('Récapitulatif des prestations — Novembre 2026');
    expect(html).toContain('Sous-total Bravo');
    expect(html).toContain('297,00 €');
    expect(html).toContain('Total général');
    expect(html).toContain('888,00 €');
  });

  it('produit un CSV Excel avec une colonne entreprise', () => {
    const csv = recapCsv(2026, 10);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    const lines = csv.trim().split('\r\n');
    expect(lines[0]).toBe(
      '"Entreprise";"Date";"Poste";"Horaires";"Heures";"Brut";"Net estimé";"Note"',
    );
    expect(lines[1]).toBe('"Alpha";"02/11/2026";"A";"08:00-14:00";"6";"72";"";""');
    expect(lines).toContain('"Sous-total Alpha";"";"";"";"18";"216";"168,48";""');
    expect(lines[lines.length - 1]).toBe('"Total général";"";"";"";"65";"888";"692,64";""');
  });
});
