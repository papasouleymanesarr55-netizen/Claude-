import { FlaskConical } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useData } from '@/features/data/DataProvider';

/** Bandeau permanent tant que l'application affiche des données de démonstration. */
export function DemoBanner() {
  const { t } = useTranslation();
  const { isDemo } = useData();
  if (!isDemo) return null;
  return (
    <div
      role="status"
      className="flex h-[var(--banner-h)] items-center justify-center gap-2 border-b border-accent/15 bg-accent/[0.07] px-4 text-center text-[12px] text-accent"
    >
      <FlaskConical aria-hidden className="size-3.5 shrink-0" />
      <span className="truncate">{t('demo.banner')}</span>
    </div>
  );
}
