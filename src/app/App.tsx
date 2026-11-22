import { useTranslation } from 'react-i18next';
import { brand } from '@/config/brand';

export function App() {
  const { t } = useTranslation();

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <section className="w-full max-w-md rounded-card border border-border bg-card p-6 shadow-card">
        <div className="flex items-center gap-3">
          <span aria-hidden className="size-2.5 rounded-full bg-accent" />
          <h1 className="text-lg font-semibold tracking-tight">{brand.name}</h1>
          {brand.isProvisional && (
            <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-xs text-muted">
              {t('app.provisionalName')}
            </span>
          )}
        </div>
        <p className="mt-4 text-sm font-medium">{t('app.status')}</p>
        <p className="mt-1 text-sm text-muted">{t('app.statusDetail')}</p>
      </section>
    </main>
  );
}
