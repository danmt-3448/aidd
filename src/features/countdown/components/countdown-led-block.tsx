'use client'

import { montserrat } from '@/features/auth/fonts'

export interface CountdownLedBlockProps {
  /** Numeric value to display (0–99). */
  value: number
  /** i18n label below the digit boxes (e.g. "NGÀY" / "DAYS"). */
  label: string
  /** Figma nodeId for the LED block root (gate: data-fig). */
  blockNodeId?: string
  /** Figma nodeId for the label text (gate: data-fig). */
  labelNodeId?: string
}

/**
 * Single LED-style unit block for the Countdown prelaunch screen.
 *
 * Layout per Figma (screen 8PJQswPZmU):
 *   - 2 digit boxes side-by-side (gap 21px), one digit each.
 *   - Each box: 76.8×122.88px, border-radius 12px, glassy white gradient
 *     at opacity 0.5, #FFEA9E 0.75px border, backdrop-blur 24.96px.
 *   - Digit: DSEG7Classic (7-segment font) 73.7px white.
 *   - Label: Montserrat 700 36px white, left-aligned under the boxes.
 *   - Unit gap (boxes → label): 21px.
 *
 * Font: DSEG7Classic-Regular loaded via @font-face in globals.css from
 *       /public/fonts/DSEG7Classic-Regular.woff2 (dseg npm package v0.46.0).
 */
export function CountdownLedBlock({
  value,
  label,
  blockNodeId,
  labelNodeId,
}: CountdownLedBlockProps) {
  const display = String(value).padStart(2, '0')
  const tens = display[0]
  const ones = display[1]

  return (
    // mm:led-block-root — Figma: 175×192px (1512 space) → ~166×183px @1440, gap 21px, flex-col.
    // Gaps use clamp so they scale with viewport (21px at ≥1440, 18px at 1280, floor 14px).
    // 21/1512*100 = 1.389vw; clamp(14px, 1.389vw, 21px) tracks the Figma ratio.
    <div
      data-fig={blockNodeId}
      className="flex flex-col items-start"
      style={{ gap: 'clamp(14px, 1.389vw, 21px)' }}
    >
      {/* mm:led-digit-row — 2 boxes, gap also clamp-scaled */}
      <div className="flex flex-row" style={{ gap: 'clamp(14px, 1.389vw, 21px)' }}>
        <DigitBox digit={tens} aria={`${value} ${label}`} />
        <DigitBox digit={ones} aria={undefined} />
      </div>

      {/* mm:led-label — Figma node: Montserrat 700 36px (1512 space) → ~34px @1440, white.
          lineHeight 1.333 tracks fontSize (48/36 Figma ratio) — at 1440 resolves to ~45.5px
          vs design scaled 45.7px, within ±1px tolerance. */}
      <span
        data-fig={labelNodeId}
        className={`${montserrat.className} uppercase`}
        style={{
          fontWeight: 700,
          fontSize: 'clamp(1rem, 2.37vw, 2.25rem)',
          lineHeight: 1.333,
          color: '#FFFFFF',
        }}
      >
        {label}
      </span>
    </div>
  )
}

/** Single glassy digit box per Figma spec. */
function DigitBox({
  digit,
  aria,
}: {
  digit: string
  aria: string | undefined
}) {
  return (
    // mm:digit-box
    // Figma: width 76.8px × height 122.88px (1512 space) → ~73×117px @1440
    // border: 0.75px solid #FFEA9E · radius 12px · blur 24.96px
    // Outer div is transparent container (no bg); inner div holds glassy fill at opacity 0.5
    <div
      aria-label={aria}
      style={{
        position: 'relative',
        width: 'clamp(48px, 5.08vw, 76.8px)',
        height: 'clamp(76px, 8.13vw, 122.88px)',
        borderRadius: 12,
        overflow: 'hidden',
        backdropFilter: 'blur(24.96px)',
        WebkitBackdropFilter: 'blur(24.96px)',
        border: '0.75px solid #FFEA9E',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Glassy fill — Figma node I2268:35141;186:2616: linear-gradient(180deg, #FFF 0%, rgba(255,255,255,0.10) 100%) at opacity 0.5 */}
      <div
        data-fig="I2268:35141;186:2616"
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, #FFFFFF 0%, rgba(255,255,255,0.10) 100%)',
          opacity: 0.5,
          borderRadius: 12,
        }}
      />
      {/* mm:digit-glyph — Figma node I2268:35141;186:2617: fontFamily "Digital Numbers" 400 73.73px white */}
      <span
        data-fig="I2268:35141;186:2617"
        style={{
          position: 'relative',
          fontFamily: "'DSEG7Classic', monospace",
          fontWeight: 400,
          fontSize: 'clamp(46px, 4.87vw, 73.7px)',
          lineHeight: 1,
          color: '#FFFFFF',
          userSelect: 'none',
          letterSpacing: '-0.02em',
        }}
      >
        {digit}
      </span>
    </div>
  )
}
