"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { reviewVerificationRequest } from "@/app/dashboard/actions";
import {
  CONSOLE_PRIMARY_BUTTON,
  CONSOLE_SECONDARY_BUTTON,
} from "@/components/dashboard/console-tokens";

/**
 * The admin's decision on one queued request.
 *
 * Approve is the action that actually makes a partner public:
 * private.business_is_public / private.organizer_is_public require
 * status = 'active' AND is_verified = true together, so the action writes both.
 *
 * A note is mandatory for every decision except "start review" — a partner who
 * is declined with no explanation has no way to fix anything and no reason to
 * try again.
 */

const DECISIONS = [
  { value: "start_review", label: "Start review", primary: false },
  { value: "needs_info", label: "Request more info", primary: false },
  { value: "approve", label: "Approve", primary: true },
  { value: "reject", label: "Decline", primary: false },
] as const;

export default function VerificationReviewActions({
  requestId,
  status,
}: {
  requestId: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  );

  const isOpen = ["pending", "in_review", "needs_info"].includes(status);
  const visible = isOpen
    ? DECISIONS
    : DECISIONS.filter((d) => d.value === "start_review")

  function decide(decision: string) {
    startTransition(async () => {
      const result = await reviewVerificationRequest(requestId, decision, note);
      setMessage({ ok: result.ok, text: result.message });
      if (result.ok) {
        setNote("");
        router.refresh();
      }
    });
  }

  if (!isOpen) {
    return (
      <div className="rounded-xl bg-console-bg px-4 py-3 text-sm text-console-muted">
        This request was decided and is kept as history. A new submission from
        this partner will create a new request.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="block text-xs font-semibold text-console-muted">
        Reviewer note (required to approve, decline, or ask for more)
        <textarea
          rows={3}
          value={note}
          maxLength={2000}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What you checked, and anything the partner should know."
          className="mt-1.5 w-full rounded-xl border border-console-border bg-white px-3.5 py-2.5 text-sm text-console-ink outline-none transition focus:border-console-indigo/50 focus:ring-2 focus:ring-console-indigo/10"
        />
      </label>

      <div className="flex flex-wrap gap-2">
        {visible.map((d) => (
          <button
            key={d.value}
            type="button"
            disabled={pending}
            onClick={() => decide(d.value)}
            className={`${
              d.primary ? CONSOLE_PRIMARY_BUTTON : CONSOLE_SECONDARY_BUTTON
            } disabled:opacity-60`}
          >
            {pending ? "Working…" : d.label}
          </button>
        ))}
      </div>

      {message && (
        <p
          role="status"
          className={`rounded-xl px-4 py-3 text-sm font-medium ${
            message.ok
              ? "bg-console-mint text-console-mint-ink"
              : "bg-console-blush text-console-blush-ink"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}