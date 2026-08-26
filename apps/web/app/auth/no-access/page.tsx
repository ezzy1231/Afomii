import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { readEnv } from '@/lib/env'

export const metadata: Metadata = { title: 'No admin access' }

export default async function NoAccessPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const mainOrigin = readEnv('NEXT_PUBLIC_MAIN_ORIGIN') ?? ''

  return (
    <div className="flex min-h-screen items-center justify-center bg-app-bg px-4">
      <div className="card-elevated w-full max-w-md p-10 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-danger/10">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-7 w-7 text-danger">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>
        <h1 className="mb-2 font-serif text-2xl font-bold text-app-fg">No admin access</h1>
        <p className="text-sm leading-relaxed text-app-muted">
          {user
            ? <>The account <strong className="text-app-fg">{user.email}</strong> doesn&apos;t have platform-admin rights.</>
            : 'You need to sign in with a platform-admin account.'}
        </p>
        <p className="mt-1 text-sm text-app-muted">
          Switch to an admin account here, or continue on the main UrbanExplore site.
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          <Link href="/auth/signin?next=/dashboard/admin" className="btn-primary w-full !py-2.5">
            Sign in with another account
          </Link>
          {mainOrigin ? (
            <a href={mainOrigin} className="btn-secondary w-full !py-2.5">
              Back to UrbanExplore
            </a>
          ) : null}
        </div>
      </div>
    </div>
  )
}
