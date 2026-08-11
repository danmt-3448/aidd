'use client'

/**
 * BoardKvBanner — hero banner at the top of the Live Board.
 *
 * Assets from Figma (MoMorph screen MaZUn5xHXZ, nodes confirmed via API):
 *   - /images/board/kudos-logo.svg   — KUDOS wordmark vector (node 2940:13440, 593×106)
 *   - /images/board/kv-background.png — full-bleed KV artwork (1440×512)
 *
 * Layout from Figma Frame 487 (y=184, h=160, px=144):
 *   Row 1 — subtitle "Hệ thống ghi nhận và cảm ơn"
 *            Montserrat 700 36px, color #FFEA9E (golden yellow), lh=44px
 *   Row 2 — KUDOS wordmark SVG (593×106 natural width)
 *   gap: 10px between rows
 *   Gradient "Cover": linear-gradient(25deg, #00101A 14.74%, transparent 47.8%)
 */

import Image from 'next/image'
import { montserrat } from '@/features/auth/fonts'

export function BoardKvBanner() {
  return (
    <div
      data-fig="2940:13432"
      className="relative w-full overflow-hidden"
      style={{ height: 512, background: '#00101A' }}
      aria-label="Sun* Kudos — Hệ thống ghi nhận và cảm ơn"
    >
      {/*
       * Inner stage capped at the Figma artboard width (1440) and centred. Beyond 1440 the
       * outer #00101A backdrop fills the sides, so the banner keeps its native composition
       * on large monitors instead of the artwork zooming up and pushing the dark-left region
       * (which carries the wordmark's contrast) off-screen. At ≤1440 this is a no-op.
       */}
      <div className="relative mx-auto h-full w-full">
        {/* KV artwork (feathers). Anchored LEFT so the artwork's dark-left stays under the
            wordmark when the stage is narrower than the 1440 image (e.g. 1280). */}
        <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
          <Image
            src="/images/board/kv-background.png"
            alt=""
            fill
            priority
            className="object-cover"
            style={{ objectPosition: 'left center' }}
          />
        </div>

        {/* Gradient overlay — 25deg from bottom-left (matches Figma "Cover" node 1210:12612). */}
        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            background:
              'linear-gradient(25deg, #00101A 14.74%, rgba(0,19,32,0) 47.8%)',
          }}
          aria-hidden
        />

        {/*
         * Content block — positioned at y=184 within the 512px banner (Figma Frame 487 startY=184).
         * Desktop: px=144px (Figma exact). Tablet/mobile: scaled down gracefully.
         */}
        <div
          className="pointer-events-none absolute z-20 w-full px-6 md:px-10 lg:px-[144px]"
          style={{ top: 184 }}
        >
          <div className="flex flex-col" style={{ gap: 10 }}>
            {/* Subtitle — Montserrat 700 36px (desktop), scaled on smaller viewports */}
            <p
              className="m-0"
              style={{
                fontFamily: montserrat.style.fontFamily,
                fontWeight: 700,
                fontSize: 'clamp(22px, 2.5vw, 36px)',
                lineHeight: 1.22,
                color: '#FFEA9E',
              }}
            >
              Hệ thống ghi nhận và cảm ơn
            </p>

            {/* KUDOS wordmark — exported SVG vector, 593×106 at desktop */}
            <Image
              data-fig-asset="kudos-logo"
              src="/images/board/kudos-logo.svg"
              alt="KUDOS"
              width={593}
              height={106}
              priority
              className="h-auto"
              style={{ width: 'clamp(200px, 41vw, 593px)' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
