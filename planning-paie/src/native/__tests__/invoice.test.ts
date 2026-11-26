import { initialState, useAppStore } from '../../store/store';
import { documentHtml, issuerComplete } from '../invoice';

beforeEach(() => {
  useAppStore.setState({
    ...initialState(),
    settings: { ...initialState().settings, language: 'fr' },
    shifts: [
      {
        id: 'm',
        name: 'Matin',
        start: 480,
        end: 960,
        pause: 30,
        rate: 25,
        color: '#000',
        employer: 'Alpha',
      },
    ],
    days: { '2026-11-02': { shiftId: 'm' }, '2026-11-03': { shiftId: 'm', note: 'Inventaire' } },
  });
  useAppStore.getState().setIssuer({
    name: 'Jean Dupont',
    address: '1 rue A\n75001 Paris',
    siret: '12345678900011',
    iban: 'FR76 0000',
  });
});

const req = {
  employer: 'Alpha',
  year: 2026,
  month0: 10,
  number: '2026-007',
  clientAddress: '5 avenue B\n69001 Lyon',
  issueDate: new Date(2026, 10, 30),
};

describe('facture et relevé', () => {
  it('exige nom, adresse et SIRET pour facturer', () => {
    expect(issuerComplete(useAppStore.getState().billing.issuer)).toBe(true);
    expect(issuerComplete({ ...useAppStore.getState().billing.issuer, siret: ' ' })).toBe(false);
  });

  it('produit une facture avec les mentions obligatoires', () => {
    const html = documentHtml({ ...req, kind: 'invoice' });
    expect(html).toContain('Facture n° 2026-007');
    expect(html).toContain('Date d’émission : 30/11/2026');
    expect(html).toContain('Échéance : 30/12/2026'); // 30 jours par défaut
    expect(html).toContain('SIRET : 12345678900011');
    expect(html).toContain('1 rue A<br>75001 Paris');
    expect(html).toContain('5 avenue B<br>69001 Lyon');
    expect(html).toContain('Prestations « Matin » — Novembre 2026');
    expect(html).toContain(
      '<td class="n">15</td><td class="n">25,00 €</td><td class="n">375,00 €</td>',
    );
    expect(html).toContain('TVA non applicable, art. 293 B du CGI');
    expect(html).toContain('indemnité forfaitaire de 40 €');
    expect(html).toContain('IBAN : FR76 0000');
  });

  it('produit un relevé d’heures à signer', () => {
    const html = documentHtml({ ...req, kind: 'statement' });
    expect(html).toContain('Relevé d’heures — Novembre 2026');
    expect(html).toContain('Inventaire');
    expect(html).toContain('15 h');
    expect(html).toContain('375,00 €');
    expect(html).toContain('Signature du salarié');
    expect(html).not.toContain('Facture n°');
  });

  it('échappe le HTML saisi par l’utilisateur', () => {
    useAppStore.getState().setIssuer({ name: '<b>X</b>' });
    expect(documentHtml({ ...req, kind: 'invoice' })).toContain('&lt;b&gt;X&lt;/b&gt;');
  });
});
