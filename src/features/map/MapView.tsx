import 'maplibre-gl/dist/maplibre-gl.css';
import { Map as MlMap, Marker, setWorkerUrl, type StyleSpecification } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import { LocateFixed, MapPinOff, Minus, Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { IconButton } from '@/components/ui/IconButton';
import type { PlaceWithDistance } from '@/features/places/types';
import { cn } from '@/lib/cn';
import type { LatLng } from '@/lib/geo';
import { MapPin } from './MapPin';
import { zoomForRadius } from '@/features/location/area';
import { applyBrandPalette, MAP_STYLE_URL } from './mapStyle';

export interface MapViewProps {
  places: PlaceWithDistance[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Zone à afficher : la carte s'y recentre à chaque changement. */
  focus: { center: LatLng; radiusM: number } | null;
  /** Position de l'utilisateur (marqueur « vous êtes ici »), si partagée. */
  userPosition?: LatLng | null;
  /** Bouton « Ma position » : demande ou recentre sur la position de l'utilisateur. */
  onLocate?: () => void;
  locatePending?: boolean;
  /** Centre de la carte après un déplacement fait par l'utilisateur. */
  onUserMove?: (center: LatLng) => void;
  className?: string;
  /** Position des boutons de zoom (ex. sous les filtres sur mobile). */
  controlsClassName?: string;
}

// Le worker MapLibre est servi comme fichier statique par Vite.
setWorkerUrl(workerUrl);

const FRANCE_CENTER: LatLng = { lat: 46.6, lng: 2.4 };

interface MarkerEntry {
  marker: Marker;
  el: HTMLElement;
}

export default function MapView({
  places,
  selectedId,
  onSelect,
  focus,
  userPosition = null,
  onLocate,
  locatePending = false,
  onUserMove,
  className,
  controlsClassName = 'top-3',
}: MapViewProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const [markers, setMarkers] = useState<globalThis.Map<string, MarkerEntry>>(new globalThis.Map());
  const [failed, setFailed] = useState(false);
  const onSelectRef = useRef(onSelect);
  const onUserMoveRef = useRef(onUserMove);
  useEffect(() => {
    onSelectRef.current = onSelect;
    onUserMoveRef.current = onUserMove;
  });

  // Création de la carte (une seule fois).
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const start = focus?.center ?? FRANCE_CENTER;
    let map: MlMap;
    try {
      map = new MlMap({
        container,
        style: MAP_STYLE_URL,
        transformStyle: (_prev: StyleSpecification | undefined, next: StyleSpecification) =>
          applyBrandPalette(next),
        center: [start.lng, start.lat],
        zoom: focus ? zoomForRadius(focus.radiusM) : 5,
        attributionControl: { compact: true },
        dragRotate: false,
        pitchWithRotate: false,
        cooperativeGestures: false,
      });
    } catch {
      // WebGL indisponible : on bascule sur l'état « Carte indisponible ».
      queueMicrotask(() => setFailed(true));
      return;
    }
    map.touchZoomRotate.disableRotation();
    let loaded = false;
    map.on('load', () => {
      loaded = true;
    });
    map.on('error', (e) => {
      // Une tuile ou une source isolée en erreur ne rend pas la carte inutilisable :
      // seul l'échec du style (avant le premier chargement) déclenche l'état de repli.
      const isSourceError = 'sourceId' in e || 'tile' in e;
      if (!loaded && !isSourceError) setFailed(true);
    });
    map.on('moveend', (e) => {
      // Seuls les déplacements faits par l'utilisateur (glisser, zoom) sont signalés.
      if (!('originalEvent' in e) || !e.originalEvent) return;
      const c = map.getCenter();
      onUserMoveRef.current?.({ lat: c.lat, lng: c.lng });
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Synchronisation des marqueurs avec la liste.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const next = new globalThis.Map<string, MarkerEntry>();
    for (const place of places) {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'map-pin';
      el.setAttribute('aria-label', place.name);
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onSelectRef.current(place.id);
      });
      const marker = new Marker({ element: el, anchor: 'bottom' })
        .setLngLat([place.position.lng, place.position.lat])
        .addTo(map);
      next.set(place.id, { marker, el });
    }
    setMarkers(next);
    return () => next.forEach(({ marker }) => marker.remove());
  }, [places]);

  // Recentrage quand la zone de recherche change (position, adresse, rayon).
  const focusKey = focus ? `${focus.center.lat},${focus.center.lng},${focus.radiusM}` : null;
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focus) return;
    map.easeTo({
      center: [focus.center.lng, focus.center.lat],
      zoom: zoomForRadius(focus.radiusM),
      duration: 700,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey]);

  // Marqueur « vous êtes ici ».
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userPosition) return;
    const el = document.createElement('div');
    el.className = 'user-dot';
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', t('map.youAreHere'));
    const marker = new Marker({ element: el, anchor: 'center' })
      .setLngLat([userPosition.lng, userPosition.lat])
      .addTo(map);
    return () => {
      marker.remove();
    };
  }, [userPosition, t]);

  // Mise au premier plan et centrage du marqueur sélectionné.
  useEffect(() => {
    const map = mapRef.current;
    markers.forEach(({ el }, id) => {
      el.style.zIndex = id === selectedId ? '2' : '1';
      el.setAttribute('aria-pressed', String(id === selectedId));
    });
    if (!map || !selectedId) return;
    const place = places.find((p) => p.id === selectedId);
    if (!place) return;
    map.easeTo({
      center: [place.position.lng, place.position.lat],
      duration: 600,
    });
  }, [selectedId, markers, places]);

  return (
    <div className={cn('relative overflow-hidden bg-[#1a201d]', className)}>
      <div ref={containerRef} className="h-full w-full" role="region" aria-label={t('map.label')} />
      {[...markers].map(([id, { el }]) => {
        const place = places.find((p) => p.id === id);
        return place
          ? createPortal(<MapPin category={place.category} selected={id === selectedId} />, el, id)
          : null;
      })}
      {failed ? (
        <div className="absolute inset-0 z-10 grid place-items-center bg-[#1a201d] p-6 text-center">
          <div>
            <MapPinOff aria-hidden className="mx-auto mb-3 size-6 text-muted" />
            <p className="text-sm font-medium">{t('map.unavailable')}</p>
            <p className="mt-1 text-xs text-muted">{t('map.unavailableText')}</p>
          </div>
        </div>
      ) : (
        <div className={cn('absolute right-3 z-10 flex flex-col gap-1.5', controlsClassName)}>
          <div className="flex flex-col overflow-hidden rounded-control border border-white/5 bg-card/90 backdrop-blur">
            <IconButton label={t('map.zoomIn')} size="sm" onClick={() => mapRef.current?.zoomIn()}>
              <Plus className="size-4" />
            </IconButton>
            <span className="mx-2 h-px bg-border" />
            <IconButton
              label={t('map.zoomOut')}
              size="sm"
              onClick={() => mapRef.current?.zoomOut()}
            >
              <Minus className="size-4" />
            </IconButton>
          </div>
          {onLocate && (
            <IconButton
              label={t('map.locate')}
              size="sm"
              aria-busy={locatePending}
              className={cn(
                'border border-white/5 bg-card/90 backdrop-blur',
                userPosition && 'text-accent hover:text-accent',
              )}
              onClick={onLocate}
            >
              <LocateFixed className={cn('size-4', locatePending && 'animate-pulse')} />
            </IconButton>
          )}
        </div>
      )}
    </div>
  );
}
