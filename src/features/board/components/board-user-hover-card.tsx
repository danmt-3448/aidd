'use client'

/**
 * board-user-hover-card.tsx — trigger wrapper for the avatar hover popup.
 *
 * Figma annotation "Hover Avatar info user" (outside artboard MaZUn5xHXZ, spec §3):
 *   Content: avatar (40px) + tên (gold) + "Tên đơn vị: {dept}" + tier badge
 *            + "Số Kudos nhận được: N" + "Số Kudos đã gửi: N" + "✎ Gửi KUDO" button.
 *
 * Architecture: data-fetching lives in HoverCardPopup (board-hover-card-popup.tsx),
 * which is only mounted when open. This keeps the hook call lazy and lets tests that
 * don't need a QueryClient render BoardFeedCard without error.
 *
 * B4 fix: popup renders via ReactDOM.createPortal to document.body with fixed
 * viewport coords so scroll-container overflow-y-auto cannot clip it.
 *
 * Keyboard: trigger is focusable; popover shows on focus-within, hides on blur.
 */

import { useRef, useState, useCallback, useId, useEffect } from 'react'
import { HoverCardPopup } from './board-hover-card-popup'
import type { PopupPosition } from './board-hover-card-popup'

export interface UserHoverCardProps {
  /** The interactive trigger element (avatar + name button) */
  children: React.ReactNode
  name: string
  role?: string
  department?: string
  avatarUrl: string | null
  tier?: 1 | 2 | 3 | 4
  /**
   * Profile UUID — enables live data fetch via useUserHoverCard().
   * Pass null for anonymous senders (query disabled, shows fallback props).
   */
  profileId?: string | null
  /** Called when "Gửi KUDO" button is clicked */
  onSendKudo?: () => void
  /** Unused — kept for API compat with callers that pass lightMode */
  lightMode?: boolean
}

function resolvePosition(triggerEl: HTMLElement): PopupPosition {
  const rect = triggerEl.getBoundingClientRect()
  const popupWidth = 240
  const viewportWidth = window.innerWidth

  let left = rect.left
  if (left + popupWidth > viewportWidth - 8) {
    left = viewportWidth - popupWidth - 8
  }
  return { top: rect.bottom + 8, left }
}

export function UserHoverCard({
  children,
  name,
  role,
  department,
  avatarUrl,
  tier,
  profileId,
  onSendKudo,
}: UserHoverCardProps) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<PopupPosition>({ top: 0, left: 0 })
  const [mounted, setMounted] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const triggerRef = useRef<HTMLSpanElement>(null)
  const popoverId = useId()

  // Client-mount flag for portal rendering — intentional one-time set on mount.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true) }, [])

  const show = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    if (triggerRef.current) setPosition(resolvePosition(triggerRef.current))
    setOpen(true)
  }, [])

  const hide = useCallback(() => {
    closeTimer.current = setTimeout(() => setOpen(false), 120)
  }, [])

  // Re-resolve position on scroll/resize while open so popup stays anchored
  useEffect(() => {
    if (!open) return
    const update = () => {
      if (triggerRef.current) setPosition(resolvePosition(triggerRef.current))
    }
    window.addEventListener('scroll', update, { capture: true, passive: true })
    window.addEventListener('resize', update, { passive: true })
    return () => {
      window.removeEventListener('scroll', update, { capture: true })
      window.removeEventListener('resize', update)
    }
  }, [open])

  return (
    <span
      ref={triggerRef}
      className="relative inline-flex min-w-0 shrink"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocusCapture={show}
      onBlurCapture={hide}
    >
      {children}
      {/* HoverCardPopup mounts only when open — hook runs lazily, no QueryClient needed at rest */}
      {open && mounted && (
        <HoverCardPopup
          name={name}
          role={role}
          departmentFallback={department}
          avatarUrl={avatarUrl}
          tierFallback={tier}
          profileId={profileId ?? null}
          onSendKudo={onSendKudo}
          position={position}
          popoverId={popoverId}
          onMouseEnter={show}
          onMouseLeave={hide}
        />
      )}
    </span>
  )
}
