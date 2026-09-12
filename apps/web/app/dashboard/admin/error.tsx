'use client'

import DashboardError from '@/components/dashboard/DashboardError'

export default function SectionError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <DashboardError error={error} reset={reset} section="Admin console" />
}
