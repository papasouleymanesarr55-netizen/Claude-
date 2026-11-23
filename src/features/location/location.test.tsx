import { fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDemoPlacesProvider } from '@/adapters/places/demo';
import { demoSource } from '@/features/demo/demoSource';
import { renderApp } from '@/test/render';
import { areaCacheKey, zoomForRadius } from './area';
import { GeolocationFailure, requestDevicePosition } from './geolocation';

type Success = (p: GeolocationPosition) => void;
type Failure = (e: GeolocationPositionError) => void;

function mockGeolocation(impl: (ok: Success, ko: Failure) => void) {
  const getCurrentPosition = vi.fn(impl);
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: { getCurrentPosition },
  });
  return getCurrentPosition;
}

const positionAt = (lat: number, lng: number, accuracy = 20) =>
  ({ coords: { latitude: lat, longitude: lng, accuracy } }) as GeolocationPosition;

const positionError = (code: 1 | 2 | 3) =>
  ({ code, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 }) as GeolocationPositionError;

afterEach(() => {
  Reflect.deleteProperty(navigator, 'geolocation');
});

describe('requestDevicePosition', () => {
  it('retourne la position et sa précision', async () => {
    mockGeolocation((ok) => ok(positionAt(45.76, 4.83, 35)));
    await expect(requestDevicePosition()).resolves.toEqual({
      position: { lat: 45.76, lng: 4.83 },
      accuracyM: 35,
    });
  });

  it.each([
    [1, 'denied'],
    [2, 'unavailable'],
    [3, 'timeout'],
  ] as const)('traduit le code %i en « %s »', async (code, kind) => {
    mockGeolocation((_ok, ko) => ko(positionError(code)));
    await expect(requestDevicePosition()).rejects.toEqual(new GeolocationFailure(kind));
  });

  it('signale un navigateur sans géolocalisation', async () => {
    await expect(requestDevicePosition()).rejects.toEqual(new GeolocationFailure('unsupported'));
  });
});

describe('zone de recherche', () => {
  it('adapte le zoom au rayon', () => {
    expect(zoomForRadius(2000)).toBeGreaterThan(zoomForRadius(20_000));
    expect(zoomForRadius(1)).toBeLessThanOrEqual(16);
  });

  it('arrondit la clé de cache à environ 100 m', () => {
    expect(areaCacheKey({ lat: 48.86731, lng: 2.36372 }, 5000)).toBe(
      areaCacheKey({ lat: 48.86719, lng: 2.36368 }, 5000),
    );
  });

  it('l’adaptateur de démo ne renvoie que les lieux dans le rayon', async () => {
    const provider = createDemoPlacesProvider(['charging']);
    const near = await provider.nearby({ center: demoSource.location.position, radiusM: 5000 });
    const far = await provider.nearby({ center: { lat: 45.76, lng: 4.83 }, radiusM: 5000 });
    expect(near.length).toBe(4);
    expect(near.every((p) => p.category === 'charging')).toBe(true);
    expect(far).toEqual([]);
  });
});

describe('géolocalisation dans l’application', () => {
  it('ne demande pas la position au chargement', async () => {
    const spy = mockGeolocation(() => {});
    renderApp('/');
    await screen.findByText('15 établissements');
    expect(spy).not.toHaveBeenCalled();
  });

  it('utilise la position accordée et recalcule les distances', async () => {
    mockGeolocation((ok) => ok(positionAt(45.764, 4.8357, 25)));
    renderApp('/');
    await screen.findByText('15 établissements');
    fireEvent.click(screen.getByRole('button', { name: 'Utiliser ma position' }));
    expect(await screen.findByText('Votre position')).toBeInTheDocument();
    expect(screen.getByText(/Précision ± 25 m/)).toBeInTheDocument();
    // Aucun établissement de démonstration autour de Lyon : rien n'est inventé.
    expect(
      await screen.findByText('Aucun établissement ne correspond à votre recherche.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });

  it('affiche un message clair si l’autorisation est refusée', async () => {
    mockGeolocation((_ok, ko) => ko(positionError(1)));
    renderApp('/');
    await screen.findByText('15 établissements');
    fireEvent.click(screen.getByRole('button', { name: 'Utiliser ma position' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Géolocalisation refusée');
    // Les résultats précédents restent affichés.
    expect(screen.getByText('15 établissements')).toBeInTheDocument();
  });

  it('propose de réessayer après un délai dépassé', async () => {
    const spy = mockGeolocation((_ok, ko) => ko(positionError(3)));
    renderApp('/');
    await screen.findByText('15 établissements');
    fireEvent.click(screen.getByRole('button', { name: 'Utiliser ma position' }));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Délai dépassé');
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('sans position par défaut, invite à choisir une position', async () => {
    renderApp('/', () =>
      Promise.resolve({
        places: [createDemoPlacesProvider(['charging'])],
        geocoding: null,
        categories: ['charging'],
        defaultLocation: null,
        vehicles: [],
      }),
    );
    expect(await screen.findAllByText('Où cherchez-vous ?')).not.toHaveLength(0);
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });

  it('change le rayon de recherche', async () => {
    renderApp('/');
    await screen.findByText('15 établissements');
    const radio = screen.getByRole('radio', { name: '2 km' });
    fireEvent.click(radio);
    expect(radio).toHaveAttribute('aria-checked', 'true');
  });
});
