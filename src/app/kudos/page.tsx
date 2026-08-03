'use client'

import { useState } from 'react'
import { Toaster } from 'sonner'
import { KudoComposeModal } from '@/features/kudos/components'
import { QueryProvider } from '@/lib/query/query-provider'

/**
 * /kudos — host route for Viết Kudo.
 * Auth-guarded by proxy (not in PUBLIC_PATHS).
 * Wraps the modal subtree with TanStack Query + Sonner toast.
 */
export default function KudosPage() {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <QueryProvider>
      <Toaster position="top-center" richColors />
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

        {/* Conditional mount: closing unmounts the modal so a reopen starts from a
            fresh instance (recipient/hashtags/editor all reset per spec ID-46/47). */}
        {modalOpen && (
          <KudoComposeModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
          />
        )}
      </main>
    </QueryProvider>
  )
}
