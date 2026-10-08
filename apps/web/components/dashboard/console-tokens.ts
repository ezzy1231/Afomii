import type { ConsoleTone } from '@/lib/console-types'

/**
 * Plain string constants for the partner console. Kept out of the
 * `console-shell` / `console-primitives` client modules so server
 * components can import them (same reason `console-shared.ts` exists).
 */

export const TONE_SURFACE: Record<ConsoleTone, string> = {
  indigo: 'bg-console-indigo-soft',
  mint: 'bg-console-mint',
  blush: 'bg-console-blush',
  sand: 'bg-console-sand',
  sky: 'bg-console-sky',
}

export const TONE_INK: Record<ConsoleTone, string> = {
  indigo: 'text-console-indigo',
  mint: 'text-console-mint-ink',
  blush: 'text-console-blush-ink',
  sand: 'text-console-sand-ink',
  sky: 'text-console-sky-ink',
}

export const CONSOLE_CARD =
  'rounded-2xl border border-console-border bg-console-card shadow-console-card'

export const CONSOLE_PRIMARY_BUTTON =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-console-indigo px-4 text-sm font-semibold text-white shadow-[0_6px_18px_rgb(91_63_240/0.28)] transition-colors duration-200 hover:bg-console-indigo-deep'

export const CONSOLE_SECONDARY_BUTTON =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-console-border bg-console-card px-4 text-sm font-semibold text-console-ink transition-colors duration-200 hover:bg-console-bg'