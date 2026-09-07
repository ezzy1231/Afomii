'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Bell, Check, Loader2 } from 'lucide-react'
import type { ConsumerNotification } from '@/lib/supabase/queries'
import { markNotificationsRead } from '@/app/plans/actions'
import { cn } from '@/lib/utils'

export default function NotificationsBell({ initialCount }: { initialCount: number }) {
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(initialCount)
  const [notifications, setNotifications] = useState<ConsumerNotification[]>([])
  const [loading, setLoading] = useState(false)
  const [loadedOnce, setLoadedOnce] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications/user')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications ?? [])
        setUnread(data.unread ?? 0)
        setLoadedOnce(true)
      }
    } catch {
      // fallback silently
    } finally {
      setLoading(false)
    }
  }, [])

  // Refetch whenever the dropdown opens so newly created notifications
  // (bookings, confirmations, ticket purchases) show up without a reload.
  const handleOpen = () => {
    setOpen((prev) => {
      const next = !prev
      if (next) fetchNotifications()
      return next
    })
  }

  // Light polling keeps the badge fresh while the user is on the page.
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') fetchNotifications()
    }, 30_000)
    return () => clearInterval(id)
  }, [fetchNotifications])

  const handleMarkRead = useCallback(
    async (id?: string) => {
      const count = await markNotificationsRead(id)
      setUnread(count)
      if (id) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)),
        )
      } else {
        setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })))
      }
    },
    [],
  )

  const ago = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime()
    const min = Math.floor(diff / 60_000)
    if (min < 1) return 'just now'
    if (min < 60) return `${min}m ago`
    const hr = Math.floor(min / 60)
    if (hr < 24) return `${hr}h ago`
    return `${Math.floor(hr / 24)}d ago`
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Notifications"
        className="relative flex size-9 items-center justify-center rounded-xl text-app-muted transition-all hover:bg-app-elevated/70 hover:text-app-fg active:scale-95"
      >
        <Bell className="size-4" strokeWidth={2.5} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-ember text-[9px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="animate-pop-in absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-white/50 bg-white/75 shadow-glass-strong backdrop-blur-2xl backdrop-saturate-150 dark:border-white/10 dark:bg-white/8">
          <div className="flex items-center justify-between border-b border-app-border px-4 py-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-app-fg">Notifications</h3>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => handleMarkRead()}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-ember hover:underline"
              >
                <Check className="size-3" strokeWidth={3} />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading && !loadedOnce ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-5 animate-spin text-ember" strokeWidth={2.5} />
              </div>
            ) : notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs font-medium text-app-muted">
                No notifications yet.
              </p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => !n.readAt && handleMarkRead(n.id)}
                  disabled={!!n.readAt}
                  className={cn(
                    'flex w-full gap-3 border-b border-app-border px-4 py-3 text-left transition-colors',
                    n.readAt ? 'opacity-50' : 'hover:bg-app-input/60',
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-app-fg">{n.title}</p>
                    {n.body && <p className="mt-0.5 text-[11px] leading-tight text-app-muted">{n.body}</p>}
                    <p className="mt-1 text-[10px] font-medium text-app-muted">{ago(n.createdAt)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
