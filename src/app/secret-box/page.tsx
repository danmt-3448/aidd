'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { SecretBoxConnected } from '@/features/secret-box/components/secret-box-connected'

/**
 * /secret-box — Open Secret Box rendered as a centered dialog overlay over a
 * dim backdrop (Figma screen J3-4YFIpMM).
 *
 * The card itself (651.5×822.6px, radius 12.73px, bg #00101A) is already
 * implemented by SecretBoxModal. This page wraps it with:
 *  - fixed inset-0 dim backdrop (rgba(0,0,0,0.60))
 *  - flex-centered dialog container
 *  - Esc key → router.back() / /board
 *  - backdrop click → close (same target check)
 *
 * role="dialog" is already set inside SecretBoxModal.
 * SecretBoxConnected.handleClose already calls router.push('/board').
 */
export default function SecretBoxPage() {
  const router = useRouter()
  const backdropRef = useRef<HTMLDivElement>(null)

  function handleClose() {
    router.back()
  }

  // Esc key closes the overlay
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        handleClose()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Backdrop click closes (only the backdrop element itself, not the card)
  function handleBackdropPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.target === backdropRef.current) {
      handleClose()
    }
  }

  return (
    /* Dim full-screen backdrop */
    <div
      ref={backdropRef}
      className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto px-4 py-8"
      style={{ background: 'rgba(0, 0, 0, 0.60)' }}
      onPointerDown={handleBackdropPointerDown}
      data-testid="secret-box-backdrop"
    >
      {/* Centered card — SecretBoxConnected owns the dialog card + close logic */}
      <SecretBoxConnected />
    </div>
  )
}
