import { MapPinOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <Card className="mt-2">
      <EmptyState
        icon={MapPinOff}
        title={t('pages.notFound')}
        text={t('notFound.text')}
        className="py-16"
        action={
          <Link
            to="/"
            className="inline-flex h-10 items-center rounded-control bg-surface px-4 text-sm font-medium transition-colors hover:bg-[#2d3530]"
          >
            {t('comingSoon.back')}
          </Link>
        }
      />
    </Card>
  );
}
