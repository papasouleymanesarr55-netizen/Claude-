import { Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { useData } from '@/features/data/DataProvider';
import { useFavorites } from '@/features/favorites/useFavorites';
import { PlaceCard } from '@/features/places/PlaceCard';

export function FavoritesPage() {
  const { t } = useTranslation();
  const { places } = useData();
  const { ids } = useFavorites();
  const favorites = ids.map((id) => places.find((p) => p.id === id)).filter((p) => p != null);

  if (favorites.length === 0) {
    return (
      <Card className="mt-2">
        <EmptyState
          icon={Heart}
          title={t('panel.noFavorites')}
          text={t('panel.noFavoritesText')}
          className="py-16"
        />
      </Card>
    );
  }

  return (
    <div className="mt-2 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {favorites.map((place) => (
        <PlaceCard key={place.id} place={place} />
      ))}
    </div>
  );
}
