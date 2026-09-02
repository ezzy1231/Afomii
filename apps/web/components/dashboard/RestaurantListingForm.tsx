"use client";

import { useState, useTransition } from "react";
import {
  createRestaurantListing,
  type DashboardActionState,
} from "@/app/dashboard/actions";
import BannerUploadField from "@/components/BannerUploadField";

export default function RestaurantListingForm() {
  const [state, setState] = useState<DashboardActionState>({
    ok: false,
    message: "",
  });
  const [pending, startTransition] = useTransition();
  const [bannerReady, setBannerReady] = useState(false);

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createRestaurantListing(state, formData);
      setState(result);
    });
  }

  return (
    <section className="card-elevated p-6 sm:p-8">
      <h2 className="text-xl font-bold text-app-fg">
        Create restaurant listing
      </h2>
      <p className="mt-2 text-sm text-app-muted">
        Publish a live listing for the explore feed.
      </p>

      <form action={handleSubmit} className="mt-6 grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-medium text-app-fg">
          <span className="mb-1.5 block">Restaurant name</span>
          <input
            name="name"
            required
            className="input-premium"
            placeholder="Juniper Table"
          />
        </label>
        <label className="block text-sm font-medium text-app-fg">
          <span className="mb-1.5 block">Cuisine</span>
          <input
            name="cuisine"
            className="input-premium"
            placeholder="Modern African"
          />
        </label>
        <label className="block text-sm font-medium text-app-fg">
          <span className="mb-1.5 block">Area label</span>
          <input
            name="areaLabel"
            className="input-premium"
            placeholder="West End"
          />
        </label>
        <label className="block text-sm font-medium text-app-fg">
          <span className="mb-1.5 block">City</span>
          <input
            name="city"
            required
            className="input-premium"
            placeholder="Addis Ababa"
          />
        </label>
        <label className="block text-sm font-medium text-app-fg sm:col-span-2">
          <span className="mb-1.5 block">Closing label</span>
          <input
            name="closingLabel"
            className="input-premium"
            placeholder="Open until 11:00 PM"
          />
        </label>

        {/* Banner upload — required */}
        <div className="sm:col-span-2">
          <BannerUploadField fieldName="coverUrl" onReady={setBannerReady} />
        </div>

        <button
          type="submit"
          disabled={pending || !bannerReady}
          className="btn-primary sm:col-span-2 mt-2 !py-3"
        >
          {pending ? "Creating listing..." : "Create listing"}
        </button>
      </form>

      {state.message && (
        <p
          className={`animate-pop-in mt-5 rounded-xl px-4 py-3 text-sm ${state.ok ? "bg-ember/10 text-app-fg border border-ember/20" : "bg-red-50 text-red-700 border border-red-200"}`}
        >
          {state.message}
        </p>
      )}
    </section>
  );
}
