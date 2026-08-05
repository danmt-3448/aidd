'use client'

/**
 * BoardKvBanner — hero banner at the top of the Live Board.
 *
 * Assets exported from Figma (MoMorph screen MaZUn5xHXZ):
 *   - /images/board/kudos-logo.svg   — KUDOS wordmark (node 2940:13440, 593×106 vector).
 *   - /images/board/kv-background.png — full-bleed KV artwork (MM_MEDIA_KV, 1440×512).
 *
 * Layout matches Figma A_KV Kudos frame:
 *   Row 1 — subtitle "Hệ thống ghi nhận và cảm ơn" (white)
 *   Row 2 — large KUDOS wordmark image (flame + KUDOS)
 *   (NO "SAA 2025 · KUDOS" eyebrow — not present in the Figma banner.)
 *   Feather artwork covers the full banner; a soft left gradient keeps text legible.
 *   The write-kudo/search row (rendered by BoardScreen) overlaps this banner's base.
 */

import Image from 'next/image'
import { montserrat } from '@/features/auth/fonts'

export function BoardKvBanner() {
  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ minHeight: 420, background: '#00101A' }}
      aria-label="Sun* Kudos — Hệ thống ghi nhận và cảm ơn"
    >
      {/* Full-bleed KV artwork (feathers cover the whole banner) */}
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        <Image
          src="/images/board/kv-background.png"
          alt=""
          fill
          priority
          className="object-cover"
          style={{ objectPosition: 'center right' }}
        />
      </div>

      {/* Soft left gradient — legibility without hiding the feathers */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            'linear-gradient(90deg,#00101A 0%,rgba(0,16,26,0.85) 18%,rgba(0,16,26,0.35) 45%,rgba(0,16,26,0) 70%)',
        }}
        aria-hidden
      />

      {/* Content — 144px side padding (Figma), extra bottom room for search overlap */}
      <div className="relative z-20 flex flex-col gap-4 px-6 pb-24 pt-12 md:px-16 lg:px-[144px] lg:pt-16">
        {/* Subtitle first (above the wordmark), matching Figma */}
        <p
          style={{
            fontFamily: montserrat.style.fontFamily,
            fontWeight: 700,
            fontSize: 'clamp(18px, 2vw, 26px)',
            color: '#FFFFFF',
            lineHeight: 1.3,
          }}
        >
          Hệ thống ghi nhận và cảm ơn
        </p>

        {/* KUDOS wordmark — exported vector (flame + KUDOS), large */}
        <Image
          src="/images/board/kudos-logo.svg"
          alt="KUDOS"
          width={593}
          height={106}
          priority
          className="h-auto w-[clamp(260px,42vw,600px)]"
        />
      </div>
    </div>
  )
}
