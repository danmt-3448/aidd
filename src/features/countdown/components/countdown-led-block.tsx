'use client'

import { montserrat } from '@/features/auth/fonts'

export interface CountdownLedBlockProps {
  /** Numeric value to display (0–99). */
  value: number
  /** i18n label below the digit boxes (e.g. "NGÀY" / "DAYS"). */
  label: string
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
export function CountdownLedBlock({ value, label }: CountdownLedBlockProps) {
  const display = String(value).padStart(2, '0')
  const tens = display[0]
  const ones = display[1]

  return (
    // mm:led-block-root
    <div className="flex flex-col items-start" style={{ gap: 21 }}>
      {/* mm:led-digit-row — 2 boxes, gap 21px */}
      <div className="flex flex-row" style={{ gap: 21 }}>
        <DigitBox digit={tens} aria={`${value} ${label}`} />
        <DigitBox digit={ones} aria={undefined} />
      </div>

      {/* mm:led-label */}
      <span
        className={`${montserrat.className} uppercase`}
        style={{
          fontWeight: 700,
          fontSize: 'clamp(1rem, 2.37vw, 2.25rem)',
          lineHeight: '3rem',
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
      {/* Glassy fill rendered at 0.5 opacity via a pseudo-layer div */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, #FFFFFF 0%, rgba(255,255,255,0.10) 100%)',
          opacity: 0.5,
          borderRadius: 12,
        }}
      />
      {/* mm:digit-glyph */}
      <span
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
