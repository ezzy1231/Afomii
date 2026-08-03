'use client'

import { useState } from 'react'
import { ArrowLeft, CalendarDays, Clock3, MapPin, Tag, Users } from 'lucide-react'
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
    <div className="mx-auto max-w-5xl px-4 pb-28 pt-8 sm:px-6 lg:px-8">
      <Link href="/events" className="mb-6 inline-flex items-center gap-2 text-sm text-app-muted hover:text-app-fg transition-colors">
        <ArrowLeft className="size-4" />
        Back to events
      </Link>

      <div className="card-elevated overflow-hidden">
        <div className="h-48 bg-gradient-to-br from-navy to-navy/80 p-6 sm:h-64">
          <div className="flex items-center gap-2">
            <span className="badge-gold">{event.category}</span>
            <span className="badge-gold bg-green-500/10 text-green-600">{event.status}</span>
          </div>
          <h1 className="mt-4 font-serif text-3xl font-bold text-white sm:text-4xl">{event.title}</h1>
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap gap-4 text-sm text-app-muted">
            <span className="flex items-center gap-1.5"><CalendarDays className="size-4" />{formatDate(event.startDateTime)}</span>
            <span className="flex items-center gap-1.5"><Clock3 className="size-4" />{formatDate(event.endDateTime)}</span>
            <span className="flex items-center gap-1.5"><MapPin className="size-4" />{event.venueName}</span>
          </div>

          {event.description && (
            <p className="mt-6 leading-relaxed text-app-muted">{event.description}</p>
          )}

          {event.ticketTypes.length > 0 && (
            <div className="mt-8">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-app-fg">
                <Tag className="size-4" />Select Tickets
              </h3>
              <div className="space-y-3">
                {event.ticketTypes.map((ticket) => {
                  const soldOut = ticket.remainingQuantity <= 0
                  return (
                    <button
                      key={ticket.id}
                      type="button"
                      disabled={soldOut}
                      onClick={() => setSelectedTier(ticket.id)}
                      className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition-all disabled:opacity-50 ${
                        selectedTier === ticket.id
                          ? 'border-gold/50 bg-gold/5 shadow-soft'
                          : 'border-[var(--border)] hover:border-gold/30'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-app-fg">{ticket.name}</span>
                          <span className="badge-gold text-[10px]">{ticket.tier}</span>
                        </div>
                        <p className="mt-1 text-sm text-app-muted">
                          <Users className="mr-1 inline size-3.5" />
                          {soldOut ? 'Sold out' : `${ticket.remainingQuantity}/${ticket.totalQuantity} remaining`}
                        </p>
                      </div>
                      <span className="font-bold text-app-fg">
                        {ticket.price === 0 ? 'Free' : `$${ticket.price}`}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="mt-8 flex gap-3">
            <Link href="/ride" className="btn-secondary flex-1 text-center !py-3">
              Go by Ride
            </Link>
            <button
              type="button"
              disabled={!selectedTier || (selectedTicket?.remainingQuantity ?? 0) <= 0}
              className="btn-primary flex-1 !py-3 disabled:opacity-50"
            >
              {selectedTicket ? `Get tickets · $${totalForSelected}` : 'Select a ticket tier'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
