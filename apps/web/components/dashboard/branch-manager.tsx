"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  addBranch,
  updateBranchBookingConfig,
  updateRestaurantHours,
} from "@/app/dashboard/actions";
import { Plus } from "lucide-react";
import { ConsoleSkeletonRow, SectionTitle } from "./console";
import { CONSOLE_CARD } from "@/components/dashboard/console-shared";
import { BranchMenu } from "@/components/dashboard/branch-menu";
import { BranchActions } from "@/components/dashboard/branch-actions";
import { cn } from "@/lib/utils";

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABELS: Record<string, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

type BookingConfig = {
  booking_mode: string;
  total_tables: number;
  max_guest_per_table: number;
  slot_duration_minutes: number;
  advance_notice_hours: number;
  cancellation_policy?: string | null;
};

export type Branch = {
  id: string;
  branch_name: string;
  address: string | null;
  phone: string | null;
  is_active: boolean;
  booking_configs: BookingConfig | null;
};

export type Restaurant = {
  id: string;
  name: string;
  opening_hours: Record<string, { open: string; close: string }[]> | null;
};

const BOOKING_MODES = [
  { value: "closed", title: "Walk-in Only", hint: "No reservations accepted." },
  {
    value: "instant",
    title: "Time Slots",
    hint: "Guests book specific times.",
  },
  {
    value: "request",
    title: "Request Mode",
    hint: "Manual approval required.",
  },
] as const;

/** Numbered − / + pill cluster from the branch_configuration artboard. */
function Stepper({
  label,
  value,
  onChange,
  min = 0,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
  min?: number;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <span className="text-sm text-app-muted">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="flex size-11 items-center justify-center rounded-full border border-app-border text-lg leading-none text-app-fg transition-colors hover:border-ember/40 hover:text-ember disabled:opacity-40"
        >
          −
        </button>
        <span className="w-10 text-center text-xl font-bold tabular-nums text-ember">
          {value}
        </span>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => onChange(value + 1)}
          className="flex size-11 items-center justify-center rounded-full border border-app-border text-lg leading-none text-app-fg transition-colors hover:border-ember/40 hover:text-ember"
        >
          ＋
        </button>
      </div>
    </div>
  );
}

/**
 * Names the migration that is actually missing. Postgres reports an undefined
 * column as 42703 regardless of which one it is, and this query touches both
 * `restaurant_id` (0017) and `is_active` (0018) — so read the column name out
 * of the message instead of assuming 0017, which sent partners re-running a
 * migration they had already applied.
 */
function describeBranchLoadError(error: {
  code?: string;
  message?: string;
}): string {
  if (error.code !== "42703") {
    return "Could not load branches. Refresh the page and try again.";
  }
  const column = error.message?.match(/column "?([\w.]+)"? does not exist/)?.[1];
  if (column?.includes("is_active")) {
    return "Pausing a location needs the is_active column. Run migration 0018_branch_lifecycle.sql against your Supabase project.";
  }
  return "This listing's branches need the listing_id column. Run migration 0017_restaurant_listing_branches.sql against your Supabase project.";
}

