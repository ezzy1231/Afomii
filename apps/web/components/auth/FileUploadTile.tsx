'use client'

import { useRef } from 'react'
import { cn } from '@/lib/utils'

/**
 * Visual-only upload tiles ported from the Stitch partner/onboarding
 * artboards. Selections are held in local state; wiring them to a storage
 * bucket is a deliberate follow-up (no bucket exists yet).
 */

const CheckBadge = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-success">
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
      clipRule="evenodd"
    />
  </svg>
)

type FileUploadTileProps = {
  label: string
  variant?: 'square' | 'wide'
  fileName?: string | null
  onSelect: (file: File | null) => void
}

export function FileUploadTile({ label, variant = 'square', fileName, onSelect }: FileUploadTileProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const hasFile = Boolean(fileName)

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={cn(
          'flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-4 text-center transition-colors',
          variant === 'square' ? 'aspect-square' : 'aspect-[2/1]',
          hasFile ? 'border-success/50 bg-success/5' : 'border-app-border bg-app-input/60 hover:border-gold/60'
        )}
      >
        {hasFile ? (
          <>
            <CheckBadge />
            <span className="line-clamp-2 max-w-full break-all px-1 text-xs font-medium text-app-fg">{fileName}</span>
          </>
        ) : (
          <>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6 text-app-muted">
              {variant === 'square' ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              ) : (
                <>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 19.5h16.5a1.5 1.5 0 0 0 1.5-1.5V6A1.5 1.5 0 0 0 20.25 4.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Z" />
                </>
              )}
            </svg>
            <span className="px-1 text-xs font-semibold text-app-muted">{label}</span>
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onSelect(e.target.files?.[0] ?? null)}
      />
    </div>
  )
}

type DocumentUploadRowProps = {
  label: string
  hint?: string
  fileName?: string | null
  accept?: string
  onSelect: (file: File | null) => void
}

/** Horizontal drop-zone row used for license / verification documents. */
export function DocumentUploadRow({ label, hint, fileName, accept = '.pdf,image/*', onSelect }: DocumentUploadRowProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const hasFile = Boolean(fileName)

  return (
    <div className="flex items-center gap-3.5">
      <span
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border',
          hasFile ? 'border-success/50 bg-success/10 text-success' : 'border-app-border bg-app-input text-app-muted'
        )}
      >
        {hasFile ? (
          <CheckBadge />
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
            />
          </svg>
        )}
      </span>
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-sm font-semibold text-app-fg underline-offset-2 hover:underline"
        >
          {hasFile ? fileName : label}
        </button>
        {hint && <p className="mt-0.5 text-xs text-app-muted">{hint}</p>}
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="btn-secondary tap-target !rounded-full !py-2 text-xs"
      >
        Browse files
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => onSelect(e.target.files?.[0] ?? null)}
      />
    </div>
  )
}
