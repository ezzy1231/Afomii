"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  createEventListing,
  type DashboardActionState,
} from "@/app/dashboard/actions";
import BannerUploadField from "@/components/BannerUploadField";
import { EVENT_CATEGORIES } from "@/lib/categories";

/** Custom display tiers map onto the shared ticket_tier enum in the server action. */
const TIER_TYPES = [
  { value: "general_admission", label: "General Admission" },
  { value: "early_bird", label: "Early Bird" },
  { value: "vip", label: "VIP" },
  { value: "vvip", label: "VVIP" },
] as const;

export default function EventListingForm({
  successHref,
}: {
  /** When set, a success message links onward instead of leaving the organizer stranded. */
  successHref?: string;
}) {
  const [state, setState] = useState<DashboardActionState>({
    ok: false,
    message: "",
  });
  const [pending, startTransition] = useTransition();
  const [bannerReady, setBannerReady] = useState(false);
  const [showTier, setShowTier] = useState(true);
  const [publishMode, setPublishMode] = useState<'draft' | 'publish'>('publish');
  const [tierType, setTierType] = useState<string>('early_bird');
  const [tierName, setTierName] = useState('Early Bird');
  const [freeTier, setFreeTier] = useState(false);
  const [tierPrice, setTierPrice] = useState('500');
  // Creation is rate limited, so a stale form invites a guaranteed rejection.
  // Bumping the key remounts the form and its banner uploader from scratch.
  const [formKey, setFormKey] = useState(0);

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createEventListing(state, formData);
      setState(result);
      if (result.ok) {
        setFormKey((k) => k + 1);
        setBannerReady(false);
        setShowTier(true);
        setPublishMode('publish');
        setTierType('early_bird');
        setTierName('Early Bird');
        setFreeTier(false);
        setTierPrice('500');
      }
    });
  }

  return (
    <section className="card-elevated p-6 sm:p-8">
      <h2 className="text-xl font-bold text-app-fg">Create event</h2>
      <p className="mt-2 text-sm text-app-muted">
        Save unfinished details as a draft, or publish a complete event to the discover feed.
      </p>

      <form key={formKey} action={handleSubmit} className="mt-6 grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-medium text-app-fg sm:col-span-2">
          <span className="mb-1.5 block">Event title</span>
          <input
            name="title"
            required
            className="input-premium"
            placeholder="Night Market Sessions"
          />
        </label>
        <label className="block text-sm font-medium text-app-fg">
          <span className="mb-1.5 block">Category</span>
          <select name="category" className="input-premium" defaultValue={EVENT_CATEGORIES[0]}>
            {EVENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-app-fg">
          <span className="mb-1.5 block">Venue</span>
          <input
            name="venueName"
            required
            className="input-premium"
            placeholder="Harbour Hall"
          />
        </label>
        <label className="block text-sm font-medium text-app-fg">
          <span className="mb-1.5 block">Start date and time</span>
          <input
            name="startsAt"
            type="datetime-local"
            className="input-premium"
          />
        </label>
        <label className="block text-sm font-medium text-app-fg">
          <span className="mb-1.5 block">End date and time</span>
          <input
            name="endDateTime"
            type="datetime-local"
            className="input-premium"
          />
        </label>
        <label className="block text-sm font-medium text-app-fg sm:col-span-2">
          <span className="mb-1.5 block">Description</span>
          <textarea
            name="description"
            rows={4}
            className="input-premium resize-y"
            placeholder="What happens, who it is for, what to bring…"
          />
        </label>
        <label className="block text-sm font-medium text-app-fg">
          <span className="mb-1.5 block">Price label</span>
          <input
            name="priceLabel"
            className="input-premium"
            placeholder="From ETB 500"
          />
        </label>
        <div className="text-sm font-medium text-app-fg">
          <span className="mb-1.5 block">Venue coordinates</span>
          <div className="flex gap-3">
            <input
              name="latitude"
              type="number"
              step="any"
              inputMode="decimal"
              className="input-premium tabular-nums"
              placeholder="Latitude"
              aria-label="Latitude"
            />
            <input
              name="longitude"
              type="number"
              step="any"
              inputMode="decimal"
              className="input-premium tabular-nums"
              placeholder="Longitude"
              aria-label="Longitude"
            />
          </div>
          <span className="mt-1.5 block text-xs font-normal text-app-muted">
            Optional. Powers the ride estimate on the event page.
          </span>
        </div>

        {/* Banner upload — required */}
        <div className="sm:col-span-2">
          <BannerUploadField
            fieldName="coverImageUrl"
            onReady={setBannerReady}
          />
        </div>

        {/* Optional first ticket tier. On by default so a new event is
            sellable immediately; untick to create the event with no tickets. */}
        <fieldset className="sm:col-span-2 rounded-xl border border-app-border bg-app-input/40 p-4 sm:p-5">
          <legend className="sr-only">First ticket tier</legend>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              name="addTicketTier"
              checked={showTier}
              onChange={(e) => setShowTier(e.target.checked)}
              className="mt-1 size-4 shrink-0 accent-ember"
            />
            <span>
              <span className="block text-sm font-semibold text-app-fg">
                Add a ticket tier
              </span>
              <span className="mt-0.5 block text-xs text-app-muted">
                An event needs at least one tier before anyone can buy a ticket.
                You can add more later under Ticket Management.
              </span>
            </span>
          </label>

          {showTier && (
            <div className="mt-4 grid gap-4 border-t border-app-border pt-4 sm:grid-cols-2">
              <label className="block">
                <span className="field-label">Tier name</span>
                <input
                  name="tierName"
                  className="input-premium"
                  value={tierName}
                  onChange={(event) => setTierName(event.target.value)}
                  placeholder="Early Bird"
                />
              </label>
              <label className="block">
                <span className="field-label">Tier type</span>
                <select
                  name="tierType"
                  className="input-premium"
                  value={tierType}
                  onChange={(event) => {
                    const next = event.target.value;
                    setTierType(next);
                    setTierName(TIER_TYPES.find((tier) => tier.value === next)?.label ?? 'Ticket');
                  }}
                >
                  {TIER_TYPES.map((t) => (
                    <option key={t.label} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="field-label">Price (ETB)</span>
                {freeTier ? (
                  <input type="hidden" name="tierPrice" value="0" />
                ) : (
                  <input
                    name="tierPrice"
                    type="number"
                    min={0}
                    step="1"
                    inputMode="numeric"
                    className="input-premium tabular-nums"
                    value={tierPrice}
                    onChange={(event) => setTierPrice(event.target.value)}
                    placeholder="500"
                  />
                )}
                <label className="mt-2 flex items-center gap-2 text-xs font-medium text-app-muted">
                  <input type="checkbox" checked={freeTier} onChange={(event) => setFreeTier(event.target.checked)} className="size-4 accent-ember" />
                  Free ticket
                </label>
              </label>
              <label className="block">
                <span className="field-label">Quantity</span>
                <input
                  name="tierQuantity"
                  type="number"
                  min={1}
                  step="1"
                  inputMode="numeric"
                  className="input-premium tabular-nums"
                  defaultValue="100"
                  placeholder="100"
                />
              </label>
            </div>
          )}
        </fieldset>

        <fieldset className="sm:col-span-2 rounded-xl border border-app-border p-4 sm:p-5">
          <legend className="px-2 text-sm font-semibold text-app-fg">When should this go live?</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-app-border p-3">
              <input
                type="radio"
                name="publishMode"
                value="draft"
                checked={publishMode === 'draft'}
                onChange={() => setPublishMode('draft')}
                className="mt-1 accent-ember"
              />
              <span><span className="block text-sm font-semibold">Save as draft</span><span className="mt-1 block text-xs text-app-muted">Only you can see it. Add a cover later.</span></span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-app-border p-3">
              <input
                type="radio"
                name="publishMode"
                value="publish"
                checked={publishMode === 'publish'}
                onChange={() => setPublishMode('publish')}
                className="mt-1 accent-ember"
              />
              <span><span className="block text-sm font-semibold">Publish now</span><span className="mt-1 block text-xs text-app-muted">A cover image is required for the public listing.</span></span>
            </label>
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={pending || (publishMode === 'publish' && !bannerReady)}
          className="btn-primary sm:col-span-2 mt-2 !py-3"
        >
          {pending ? "Saving event..." : publishMode === 'draft' ? "Save draft" : "Publish event"}
        </button>
      </form>

      {state.message && (
        <div
          role="status"
          aria-live="polite"
          className={`animate-pop-in mt-5 rounded-xl px-4 py-3 text-sm ${state.ok ? "bg-ember/10 text-app-fg border border-ember/20" : "bg-red-50 text-red-700 border border-red-200"}`}
        >
          <p>{state.message}</p>
          {state.ok && successHref && (
            <Link
              href={successHref}
              className="mt-2 inline-block font-semibold text-ember underline underline-offset-2"
            >
              View your events
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