export function BranchManager({
  restaurantId,
  listingName,
}: {
  restaurantId: string
  listingName?: string
}) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [dishCounts, setDishCounts] = useState<Record<string, number>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [branchError, setBranchError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true
    async function fetchBranches() {
      const supabase = createClient();
      setLoading(true);
      const { data: branchRows, error } = await supabase
        .from("branches")
        .select(
          "id, branch_name, address, phone, is_active, booking_configs(booking_mode, total_tables, max_guest_per_table, slot_duration_minutes, advance_notice_hours, cancellation_policy)",
        )
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: true });
      if (!active) return;
      if (error) {
        console.error("[branch-manager] load failed:", error.message);
        setBranchError(describeBranchLoadError(error));
        setLoading(false);
        return;
      }
      setBranchError(null);
      const list: Branch[] = (branchRows ?? []).map((b: any) => ({
        id: b.id,
        branch_name: b.branch_name,
        address: b.address,
        phone: b.phone,
        is_active: b.is_active !== false,
        booking_configs: Array.isArray(b.booking_configs)
          ? (b.booking_configs[0] ?? null)
          : (b.booking_configs ?? null),
      }));
      setBranches(list);
      // Default to the first branch so the detail pane is never empty, and
      // drop a stale selection if that branch has since been removed.
      setSelectedId((current) =>
        current && list.some((b) => b.id === current) ? current : list[0]?.id ?? null,
      );
      setLoading(false);

      if (list.length === 0) {
        setDishCounts({});
        return;
      }
      // One aggregate read for every branch in the listing, not one per branch.
      const { data: menuRows } = await supabase
        .from("menu_items")
        .select("branch_id")
        .in(
          "branch_id",
          list.map((b) => b.id),
        );
      if (!active) return;
      const counts: Record<string, number> = {};
      for (const row of (menuRows ?? []) as Array<{ branch_id: string }>) {
        counts[row.branch_id] = (counts[row.branch_id] ?? 0) + 1;
      }
      setDishCounts(counts);
    }
    void fetchBranches()
    return () => {
      active = false
    }
  }, [restaurantId, refreshKey])

  const selected = branches.find((branch) => branch.id === selectedId) ?? null

  return (
    <ConsolePage>
      <section className="space-y-3">
        <SectionTitle>{listingName ? `${listingName} branches` : "Branches"}</SectionTitle>
        <p className="text-sm text-app-muted">
          Pick a location to set its availability and menu. Each one is independent.
        </p>
      </section>

      {branchError ? (
        <div className={cn(CONSOLE_CARD, "border-danger/30 p-6 text-center")}>
          <p className="font-semibold text-danger">Could not load branches</p>
          <p className="mt-1 text-sm text-app-muted">{branchError}</p>
        </div>
      ) : loading ? (
        <ConsoleSkeletonRow count={2} />
      ) : branches.length === 0 ? (
        <div className={cn(CONSOLE_CARD, "border-dashed p-8 text-center")}>
          <p className="font-semibold text-console-ink">No locations yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-app-muted">
            A location is one place guests can book or order from. Add one to set its hours and
            menu.
          </p>
          <div className="mt-5 flex justify-center">
            <AddBranchForm
              restaurantId={restaurantId}
              onCreated={(newBranchId) => {
                if (newBranchId) setSelectedId(newBranchId)
                setRefreshKey((key) => key + 1)
              }}
            />
          </div>
        </div>
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,19rem)_minmax(0,1fr)]">
          {/* Branch list — the entry point to each location's settings and menu. */}
          <nav
            aria-label="Locations"
            className={cn(CONSOLE_CARD, "overflow-hidden lg:sticky lg:top-6")}
          >
            <ul className="divide-y divide-app-border">
              {branches.map((branch) => {
                const isSelected = branch.id === selectedId;
                const dishes = dishCounts[branch.id] ?? 0;
                const isPaused = branch.is_active === false;
                return (
                  <li
                    key={branch.id}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 transition-colors",
                      isSelected ? "bg-console-bg" : "hover:bg-console-bg/60",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedId(branch.id)}
                      aria-current={isSelected ? "true" : undefined}
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-2 py-2 text-left"
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "h-9 w-1 shrink-0 rounded-full",
                          isSelected ? "bg-console-indigo" : "bg-transparent",
                        )}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              "truncate text-sm font-semibold",
                              isSelected ? "text-console-ink" : "text-app-fg",
                              isPaused && "line-through",
                            )}
                          >
                            {branch.branch_name}
                          </span>
                          {isPaused && (
                            <span className="shrink-0 rounded-full bg-console-sand px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-console-sand-ink">
                              Paused
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-app-muted">
                          {branch.address || "No address"}
                        </span>
                        <span className="mt-1 block text-xs text-app-muted tabular-nums">
                          {dishes === 0
                            ? "No dishes yet"
                            : `${dishes} dish${dishes === 1 ? "" : "es"}`}
                        </span>
                      </span>
                    </button>

                    <div className="flex shrink-0 flex-col items-stretch gap-1">
                      <BranchActions
                        branchId={branch.id}
                        branchName={branch.branch_name}
                        isActive={branch.is_active !== false}
                        dishCount={dishes}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="border-t border-app-border p-2">
              <AddBranchForm
                restaurantId={restaurantId}
                onCreated={(newBranchId) => {
                  if (newBranchId) setSelectedId(newBranchId)
                  setRefreshKey((key) => key + 1)
                }}
              />
            </div>
          </nav>

          {selected && (
            <div className="min-w-0">
              <BranchConfigCard key={selected.id} branch={selected} />
            </div>
          )}
        </div>
      )}

    </ConsolePage>
  );
}

