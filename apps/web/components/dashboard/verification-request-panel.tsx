"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitVerificationRequest } from "@/app/dashboard/actions";
import DocumentUploadField from "@/components/dashboard/DocumentUploadField";
import {
  CONSOLE_CARD,
  CONSOLE_PRIMARY_BUTTON,
  CONSOLE_SECONDARY_BUTTON,
} from "@/components/dashboard/console-tokens";
import type {
  VerificationEntityType,
  VerificationRequest,
} from "@/lib/dashboard/verification-data";

/**
 * The partner's side of verification: what state they are in, and the form to
 * submit (or resubmit) a request.
 *
 * This exists because before it there was no way to ask. ensureBusiness /
 * ensureOrganizer insert neither `status` nor `is_verified`, so a new partner
 * lands on the pending/unverified defaults — and
 * private.business_is_public / private.organizer_is_public require
 * status = 'active' AND is_verified = true, so every one of their listings is
 * invisible on the public catalogue, with nothing in the UI saying so.
 */

const STATUS_COPY: Record<
  string,
  { heading: string; body: string; surface: string; ink: string }
> = {
  approved: {
    heading: "Verified",
    body: "Your listings are visible on UrbanExplore.",
    surface: "bg-console-mint",
    ink: "text-console-mint-ink",
  },
  in_review: {
    heading: "Under review",
    body: "An admin is checking your submission. You will be notified when there is a decision.",
    surface: "bg-console-sky",
    ink: "text-console-sky-ink",
  },
  pending: {
    heading: "Submitted",
    body: "Your request is in the queue. You will be notified when there is a decision.",
    surface: "bg-console-sand",
    ink: "text-console-sand-ink",
  },
  needs_info: {
    heading: "More information needed",
    body: "The reviewer asked for more detail. Update your submission below.",
    surface: "bg-console-sand",
    ink: "text-console-sand-ink",
  },
  rejected: {
    heading: "Not verified",
    body: "Your last request was declined. See the reviewer note below, then submit again.",
    surface: "bg-console-blush",
    ink: "text-console-blush-ink",
  },
};

const inputClass =
  "mt-1.5 min-h-11 w-full rounded-xl border border-console-border bg-white px-3.5 text-sm text-console-ink outline-none transition focus:border-console-indigo/50 focus:ring-2 focus:ring-console-indigo/10";

