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
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={filled ? '#EF4444' : 'none'}
      stroke={filled ? '#EF4444' : '#6B7280'}
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
  return (
    <svg
      width="16"
      height="16"
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

export function ArrowRightIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="rgba(255,255,255,0.4)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="flex-shrink-0"
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )
}

// ── Date formatter ────────────────────────────────────────────────────────────

export function formatCardDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}
