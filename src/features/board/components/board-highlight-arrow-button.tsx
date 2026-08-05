'use client'

/**
 * board-highlight-arrow-button.tsx — 80×80 circle arrow for HIGHLIGHT KUDOS carousel.
 *
 * Design tokens from MoMorph MCP (mms_B.2.1 / mms_B.2.2, node 2940:13470 / 2940:13468):
 *   Size: 80×80px, border-radius: 50%
 *   bg: rgba(255,255,255,0.08)
 *   border: 1px solid rgba(255,255,255,0.12)
 *   disabled: opacity 0.3, not-allowed cursor
 */

import React from 'react'

function ChevronLeft() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}

export function HighlightArrowPrev({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label="Kudo trước"
      className="flex items-center justify-center transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFEA9E] flex-shrink-0"
      style={{
        width: 80, height: 80, borderRadius: '50%',
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.12)',
        color: 'rgba(255,255,255,0.8)',
        opacity: disabled ? 0.3 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <ChevronLeft />
    </button>
  )
}

export function HighlightArrowNext({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label="Kudo tiếp theo"
      className="flex items-center justify-center transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFEA9E] flex-shrink-0"
      style={{
        width: 80, height: 80, borderRadius: '50%',
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.12)',
        color: 'rgba(255,255,255,0.8)',
        opacity: disabled ? 0.3 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <ChevronRight />
    </button>
  )
}
