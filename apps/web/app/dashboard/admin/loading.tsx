import { ConsoleSkeletonRow } from '@/components/dashboard/console'

export default function AdminLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-4" aria-label="Loading admin content">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-app-elevated" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-28 animate-pulse rounded-xl bg-app-elevated" />)}
      </div>
      <ConsoleSkeletonRow count={3} height="h-14" />
    </div>
  )
}
