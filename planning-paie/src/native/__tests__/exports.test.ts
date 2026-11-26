import { initialState, useAppStore } from '../../store/store';
import { timesheetCsv, timesheetHtml } from '../exports';

beforeEach(() => {
  useAppStore.setState({
    ...initialState(),
    settings: { ...initialState().settings, language: 'fr' },
    shifts: [
      { id: 'm', name: 'Matin', start: 480, end: 960, pause: 30, rate: 12.5, color: '#000' },
    ],
    days: {
      '2026-10-06': { shiftId: 'm', note: 'Caisse "2"' },
      '2026-10-07': { shiftId: 'm' },
      '2026-11-02': { shiftId: 'm' },
    },
  });
});

describe('exports du mois', () => {
  it('produit un CSV lisible par Excel en français', () => {
    const csv = timesheetCsv(2026, 9);
    expect(csv.startsWith('﻿"Date";"Poste"')).toBe(true);
    const lines = csv.trim().split('\r\n');
    expect(lines).toHaveLength(4);
    expect(lines[1]).toContain('"7,5";"93,75";"Caisse ""2"""');
    expect(lines[3]).toBe('"Total";"";"";"15";"187,5";""');
  });

  it('produit une feuille d’heures HTML avec totaux et mention indicative', () => {
    const html = timesheetHtml(2026, 9);
    expect(html).toContain('Feuille d’heures — Octobre 2026');
    expect(html).toContain('187,50 €');
    expect(html).toContain('Net estimé (22 % de charges)');
    expect(html).toContain('146,25 €');
    expect(html).toContain('Caisse &quot;2&quot;');
    expect(html).toContain('non contractuelle');
  });
});
