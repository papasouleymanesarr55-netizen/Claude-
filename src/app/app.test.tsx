import { fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { demoSource } from '@/features/demo/demoSource';
import { renderApp } from '@/test/render';

const loadDemo = () => Promise.resolve(demoSource);
const loadNone = () => Promise.resolve(null);

describe('Application', () => {
  it('affiche le bandeau de démonstration et les établissements de démo', async () => {
    renderApp('/', loadDemo);
    expect(await screen.findByText(/Données de démonstration/)).toBeInTheDocument();
    expect(await screen.findByText('15 établissements')).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(15);
  });

  it('filtre par catégorie via les pastilles et l’URL', async () => {
    const { router } = renderApp('/', loadDemo);
    await screen.findByText('15 établissements');
    const filters = screen.getByRole('group', { name: 'Filtrer par catégorie' });
    fireEvent.click(within(filters).getByRole('button', { name: 'Parking' }));
    expect(await screen.findByText('3 établissements')).toBeInTheDocument();
    expect(router.state.location.search).toBe('?cat=parking');
  });

  it('restreint la page Bornes de recharge à sa catégorie', async () => {
    renderApp('/recharge', loadDemo);
    expect(await screen.findByText('4 établissements')).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Filtrer par catégorie' })).not.toBeInTheDocument();
  });

  it('recherche un établissement depuis la barre supérieure', async () => {
    renderApp('/', loadDemo);
    await screen.findByText('15 établissements');
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'bastille' } });
    expect(await screen.findByText('1 établissement')).toBeInTheDocument();
  });

  it('indique la page active dans la navigation', async () => {
    renderApp('/parkings', loadDemo);
    const nav = await screen.findByRole('navigation', { name: 'Navigation' });
    expect(within(nav).getByRole('link', { name: 'Parkings' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('sans source de données, n’affiche aucune donnée fictive ni bandeau démo', async () => {
    renderApp('/', loadNone);
    expect(await screen.findAllByText('Aucune source de données connectée')).not.toHaveLength(0);
    expect(screen.queryByText(/Données de démonstration/)).not.toBeInTheDocument();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
    expect(screen.getAllByText('Aucun véhicule enregistré').length).toBeGreaterThan(0);
  });
});
