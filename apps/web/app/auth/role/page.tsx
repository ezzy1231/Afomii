import type { Metadata } from 'next'
import RoleClient from './RoleClient'

export const metadata: Metadata = { title: 'Get Started' }

export default function RolePage() {
  return <RoleClient />
}