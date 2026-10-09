'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, CameraOff, CheckCircle2 } from 'lucide-react'
import { checkInReservation } from '@/app/dashboard/actions'

type ReservationCodeRow = {
  bookingCode: string
  checkedInAt: string | null
  status: string
}

type BarcodeDetectorLike = {
  detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>>
}

type BarcodeDetectorConstructor = new (options: { formats: string[] }) => BarcodeDetectorLike

export function BookingCheckIn({
  reservations,
  onCheckedIn,
}: {
  reservations: ReservationCodeRow[]
  onCheckedIn?: (code: string) => void
}) {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const submitRef = useRef<(value?: string) => Promise<void>>(async () => {})
  const [code, setCode] = useState('')
  const [scanning, setScanning] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)

  async function submit(value = code) {
    if (busy) return
    setBusy(true)
    setMessage(null)
    const normalized = value.trim().toUpperCase()
    const result = await checkInReservation(normalized)
    setMessage({ ok: result.ok, text: result.message })
    if (result.ok) {
      onCheckedIn?.(normalized)
      router.refresh()
      setCode('')
    }
    setBusy(false)
  }

  useEffect(() => { submitRef.current = submit }, [submit])

  useEffect(() => {
    if (!scanning) return
    let stopped = false
    let stream: MediaStream | null = null
    let timer: ReturnType<typeof setTimeout> | null = null

    async function run() {
      try {
        const Detector = (window as Window & { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector
        if (!Detector) {
          setCameraError('QR scanning is not available in this browser. Enter the booking code below.')
          setScanning(false)
          return
        }
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } })
        if (stopped || !videoRef.current) return
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        const detector = new Detector({ formats: ['qr_code'] })

        const scan = async () => {
          if (stopped || !videoRef.current) return
          try {
            const result = await detector.detect(videoRef.current)
            const found = result[0]?.rawValue?.trim()
            if (found) {
              setCode(found)
              setScanning(false)
              await submitRef.current(found)
              return
            }
          } catch {
            setCameraError('Could not read that QR code. Try again or enter the booking code.')
          }
          if (!stopped) timer = setTimeout(scan, 250)
        }
        void scan()
      } catch {
        setCameraError('Camera access was unavailable. Enter the booking code below.')
        setScanning(false)
      }
    }

    setCameraError(null)
    void run()
    return () => {
      stopped = true
      if (timer) clearTimeout(timer)
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [scanning])

  const unverified = reservations.filter((row) => row.status === 'confirmed' && !row.checkedInAt).length

  return (
    <section className="glass rounded-2xl p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-app-muted">Guest arrival</p>
          <h2 className="mt-1 text-xl font-bold text-app-fg">Reservation check-in</h2>
          <p className="mt-1 text-sm text-app-muted">Scan the guest QR or enter their 12-character booking code.</p>
        </div>
        <span className="rounded-full bg-app-input px-3 py-1 text-xs font-semibold text-app-muted">{unverified} awaiting check-in</span>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase().replace(/[^A-F0-9]/g, '').slice(0, 12))}
          onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void submit() } }}
          inputMode="text"
          autoComplete="off"
          aria-label="Booking code"
          placeholder="ABC123DEF456"
          className="min-h-11 min-w-0 flex-1 rounded-xl border border-app-border bg-app-input px-4 font-mono text-base tracking-[0.16em] text-app-fg outline-none focus:border-ember/50"
        />
        <button type="button" onClick={() => void submit()} disabled={busy || code.length !== 12} className="min-h-11 rounded-xl bg-ember px-5 text-sm font-semibold text-on-accent disabled:opacity-50">
          {busy ? 'Checking…' : 'Check in guest'}
        </button>
        <button type="button" onClick={() => setScanning((value) => !value)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-app-border px-4 text-sm font-semibold text-app-fg hover:bg-app-input">
          {scanning ? <CameraOff className="size-4" /> : <Camera className="size-4" />}
          {scanning ? 'Stop camera' : 'Scan QR'}
        </button>
      </div>

      {scanning && <video ref={videoRef} muted playsInline className="mt-4 aspect-video max-h-72 w-full rounded-xl bg-black object-cover" />}
      {(cameraError || message) && (
        <p role="status" aria-live="polite" className={`mt-3 flex items-center gap-2 text-sm ${message?.ok ? 'text-success' : 'text-danger'}`}>
          {message?.ok && <CheckCircle2 className="size-4 shrink-0" />}
          {message?.text ?? cameraError}
        </p>
      )}
    </section>
  )
}
