import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router';
import { cn } from '@/lib/cn';
import { mobileNav } from './navigation';

export function MobileNav() {
  const { t } = useTranslation();
  return (
    <nav
      aria-label={t('nav.mobile')}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.06] bg-sidebar/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="grid h-16 grid-cols-5">
        {mobileNav.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'relative flex h-full flex-col items-center justify-center gap-1 text-[10.5px] transition-colors',
                  isActive ? 'text-accent' : 'text-muted',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span
                      aria-hidden
                      className="absolute top-0 h-[2px] w-8 rounded-b-full bg-accent"
                    />
                  )}
                  <item.icon aria-hidden className="size-[21px]" strokeWidth={isActive ? 2 : 1.7} />
                  <span>{t(item.shortLabelKey ?? item.labelKey)}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
