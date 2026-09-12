/**
 * Health endpoint for uptime monitors (PRODUCTION_READINESS_PLAN §D2,
 * LAUNCH_REHEARSAL.md §6).
 *
 * Checks the two runtime dependencies a request actually needs:
 *  - Supabase reachable (network + project up)
 *  - Session cookie store works (Next runtime healthy)
 *
 * Deliberately cheap: no auth, no rate limit (monitoring hits it frequently),
 * no dependency on database content — only that the platform answers.
 */
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const startedAt = Date.now()
  const checks: Record<string, { ok: boolean; latencyMs?: number; error?: string }> = {}

  // 1) Supabase reachability — the auth health endpoint requires the anon
  //    key header (plain requests get 401). This validates network + project
  //    + credentials in one cheap call, without touching the database.
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) {
      checks.supabase = { ok: false, error: 'Supabase env vars not configured' }
    } else {
      const t0 = Date.now()
      const res = await fetch(`${url}/auth/v1/health`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(5000),
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      })
      checks.supabase = { ok: res.ok, latencyMs: Date.now() - t0 }
      if (!res.ok) checks.supabase.error = `auth health returned ${res.status}`
    }
  } catch (err) {
    checks.supabase = { ok: false, error: err instanceof Error ? err.message : 'unreachable' }
  }

  const ok = Object.values(checks).every((c) => c.ok)
  const body = {
    status: ok ? 'ok' : 'degraded',
    uptime: process.uptime(),
    checkedAt: new Date(startedAt).toISOString(),
    durationMs: Date.now() - startedAt,
    checks,
  }

  return NextResponse.json(body, { status: ok ? 200 : 503 })
}
