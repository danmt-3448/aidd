'use client'

/**
 * BoardWriteKudoTrigger — pill-shaped input area that opens the KudoComposeModal.
 *
 * Design tokens from MoMorph MCP screen MaZUn5xHXZ:
 *   bg: rgba(255,255,255,0.06), border: 1px solid rgba(255,255,255,0.12)
 *   radius: 999px (full pill), padding: 14px 20px, gap: 12px
 *   Pencil icon: 20×20, color rgba(255,255,255,0.4)
 *   Placeholder text: Montserrat 14px 400, color rgba(255,255,255,0.4)
 */

import { montserrat } from '@/features/auth/fonts'

export interface BoardWriteKudoTriggerProps {
  onOpen: () => void
}

function PencilIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="rgba(255,255,255,0.4)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="flex-shrink-0"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

export function BoardWriteKudoTrigger({ onOpen }: BoardWriteKudoTriggerProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Viết lời cảm ơn và ghi nhận"
      className="flex w-full items-center gap-3 text-left transition-opacity hover:opacity-80"
      style={{
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 999,
        padding: '14px 20px',
      }}
    >
      <PencilIcon />
      <span
        style={{
          fontFamily: montserrat.style.fontFamily,
          fontSize: 14,
          fontWeight: 400,
          lineHeight: '20px',
          color: 'rgba(255,255,255,0.4)',
        }}
      >
        Hôm nay, bạn muốn gửi lời cảm ơn và ghi nhận đến ai?
      </span>
    </button>
  )
}
