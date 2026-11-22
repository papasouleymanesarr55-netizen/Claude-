import { Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink } from 'react-router';
import { cn } from '@/lib/cn';
import { BrandMark } from './BrandMark';
import { mainNav, personalNav, type NavItem } from './navigation';

function SidebarLink({ item }: { item: NavItem }) {
  const { t } = useTranslation();
  const label = t(item.labelKey);
  return (
    <li>
      <NavLink
        to={item.to}
        end={item.to === '/'}
        title={label}
        className={({ isActive }) =>
          cn(
            'group relative flex h-11 items-center gap-3.5 rounded-control px-3 text-[14px] transition-colors duration-150',
            'justify-center xl:justify-start',
            isActive ? 'text-accent' : 'text-muted hover:bg-white/[0.03] hover:text-text',
          )
        }
      >
        {({ isActive }) => (
          <>
            <item.icon
              aria-hidden
              className="size-[19px] shrink-0"
              strokeWidth={isActive ? 2 : 1.7}
            />
            <span className="sr-only xl:not-sr-only">{label}</span>
            {isActive && (
              <span
                aria-hidden
                className="absolute top-1.5 -right-3 bottom-1.5 w-[3px] rounded-l-full bg-accent shadow-[0_0_12px_rgba(72,229,173,0.6)] xl:-right-5"
              />
            )}
          </>
        )}
      </NavLink>
    </li>
  );
}

export function Sidebar() {
  const { t } = useTranslation();
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[76px] flex-col border-r border-white/[0.04] bg-sidebar md:flex xl:w-[240px]">
      <div className="flex h-[84px] items-center justify-center border-b border-white/[0.05] px-5 xl:justify-start xl:px-6">
        <Link to="/" aria-label={t('nav.dashboard')}>
          <BrandMark className="xl:hidden" compact />
          <BrandMark className="hidden xl:flex" />
        </Link>
      </div>

      <nav
        className="flex flex-1 flex-col gap-7 overflow-y-auto px-3 py-7 xl:px-5"
        aria-label={t('nav.main')}
      >
        <div>
          <p className="mb-2 hidden px-3 text-[11px] font-medium tracking-wider text-muted/70 uppercase xl:block">
            {t('nav.main')}
          </p>
          <ul className="flex flex-col gap-1">
            {mainNav.map((item) => (
              <SidebarLink key={item.to} item={item} />
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-2 hidden px-3 text-[11px] font-medium tracking-wider text-muted/70 uppercase xl:block">
            {t('nav.personal')}
          </p>
          <span aria-hidden className="mx-auto mb-3 block h-px w-8 bg-border xl:hidden" />
          <ul className="flex flex-col gap-1">
            {personalNav.map((item) => (
              <SidebarLink key={item.to} item={item} />
            ))}
          </ul>
        </div>
      </nav>

      <div className="hidden p-5 xl:block">
        <div className="relative overflow-hidden rounded-card border border-white/[0.05] bg-card p-4">
          <div
            aria-hidden
            className="absolute -top-10 -right-8 size-28 rounded-full bg-accent/10 blur-2xl"
          />
          <Sparkles aria-hidden className="relative size-5 text-accent" />
          <p className="relative mt-3 text-[14px] font-medium">{t('premium.title')}</p>
          <p className="relative mt-1 text-[12px] leading-relaxed text-muted">
            {t('premium.text')}
          </p>
          <Link
            to="/abonnement"
            className="relative mt-4 flex h-9 items-center justify-center rounded-control bg-accent text-[13px] font-semibold text-bg transition-colors hover:bg-[#5febbb]"
          >
            {t('premium.cta')}
          </Link>
        </div>
      </div>
    </aside>
  );
}
