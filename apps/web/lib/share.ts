'use client'

/** Share the current page (navigator.share) with a clipboard fallback. */
export async function sharePage(title: string, url: string): Promise<'shared' | 'copied' | 'failed'> {
  const href = url.startsWith('http') ? url : `${window.location.origin}${url}`

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, url: href })
      return 'shared'
    } catch (err) {
      // AbortError = user dismissed the sheet; fall through to clipboard for
      // other failures (e.g. share not supported on desktop browsers).
      if ((err as Error)?.name === 'AbortError') return 'shared'
    }
  }

  try {
    await navigator.clipboard.writeText(href)
    return 'copied'
  } catch {
    return 'failed'
  }
}
