import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'ghost' | 'surface' | 'accent' | 'outline';

const variants: Record<Variant, string> = {
  ghost: 'text-muted hover:text-text hover:bg-surface',
  surface: 'bg-surface text-text hover:bg-[#2d3530]',
  accent: 'bg-accent text-bg hover:bg-[#5febbb]',
  outline: 'border border-accent text-accent hover:bg-accent/10',
};

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: Variant;
  size?: 'sm' | 'md';
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, variant = 'ghost', size = 'md', className, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-control transition-colors duration-150',
        'disabled:cursor-not-allowed disabled:bg-surface disabled:text-muted/60 disabled:border-transparent',
        size === 'sm' ? 'size-8' : 'size-10',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
});
