import { FlaskConical } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';

/** Étiquette obligatoire sur tout contenu issu des données de démonstration. */
export function DemoBadge({ className }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent',
        className,
      )}
    >
      <FlaskConical aria-hidden className="size-3" strokeWidth={2} />
      {t('demo.badge')}
    </span>
  );
}
