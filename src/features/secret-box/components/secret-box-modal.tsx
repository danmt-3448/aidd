'use client'

import Image from 'next/image'
import type { SecretBoxModalProps } from './secret-box-types'
import { SecretBoxSpinner } from './secret-box-spinner'

/**
 * SecretBoxModal — screen J3-4YFIpMM (Open Secret Box, chưa mở).
 *
 * Figma artboard: 651.5 × 822.6px · bg #00101A · radius 12.73px.
 * Sections: title row | top separator | guidance (conditional) |
 *           557×557 clickable box | bottom separator | counter row.
 *
 * Purely presentational — Track B (phase 06) owns the RPC + badge selection.
 * Design tokens fetched from MoMorph MCP (screen J3-4YFIpMM).
 */
export function SecretBoxModal({
  unopened,
  currentBadge,
  isOpening,
  onOpen,
  onClose,
}: SecretBoxModalProps) {
  const isDisabled = unopened === 0 || isOpening
  const counterDisplay = String(unopened).padStart(2, '0')

  return (
    <div
      className="relative flex w-full max-w-[652px] flex-col items-center"
      style={{
        background: '#00101A',
        borderRadius: '12.73px',
        padding: '23.87px 12.73px',
        gap: '22.28px',
      }}
    >
      {/* Title row — A_Title + optional close (MM_MEDIA_Close, 19×19) */}
      <div className="flex w-full items-center justify-center">
        <h2
          className="flex-1 text-center"
          style={{
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 700,
            fontSize: '25.46px',
            lineHeight: '31.82px',
            color: '#FFEA9E',
            letterSpacing: '0px',
          }}
        >
          KHÁM PHÁ SECRET BOX CỦA BẠN
        </h2>

        {onClose != null && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="ml-2 flex-shrink-0 opacity-80 transition-opacity hover:opacity-100"
          >
            {/* Inline SVG — Close icon from Figma (MM_MEDIA_Close) */}
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <path
                d="M13.4759 12.0972L19.0159 17.6372V19.0972H17.5559L12.0159 13.5572L6.47587 19.0972H5.01587V17.6372L10.5559 12.0972L5.01587 6.55717V5.09717H6.47587L12.0159 10.6372L17.5559 5.09717H19.0159V6.55717L13.4759 12.0972Z"
                fill="white"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Rectangle 16 — top separator, rgba(46,57,64,1) */}
      <div className="w-full" style={{ height: '1px', background: 'rgba(46,57,64,1)' }} aria-hidden />

      {/* B_Group 396 — guidance text, visible only when unopened > 0 */}
      {unopened > 0 && (
        <div className="flex items-center justify-center">
          <span
            style={{
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 700,
              fontSize: '12.73px',
              lineHeight: '19.09px',
              letterSpacing: '0.398px',
              color: 'rgba(255,255,255,1)',
            }}
          >
            Click vào box để mở
          </span>
        </div>
      )}

      {/* C_Box image — 557×557px (responsive via maxWidth + aspectRatio) */}
      <div className="relative" style={{ width: '557px', maxWidth: '100%', aspectRatio: '1/1' }}>
        {/* Glow overlay — MM_MEDIA_hiệu ứng box quà, decorative */}
        <Image
          src="/secret-box/hieu-ung-box-qua.png"
          alt=""
          aria-hidden
          fill
          style={{ objectFit: 'contain', pointerEvents: 'none' }}
          priority
        />

        {/* Box button — MM_MEDIA_box quà chưa mở; disabled when empty or opening */}
        <button
          type="button"
          onClick={isDisabled ? undefined : onOpen}
          disabled={isDisabled}
          aria-label="Open secret box"
          className="absolute inset-0 transition-opacity"
          style={{
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            opacity: isDisabled ? 0.6 : 1,
            background: 'transparent',
            border: 'none',
            padding: 0,
          }}
        >
          {isOpening ? (
            <SecretBoxSpinner />
          ) : (
            <Image
              src={currentBadge != null ? currentBadge.imageSrc : '/secret-box/box-qua-chua-mo.svg'}
              alt="Secret box"
              fill
              style={{ objectFit: 'contain' }}
              priority
            />
          )}
        </button>
      </div>

      {/* Rectangle 18 — bottom separator */}
      <div className="w-full" style={{ height: '1px', background: 'rgba(46,57,64,1)' }} aria-hidden />

      {/* D_Số box chưa mở — counter: golden number + white label */}
      <div className="flex items-center" style={{ gap: '6.36px' }}>
        <span
          style={{
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 700,
            fontSize: '28.64px',
            lineHeight: '35px',
            color: '#FFEA9E',
            letterSpacing: '0px',
          }}
          aria-live="polite"
        >
          {counterDisplay}
        </span>
        <span
          style={{
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 700,
            fontSize: '12.73px',
            lineHeight: '19.09px',
            letterSpacing: '0.398px',
            color: 'rgba(255,255,255,1)',
          }}
        >
          Secretbox chưa mở
        </span>
      </div>
    </div>
  )
}
