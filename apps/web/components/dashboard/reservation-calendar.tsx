"use client";

import { useState } from "react";
import { cn, formatDate } from "../../lib/utils";
import { StatusBadge } from "../ui/badge";
import { Button } from "../ui/button";

type Reservation = {
  id: string;
  reservationDate: string;
  timeSlot: string | null;
  guestCount: number;
  status: string;
  user: { email?: string; phone?: string };
};

type Props = {
  reservations: Reservation[];
  onUpdateStatus: (id: string, status: string) => void;
};

export function ReservationCalendarGrid({ reservations, onUpdateStatus }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  const groupedByDate = reservations.reduce<Record<string, Reservation[]>>(
    (acc, r) => {
      const key = new Date(r.reservationDate).toDateString();
      if (!acc[key]) acc[key] = [];
      acc[key].push(r);
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-app-fg">Reservations</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">Day</Button>
          <Button variant="primary" size="sm">Week</Button>
          <Button variant="outline" size="sm">Month</Button>
        </div>
      </div>

      <div className="grid gap-4">
        {Object.entries(groupedByDate).map(([date, bookings]) => (
          <div key={date} className="card">
            <p className="text-sm font-semibold text-app-fg mb-3">
              {formatDate(date)}
            </p>
            <div className="space-y-2">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all",
                    selected === booking.id
                      ? "border-gold bg-gold/5"
                      : "border-app-border hover:border-gold/40"
                  )}
                  onClick={() =>
                    setSelected(selected === booking.id ? null : booking.id)
                  }
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-sm font-bold text-app-fg">
                        {booking.timeSlot ?? "—"}
                      </p>
                       <p className="text-xs text-app-muted">
                        {booking.guestCount} guests
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-app-fg">
                        {booking.user.email ?? booking.user.phone}
                      </p>
                      <StatusBadge status={booking.status} />
                    </div>
                  </div>

                  {selected === booking.id && (
                    <div className="flex flex-wrap gap-2">
                      {booking.status === "pending" && (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateStatus(booking.id, "confirmed");
                            }}
                          >
                            Confirm
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateStatus(booking.id, "rejected");
                            }}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {booking.status === "confirmed" && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateStatus(booking.id, "completed");
                          }}
                        >
                          Complete
                        </Button>
                      )}
                      {(booking.status === "pending" || booking.status === "confirmed") && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateStatus(booking.id, "cancelled");
                          }}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {reservations.length === 0 && (
          <p className="text-center text-app-muted py-8">
            No reservations yet
          </p>
        )}
      </div>
    </div>
  );
}
