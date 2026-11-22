import { fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { demoSource } from '@/features/demo/demoSource';
import { renderWithRouter } from '@/test/render';
import { filterPlaces } from './filter';
import { PlaceCard } from './PlaceCard';
import type { PlaceWithDistance } from './types';

const base: PlaceWithDistance = {
  id: 'p1',
  name: 'Établissement test',
  category: 'parking',
  position: { lat: 48.86, lng: 2.36 },
  address: 'Rue de test',
  price: null,
  services: ['PMR'],
  details: [
    { label: 'Places', value: '100', unit: null },
    { label: 'Hauteur', value: '1,90', unit: 'm' },
  ],
  openingHours: null,
  source: { name: 'Source réelle', isDemo: false, updatedAt: '2026-11-01' },
  distanceM: 1500,
};

describe('filterPlaces', () => {
  const places: PlaceWithDistance[] = [
    { ...base, id: 'a', category: 'charging', name: 'Borne Été', distanceM: 900 },
    { ...base, id: 'b', category: 'parking', name: 'Parking Nord', distanceM: 300 },
    { ...base, id: 'c', category: 'fuel', name: 'Station Sud', distanceM: null },
  ];

  it('trie par distance, les distances inconnues en dernier', () => {
    expect(filterPlaces(places, { categories: [], query: '' }).map((p) => p.id)).toEqual([
      'b',
      'a',
      'c',
    ]);
  });

  it('filtre par catégorie', () => {
    expect(filterPlaces(places, { categories: ['charging'], query: '' }).map((p) => p.id)).toEqual([
      'a',
    ]);
  });

  it('recherche sans tenir compte des accents ni de la casse', () => {
    expect(filterPlaces(places, { categories: [], query: 'ete' }).map((p) => p.id)).toEqual(['a']);
  });
});

describe('PlaceCard', () => {
  it('affiche « Non communiqué » quand le prix est absent', () => {
    renderWithRouter(<PlaceCard place={base} />);
    expect(screen.getByText('Non communiqué')).toBeInTheDocument();
    expect(screen.getByText('Prix')).toBeInTheDocument();
  });

  it('n’affiche pas de badge Démo pour une donnée réelle et active l’itinéraire', () => {
    renderWithRouter(<PlaceCard place={base} />);
    expect(screen.queryByText('Démo')).not.toBeInTheDocument();
    const btn = screen.getByRole('button', { name: /Itinéraire vers/ });
    expect(btn).toBeEnabled();
    fireEvent.click(btn);
    const menu = screen.getByRole('menu');
    expect(within(menu).getByRole('menuitem', { name: 'Waze' })).toHaveAttribute(
      'href',
      'https://waze.com/ul?ll=48.860000,2.360000&navigate=yes',
    );
  });

  it('marque une donnée de démonstration : badge, « Prix démo », itinéraire désactivé', () => {
    const demo: PlaceWithDistance = {
      ...base,
      price: { amount: 2.9, unit: 'h' },
      source: { name: 'Démo', isDemo: true, updatedAt: null },
    };
    renderWithRouter(<PlaceCard place={demo} />);
    expect(screen.getByText('Démo')).toBeInTheDocument();
    expect(screen.getByText('Prix démo')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Itinéraire disponible avec les données réelles' }),
    ).toBeDisabled();
  });

  it('ajoute et retire un favori', () => {
    renderWithRouter(<PlaceCard place={base} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter aux favoris' }));
    expect(screen.getByRole('button', { name: 'Retirer des favoris' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});

describe('jeu de démonstration', () => {
  it('ne contient que des éléments explicitement marqués comme fictifs', async () => {
    const places = await demoSource.listPlaces();
    const vehicles = await demoSource.listVehicles();
    expect(places.length).toBeGreaterThan(0);
    for (const p of places) {
      expect(p.source.isDemo).toBe(true);
      expect(p.name.toLowerCase()).toContain('démo');
    }
    for (const v of vehicles) expect(v.isDemo).toBe(true);
    expect(demoSource.location.isDemo).toBe(true);
  });
});
