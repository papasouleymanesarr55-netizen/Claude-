import { useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';

/**
 * Panneau mobile qui remonte du bas de l'écran, au-dessus de la barre de navigation.
 * Deux positions : réduit (aperçu) et déplié. Bascule au tap ou en glissant la poignée.
 */
export function BottomSheet({
  header,
  children,
  expanded,
  onExpandedChange,
}: {
  header: ReactNode;
  children: ReactNode;
  expanded: boolean;
  onExpandedChange: (v: boolean) => void;
}) {
  const { t } = useTranslation();
  const startY = useRef<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [dragging, setDragging] = useState(false);

  const onPointerDown = (e: React.PointerEvent) => {
    startY.current = e.clientY;
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (startY.current == null) return;
    setDragOffset(e.clientY - startY.current);
  };
  const onPointerUp = () => {
    if (startY.current == null) return;
    if (dragOffset < -40) onExpandedChange(true);
    else if (dragOffset > 40) onExpandedChange(false);
    else if (Math.abs(dragOffset) < 5) onExpandedChange(!expanded);
    startY.current = null;
    setDragging(false);
    setDragOffset(0);
  };

  return (
    <section
      className={cn(
        'fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-30 flex flex-col rounded-t-[22px] border-t border-white/[0.06] bg-bg/95 shadow-[0_-12px_40px_-12px_rgba(0,0,0,0.6)] backdrop-blur-md',
        !dragging && 'transition-[height] duration-300 ease-out-soft',
      )}
      style={{
        height: `calc(${expanded ? '72dvh' : '128px'} - ${dragging ? dragOffset : 0}px)`,
      }}
    >
      <button
        type="button"
        aria-expanded={expanded}
        aria-label={expanded ? t('places.hideList') : t('places.showList')}
        className="flex touch-none justify-center pt-2.5 pb-1.5"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <span className="h-1 w-10 rounded-full bg-[#3a443e]" />
      </button>
      <div className="px-4 pb-2">{header}</div>
      <div className={cn('flex-1 px-4 pb-4', expanded ? 'overflow-y-auto' : 'overflow-hidden')}>
        {children}
      </div>
    </section>
  );
}
