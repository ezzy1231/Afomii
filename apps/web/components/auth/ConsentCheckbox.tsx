'use client'

import Link from 'next/link'

type ConsentCheckboxProps = {
  checked: boolean
  onChange: (checked: boolean) => void
}

/**
 * Authority/consent gate ported from the Stitch organizer_signup artboard.
 * Required before an organizer account can be created.
 */
export function ConsentCheckbox({ checked, onChange }: ConsentCheckboxProps) {
  return (
    <label className="mt-6 flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-[1.125rem] w-[1.125rem] shrink-0 accent-navy"
      />
      <span className="text-xs leading-relaxed text-app-muted">
        I agree to the{' '}
        <Link href="/terms" target="_blank" className="font-medium text-app-fg underline underline-offset-2">
          Organizer Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="/privacy" target="_blank" className="font-medium text-app-fg underline underline-offset-2">
          Privacy Policy
        </Link>
        . I confirm that I have the authority to create this account and manage payouts on behalf of
        the organization.
      </span>
    </label>
  )
}
