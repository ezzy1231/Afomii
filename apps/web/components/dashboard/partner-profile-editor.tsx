'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Save } from 'lucide-react'
import BannerUploadField from '@/components/BannerUploadField'
import { updatePartnerProfile } from '@/app/dashboard/actions'

type ProfileEditorProps = {
  kind: 'restaurant' | 'organizer'
  profile: { fullName: string; email: string; phone: string; city: string }
  account: { name: string; email: string; phone: string; city: string; address: string; category: string; website: string; description: string; logoUrl: string; coverUrl: string }
  listing?: { id: string; name: string; cuisine: string; neighborhood: string }
}

const inputClass = 'mt-1.5 min-h-11 w-full rounded-xl border border-console-border bg-white px-3.5 text-sm text-console-ink outline-none transition focus:border-console-indigo/50 focus:ring-2 focus:ring-console-indigo/10'

export function PartnerProfileEditor({ kind, profile, account, listing }: ProfileEditorProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const restaurant = kind === 'restaurant'

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    setMessage(null)
    startTransition(async () => {
      const result = await updatePartnerProfile(formData)
      setMessage({ ok: result.ok, text: result.message })
      if (result.ok) router.refresh()
    })
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <section className="rounded-2xl border border-console-border bg-white p-5 sm:p-6">
        <div className="mb-5 border-b border-console-border pb-4">
          <h2 className="text-base font-bold text-console-ink">Contact profile</h2>
          <p className="mt-1 text-sm text-console-muted">Your personal contact details for this partner account.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-semibold text-console-muted">Your name<input name="fullName" required maxLength={120} defaultValue={profile.fullName} className={inputClass} /></label>
          <label className="text-xs font-semibold text-console-muted">Contact email<input name="contactEmail" type="email" maxLength={254} defaultValue={account.email || profile.email} className={inputClass} /></label>
          <label className="text-xs font-semibold text-console-muted">Phone<input name="phone" maxLength={40} defaultValue={account.phone || profile.phone} className={inputClass} /></label>
          <label className="text-xs font-semibold text-console-muted">City<input name="city" maxLength={100} defaultValue={account.city || profile.city} className={inputClass} /></label>
        </div>
      </section>

      <section className="rounded-2xl border border-console-border bg-white p-5 sm:p-6">
        <div className="mb-5 border-b border-console-border pb-4">
          <h2 className="text-base font-bold text-console-ink">{restaurant ? 'Restaurant business' : 'Organizer profile'}</h2>
          <p className="mt-1 text-sm text-console-muted">These details appear on your public profile.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-semibold text-console-muted">{restaurant ? 'Business name' : 'Organizer name'}<input name="accountName" required minLength={2} maxLength={160} defaultValue={account.name} className={inputClass} /></label>
          <label className="text-xs font-semibold text-console-muted">Category<input name="category" maxLength={120} defaultValue={account.category} placeholder={restaurant ? 'Restaurant' : 'Music, theatre, community…'} className={inputClass} /></label>
          <label className="text-xs font-semibold text-console-muted sm:col-span-2">Street address<input name="address" maxLength={240} defaultValue={account.address} className={inputClass} /></label>
          <label className="text-xs font-semibold text-console-muted sm:col-span-2">Website<input name="website" type="url" maxLength={300} defaultValue={account.website} placeholder="https://example.com" className={inputClass} /></label>
          <label className="text-xs font-semibold text-console-muted sm:col-span-2">About<textarea name="description" rows={4} maxLength={2000} defaultValue={account.description} className={`${inputClass} resize-y py-3`} /></label>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold text-console-muted">Profile logo</p>
            <BannerUploadField fieldName="logoUrl" initialUrl={account.logoUrl} label="Upload logo" hint="jpg, png or webp · up to 5 MB" />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold text-console-muted">Profile background photo</p>
            <BannerUploadField fieldName="coverUrl" initialUrl={account.coverUrl} label="Upload cover photo" hint="jpg, png or webp · up to 5 MB" />
          </div>
        </div>
      </section>

      {restaurant && listing && (
        <section className="rounded-2xl border border-console-border bg-white p-5 sm:p-6">
          <div className="mb-5 border-b border-console-border pb-4">
            <h2 className="text-base font-bold text-console-ink">Restaurant listing</h2>
            <p className="mt-1 text-sm text-console-muted">Cuisine and neighborhood help guests find the right branch and listing.</p>
          </div>
          <input type="hidden" name="listingId" value={listing.id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-semibold text-console-muted">Restaurant name<input name="listingName" required minLength={2} maxLength={160} defaultValue={listing.name} className={inputClass} /></label>
            <label className="text-xs font-semibold text-console-muted">Cuisine type<input name="cuisine" maxLength={120} defaultValue={listing.cuisine} placeholder="Ethiopian, Italian…" className={inputClass} /></label>
            <label className="text-xs font-semibold text-console-muted sm:col-span-2">Neighborhood<input name="neighborhood" maxLength={120} defaultValue={listing.neighborhood} className={inputClass} /></label>
          </div>
        </section>
      )}

      {!listing && restaurant && <input type="hidden" name="listingId" value="" />}
      {!restaurant && <input type="hidden" name="listingId" value="" />}
      <input type="hidden" name="listingName" value="" />
      <input type="hidden" name="cuisine" value="" />
      <input type="hidden" name="neighborhood" value="" />

      {message && <p role="status" aria-live="polite" className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${message.ok ? 'border-console-mint/40 bg-console-mint/20 text-console-mint-ink' : 'border-[#F5C2BC] bg-[#FDECEA] text-[#8C1D18]'}`}>{message.ok && <CheckCircle2 className="size-4" />}{message.text}</p>}
      <button type="submit" disabled={pending} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-console-indigo px-5 text-sm font-semibold text-white shadow-[0_6px_18px_rgb(91_63_240/0.22)] hover:bg-console-indigo-deep disabled:opacity-50">
        <Save className="size-4" />{pending ? 'Saving profile…' : 'Save profile'}
      </button>
    </form>
  )
}
