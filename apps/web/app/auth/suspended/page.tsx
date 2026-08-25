import type { Metadata } from 'next'
import Link from 'next/link'
import SignOutButton from '@/app/settings/SignOutButton'

export const metadata: Metadata = { title: 'Account suspended' }

export default function SuspendedPage() {
  return (
    <div className="w-full max-w-md text-center">
      <div className="card-elevated animate-fade-in-up p-10">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-danger/10">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-7 w-7 text-danger">
            <path
              fillRule="evenodd"
              d="M18 10A8 8 0 1 1 2 10a8 8 0 0 1 16 0Zm-8-4a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 6Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h2 className="mb-2 font-serif text-2xl font-bold text-app-fg">Account suspended</h2>
        <p className="mb-6 text-sm text-app-muted">
          A platform administrator has suspended this account&apos;s access to partner and admin
          tools. You can still browse UrbanExplore as a guest. If you believe this is a mistake,
          contact support.
        </p>
        <div className="flex flex-col items-center gap-3">
          <Link href="/" className="btn-primary w-full !py-2.5">
            Back to home
          </Link>
          <SignOutButton />
        </div>
      </div>
    </div>
  )
}
