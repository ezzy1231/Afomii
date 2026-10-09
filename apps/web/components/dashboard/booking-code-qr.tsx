'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import QRCode from 'qrcode'

export function BookingCodeQR({ code, size = 112 }: { code: string; size?: number }) {
  const [image, setImage] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    QRCode.toDataURL(code, {
      width: size,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#10263c', light: '#ffffff' },
    }).then((result) => {
      if (active) setImage(result)
    }).catch(() => {
      if (active) setImage(null)
    })
    return () => { active = false }
  }, [code, size])

  return image ? (
    <Image src={image} width={size} height={size} alt={`Check-in QR code for booking ${code}`} unoptimized className="rounded-lg bg-white p-1" />
  ) : (
    <div aria-label="Generating booking QR code" className="size-28 animate-pulse rounded-lg bg-app-input" />
  )
}
