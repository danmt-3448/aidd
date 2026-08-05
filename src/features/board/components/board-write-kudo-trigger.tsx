'use client'

/**
 * BoardWriteKudoTrigger — two-field action row below the KV banner.
 *
 * Design tokens from MoMorph MCP screen MaZUn5xHXZ (authoritative):
 *   Parent frame "Button chuc nang" (2940:13448): 2 children, gap 16px.
 *   Both fields: height 52px, bg rgba(255,255,255,0.08), border 1px solid rgba(255,255,255,0.16)
 *   radius 999px (pill), padding 14px 24px, gap 12px (icon + text), icon 20px.
 *   Icon color: rgba(255,255,255,0.5).
 *   Placeholder text: Montserrat 14px 400, rgba(255,255,255,0.45).
 *   Field 1 (compose): flex-1 (wider), icon = pen/edit.
 *   Field 2 (search): flex-shrink-0 w-[268px] on desktop, icon = magnifier.
 */

import { montserrat } from '@/features/auth/fonts'

export interface BoardWriteKudoTriggerProps {
  onOpen: () => void
  /** Called when user types in the profile search field */
  onProfileSearch?: (query: string) => void
}

function PencilIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden className="flex-shrink-0">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden className="flex-shrink-0">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  )
}

/**
 * Shared pill field styles — from Figma MaZUn5xHXZ node "Button chuc nang" children.
 * bg rgba(255,255,255,0.08) · border rgba(255,255,255,0.16) · radius 999 · height 52px
 */
const PILL_BASE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.16)',
  borderRadius: 999,
  height: 52,
  paddingLeft: 24,
  paddingRight: 24,
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  color: 'rgba(255,255,255,0.5)',
}

const PLACEHOLDER_STYLE: React.CSSProperties = {
  fontFamily: montserrat.style.fontFamily,
  fontSize: 14,
  fontWeight: 400,
  lineHeight: '20px',
  color: 'rgba(255,255,255,0.45)',
}

export function BoardWriteKudoTrigger({ onOpen, onProfileSearch }: BoardWriteKudoTriggerProps) {
  return (
    <div className="flex items-center gap-4">
      {/* Field 1 — compose kudo (flex-1) */}
      <button
        type="button"
        onClick={onOpen}
        aria-label="Viết lời cảm ơn và ghi nhận"
        className="min-w-0 flex-1 text-left transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFEA9E]"
        style={PILL_BASE}
      >
        <PencilIcon />
        <span className="truncate" style={PLACEHOLDER_STYLE}>
          Hôm nay, bạn muốn gửi lời cảm ơn và ghi nhận đến ai?
        </span>
      </button>

      {/* Field 2 — profile search (268px on desktop per Figma) */}
      <div
        className="hidden w-[268px] flex-shrink-0 sm:flex"
        style={PILL_BASE}
      >
        <SearchIcon />
        <input
          type="search"
          placeholder="Tìm kiếm profile Sunner"
          aria-label="Tìm kiếm profile Sunner"
          onChange={(e) => onProfileSearch?.(e.target.value)}
          className="w-full bg-transparent outline-none"
          style={{
            ...PLACEHOLDER_STYLE,
            color: 'rgba(255,255,255,0.85)',
          }}
        />
      </div>
    </div>
  )
}
