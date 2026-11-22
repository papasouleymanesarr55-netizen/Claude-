import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function EmptyState({
  icon: Icon,
  title,
  text,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  text?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center px-6 py-10 text-center', className)}
    >
      <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-surface text-accent">
        <Icon aria-hidden className="size-5" />
      </span>
      <p className="text-[15px] font-medium">{title}</p>
      {text && <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
