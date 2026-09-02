'use client'

/** Lightweight persistence for the bookmark/"save" toggles. */
const SAVED_KEY = 'afomii.saved'

export function loadSavedIds(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(SAVED_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string') : []
  } catch {
    return []
  }
}

export function persistSavedIds(ids: string[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(SAVED_KEY, JSON.stringify(ids))
  } catch {
    // storage unavailable (private mode / quota) — toggle stays in-memory
  }
}
