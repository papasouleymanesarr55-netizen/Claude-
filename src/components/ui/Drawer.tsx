import { X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { IconButton } from './IconButton';

/** Tiroir latéral droit, modal, fermable avec Échap ou en cliquant à l'extérieur. */
export function Drawer({
  open,
  onClose,
  title,
  closeLabel,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  closeLabel: string;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    panelRef.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <div
      className={cn('fixed inset-0 z-50', open ? 'pointer-events-auto' : 'pointer-events-none')}
      aria-hidden={!open}
    >
      <div
        className={cn(
          'absolute inset-0 bg-black/60 transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0',
        )}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        inert={!open}
        className={cn(
          'absolute inset-y-0 right-0 flex w-[min(380px,100%)] flex-col bg-bg shadow-2xl outline-none',
          'transition-transform duration-300 ease-out-soft',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <p className="text-base font-medium">{title}</p>
          <IconButton label={closeLabel} onClick={onClose}>
            <X className="size-5" />
          </IconButton>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-6">{children}</div>
      </div>
    </div>
  );
}
