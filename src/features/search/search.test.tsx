import { fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createDemoPlacesProvider } from '@/adapters/places/demo';
import type { GeocodingProvider } from '@/core/providers/types';
import { demoSource } from '@/features/demo/demoSource';
import { renderApp } from '@/test/render';

const lyon = {
  id: '69123',
  label: 'Lyon',
  context: '69, Rhône, Auvergne-Rhône-Alpes',
  kind: 'municipality' as const,
  position: { lat: 45.758, lng: 4.835 },
};

function setupWith(geocoder: GeocodingProvider | null) {
  return () =>
    Promise.resolve({
      places: [
        createDemoPlacesProvider(['charging', 'fuel', 'parking', 'garage', 'wash', 'tyres']),
      ],
      geocoding: geocoder,
      categories: ['charging', 'fuel', 'parking', 'garage', 'wash', 'tyres'] as const,
      defaultLocation: demoSource.location,
      vehicles: [],
    }).then((s) => ({ ...s, categories: [...s.categories] }));
}

const fakeGeocoder = (search: GeocodingProvider['search']): GeocodingProvider => ({
  info: {
    id: 'fake',
    name: 'Faux',
    producer: 'Test',
    licence: 'Test',
    licenceUrl: null,
    url: null,
    updateFrequency: null,
    isDemo: false,
  },
  search,
  reverse: () => Promise.resolve(null),
});

describe('recherche unifiée', () => {
  it('propose des adresses et des établissements, et déplace la recherche sur l’adresse choisie', async () => {
    const search = vi.fn(() => Promise.resolve([lyon]));
    renderApp('/', setupWith(fakeGeocoder(search)));
    await screen.findByText('15 établissements');
    const box = screen.getByRole('combobox');
    fireEvent.focus(box);
    fireEvent.change(box, { target: { value: 'lyon' } });
    const list = await screen.findByRole('listbox');
    const option = await within(list).findByRole('option', { name: /Lyon/ });
    fireEvent.click(option);
    expect(await screen.findAllByText('Lyon')).not.toHaveLength(0);
    // Aucun établissement de démonstration autour de Lyon : rien n'est inventé.
    expect(
      await screen.findByText('Aucun établissement ne correspond à votre recherche.'),
    ).toBeInTheDocument();
    expect(search).toHaveBeenCalled();
  });

  it('se navigue au clavier et sélectionne un établissement', async () => {
    renderApp('/', setupWith(fakeGeocoder(() => Promise.resolve([]))));
    await screen.findByText('15 établissements');
    const box = screen.getByRole('combobox');
    fireEvent.focus(box);
    fireEvent.change(box, { target: { value: 'bastille' } });
    await screen.findByRole('option', { name: /Borne démo · Bastille/ });
    fireEvent.keyDown(box, { key: 'ArrowDown' });
    fireEvent.keyDown(box, { key: 'Enter' });
    expect(
      await screen.findByText('Borne démo · Bastille', { selector: 'button' }),
    ).toBeInTheDocument();
    expect(document.querySelector('[data-place-id="demo-ch-bastille"]')).toHaveAttribute(
      'aria-current',
      'true',
    );
  });

  it('indique une panne du géocodage sans inventer de résultat', async () => {
    renderApp('/', setupWith(fakeGeocoder(() => Promise.reject(new Error('down')))));
    await screen.findByText('15 établissements');
    const box = screen.getByRole('combobox');
    fireEvent.focus(box);
    fireEvent.change(box, { target: { value: 'zzzz' } });
    expect(
      await screen.findByText('Recherche d’adresse momentanément indisponible.'),
    ).toBeInTheDocument();
  });
});
