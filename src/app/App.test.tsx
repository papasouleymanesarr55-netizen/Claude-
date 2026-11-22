import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { brand } from '@/config/brand';
import { App } from './App';

describe('App', () => {
  it('affiche le nom de marque issu de la configuration', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: brand.name })).toBeInTheDocument();
  });

  it('signale que le nom est provisoire', () => {
    render(<App />);
    expect(screen.getByText('Nom provisoire')).toBeInTheDocument();
  });
});
