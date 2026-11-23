import { useQuery } from '@tanstack/react-query';
import { Building2, Loader2, MapPin, Search } from 'lucide-react';
import { useId, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router';
import type { GeocodingResult } from '@/core/providers/types';
import { useData } from '@/features/data/DataProvider';
import { getCategory } from '@/features/places/categories';
import { filterPlaces } from '@/features/places/filter';
import type { PlaceWithDistance } from '@/features/places/types';
import { cn } from '@/lib/cn';
import { useDebouncedValue } from '@/lib/useDebouncedValue';

const MIN_CHARS = 3;
const DEBOUNCE_MS = 250;

type Option =
  | { type: 'address'; id: string; result: GeocodingResult }
  | { type: 'place'; id: string; place: PlaceWithDistance };

/**
 * Recherche unifiée (combobox) :
 * - adresses, villes et codes postaux via le fournisseur de géocodage ;
 * - établissements de la zone chargée, filtrés aussi dans la liste pendant la saisie.
 */
export function SearchBox({
  searchable,
  autoFocus,
  className,
}: {
  searchable: boolean;
  autoFocus?: boolean;
  className?: string;
}) {
  const { t } = useTranslation();
  const data = useData();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(params.get('q') ?? '');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  // Champ synchronisé avec l'URL (réinitialisation des filtres, navigation).
  const urlQuery = params.get('q') ?? '';
  const [lastUrlQuery, setLastUrlQuery] = useState(urlQuery);
  if (urlQuery !== lastUrlQuery) {
    setLastUrlQuery(urlQuery);
    setValue(urlQuery);
  }

  const query = useDebouncedValue(value.trim(), DEBOUNCE_MS);
  const near = data.location?.position;
  const geocoder = data.geocoding;
  const geocode = useQuery({
    queryKey: ['geocode', geocoder?.info.id, query],
    queryFn: ({ signal }) =>
      geocoder ? geocoder.search(query, near ? { near, limit: 5 } : { limit: 5 }, signal) : [],
    enabled: open && geocoder != null && query.length >= MIN_CHARS,
    staleTime: 60 * 60_000,
    retry: false,
  });

  const options = useMemo<Option[]>(() => {
    const places =
      query.length >= 2
        ? filterPlaces(data.places, { categories: [], query })
            .slice(0, 4)
            .map((place): Option => ({ type: 'place', id: `p-${place.id}`, place }))
        : [];
    const addresses = (geocode.data ?? []).map((result): Option => ({
      type: 'address',
      id: `a-${result.id}`,
      result,
    }));
    return [...addresses, ...places];
  }, [geocode.data, data.places, query]);

  const setUrl = (patch: Record<string, string | null>, path?: string) => {
    if (path) {
      const next = new URLSearchParams();
      for (const [k, v] of Object.entries(patch)) if (v) next.set(k, v);
      navigate(`${path}${next.size ? `?${next}` : ''}`);
      return;
    }
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [k, v] of Object.entries(patch)) {
          if (v) next.set(k, v);
          else next.delete(k);
        }
        return next;
      },
      { replace: true },
    );
  };

  const onType = (q: string) => {
    setValue(q);
    setOpen(true);
    setActive(-1);
    if (searchable) setUrl({ q: q || null });
  };

  const choose = (option: Option) => {
    setOpen(false);
    setActive(-1);
    setValue('');
    if (option.type === 'address') {
      const { result } = option;
      data.setLocation({
        label: result.label,
        context: result.context,
        position: result.position,
        isDemo: false,
        source: 'search',
      });
      if (searchable) setUrl({ q: null, place: null });
      else setUrl({}, '/');
    } else if (searchable) {
      setUrl({ q: null, place: option.place.id });
    } else {
      setUrl({ place: option.place.id }, '/');
    }
    inputRef.current?.blur();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) setOpen(true);
      if (options.length === 0) return;
      const delta = e.key === 'ArrowDown' ? 1 : -1;
      setActive((i) => (i + delta + options.length) % options.length);
    } else if (e.key === 'Enter') {
      const option = options[active] ?? (active === -1 ? options[0] : undefined);
      if (open && option) {
        e.preventDefault();
        choose(option);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActive(-1);
    }
  };

  const showList = open && query.length >= MIN_CHARS;
  const addresses = options.filter((o) => o.type === 'address');
  const places = options.filter((o) => o.type === 'place');
  const activeId = options[active]?.id;

  const renderOption = (option: Option) => {
    const index = options.indexOf(option);
    const Icon =
      option.type === 'address'
        ? option.result.kind === 'municipality'
          ? Building2
          : MapPin
        : getCategory(option.place.category).icon;
    const title = option.type === 'address' ? option.result.label : option.place.name;
    const subtitle =
      option.type === 'address'
        ? option.result.context
        : `${t(`categories.${option.place.category}`)} · ${option.place.address}`;
    return (
      <li
        key={option.id}
        id={`${listId}-${option.id}`}
        role="option"
        aria-selected={index === active}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => choose(option)}
        onMouseEnter={() => setActive(index)}
        className={cn(
          'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2',
          index === active ? 'bg-surface' : 'hover:bg-surface/60',
        )}
      >
        <Icon aria-hidden className="size-4 shrink-0 text-accent" />
        <span className="min-w-0">
          <span className="block truncate text-[13.5px] text-text">{title}</span>
          {subtitle && <span className="block truncate text-[12px] text-muted">{subtitle}</span>}
        </span>
      </li>
    );
  };

  return (
    <div className={cn('relative', className)}>
      <label className="flex h-11 items-center gap-2.5 rounded-full border border-white/[0.05] bg-card px-4 text-muted transition-colors focus-within:border-accent/40">
        {geocode.isFetching ? (
          <Loader2 aria-hidden className="size-4 shrink-0 animate-spin" />
        ) : (
          <Search aria-hidden className="size-4 shrink-0" />
        )}
        <span className="sr-only">{t('topbar.searchLabel')}</span>
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && activeId ? `${listId}-${activeId}` : undefined}
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => onType(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          placeholder={t('topbar.search')}
          className="h-full w-full min-w-0 bg-transparent text-[13.5px] text-text placeholder:text-muted/80 focus:outline-none"
        />
      </label>
      {showList && (
        <div
          id={listId}
          role="listbox"
          aria-label={t('search.suggestions')}
          className="absolute top-[calc(100%+6px)] right-0 left-0 z-50 max-h-[60vh] overflow-y-auto rounded-card border border-border bg-card p-1.5 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.7)]"
        >
          {addresses.length > 0 && (
            <ul role="group" aria-label={t('search.addresses')}>
              <li
                role="presentation"
                className="px-3 pt-1.5 pb-1 text-[11px] tracking-wider text-muted uppercase"
              >
                {t('search.addresses')}
              </li>
              {addresses.map(renderOption)}
            </ul>
          )}
          {places.length > 0 && (
            <ul role="group" aria-label={t('search.places')}>
              <li
                role="presentation"
                className="px-3 pt-2 pb-1 text-[11px] tracking-wider text-muted uppercase"
              >
                {t('search.places')}
              </li>
              {places.map(renderOption)}
            </ul>
          )}
          {options.length === 0 && (
            <p className="px-3 py-2.5 text-[13px] text-muted" role="status">
              {geocode.isFetching
                ? t('search.loading')
                : geocode.isError
                  ? t('search.error')
                  : t('search.noResults')}
            </p>
          )}
          {geocode.isError && options.length > 0 && (
            <p className="px-3 py-2 text-[12px] text-muted" role="status">
              {t('search.addressUnavailable')}
            </p>
          )}
          {addresses.length > 0 && (
            <p className="px-3 pt-1.5 pb-1 text-[10.5px] text-muted/70">
              {t('search.attribution')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
