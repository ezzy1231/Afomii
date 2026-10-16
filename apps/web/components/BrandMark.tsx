import { cn } from '@/lib/utils'

/** UrbanExplore mark: a "U" that doubles as a route bending toward a pin. */
export function BrandMark({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        'relative inline-flex size-9 shrink-0 items-center justify-center rounded-[10px]',
        inverted ? 'bg-[rgb(251_245_240)] text-[rgb(11_31_58)]' : 'bg-ember text-on-accent',
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="size-[22px]" fill="none">
        <path d="M6.5 5v7.5a5.5 5.5 0 0 0 11 0V5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
        <circle cx="17.5" cy="5" r="2.2" fill="rgb(var(--gold-rgb))" />
      </svg>
    </span>
  )
}

export function BrandWordmark({ inverted = false, className }: { inverted?: boolean; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <BrandMark inverted={inverted} />
      <span className={cn('font-display text-[1.2rem] font-bold tracking-[-0.03em]', inverted ? 'text-[rgb(251_245_240)]' : 'text-app-fg')}>
        UrbanExplore
      </span>
    </span>
  )
}
