import { Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { IconButton } from '@/components/ui/IconButton';
import { useFavorites } from '@/features/favorites/useFavorites';
import { cn } from '@/lib/cn';

export function FavoriteButton({ placeId }: { placeId: string }) {
  const { t } = useTranslation();
  const { isFavorite, toggle } = useFavorites();
  const active = isFavorite(placeId);
  return (
    <IconButton
      label={active ? t('places.removeFavorite') : t('places.addFavorite')}
      size="sm"
      aria-pressed={active}
      className={cn('size-7', active && 'text-accent hover:text-accent')}
      onClick={(e) => {
        e.stopPropagation();
        toggle(placeId);
      }}
    >
      <Heart className="size-4" fill={active ? 'currentColor' : 'none'} />
    </IconButton>
  );
}
