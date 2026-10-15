"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Client-side session state for the shared chrome (header, footer).
 *
 * WHY THIS EXISTS — it is a performance fix, not a style preference.
 *
 * `Navbar` and `PageFooter` used to be async server components calling
 * `createClient()` from lib/supabase/server, which calls `cookies()`. In the App
 * Router, reading cookies anywhere in a route's render tree opts that ENTIRE
 * route out of static rendering. Both sit on nearly every public page, so every
 * page shipped as `ƒ` (rendered on demand) with
 * `cache-control: private, no-store` — nothing cacheable at the CDN, plus two
 * extra Supabase round-trips per request. Measured on the deployed site: ~420ms
 * TTFB on a purely static page such as /about, against ~160ms for routes that
 * were already static.
 *
 * It talks to /api/session rather than importing @supabase/supabase-js, because
 * a client-side Supabase client put ~70 kB of extra shared JavaScript on every
 * page — including /about and /terms, which need almost none.
 *
 * What the header shows is cosmetic. The authorisation boundary is
 * middleware.ts, untouched here, so none of this weakens access control.
 */
type SessionState = {
  /** False until the first session lookup settles. */
  ready: boolean;
  isAuthenticated: boolean;
  profileId: string | null;
  /** Single-letter avatar fallback. */
  initial: string | null;
  unreadCount: number;
};

const ANON: SessionState = {
  ready: false,
  isAuthenticated: false,
  profileId: null,
  initial: null,
  unreadCount: 0,
};

const SessionContext = createContext<SessionState>(ANON);

export function useSession() {
  return useContext(SessionContext);
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SessionState>(ANON);
  const pathname = usePathname();

  // Re-checks on every client-side navigation. Sign-in and sign-out both end in
  // router.push + router.refresh, which re-renders server components but does
  // NOT remount this provider — so without this the header would keep showing
  // "Sign in" after a successful sign-in until a hard reload.
  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const res = await fetch("/api/session", { cache: "no-store" });
        const data = res.ok ? await res.json().catch(() => null) : null;
        if (!active) return;
        setState({
          ready: true,
          isAuthenticated: Boolean(data?.authenticated),
          profileId: data?.profileId ?? null,
          initial: data?.initial ?? null,
          unreadCount: data?.unread ?? 0,
        });
      } catch {
        if (active) setState({ ...ANON, ready: true });
      }
    })();

    return () => {
      active = false;
    };
  }, [pathname]);

  const value = useMemo(() => state, [state]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
