import type { CategoryId, Place } from '@/features/places/types';
import type { LatLng } from '@/lib/geo';

/** Fiche d'identité d'un fournisseur : affichée dans les mentions et utilisée pour l'attribution. */
export interface ProviderInfo {
  id: string;
  name: string;
  /** Producteur des données (ex. « DGCCRF », « IGN »). */
  producer: string;
  licence: string;
  licenceUrl: string | null;
  /** Page officielle du jeu de données ou du service. */
  url: string | null;
  /** Fréquence de mise à jour annoncée par le producteur. */
  updateFrequency: string | null;
  isDemo: boolean;
}

/** Zone de recherche : un centre et un rayon. */
export interface AreaQuery {
  center: LatLng;
  radiusM: number;
}

/**
 * Contrat d'un fournisseur d'établissements.
 * L'interface ne connaît que ce contrat : remplacer un fournisseur = écrire un nouvel adaptateur.
 */
export interface PlacesProvider {
  info: ProviderInfo;
  categories: CategoryId[];
  /** Durée pendant laquelle une réponse peut être réutilisée sans nouvel appel. */
  cacheTtlMs: number;
  nearby(area: AreaQuery, signal?: AbortSignal): Promise<Place[]>;
}

export type GeocodingKind = 'address' | 'street' | 'municipality' | 'locality';

export interface GeocodingResult {
  id: string;
  label: string;
  /** Complément affiché sous le libellé (code postal, commune, département). */
  context: string;
  kind: GeocodingKind;
  position: LatLng;
}

export interface GeocodingProvider {
  info: ProviderInfo;
  search(
    query: string,
    options: { near?: LatLng; limit?: number },
    signal?: AbortSignal,
  ): Promise<GeocodingResult[]>;
  reverse(position: LatLng, signal?: AbortSignal): Promise<GeocodingResult | null>;
}

/** Erreur normalisée d'un fournisseur, sans détail technique exposé à l'utilisateur. */
export class ProviderError extends Error {
  constructor(
    readonly providerId: string,
    readonly kind: 'network' | 'http' | 'rate-limit' | 'invalid-data' | 'aborted',
    message: string,
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}
