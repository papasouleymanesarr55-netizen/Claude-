import { getCategory } from '@/features/places/categories';
import type { CategoryId } from '@/features/places/types';
import { cn } from '@/lib/cn';

/** Marqueur en goutte, icône de catégorie au centre. */
export function MapPin({ category, selected }: { category: CategoryId; selected: boolean }) {
  const Icon = getCategory(category).icon;
  return (
    <span
      className={cn(
        'relative block transition-transform duration-200 ease-out-soft',
        selected ? 'scale-[1.18]' : 'hover:scale-110',
      )}
      style={{ transformOrigin: '50% 100%' }}
    >
      {selected && (
        <span
          aria-hidden
          className="absolute top-[34px] left-1/2 h-3 w-7 -translate-x-1/2 rounded-[50%] bg-accent/45 blur-[3px]"
        />
      )}
      <svg
        width="34"
        height="42"
        viewBox="0 0 34 42"
        aria-hidden
        className="relative drop-shadow-[0_4px_10px_rgba(0,0,0,0.45)]"
      >
        <path
          d="M17 41c-.6 0-1.1-.3-1.5-.8C9.4 32.4 2 24.3 2 16.6 2 8 8.7 1.5 17 1.5S32 8 32 16.6c0 7.7-7.4 15.8-13.5 23.6-.4.5-.9.8-1.5.8Z"
          fill={selected ? '#48E5AD' : '#3fcf9c'}
          stroke="#101211"
          strokeOpacity="0.35"
        />
      </svg>
      <Icon
        aria-hidden
        className="absolute top-[8px] left-1/2 size-[17px] -translate-x-1/2 text-[#0d1110]"
        strokeWidth={2.2}
      />
    </span>
  );
}
