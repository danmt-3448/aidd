'use client'

import { useState } from 'react'
import { RulesPanel } from '@/features/rules/components'
import { KudoComposeModal } from '@/features/kudos/components/kudo-compose-modal'
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
 * /rules — Thể lệ rules panel. Auth-guarded by proxy.
 * Content from the canonical rules-content config. "Viết KUDOS" opens the
 * existing KudoComposeModal (reused, wrapped in QueryProvider for its hooks).
 */
export default function RulesPage() {
  const [visible, setVisible] = useState(true)
  const [composeOpen, setComposeOpen] = useState(false)

  if (!visible) {
    return (
      <main
        className="flex min-h-screen items-center justify-center"
        style={{ background: '#00101A' }}
      >
        <button
          className="rounded px-6 py-3 text-sm font-bold"
          style={{ background: '#FFEA9E', color: '#00101A' }}
          onClick={() => setVisible(true)}
        >
          Mở lại Thể lệ
        </button>
      </main>
    )
  }

  return (
    <main
      className="flex min-h-screen items-end justify-end"
      style={{ background: '#00101A' }}
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
        onClose={() => setVisible(false)}
      />
      {composeOpen && (
        <KudoComposeModal isOpen onClose={() => setComposeOpen(false)} />
      )}
    </main>
  )
}
