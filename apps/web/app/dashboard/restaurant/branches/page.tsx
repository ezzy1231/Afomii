import type { Metadata } from 'next'
import { BranchManager } from '@/components/dashboard/branch-manager'

export const metadata: Metadata = { title: 'Branches & Availability' }

export default function BranchesPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-gold">Restaurant</p>
      <h1 className="mt-2 font-serif text-3xl font-bold text-app-fg">Branches & availability</h1>
      <p className="mt-2 text-sm text-app-muted">
        Add branches and configure tables, slot duration, booking mode, and opening hours.
      </p>

      <div className="mt-8">
        <BranchManager />
      </div>
    </div>
  )
}
