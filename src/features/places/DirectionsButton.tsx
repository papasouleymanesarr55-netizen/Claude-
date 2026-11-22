import { CornerUpRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconButton } from '@/components/ui/IconButton';
import { directionsProviders, directionsUrl } from '@/lib/directions';
import type { Place } from './types';

/**
 * Ouvre l'itinéraire dans l'application de navigation choisie.
 * Désactivé pour les établissements de démonstration (lieux fictifs).
 */
export function DirectionsButton({ place, selected }: { place: Place; selected: boolean }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const isDemo = place.source.isDemo;

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (
        e instanceof KeyboardEvent
          ? e.key === 'Escape'
          : !rootRef.current?.contains(e.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative z-10">
      <span title={isDemo ? t('demo.directionsDisabled') : undefined} className="block">
        <IconButton
          label={
            isDemo ? t('demo.directionsDisabled') : t('places.directionsTo', { name: place.name })
          }
          variant={selected ? 'outline' : 'accent'}
          size="sm"
          disabled={isDemo}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={(e) => {
            e.stopPropagation();
            setOpen((o) => !o);
          }}
        >
          <CornerUpRight className="size-4" strokeWidth={2.2} />
        </IconButton>
      </span>
      {open && !isDemo && (
        <div
          role="menu"
          className="absolute right-0 bottom-10 z-20 w-44 overflow-hidden rounded-control border border-border bg-surface py-1 shadow-xl"
        >
          {directionsProviders.map((p) => (
            <a
              key={p.id}
              role="menuitem"
              href={directionsUrl(p.id, place.position)}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-3 py-2 text-sm text-text hover:bg-card"
              onClick={(e) => e.stopPropagation()}
            >
              {p.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
