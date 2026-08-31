import type { Metadata } from 'next'
import { Suspense } from 'react'
import RoleClient from './RoleClient'

export const metadata: Metadata = { title: 'Get Started' }

export default function RolePage() {
  return (
    <Suspense>
      <RoleClient />
    </Suspense>
  )
}