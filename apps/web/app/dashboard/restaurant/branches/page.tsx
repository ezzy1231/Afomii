import type { Metadata } from 'next'
import { BranchManager } from '@/components/dashboard/branch-manager'

export const metadata: Metadata = { title: 'Branches & Availability' }

export default function BranchesPage() {
  return <BranchManager />
}
