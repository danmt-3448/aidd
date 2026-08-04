'use client'

import { useState } from 'react'
import { KudoComposeModal } from '@/features/kudos/components'

/**
 * /kudos — host route for Viết Kudo.
 * Auth-guarded by proxy (not in PUBLIC_PATHS).
 *
 * QueryProvider + Toaster are mounted at root (src/app/providers.tsx).
 * This page only manages the modal open/close state.
 *
 * Conditional mount: closing unmounts the modal so a reopen starts from a
 * fresh instance (recipient/hashtags/editor all reset per spec ID-46/47).
 */
export default function KudosPage() {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <main
      className="flex min-h-screen items-center justify-center"
      style={{ background: '#00101A' }}
    >
      <button
        onClick={() => setModalOpen(true)}
        className="rounded-lg px-8 py-4 font-montserrat text-lg font-bold text-[#00101A] transition-opacity hover:opacity-90"
        style={{ background: 'rgba(255,234,158,1)' }}
      >
        Viết Kudo
      </button>

      {modalOpen && (
        <KudoComposeModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
        />
      )}
    </main>
  )
}
