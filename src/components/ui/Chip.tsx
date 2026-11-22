import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active: boolean;
  icon?: ReactNode;
}

export function Chip({ active, icon, className, children, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        'inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 text-[13px] font-medium transition-colors duration-150',
        active
          ? 'border-accent/40 bg-accent/12 text-accent'
          : 'border-border bg-surface/60 text-muted hover:text-text hover:border-[#3a443e]',
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
