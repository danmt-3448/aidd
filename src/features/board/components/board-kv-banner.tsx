'use client'

/**
 * BoardKvBanner — hero banner at the top of the Live Board.
 *
 * Design tokens from MoMorph MCP screen MaZUn5xHXZ:
 *   Container: full-width, min-height 200px, bg rgba(0,16,26,1)
 *   Gradient overlay: linear-gradient bottom rgba(0,16,26,0) → rgba(0,16,26,1)
 *   Title: "Hệ thống ghi nhận lời cảm ơn" Montserrat 700 36px #FFFFFF
 *   Subtitle row: SAA 2025 KUDOS logo (inline SVG wordmark) + decorative line
 *   Background keyvisual image reused from /homepage/keyvisual-bg.png
 */

import Image from 'next/image'
import { montserrat } from '@/features/auth/fonts'

export function BoardKvBanner() {
  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ minHeight: 200, background: 'rgba(0,16,26,1)' }}
      aria-label="Sun* Kudos — Hệ thống ghi nhận lời cảm ơn"
    >
      {/* Background keyvisual — decorative, reuse homepage asset */}
      <div className="pointer-events-none absolute inset-0 z-0 opacity-30">
        <Image
          src="/homepage/keyvisual-bg.png"
          alt=""
          fill
          className="object-cover object-top"
          priority
          aria-hidden
        />
      </div>

      {/* Bottom fade gradient */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24"
        style={{
          background:
            'linear-gradient(to bottom, rgba(0,16,26,0) 0%, rgba(0,16,26,1) 100%)',
        }}
        aria-hidden
      />

      {/* Content */}
      <div className="relative z-20 flex flex-col items-center justify-center gap-4 px-4 py-12 text-center md:py-16">
        {/* SAA 2025 KUDOS logo — text wordmark */}
        <div className="flex items-center gap-3">
          {/* Sun* logo icon */}
          <div className="relative" style={{ width: 40, height: 36 }}>
            <Image
              src="/homepage/logo.png"
              alt="Sun*"
              fill
              className="object-contain"
            />
          </div>
          <span
            style={{
              fontFamily: montserrat.style.fontFamily,
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: '3px',
              color: '#FFEA9E',
              textTransform: 'uppercase',
            }}
          >
            SAA 2025 · KUDOS
          </span>
        </div>

        {/* Main title */}
        <h1
          style={{
            fontFamily: montserrat.style.fontFamily,
            fontWeight: 700,
            fontSize: 'clamp(24px, 4vw, 36px)',
            color: '#FFFFFF',
            lineHeight: '1.2',
            letterSpacing: '-0.5px',
            maxWidth: 640,
          }}
        >
          Hệ thống ghi nhận lời cảm ơn
        </h1>

        {/* Decorative separator */}
        <div
          className="mx-auto"
          style={{
            width: 64,
            height: 2,
            background:
              'linear-gradient(to right, rgba(255,234,158,0), rgba(255,234,158,0.8), rgba(255,234,158,0))',
            borderRadius: 2,
          }}
          aria-hidden
        />
      </div>
    </div>
  )
}
