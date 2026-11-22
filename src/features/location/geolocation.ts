import type { LatLng } from '@/lib/geo';

export type GeolocationErrorKind =
  'denied' | 'unavailable' | 'timeout' | 'unsupported' | 'insecure';

export interface DevicePosition {
  position: LatLng;
  accuracyM: number;
}

export class GeolocationFailure extends Error {
  constructor(readonly kind: GeolocationErrorKind) {
    super(kind);
    this.name = 'GeolocationFailure';
  }
}

const OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 10_000,
  // Une position de moins d'une minute est réutilisée : évite de solliciter le GPS inutilement.
  maximumAge: 60_000,
};

/**
 * Demande la position de l'appareil. À n'appeler qu'après une action explicite de l'utilisateur.
 * La position n'est ni stockée ni transmise par cette fonction.
 */
export function requestDevicePosition(): Promise<DevicePosition> {
  if (typeof window !== 'undefined' && window.isSecureContext === false) {
    return Promise.reject(new GeolocationFailure('insecure'));
  }
  if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
    return Promise.reject(new GeolocationFailure('unsupported'));
  }
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          position: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          accuracyM: Math.round(pos.coords.accuracy),
        }),
      (err) => {
        const kind: GeolocationErrorKind =
          err.code === err.PERMISSION_DENIED
            ? 'denied'
            : err.code === err.TIMEOUT
              ? 'timeout'
              : 'unavailable';
        reject(new GeolocationFailure(kind));
      },
      OPTIONS,
    );
  });
}
