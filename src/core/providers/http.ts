import { ProviderError } from './types';

/** Délai maximal d'une requête : au-delà, la source est considérée comme indisponible. */
export const REQUEST_TIMEOUT_MS = 8_000;

/** `fetch` + JSON avec délai maximal et erreurs normalisées pour l'interface. */
export async function fetchJson(
  providerId: string,
  url: string,
  signal?: AbortSignal,
): Promise<unknown> {
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(url, { signal: signal ? AbortSignal.any([signal, timeout]) : timeout });
  } catch (e) {
    if (signal?.aborted) throw new ProviderError(providerId, 'aborted', 'Requête annulée');
    const timedOut = timeout.aborted || (e instanceof DOMException && e.name === 'TimeoutError');
    throw new ProviderError(
      providerId,
      'network',
      timedOut ? 'Délai de réponse dépassé' : 'Service injoignable',
    );
  }
  if (res.status === 429) throw new ProviderError(providerId, 'rate-limit', 'Quota atteint');
  if (!res.ok) throw new ProviderError(providerId, 'http', `HTTP ${res.status}`);
  try {
    return await res.json();
  } catch {
    throw new ProviderError(providerId, 'invalid-data', 'Réponse illisible');
  }
}
