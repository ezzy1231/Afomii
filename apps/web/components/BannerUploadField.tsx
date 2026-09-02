'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import NextImage from 'next/image'
import { Check, ImagePlus, Loader2, RefreshCcw, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

/**
 * Required banner upload for restaurant listings and events.
 *
 * - Client-side validation: jpg/png/webp, max 5 MB.
 * - Client-side compression: downscales to max 1600px wide and re-encodes as
 *   JPEG q0.85 via canvas, so uploads stay well under the bucket cap.
 * - Previews the compressed image before upload.
 * - Uploads directly to Supabase Storage (banners/<user-id>/<timestamp>.<ext>)
 *   using the browser client, which carries the authenticated session, then
 *   writes the public URL into a hidden input that flows through the form's
 *   FormData to the server action.
 *
 * Props:
 *  - fieldName: hidden-input name the server action reads (coverUrl / coverImageUrl)
 *  - onReady: fires with true/false so the parent can gate the submit button.
 */

const MAX_BYTES = 5 * 1024 * 1024
const MAX_WIDTH = 1600
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']

type Status = 'idle' | 'processing' | 'preview' | 'uploading' | 'done' | 'error'

export default function BannerUploadField({
  fieldName,
  label = 'Banner image',
  hint = 'jpg, png or webp · up to 5 MB · shows on the listing and detail pages',
  onReady,
}: {
  fieldName: string
  label?: string
  hint?: string
  onReady?: (ready: boolean) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [publicUrl, setPublicUrl] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  // Surface readiness to the parent form.
  useEffect(() => {
    onReady?.(status === 'done')
  }, [status, onReady])

  const reset = useCallback(() => {
    setStatus('idle')
    setPreviewUrl(null)
    setPublicUrl('')
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }, [])

  async function compress(file: File): Promise<Blob> {
    // Downscale to MAX_WIDTH and re-encode as JPEG. Returns original file when
    // it is already small and within the bucket limits to avoid re-encoding.
    if (file.size < 350 * 1024 && file.type === 'image/jpeg') return file

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('Could not read the selected file.'))
      reader.readAsDataURL(file)
    })

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error('The selected file is not a valid image.'))
      image.src = dataUrl
    })

    const scale = Math.min(1, MAX_WIDTH / img.width)
    const width = Math.max(1, Math.round(img.width * scale))
    const height = Math.max(1, Math.round(img.height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('This browser cannot process images.')
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, width, height)
    ctx.drawImage(img, 0, 0, width, height)

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', 0.85)
    })
    if (!blob) throw new Error('Could not compress the image.')
    return blob
  }

  async function handleFile(file: File | null) {
    if (!file) return
    setError(null)

    if (!ACCEPTED.includes(file.type)) {
      setStatus('error')
      setError('Please choose a jpg, png or webp image.')
      return
    }
    if (file.size > MAX_BYTES) {
      setStatus('error')
      setError('Image is larger than 5 MB. Please pick a smaller file.')
      return
    }

    setStatus('processing')
    try {
      const blob = await compress(file)
      const preview = URL.createObjectURL(blob)
      setPreviewUrl(preview)
      setStatus('preview')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Could not process the image.')
    }
  }

  async function upload() {
    if (!previewUrl || status !== 'preview') return
    setStatus('uploading')
    setError(null)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Please sign in again before uploading a banner.')

      const response = await fetch(previewUrl)
      const blob = await response.blob()
      const ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg'
      const path = `${user.id}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage.from('banners').upload(path, blob, {
        contentType: blob.type,
        cacheControl: '3600',
        upsert: false,
      })
      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('banners').getPublicUrl(path)
      setPublicUrl(urlData.publicUrl)
      setStatus('done')
    } catch (err) {
      setStatus('preview')
      const msg =
        err instanceof Error && err.message.includes('bucket')
          ? 'Banner storage is not set up yet — the "banners" bucket must be created first (migration 0011).'
          : err instanceof Error
            ? err.message
            : 'Upload failed. Please try again.'
      setError(msg)
    }
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name={fieldName} value={publicUrl} />

      {status === 'done' ? (
        <div className="overflow-hidden rounded-2xl border border-app-border bg-app-card shadow-soft">
          <div className="relative aspect-[16/7] w-full">
            {publicUrl ? (
              <NextImage src={publicUrl} alt="Banner preview" fill sizes="640px" className="object-cover" />
            ) : null}
          </div>
          <div className="flex items-center justify-between gap-3 p-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-success">
              <Check className="size-4" strokeWidth={3} />
              Banner uploaded
            </p>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-[10px] border border-app-border bg-app-card px-3 py-2 text-xs font-bold text-app-fg transition-all hover:-translate-y-0.5 hover:shadow-soft active:translate-y-0 active:shadow-none"
            >
              <RefreshCcw className="size-3.5" strokeWidth={2.5} />
              Replace
            </button>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              inputRef.current?.click()
            }
          }}
          className={cn(
            'group relative flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-app-border bg-app-input/50 p-4 text-center transition-all hover:border-ember hover:bg-app-card',
            status === 'error' && 'border-danger'
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />

          {status === 'preview' && previewUrl ? (
            <>
              <div className="relative aspect-[16/7] w-full overflow-hidden rounded-xl border border-app-border">
                <NextImage src={previewUrl} alt="Banner preview" fill sizes="640px" className="object-cover" />
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    void upload()
                  }}
                  className="btn-primary !py-2 text-xs"
                >
                  Upload banner
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    reset()
                  }}
                  className="inline-flex items-center gap-1 rounded-[10px] border border-app-border bg-app-card px-3 py-2 text-xs font-bold text-app-muted transition-all hover:text-danger"
                >
                  <Trash2 className="size-3.5" strokeWidth={2.5} />
                  Remove
                </button>
              </div>
            </>
          ) : status === 'uploading' ? (
            <>
              <Loader2 className="size-8 animate-spin text-ember" strokeWidth={2.5} />
              <p className="text-xs font-semibold text-app-fg">Uploading banner…</p>
            </>
          ) : status === 'processing' ? (
            <>
              <Loader2 className="size-8 animate-spin text-ember" strokeWidth={2.5} />
              <p className="text-xs font-semibold text-app-fg">Optimizing image…</p>
            </>
          ) : (
            <>
              <span className="flex size-12 items-center justify-center rounded-2xl border border-app-border bg-app-card text-ember shadow-soft transition-transform group-hover:-translate-y-0.5 group-hover:rotate-6">
                <ImagePlus className="size-6" strokeWidth={2.2} />
              </span>
              <span className="text-sm font-extrabold text-app-fg">{label}</span>
              <span className="max-w-sm text-xs text-app-muted">{hint}</span>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
