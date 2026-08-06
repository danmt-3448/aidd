'use client'

import { useEffect, useRef, useState } from 'react'
import { RulesPanel } from './rules-panel'
import { KudoComposeModal } from '@/features/kudos/components/kudo-compose-modal'
import {
  RECIPIENT_SECTION,
  SENDER_SECTION,
  HERO_BADGES,
  SECRET_BADGES,
  SENDER_FOOTER_TEXT,
  KUDOS_QUOC_DAN_HEADING,
  KUDOS_QUOC_DAN_BODY,
} from '../rules-content'

/**
 * RulesModal — the "Thể lệ" right-anchored side-panel over a dim backdrop
 * (Figma frame b1Filzi9i6). Self-contained + reusable (DRY):
 *   - `/rules` route mounts it with onClose = router.back()
 *   - Homepage FAB "Thể lệ" mounts it in-place with onClose = setRulesOpen(false)
 *
 * Closes on ✕, Esc, or backdrop click (Esc suppressed while the nested
 * KudoComposeModal is open on top).
 */
interface RulesModalProps {
  onClose: () => void
}

export function RulesModal({ onClose }: RulesModalProps) {
  const [composeOpen, setComposeOpen] = useState(false)
  const backdropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !composeOpen) onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [composeOpen, onClose])

  function handleBackdropPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.target === backdropRef.current) onClose()
  }

  return (
    <>
      <div
        ref={backdropRef}
        className="fixed inset-0 z-[60] flex items-stretch justify-end"
        style={{ background: 'rgba(0, 0, 0, 0.60)' }}
        onPointerDown={handleBackdropPointerDown}
        data-testid="rules-backdrop"
      >
        <RulesPanel
          recipientSection={RECIPIENT_SECTION}
          senderSection={SENDER_SECTION}
          heroBadges={HERO_BADGES}
          secretBadges={SECRET_BADGES}
          senderFooterText={SENDER_FOOTER_TEXT}
          kudosQuocDanHeading={KUDOS_QUOC_DAN_HEADING}
          kudosQuocDanBody={KUDOS_QUOC_DAN_BODY}
          onWriteKudos={() => setComposeOpen(true)}
          onClose={onClose}
        />
      </div>

      {composeOpen && <KudoComposeModal isOpen onClose={() => setComposeOpen(false)} />}
    </>
  )
}
