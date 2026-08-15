'use client'

import { useState } from 'react'
import { ArrowLeft, Check, Clock3, MapPin, Phone, ShieldCheck, Star, Utensils, Wallet } from 'lucide-react'
import Link from 'next/link'
import { ReservationForm } from '@/components/reservation-form'
import type { RestaurantDetail as Restaurant, DetailBranch as Branch } from '@/lib/supabase/queries'

export default function RestaurantDetail({ restaurant }: { restaurant: Restaurant }) {
  const [selectedBranch, setSelectedBranch] = useState(restaurant.branches[0]?.id ?? null)
  const branch = restaurant.branches.find((b) => b.id === selectedBranch) ?? restaurant.branches[0]
  const menuCategories = branch?.menuItems ? [...new Set(branch.menuItems.map((item) => item.category))] : []

  return (
    <div className="mx-auto max-w-6xl px-4 pb-28 pt-8 sm:px-6 lg:px-8">
      <Link href="/restaurants" className="mb-6 inline-flex items-center gap-2 text-sm text-[#d9d0c4] transition-colors hover:text-[#f7f0e8]">
        <ArrowLeft className="size-4" />
        Back to restaurants
      </Link>

      <div className="overflow-hidden rounded-[30px] border border-[#d7b778]/30 bg-[#071a2e] shadow-[0_24px_80px_rgba(0,0,0,0.32)]">
        <div className="h-56 bg-[radial-gradient(circle_at_top,_rgba(215,183,120,0.22),transparent_28%),linear-gradient(135deg,#1a120d,#0d1e2f_50%,#07192b_100%)] p-5 sm:h-72 sm:p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#d7b778]/35 bg-[#0d1e2f]/70 text-2xl">🌳</div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.24em] text-[#d7b778]">Sky Garden</div>
                <div className="font-serif text-3xl font-bold text-[#f8f1e8] sm:text-5xl">{restaurant.name}</div>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d7b778]/35 bg-[#d7b778]/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-[#f1d79a]">
              <ShieldCheck className="size-3.5" />
              Premium
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[#f7f0e7]">
              <Star className="size-5 fill-[#d7b778] text-[#d7b778]" />
              <span className="font-serif text-3xl font-bold">4.7</span>
              <span className="text-sm text-[#d7d0c5]">(1,248 reviews)</span>
            </div>
            <div className="rounded-full border border-[#d7b778]/25 bg-[#d7b778]/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-[#f2d79b]">
              Verified
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3 text-sm text-[#d7d0c5]">
                <div className="flex items-center gap-2 rounded-2xl border border-[#d7b778]/15 bg-[#0c1d30] px-3 py-2">
                  <MapPin className="size-4 text-[#d7b778]" />
                  {branch?.address ?? 'Addis Ababa'}
                </div>
                <div className="flex items-center gap-2 rounded-2xl border border-[#d7b778]/15 bg-[#0c1d30] px-3 py-2">
                  <Clock3 className="size-4 text-[#d7b778]" />
                  Mon - Sun · 8:00 AM - 11:00 PM
                </div>
              </div>

              {restaurant.branches.length > 1 && (
                <div className="rounded-[22px] border border-[#d7b778]/20 bg-[#0d1d2f] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-lg font-semibold text-[#f7f0e7]">Branches</div>
                    <div className="text-xs uppercase tracking-[0.18em] text-[#d7b778]">View all</div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {restaurant.branches.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setSelectedBranch(b.id)}
                        className={`rounded-2xl border p-3 text-left transition ${
                          selectedBranch === b.id ? 'border-[#d7b778]/35 bg-[#d7b778]/10' : 'border-[#d7b778]/10 bg-[#101f32]'
                        }`}
                      >
                        <div className="font-medium text-[#f7f0e7]">{b.branchName}</div>
                        <div className="mt-1 text-sm text-[#d3cabf]">{b.address}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-4">
                {[
                  { label: 'Menu', icon: Utensils },
                  { label: 'Reserve', icon: Clock3 },
                  { label: 'Follow', icon: Star },
                  { label: 'Save', icon: Wallet },
                ].map(({ label, icon: Icon }) =>
                  label === 'Reserve' ? (
                    <Link
                      key={label}
                      href="#reserve"
                      className="rounded-2xl border border-[#d7b778]/20 bg-[#0d1d2f] p-3 text-center text-sm text-[#f2ece2]"
                    >
                      <div className="mb-2 flex justify-center"><Icon className="size-5 text-[#d7b778]" /></div>
                      {label}
                    </Link>
                  ) : (
                    <button key={label} type="button" className="rounded-2xl border border-[#d7b778]/20 bg-[#0d1d2f] p-3 text-center text-sm text-[#f2ece2]">
                      <div className="mb-2 flex justify-center"><Icon className="size-5 text-[#d7b778]" /></div>
                      {label}
                    </button>
                  )
                )}
              </div>

              <div className="rounded-[22px] border border-[#d7b778]/20 bg-[#0d1d2f] p-4">
                <div className="mb-2 flex items-center justify-between text-sm text-[#d7d0c5]">
                  <span className="inline-flex items-center gap-2"><Check className="size-4 text-[#d7b778]" />Live-time availability</span>
                  <span className="text-[#d7b778]">Available now</span>
                </div>
                <div className="text-sm text-[#d7d0c5]">Next available time: 7:30 PM</div>
              </div>
            </div>

            <div className="rounded-[22px] border border-[#d7b778]/20 bg-[#0d1d2f] p-4">
              <div className="mb-3 flex items-center justify-between text-[#f7f0e7]">
                <span className="font-medium">Directions</span>
                <span className="rounded-full border border-[#d7b778]/25 bg-[#d7b778]/10 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-[#f1d79a]">Map</span>
              </div>
              <div className="rounded-2xl bg-[radial-gradient(circle_at_center,_rgba(215,183,120,0.12),transparent_35%),linear-gradient(135deg,#dfeaf6,#b7d0e4)] p-4 text-center text-sm text-[#051a2c]">
                Map preview
              </div>
              <div className="mt-4 text-sm text-[#d5cbbd]">Bole, Addis Ababa</div>
            </div>

            <div id="reserve" className="mt-4 scroll-mt-24">
              <ReservationForm restaurant={restaurant} branch={branch} key={branch.id} />
            </div>
          </div>

          {branch?.menuItems && branch.menuItems.length > 0 && (
            <div className="mt-8 rounded-[24px] border border-[#d7b778]/20 bg-[#0d1d2f] p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="font-serif text-2xl font-bold text-[#f7f0e7]">Menu</div>
                <div className="text-xs uppercase tracking-[0.18em] text-[#d7b778]">Popular</div>
              </div>

              {menuCategories.map((category) => (
                <div key={category} className="mb-5">
                  <div className="mb-2 text-xs uppercase tracking-[0.2em] text-[#d7b778]">{category}</div>
                  <div className="space-y-2">
                    {branch.menuItems.filter((item) => item.category === category).slice(0, 3).map((item) => (
                      <div key={item.id} className="flex items-center justify-between rounded-2xl border border-[#d7b778]/10 bg-[#101f32] p-3">
                        <div>
                          <div className="font-medium text-[#f7f0e7]">{item.name}</div>
                          <div className="text-xs text-[#d3cabf]">{item.isAvailable ? 'Available' : 'Unavailable'}</div>
                        </div>
                        <div className="font-semibold text-[#f0d79a]">ETB {item.price}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
