'use client'

/**
 * profile-write-bar.tsx — Write-kudo CTA shown in OTHER mode.
 *
 * Design tokens from MoMorph screen 3FoIx6ALVb:
 *   Container bg: rgba(255,255,255,0.03), border: 1px solid rgba(255,255,255,0.08), radius 12px, padding 16px 20px
 *   Label: Montserrat 400, 14px, rgba(255,255,255,0.7)  — names the viewed Sunner
 *   CTA button: bg #FFEA9E, color #00101A, Montserrat 700, 14px, radius 8px, padding 10px 20px
 *   Pencil icon: #00101A
 *
 * Clicking the button fires onWriteKudo — the parent (ProfileScreen) opens
 * KudoComposeModal with the recipient pre-filled. This component owns no modal
 * state; it is purely presentational.
 */

import { montserrat } from '@/features/auth/fonts'

// ── Pencil icon — inline SVG ─────────────────────────────────────────────────

function PencilIcon() {
  return (
    /* mm:pencil-icon */
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      style={{ color: '#00101A' }}
    >
      <path
        d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ── ProfileWriteBar ──────────────────────────────────────────────────────────

export interface ProfileWriteBarProps {
  /** Display name of the viewed Sunner — shown in the label. */
  recipientName: string
  /** Called when the CTA is clicked — parent opens KudoComposeModal. */
  onWriteKudo: () => void
}

export function ProfileWriteBar({ recipientName, onWriteKudo }: ProfileWriteBarProps) {
  return (
    /* mm:profile-write-bar */
    <section
      aria-label={`Gửi Kudo cho ${recipientName}`}
      className="px-6 py-5"
    >
      <div
        className="flex items-center justify-between gap-4"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          padding: '16px 20px',
        }}
      >
        {/* mm:write-bar-label */}
        <p
          style={{
            fontFamily: montserrat.style.fontFamily,
            fontWeight: 400,
            fontSize: 14,
            color: 'rgba(255,255,255,0.7)',
            lineHeight: '20px',
            margin: 0,
          }}
        >
          Gửi Kudo cho{' '}
          <span style={{ fontWeight: 700, color: '#FFFFFF' }}>{recipientName}</span>
        </p>

        {/* mm:write-kudo-cta */}
        <button
          type="button"
          onClick={onWriteKudo}
          aria-label={`Viết Kudo cho ${recipientName}`}
          className="flex flex-shrink-0 items-center gap-2 rounded-lg font-bold transition-opacity hover:opacity-90 active:opacity-75"
          style={{
            background: '#FFEA9E',
            color: '#00101A',
            fontFamily: montserrat.style.fontFamily,
            fontSize: 14,
            fontWeight: 700,
            padding: '10px 20px',
            lineHeight: '20px',
          }}
        >
          <PencilIcon />
          Viết Kudo
        </button>
      </div>
    </section>
  )
}
