/**
 * board-card-atoms.tsx — tiny presentational atoms shared by board card components.
 * Extracted to keep board-feed-card.tsx under 200 lines.
 */

import Image from 'next/image'
import { montserrat } from '@/features/auth/fonts'

// ── AvatarCircle ─────────────────────────────────────────────────────────────

interface AvatarCircleProps {
  src: string | null
  name: string
  size?: number
  /** When true, card bg is cream — fallback avatar uses warm-brown palette */
  lightMode?: boolean
}

export function AvatarCircle({ src, name, size = 40, lightMode = false }: AvatarCircleProps) {
  const initial = name.charAt(0).toUpperCase()
  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size, flexShrink: 0 }}
      />
    )
  }
  // Dark-card palette: gold on navy. Light-card palette: amber on cream.
  const bg = lightMode ? 'rgba(146,64,14,0.12)' : 'rgba(255,234,158,0.15)'
  const border = lightMode ? '1px solid rgba(146,64,14,0.3)' : '1px solid rgba(255,234,158,0.3)'
  const color = lightMode ? '#92400E' : '#FFEA9E'

  return (
    <div
      className="flex items-center justify-center rounded-full font-bold"
      style={{
        width: size,
        height: size,
        background: bg,
        border,
        color,
        fontSize: size * 0.4,
        fontFamily: montserrat.style.fontFamily,
        flexShrink: 0,
      }}
      aria-label={name}
    >
      {initial}
    </div>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────────

export function HeartIcon({ filled }: { filled: boolean }) {
  // unfilled: warm dark stroke rgba(26,18,8,0.4) — matches cream card color family (not Tailwind gray-500 #6B7280)
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill={filled ? '#EF4444' : 'none'}
      stroke={filled ? '#EF4444' : 'rgba(26,18,8,0.4)'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

export function LinkIcon() {
  // Chain-link icon — inherits color via currentColor; parent button sets color
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  )
}

/**
 * ArrowUpRightIcon — diagonal arrow ↗ for "View detail" button on cream cards.
 * Inherits color via currentColor so parent sets the color.
 */
export function ArrowUpRightIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="flex-shrink-0"
    >
      <path d="M7 17L17 7M17 7H7M17 7v10" />
    </svg>
  )
}

// ── Date formatter ────────────────────────────────────────────────────────────

/**
 * Formats an ISO date string as "HH:MM - DD/MM/YYYY" per Figma card design.
 * User feedback: timestamp shown as "10:00 - 10/30/2025" — time + date, left-aligned.
 */
export function formatCardDate(iso: string): string {
  try {
    const d = new Date(iso)
    const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })
    const date = d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
    return `${time} - ${date}`
  } catch {
    return iso
  }
}

// PaperPlaneIcon and PencilIcon live in board-card-send-icons.tsx
// (extracted to keep this file under 200 lines)

// ── HashtagRow ────────────────────────────────────────────────────────────────

/**
 * HashtagRow — up to 5 hashtag chips with a "+N" overflow badge.
 * Extracted from board-feed-card.tsx to keep that file under 200 lines.
 * Colors from Figma (rework pass 2, confirmed): red bg + #B91C1C text.
 */
export function HashtagRow({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null
  const visible = tags.slice(0, 5)
  const overflow = tags.length - 5
  return (
    <div className="flex flex-wrap gap-2" role="list" aria-label="Hashtags">
      {visible.map((tag, idx) => (
        <span
          key={`${tag}-${idx}`}
          role="listitem"
          className="rounded-full px-3 py-1 text-xs font-bold"
          style={{
            background: 'rgba(231,57,40,0.1)',
            border: '1px solid rgba(231,57,40,0.25)',
            color: '#B91C1C',
            fontFamily: montserrat.style.fontFamily,
          }}
        >
          {tag}
        </span>
      ))}
      {overflow > 0 && (
        <span
          className="rounded-full px-3 py-1 text-xs font-bold"
          style={{
            background: 'rgba(26,18,8,0.06)',
            border: '1px solid rgba(26,18,8,0.15)',
            color: 'rgba(26,18,8,0.5)',
            fontFamily: montserrat.style.fontFamily,
          }}
          aria-label={`${overflow} hashtag nữa`}
        >
          +{overflow}
        </span>
      )}
    </div>
  )
}