export default function VerificationRequestPanel({
  entityType,
  entityName,
  isVerified,
  status,
  request,
  defaults,
}: {
  entityType: VerificationEntityType;
  entityName: string;
  isVerified: boolean;
  status: string | null;
  request: VerificationRequest | null;
  defaults: {
    legalName: string;
    phone: string;
    address: string;
    city: string;
    website: string;
  };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const [showForm, setShowForm] = useState(
    request?.status === "needs_info" || (!request && !isVerified),
  );

  const copy = request ? STATUS_COPY[request.status] : null;
  // A live request (pending / in_review / needs_info) is already with an admin;
  // only a rejection or no request at all is an invitation to submit.
  const canSubmit =
    !isVerified && (!copy || copy.heading === "Not verified");

  function submit(formData: FormData) {
    formData.set("entityType", entityType);
    startTransition(async () => {
      const result = await submitVerificationRequest(formData);
      setMessage({ ok: result.ok, text: result.message });
      if (result.ok) {
        setShowForm(false);
        router.refresh();
      }
    });
  }

  return (
    <section id="verification" className={`${CONSOLE_CARD} p-5 scroll-mt-24 sm:p-6`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-console-ink">Verification</h2>
          <p className="mt-1 text-sm text-console-muted">
            UrbanExplore only lists partners an admin has confirmed. Until{" "}
            {entityName || "your account"} is verified, your listings stay off the
            public feed — you can still set everything else up here.
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
            isVerified ? "bg-console-mint text-console-mint-ink" : "bg-console-sand text-console-sand-ink"
          }`}
        >
          {isVerified ? "Verified" : (status ?? "Pending")}
        </span>
      </div>

      {copy && (
        <div className={`mt-4 rounded-xl px-4 py-3 ${copy.surface}`}>
          <p className={`text-sm font-bold ${copy.ink}`}>{copy.heading}</p>
          <p className={`mt-1 text-sm ${copy.ink}`}>{copy.body}</p>
          {request?.reviewer_note && (
            <p className={`mt-2 border-t border-console-border/60 pt-2 text-sm ${copy.ink}`}>
              <span className="font-semibold">Reviewer note: </span>
              {request.reviewer_note}
            </p>
          )}
        </div>
      )}

      {message && (
        <p
          role="status"
          className={`mt-4 rounded-xl px-4 py-3 text-sm font-medium ${
            message.ok
              ? "bg-console-mint text-console-mint-ink"
              : "bg-console-blush text-console-blush-ink"
          }`}
        >
          {message.text}
        </p>
      )}

      {!showForm && canSubmit && (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className={`${CONSOLE_PRIMARY_BUTTON} mt-4`}
        >
          {request ? "Submit a new request" : "Request verification"}
        </button>
      )}

      {showForm && (
        <form action={submit} className="mt-4 grid gap-4 border-t border-console-border pt-5 sm:grid-cols-2">
          <input type="hidden" name="entityType" value={entityType} />

          <label className="text-xs font-semibold text-console-muted sm:col-span-2">
            Legal name
            <input
              name="legalName"
              required
              maxLength={160}
              defaultValue={request?.legal_name ?? defaults.legalName}
              placeholder="Registered name of the business or organisation"
              className={inputClass}
            />
          </label>

          <label className="text-xs font-semibold text-console-muted">
            Registration number
            <input
              name="registrationNumber"
              maxLength={80}
              defaultValue={request?.registration_number ?? ""}
              placeholder="Commercial register / licence number"
              className={inputClass}
            />
          </label>

          <label className="text-xs font-semibold text-console-muted">
            Tax ID
            <input
              name="taxId"
              maxLength={80}
              defaultValue={request?.tax_id ?? ""}
              placeholder="Optional"
              className={inputClass}
            />
          </label>

          <label className="text-xs font-semibold text-console-muted">
            Contact phone
            <input
              name="phone"
              maxLength={40}
              defaultValue={request?.phone ?? defaults.phone}
              className={inputClass}
            />
          </label>

          <label className="text-xs font-semibold text-console-muted">
            City
            <input
              name="city"
              maxLength={100}
              defaultValue={request?.city ?? defaults.city}
              className={inputClass}
            />
          </label>

          <label className="text-xs font-semibold text-console-muted sm:col-span-2">
            Registered address
            <input
              name="address"
              maxLength={240}
              defaultValue={request?.address ?? defaults.address}
              className={inputClass}
            />
          </label>

          <label className="text-xs font-semibold text-console-muted sm:col-span-2">
            Website
            <input
              name="website"
              type="url"
              maxLength={300}
              defaultValue={request?.website ?? defaults.website}
              placeholder="https://"
              className={inputClass}
            />
          </label>

          <label className="text-xs font-semibold text-console-muted sm:col-span-2">
            Anything else that proves legitimacy
            <textarea
              name="note"
              rows={3}
              maxLength={2000}
              defaultValue={request?.note ?? ""}
              placeholder="Years trading, number of locations, awards — anything an admin should know."
              className={`${inputClass} resize-y`}
            />
          </label>

          <div className="sm:col-span-2">
            <DocumentUploadField />
          </div>

          <div className="flex gap-3 sm:col-span-2">
            <button
              type="submit"
              disabled={pending}
              className={`${CONSOLE_PRIMARY_BUTTON} disabled:opacity-60`}
            >
              {pending ? "Submitting…" : "Submit for review"}
            </button>
            {request && (
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className={CONSOLE_SECONDARY_BUTTON}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}
    </section>
  );
}