function ConsolePage({ children }: { children: React.ReactNode }) {
  return <div className="space-y-6">{children}</div>;
}

const consoleInput =
  "w-full rounded-lg border border-app-border bg-app-bg px-3.5 py-2.5 text-sm text-app-fg outline-none transition-colors placeholder:text-app-muted/70 focus:border-ember/50";

function AddBranchForm({
  restaurantId,
  onCreated,
}: {
  restaurantId: string;
  onCreated: (newBranchId?: string) => void;
}) {
  const [state, setState] = useState<{ ok: boolean; message: string; id?: string } | null>(
    null,
  );
  const [showForm, setShowForm] = useState(false);

  if (!showForm) {
    return (
      <button
        type="button"
        onClick={() => setShowForm(true)}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-dashed border-console-border px-4 text-sm font-semibold text-console-ink transition-colors hover:border-console-indigo/50 hover:bg-console-card"
      >
        <Plus className="size-4" strokeWidth={2.2} />
        Add a location
      </button>
    );
  }

  return (
    <form
      action={async (formData: FormData) => {
        const res = await addBranch(state as any, formData);
        setState(res);
        if (res.ok) {
          setShowForm(false);
          onCreated(res.id);
        }
      }}
      className={cn(CONSOLE_CARD, "border-dashed p-6")}
    >
      <input type="hidden" name="restaurantId" value={restaurantId} />
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-[15px] font-bold text-console-ink">New location</h3>
        <button
          type="button"
          onClick={() => setShowForm(false)}
          className="min-h-9 rounded-lg px-3 text-xs font-semibold text-app-muted transition-colors hover:text-app-fg"
        >
          Cancel
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          name="branchName"
          required
          placeholder="e.g. Bole"
          className={consoleInput}
        />
        <input
          name="address"
          required
          placeholder="Address"
          className={consoleInput}
        />
        <input
          name="phone"
          placeholder="Phone (optional)"
          className={consoleInput}
        />
        <div className="flex gap-2">
          <input
            name="latitude"
            placeholder="Lat (optional)"
            className={`w-full ${consoleInput}`}
          />
          <input
            name="longitude"
            placeholder="Lng (optional)"
            className={`w-full ${consoleInput}`}
          />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          className="min-h-11 rounded-xl bg-console-indigo px-5 text-sm font-semibold text-white transition-colors hover:bg-console-indigo-deep"
        >
          Add location
        </button>
        {state && (
          <p role="status" className={cn("text-sm", state.ok ? "text-success" : "text-danger")}>
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}

function BranchConfigCard({ branch }: { branch: Branch }) {
  const cfg = branch.booking_configs;
  const [bookingMode, setBookingMode] = useState(
    cfg?.booking_mode ?? "instant",
  );
  const [totalTables, setTotalTables] = useState(cfg?.total_tables ?? 10);
  const [maxGuestPerTable, setMaxGuestPerTable] = useState(
    cfg?.max_guest_per_table ?? 8,
  );
  const [slotDurationMinutes, setSlotDurationMinutes] = useState(
    cfg?.slot_duration_minutes ?? 60,
  );
  const [advanceNoticeHours, setAdvanceNoticeHours] = useState(
    cfg?.advance_notice_hours ?? 2,
  );
  const [cancellationPolicy, setCancellationPolicy] = useState(
    cfg?.cancellation_policy ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  // Baseline for `dirty`. Seeded from the `cfg` prop, then replaced by the last
  // *successful* save — the prop never changes, so deriving `dirty` from it
  // left the card permanently "unsaved" after a successful write.
  const [saved, setSaved] = useState<string | null>(null);

  const fromProps = `${cfg?.booking_mode ?? "instant"}|${cfg?.total_tables ?? 10}|${cfg?.max_guest_per_table ?? 8}|${cfg?.slot_duration_minutes ?? 60}|${cfg?.advance_notice_hours ?? 2}|${cfg?.cancellation_policy ?? ""}`;
  const current = `${bookingMode}|${totalTables}|${maxGuestPerTable}|${slotDurationMinutes}|${advanceNoticeHours}|${cancellationPolicy}`;
  const dirty = (saved ?? fromProps) !== current;

  function discard() {
    setBookingMode(cfg?.booking_mode ?? "instant");
    setTotalTables(cfg?.total_tables ?? 10);
    setMaxGuestPerTable(cfg?.max_guest_per_table ?? 8);
    setSlotDurationMinutes(cfg?.slot_duration_minutes ?? 60);
    setAdvanceNoticeHours(cfg?.advance_notice_hours ?? 2);
    setCancellationPolicy(cfg?.cancellation_policy ?? "");
    setSaved(null);
    setMsg(null);
  }

  async function save() {
    setSaving(true);
    setMsg(null);
    const res = await updateBranchBookingConfig({
      branchId: branch.id,
      bookingMode,
      totalTables: Number(totalTables),
      maxGuestPerTable: Number(maxGuestPerTable),
      slotDurationMinutes: Number(slotDurationMinutes),
      advanceNoticeHours: Number(advanceNoticeHours),
      cancellationPolicy,
    });
    setSaving(false);
    setMsg({ ok: res.ok, text: res.message });
    if (res.ok) setSaved(current);
  }

  // Live preview of what guests see, per the artboard's navy strip.
  const guestSummary =
    bookingMode === "closed"
      ? "Walk-in only · no online reservations"
      : [
          bookingMode === "instant"
            ? "Instant confirmation"
            : "Request to book",
          `up to ${maxGuestPerTable} guests`,
          advanceNoticeHours > 0
            ? `book ${advanceNoticeHours}h ahead`
            : "same-day bookings",
        ].join(" · ");

  return (
    <div className={cn(CONSOLE_CARD, "overflow-hidden")}>
      {/* Repeats the selected branch from the list — this pane becomes its own
          context when stacked below the list on narrow screens. */}
      <div className="border-b border-app-border px-5 py-4">
        <h2 className="text-lg font-bold text-console-ink">{branch.branch_name}</h2>
        {branch.address && (
          <p className="mt-0.5 text-xs text-app-muted">{branch.address}</p>
        )}
      </div>

      <div className="space-y-6 p-5">
        {/* 1. Booking mode — radio cards */}
        <fieldset>
          <legend className="mb-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-app-muted">
            1. Booking mode
          </legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {BOOKING_MODES.map((mode) => {
              const active = bookingMode === mode.value;
              return (
                <button
                  key={mode.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setBookingMode(mode.value)}
                  className={cn(
                    "relative rounded-lg border p-4 text-left transition-all",
                    active
                      ? "border-2 border-ember/50 bg-ember/10"
                      : "border-app-border hover:border-ember/30",
                  )}
                >
                  {active && (
                    <span
                      aria-hidden
                      className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-ember text-[11px] font-bold text-on-accent"
                    >
                      ✓
                    </span>
                  )}
                  <span
                    className={cn(
                      "block text-sm font-bold",
                      active ? "text-ember" : "text-app-fg",
                    )}
                  >
                    {mode.title}
                  </span>
                  <span className="mt-1 block text-xs text-app-muted">
                    {mode.hint}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* 2. Capacity — steppers */}
        <fieldset>
          <legend className="mb-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-app-muted">
            2. Capacity
          </legend>
          <div className="divide-y divide-app-border">
            <Stepper
              label="Total tables"
              value={totalTables}
              onChange={(v) => setTotalTables(Math.max(0, v))}
            />
            <Stepper
              label="Max guests / table"
              value={maxGuestPerTable}
              onChange={(v) => setMaxGuestPerTable(Math.max(1, v))}
              min={1}
            />
          </div>
        </fieldset>

        {/* 3. Policy */}
        <fieldset>
          <legend className="mb-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-app-muted">
            3. Policy
          </legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs text-app-muted">
                Slot duration
              </span>
              <select
                value={String(slotDurationMinutes)}
                onChange={(e) => setSlotDurationMinutes(Number(e.target.value))}
                className={consoleInput}
              >
                {[30, 60, 90, 120].map((mins) => (
                  <option key={mins} value={String(mins)}>
                    {mins} min
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-app-muted">
                Advance notice (hours)
              </span>
              <input
                type="number"
                min={0}
                max={720}
                value={advanceNoticeHours}
                onChange={(e) => setAdvanceNoticeHours(Number(e.target.value))}
                className={`${consoleInput} tabular-nums`}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-xs text-app-muted">
                Cancellation policy
              </span>
              <textarea
                rows={2}
                maxLength={500}
                value={cancellationPolicy}
                onChange={(e) => setCancellationPolicy(e.target.value)}
                placeholder="Enter terms… e.g. Free cancellation up to 2 hours before the reservation."
                className={`${consoleInput} resize-none`}
              />
            </label>
          </div>
        </fieldset>

        {/* Live preview strip */}
        <div className="flex items-start gap-2.5 rounded-lg border border-app-border bg-app-bg px-4 py-3">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className="mt-0.5 h-4 w-4 shrink-0 text-ember"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
            />
          </svg>
          <p className="text-xs leading-relaxed text-app-muted">
            <span className="font-semibold uppercase tracking-widest text-app-muted">
              Guests see:
            </span>{" "}
            {guestSummary}
            {cancellationPolicy.trim() ? ` · ${cancellationPolicy.trim()}` : ""}
          </p>
        </div>
      </div>

      {/* Save bar — mirrors the artboard's unsaved-changes treatment */}
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-3 border-t px-5 py-4 transition-colors",
          dirty ? "border-ember/40 bg-ember/10" : "border-app-border",
        )}
      >
        <span
          className={cn(
            "text-sm italic",
            dirty ? "text-ember" : "text-transparent select-none",
          )}
          aria-hidden={!dirty}
        >
          Unsaved changes
        </span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={discard}
            disabled={!dirty || saving}
            className="min-h-[44px] rounded-full border border-app-border px-5 text-sm font-semibold text-app-muted transition-colors hover:border-ember/30 disabled:pointer-events-none disabled:opacity-50"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!dirty || saving}
            className="min-h-[44px] rounded-full bg-ember px-6 text-sm font-semibold text-on-accent shadow-glass transition-all hover:brightness-110 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
        {msg && (
          <p
            role={msg.ok ? "status" : "alert"}
            className={cn("w-full text-xs", msg.ok ? "text-success" : "text-danger")}
          >
            {msg.text}
          </p>
        )}
      </div>

      <BranchMenu branchId={branch.id} branchName={branch.branch_name} />
    </div>
  );
}

export function RestaurantHoursCard({
  restaurant,
}: {
  restaurant: Restaurant
}) {
  const [hours, setHours] = useState<
    Record<string, { open: string; close: string }[]>
  >(() => structuredClone(restaurant.opening_hours ?? {}));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function setRange(day: string, open: string, close: string) {
    setHours((prev) => ({ ...prev, [day]: [{ open, close }] }));
    setMsg(null);
  }

  async function save() {
    setSaving(true);
    setMsg(null);
    const res = await updateRestaurantHours({
      restaurantId: restaurant.id,
      openingHours: hours,
    });
    setSaving(false);
    setMsg({ ok: res.ok, text: res.message });
  }

  return (
    <div className={cn(CONSOLE_CARD, "p-5")}>
      <p className="mb-4 text-lg font-bold">{restaurant.name}</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {DAYS.map((day) => {
          const range = hours[day]?.[0] ?? { open: "12:00", close: "22:00" };
          return (
            <div
              key={day}
              className="flex items-center gap-2 text-sm capitalize"
            >
              <span className="w-16 shrink-0 text-xs font-semibold uppercase tracking-widest text-app-muted">
                {DAY_LABELS[day].slice(0, 3)}
              </span>
              <input
                type="time"
                aria-label={`${DAY_LABELS[day]} opens`}
                value={range.open}
                onChange={(e) => setRange(day, e.target.value, range.close)}
                className="rounded-md border border-app-border bg-app-bg px-2 py-1.5 text-xs tabular-nums text-app-fg outline-none focus:border-ember/50"
              />
              <span className="text-app-muted">–</span>
              <input
                type="time"
                aria-label={`${DAY_LABELS[day]} closes`}
                value={range.close}
                onChange={(e) => setRange(day, range.open, e.target.value)}
                className="rounded-md border border-app-border bg-app-bg px-2 py-1.5 text-xs tabular-nums text-app-fg outline-none focus:border-ember/50"
              />
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="min-h-[44px] rounded-full bg-ember px-6 text-sm font-semibold text-on-accent shadow-glass transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save hours"}
        </button>
        {msg && (
          <p
            role={msg.ok ? "status" : "alert"}
            className={cn("text-sm", msg.ok ? "text-success" : "text-danger")}
          >
            {msg.text}
          </p>
        )}
      </div>
    </div>
  );
}
