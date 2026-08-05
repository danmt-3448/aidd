'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { RulesPanel } from '@/features/rules/components'
import { KudoComposeModal } from '@/features/kudos/components/kudo-compose-modal'
import { useState } from 'react'
import {
  RECIPIENT_SECTION,
  SENDER_SECTION,
  HERO_BADGES,
  SECRET_BADGES,
  SENDER_FOOTER_TEXT,
  KUDOS_QUOC_DAN_HEADING,
  KUDOS_QUOC_DAN_BODY,
} from '@/features/rules/rules-content'

/**
 * /rules — Thể lệ rules panel rendered as a right-anchored 553px side-panel
 * modal over a dim full-screen backdrop (Figma frame b1Filzi9i6).
 *
 * Close: × button → router.back() (falls back to / if no history).
 * FAB "Thể lệ" navigates to /rules which opens this modal overlay.
 * "Viết KUDOS" opens KudoComposeModal on top.
 */
export default function RulesPage() {
  const router = useRouter()
  const [composeOpen, setComposeOpen] = useState(false)
  const backdropRef = useRef<HTMLDivElement>(null)

  function handleClose() {
    router.back()
  }

  // Esc key closes the panel (not while compose modal is open on top)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !composeOpen) {
        handleClose()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  // handleClose only reads router, which is stable. composeOpen guards the Esc.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [composeOpen])

  // Backdrop click closes the panel (only when clicking outside the panel)
  function handleBackdropPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.target === backdropRef.current) {
      handleClose()
    }
  }

  return (
    <>
      {/* Dim full-screen backdrop */}
      <div
        ref={backdropRef}
        className="fixed inset-0 z-40 flex items-stretch justify-end"
        style={{ background: 'rgba(0, 0, 0, 0.60)' }}
        aria-hidden="false"
        onPointerDown={handleBackdropPointerDown}
        data-testid="rules-backdrop"
      >
        {/* Right-anchored 553px side-panel — RulesPanel owns role="dialog" */}
        <RulesPanel
          recipientSection={RECIPIENT_SECTION}
          senderSection={SENDER_SECTION}
          heroBadges={HERO_BADGES}
          secretBadges={SECRET_BADGES}
          senderFooterText={SENDER_FOOTER_TEXT}
          kudosQuocDanHeading={KUDOS_QUOC_DAN_HEADING}
          kudosQuocDanBody={KUDOS_QUOC_DAN_BODY}
          onWriteKudos={() => setComposeOpen(true)}
          onClose={handleClose}
        />
      </div>

      {composeOpen && (
        <KudoComposeModal isOpen onClose={() => setComposeOpen(false)} />
      )}
    </>
  )
}
