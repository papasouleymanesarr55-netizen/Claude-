import { brand } from '@/config/brand';
import { cn } from '@/lib/cn';

/** Logo provisoire : pictogramme abstrait + nom issu de la configuration de marque. */
export function BrandMark({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden>
        <rect width="32" height="32" rx="9" fill="#48E5AD" fillOpacity="0.12" />
        <path
          d="M16 6.5a8.5 8.5 0 0 1 8.5 8.5c0 5.6-6 10.4-7.7 11.7a1.3 1.3 0 0 1-1.6 0C13.5 25.4 7.5 20.6 7.5 15A8.5 8.5 0 0 1 16 6.5Z"
          fill="none"
          stroke="#48E5AD"
          strokeWidth="2.2"
        />
        <circle cx="16" cy="15" r="3.2" fill="#48E5AD" />
      </svg>
      {!compact && (
        <span className="text-[19px] font-semibold tracking-tight whitespace-nowrap">
          {brand.name}
        </span>
      )}
    </span>
  );
}
