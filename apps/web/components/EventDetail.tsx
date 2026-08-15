'use client'

import { useState } from 'react'
import { ArrowLeft, CalendarDays, Clock3, MapPin, ShieldCheck, Tag, Ticket, Users } from 'lucide-react'
import Link from 'next/link'

type TicketType = {
  id: string
  name: string
  tier: string
  price: number
  totalQuantity: number
  remainingQuantity: number
  salesStart: string | null
  salesEnd: string | null
}

type Event = {
  id: string
  title: string
  description: string | null
  category: string
  venueName: string
  latitude: number | null
  longitude: number | null
  startDateTime: string
  endDateTime: string
  coverImageUrl: string | null
  status: string
  ticketTypes: TicketType[]
  organizer: { id: string; email: string }
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

export default function EventDetail({ event }: { event: Event }) {
  const [selectedTier, setSelectedTier] = useState<string | null>(null)
  const selectedTicket = event.ticketTypes.find((t) => t.id === selectedTier)
  const totalForSelected = selectedTicket ? selectedTicket.price : 0

  return (
    <div className="mx-auto max-w-6xl px-4 pb-28 pt-8 sm:px-6 lg:px-8">
      <Link href="/events" className="mb-6 inline-flex items-center gap-2 text-sm text-[#d9d0c4] transition-colors hover:text-[#f7f0e8]">
        <ArrowLeft className="size-4" />
        Back to events
      </Link>

      <div className="overflow-hidden rounded-[30px] border border-[#d7b778]/30 bg-[#071a2e] shadow-[0_24px_80px_rgba(0,0,0,0.32)]">
        <div className="h-56 bg-[radial-gradient(circle_at_top,_rgba(215,183,120,0.22),transparent_22%),linear-gradient(135deg,#2d1a38,#0c1d2f_50%,#07192b_100%)] p-5 sm:h-72 sm:p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#d7b778]/35 bg-[#0d1e2f]/70 text-3xl">🎵</div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.24em] text-[#d7b778]">Event</div>
                <div className="font-serif text-3xl font-bold text-[#f8f1e8] sm:text-5xl">{event.title}</div>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d7b778]/35 bg-[#d7b778]/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-[#f1d79a]">
              <ShieldCheck className="size-3.5" />
              Verified
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-7">
          <div className="mb-5 flex flex-wrap gap-3 text-sm text-[#d7d0c5]">
            <div className="flex items-center gap-2 rounded-2xl border border-[#d7b778]/15 bg-[#0c1d30] px-3 py-2">
              <CalendarDays className="size-4 text-[#d7b778]" />
              {formatDate(event.startDateTime)}
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-[#d7b778]/15 bg-[#0c1d30] px-3 py-2">
              <MapPin className="size-4 text-[#d7b778]" />
              {event.venueName}
            </div>
          </div>

          {event.description && <p className="mb-5 text-base leading-7 text-[#d9d0c6]">{event.description}</p>}

          <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="rounded-[22px] border border-[#d7b778]/20 bg-[#0d1d2f] p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="font-serif text-2xl font-bold text-[#f7f0e7]">Tickets</div>
                <div className="text-xs uppercase tracking-[0.18em] text-[#d7b778]">Available</div>
              </div>

              <div className="space-y-3">
                {event.ticketTypes.map((ticket) => {
                  const soldOut = ticket.remainingQuantity <= 0
                  return (
                    <button
                      key={ticket.id}
                      type="button"
                      disabled={soldOut}
                      onClick={() => setSelectedTier(ticket.id)}
                      className={`flex w-full items-center justify-between rounded-2xl border p-3 text-left transition disabled:opacity-60 ${
                        selectedTier === ticket.id ? 'border-[#d7b778]/40 bg-[#d7b778]/10' : 'border-[#d7b778]/10 bg-[#101f32]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#f7f0e7]">{ticket.name}</span>
                          <span className="rounded-full border border-[#d7b778]/20 bg-[#d7b778]/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-[#f0d79a]">{ticket.tier}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-[#d0c7bb]">
                          <Users className="size-3.5 text-[#d7b778]" />
                          {soldOut ? 'Sold out' : `${ticket.remainingQuantity} left`}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-[#f7f0e7]">{ticket.price === 0 ? 'Free' : `ETB ${ticket.price}`}</div>
                        <div className="text-[10px] uppercase tracking-[0.18em] text-[#d7b778]">{ticket.tier}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="rounded-[22px] border border-[#d7b778]/20 bg-[#0d1d2f] p-4">
              <div className="mb-3 flex items-center gap-2 text-[#d7b778]">
                <Ticket className="size-4" />
                Order summary
              </div>

              <div className="space-y-3 text-sm text-[#e5ddd2]">
                <div className="flex items-center justify-between">
                  <span>Selected</span>
                  <span>{selectedTicket ? selectedTicket.name : 'No ticket selected'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Date</span>
                  <span>{new Date(event.startDateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Time</span>
                  <span>{new Date(event.startDateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                </div>
              </div>

              <button
                type="button"
                disabled={!selectedTier || (selectedTicket?.remainingQuantity ?? 0) <= 0}
                className="mt-5 w-full rounded-2xl bg-[#d7b778] px-4 py-3 text-sm font-semibold text-[#06182d] disabled:opacity-50"
              >
                {selectedTicket ? `Book ticket · ETB ${totalForSelected}` : 'Select a ticket'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
