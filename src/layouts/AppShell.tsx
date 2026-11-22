import type { CSSProperties } from 'react';
import { Outlet } from 'react-router';
import { useData } from '@/features/data/DataProvider';
import { DemoBanner } from './DemoBanner';
import { MobileNav } from './MobileNav';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { ShellStateProvider } from './shellState';

function ShellContent() {
  const { isDemo } = useData();
  return (
    <div
      className="flex min-h-dvh flex-col md:pl-[76px] xl:pl-[240px]"
      style={{ '--banner-offset': isDemo ? 'var(--banner-h)' : '0px' } as CSSProperties}
    >
      <DemoBanner />
      <TopBar />
      <main className="flex-1 px-4 pt-1 pb-[calc(88px+env(safe-area-inset-bottom))] md:px-6 md:pb-8 xl:px-8">
        <Outlet />
      </main>
    </div>
  );
}

export function AppShell() {
  return (
    <ShellStateProvider>
      <Sidebar />
      <ShellContent />
      <MobileNav />
    </ShellStateProvider>
  );
}
