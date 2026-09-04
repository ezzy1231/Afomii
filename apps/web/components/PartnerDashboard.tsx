import Link from "next/link";
import {
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  Store,
} from "lucide-react";
import Navbar from "./Navbar";
import PageFooter from "./PageFooter";

export default function PartnerDashboard({
  type,
}: {
  type: "restaurant" | "organizer";
}) {
  const restaurant = type === "restaurant";
  const title = restaurant ? "Restaurant workspace" : "Organizer workspace";
  const action = restaurant ? "Create your listing" : "Create an event";
  const label = restaurant ? "Restaurant" : "Event";
  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-8 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ember">
          Partner portal
        </p>
        <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-4xl font-bold text-app-fg">{title}</h1>
            <p className="mt-2 text-app-muted">
              Your profile is ready. Add details to start reaching new
              customers.
            </p>
          </div>
          <Link href="/settings" className="btn-primary !py-2 !px-5 text-xs">
            Account settings
          </Link>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          <Metric
            icon={restaurant ? Store : CalendarDays}
            label={`Published ${label.toLowerCase()}s`}
            value="0"
          />
          <Metric icon={CalendarDays} label="Upcoming bookings" value="0" />
          <Metric icon={CircleDollarSign} label="This month" value="$0" />
        </div>
        <section className="card-elevated mt-6 p-6 sm:p-8">
          <h2 className="text-xl font-bold text-app-fg">
            Set up your presence
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-app-muted">
            Your public page is not live yet. Complete your profile details,
            photos and availability to begin.
          </p>
          <Link
            href={restaurant ? "/dashboard/restaurant/listings/new" : "/dashboard/organizer/events"}
            className="btn-secondary mt-5 inline-flex items-center gap-2 !py-2 !px-5 text-xs"
          >
            {action}
            <ChevronRight className="size-4" />
          </Link>
        </section>
      </main>
      <PageFooter />
    </>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Store;
  label: string;
  value: string;
}) {
  return (
    <section className="card-surface p-6">
      <Icon className="size-5 text-ember" />
      <p className="mt-4 text-3xl font-bold text-app-fg">{value}</p>
      <p className="mt-1 text-sm text-app-muted">{label}</p>
    </section>
  );
}
