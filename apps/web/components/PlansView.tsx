"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CarFront,
  Clock3,
  Loader2,
  MapPin,
  Utensils,
  Ticket,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { isRideBookable, rideWindowHint } from "@/lib/rideWindow";
import { cn } from "@/lib/utils";
import { startPlanRide } from "@/app/plans/actions";
import { EmptyState } from "@/components/patterns";
import { StaggerGroup, StaggerItem } from "@/components/motion";

type Tab = "upcoming" | "past";

export type ConsumerPlan = {
  id: string;
  planType: "reservation" | "event";
  title: string;
  coverImageUrl: string | null;
  planDate: string | null;
  location: string;
  latitude: number | null;
  longitude: number | null;
  status: string;
};

export default function PlansView({ userId }: { userId: string }) {
  const router = useRouter();
  const [plans, setPlans] = useState<ConsumerPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("upcoming");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/plans/user")
      .then((r) => (r.ok ? r.json() : { plans: [] }))
      .then((data) => {
        if (!cancelled) setPlans(data.plans ?? []);
      })
      .catch(() => {
        if (!cancelled) setPlans([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const now = new Date();
  const upcoming = plans.filter(
    (p) =>
      !p.planDate ||
      new Date(p.planDate) >= new Date(now.getTime() - 2 * 60 * 60 * 1000),
  );
  const past = plans.filter(
    (p) =>
      p.planDate &&
      new Date(p.planDate) < new Date(now.getTime() - 2 * 60 * 60 * 1000),
  );

  const [bookingId, setBookingId] = useState<string | null>(null);

  const handleBookRide = useCallback(
    async (plan: ConsumerPlan) => {
      if (bookingId) return;
      setBookingId(plan.id);
      try {
        const result = await startPlanRide(plan.id, plan.planType);
        if (result.ok && result.url) {
          router.push(result.url);
        } else {
          alert(result.message);
        }
      } catch {
        alert("Something went wrong. Please try again.");
      } finally {
        setBookingId(null);
      }
    },
    [bookingId, router],
  );

  const displayPlans = tab === "upcoming" ? upcoming : past;

  return (
    <div className="mx-auto max-w-4xl">
      {/* Tabs */}
      <div className="glass mb-6 flex gap-1.5 rounded-2xl p-1">
        {(["upcoming", "past"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold capitalize transition-all duration-200",
              tab === t
                ? "bg-gradient-to-br from-ember to-ember-deep text-white shadow-[0_2px_8px_rgb(var(--ember-rgb)/0.3)]"
                : "text-app-muted hover:bg-app-elevated/60 hover:text-app-fg",
            )}
          >
            {t}
            <span className="ml-1.5 text-[11px] font-medium opacity-70">
              {t === "upcoming" ? upcoming.length : past.length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2
            className="size-8 animate-spin text-ember"
            strokeWidth={2.5}
          />
        </div>
      ) : displayPlans.length === 0 ? (
        <EmptyState
          icon={
            tab === "upcoming" ? (
              <CalendarDays className="size-6" />
            ) : (
              <Ticket className="size-6" />
            )
          }
          title={tab === "upcoming" ? "No upcoming plans" : "No past plans"}
          message={
            tab === "upcoming"
              ? "Book a table or grab tickets for an event — your plans will show up here."
              : "Your past reservations and events will appear here."
          }
        />
      ) : (
        <StaggerGroup className="space-y-3">
          {displayPlans.map((plan) => {
            const bookable = isRideBookable(plan.planDate);
            const hint = rideWindowHint(plan.planDate);
            const busy = bookingId === plan.id;

            return (
              <StaggerItem key={`${plan.planType}-${plan.id}`}>
                <div className="glass glass-hover overflow-hidden rounded-2xl">
                  <div className="flex flex-col sm:flex-row">
                    {/* Thumbnail */}
                    <div className="relative h-28 w-full shrink-0 overflow-hidden sm:h-auto sm:w-36">
                      {plan.coverImageUrl ? (
                        <Image
                          src={plan.coverImageUrl}
                          alt={plan.title}
                          fill
                          sizes="180px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-ember/25 to-ember/60">
                          <span className="text-4xl font-bold text-white">
                            {plan.title.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 px-4 py-3 sm:px-5">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "flex size-6 shrink-0 items-center justify-center rounded-lg",
                            plan.planType === "reservation"
                              ? "bg-ember/15 text-ember"
                              : "bg-ember/15 text-ember",
                          )}
                        >
                          {plan.planType === "reservation" ? (
                            <Utensils className="size-3.5" strokeWidth={2.5} />
                          ) : (
                            <Ticket className="size-3.5" strokeWidth={2.5} />
                          )}
                        </span>
                        <span className="text-[11px] font-semibold uppercase tracking-widest text-app-muted">
                          {plan.planType === "reservation"
                            ? "Restaurant"
                            : "Event"}
                        </span>
                        {plan.status && (
                          <span
                            className={cn(
                              "ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                              plan.status === "confirmed" ||
                                plan.status === "paid"
                                ? "bg-success/15 text-success"
                                : "bg-warning/15 text-warning",
                            )}
                          >
                            {plan.status}
                          </span>
                        )}
                      </div>

                      <h3 className="truncate text-lg font-semibold text-app-fg">
                        {plan.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-app-muted">
                        {plan.planDate && (
                          <span className="flex items-center gap-1">
                            <Clock3 className="size-3" strokeWidth={2.5} />
                            {new Date(plan.planDate).toLocaleDateString(
                              "en-US",
                              {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              },
                            )}
                          </span>
                        )}
                        {plan.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="size-3" strokeWidth={2.5} />
                            <span className="truncate max-w-40">
                              {plan.location}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Ride action */}
                    <div className="flex shrink-0 items-center border-t border-app-border px-4 py-3 sm:border-l sm:border-t-0 sm:px-5">
                      <button
                        type="button"
                        onClick={() => handleBookRide(plan)}
                        disabled={!bookable || busy}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all duration-200",
                          bookable
                            ? "bg-gradient-to-br from-ember to-ember-deep text-white shadow-[0_2px_8px_rgb(var(--ember-rgb)/0.3)] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgb(var(--ember-rgb)/0.4)] active:translate-y-0 active:scale-[0.98]"
                            : "bg-app-input text-app-muted/50 cursor-not-allowed",
                        )}
                      >
                        {busy ? (
                          <Loader2
                            className="size-3.5 animate-spin"
                            strokeWidth={2.5}
                          />
                        ) : (
                          <CarFront className="size-3.5" strokeWidth={2.5} />
                        )}
                        {busy
                          ? "Opening…"
                          : bookable
                            ? "Book a Ride"
                            : "Ride unavailable"}
                      </button>
                      {!bookable && (
                        <p className="ml-2 max-w-28 text-[9px] font-medium leading-tight text-app-muted">
                          {hint}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerGroup>
      )}
    </div>
  );
}
