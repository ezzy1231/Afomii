'use client'

import { cn } from '@/lib/utils'
import { DocumentUploadRow } from './FileUploadTile'

/**
 * Payout Details card ported from the Stitch organizer_signup artboard.
 * Optional by design: required only before publishing paid events. Values are
 * persisted as additive `org_payout_*` signup metadata — no schema migration.
 */

export const ETHIOPIAN_BANKS = [
  'Commercial Bank of Ethiopia (CBE)',
  'Awash Bank',
  'Dashen Bank',
  'Bank of Abyssinia',
] as const

export type PayoutDetails = {
  bank: string
  accountHolder: string
  accountNumber: string
}

const EMPTY_PAYOUT: PayoutDetails = { bank: '', accountHolder: '', accountNumber: '' }

export function payoutDetailsValue(value?: Partial<PayoutDetails>): PayoutDetails {
  return { ...EMPTY_PAYOUT, ...value }
}

type PayoutDetailsFieldsProps = {
  value: PayoutDetails
  onChange: (next: PayoutDetails) => void
  docsFileName?: string | null
  onDocsSelect: (file: File | null) => void
}

export function PayoutDetailsFields({
  value,
  onChange,
  docsFileName,
  onDocsSelect,
}: PayoutDetailsFieldsProps) {
  const inputCls = 'input-premium'

  return (
    <section className="rounded-xl border border-app-border bg-app-card p-5">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h3 className="font-serif text-lg font-semibold text-app-fg">Payout details</h3>
        <span className="badge-gold inline-flex items-center gap-1 !text-[10px] uppercase tracking-widest">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3 w-3">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
            />
          </svg>
          Optional · Secure
        </span>
      </div>
      <p className="mb-4 text-xs text-app-muted">Required before you can publish paid events.</p>

      <div className="space-y-4">
        <div>
          <label className="eyebrow mb-1.5 block">Bank name</label>
          <select
            value={value.bank}
            onChange={(e) => onChange({ ...value, bank: e.target.value })}
            className={inputCls}
          >
            <option value="">Select your bank…</option>
            {ETHIOPIAN_BANKS.map((bank) => (
              <option key={bank} value={bank}>
                {bank}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="eyebrow mb-1.5 block">Account holder</label>
          <input
            type="text"
            value={value.accountHolder}
            onChange={(e) => onChange({ ...value, accountHolder: e.target.value })}
            placeholder="As it appears on the account"
            autoComplete="off"
            className={cn(inputCls)}
          />
        </div>
        <div>
          <label className="eyebrow mb-1.5 block">Account number</label>
          <input
            type="text"
            inputMode="numeric"
            value={value.accountNumber}
            onChange={(e) => onChange({ ...value, accountNumber: e.target.value })}
            placeholder="0000 0000 0000"
            autoComplete="off"
            className={cn(inputCls, 'tabular-nums')}
          />
        </div>
        <div className="border-t border-dashed border-[var(--border)] pt-4">
          <DocumentUploadRow
            label="Upload verification documents"
            hint="Business registration or valid ID (PDF, JPG up to 10MB)"
            fileName={docsFileName}
            onSelect={onDocsSelect}
          />
        </div>
      </div>
    </section>
  )
}
