import { useTranslation } from 'react-i18next';
import { Chip } from '@/components/ui/Chip';
import { cn } from '@/lib/cn';
import { categories } from './categories';
import type { CategoryId } from './types';

export function CategoryFilters({
  available,
  selected,
  onChange,
  className,
}: {
  available: CategoryId[];
  selected: CategoryId[];
  onChange: (next: CategoryId[]) => void;
  className?: string;
}) {
  const { t } = useTranslation();
  const items = categories.filter((c) => available.includes(c.id));
  if (items.length <= 1) return null;

  const toggle = (id: CategoryId) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  return (
    <div
      role="group"
      aria-label={t('places.filters')}
      className={cn('no-scrollbar flex gap-2 overflow-x-auto', className)}
    >
      <Chip active={selected.length === 0} onClick={() => onChange([])}>
        {t('categories.all')}
      </Chip>
      {items.map(({ id, icon: Icon }) => (
        <Chip
          key={id}
          active={selected.includes(id)}
          onClick={() => toggle(id)}
          icon={<Icon aria-hidden className="size-4" strokeWidth={1.9} />}
        >
          {t(`categories.${id}`)}
        </Chip>
      ))}
    </div>
  );
}
