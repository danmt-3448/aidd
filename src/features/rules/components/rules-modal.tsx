'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { RulesPanel } from './rules-panel'
import { KudoComposeModal } from '@/features/kudos/components/kudo-compose-modal'
import { HERO_BADGES, SECRET_BADGES } from '../rules-content'

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
  const t = useTranslations('rules')
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
          panelAriaLabel={t('panelAriaLabel')}
          title={t('title')}
          recipientSection={{
            id: 'recipient',
            heading: t('recipient.heading'),
            body: t('recipient.body'),
          }}
          senderSection={{
            id: 'sender',
            heading: t('sender.heading'),
            body: t('sender.body'),
          }}
          heroBadges={HERO_BADGES.map((badge) => {
            // Map badge id (kebab-case) to camelCase key used in messages JSON
            const keyMap: Record<string, string> = {
              'new-hero': 'newHero',
              'rising-hero': 'risingHero',
              'super-hero': 'superHero',
              'legend-hero': 'legendHero',
            }
            const msgKey = keyMap[badge.id] ?? badge.id
            return {
              ...badge,
              condition: t(`heroBadges.${msgKey}.condition`),
              description: t(`heroBadges.${msgKey}.description`),
            }
          })}
          secretBadges={SECRET_BADGES}
          senderFooterText={t('sender.footerText')}
          kudosQuocDanHeading={t('kudosQuocDan.heading')}
          kudosQuocDanBody={t('kudosQuocDan.body')}
          onWriteKudos={() => setComposeOpen(true)}
          onClose={onClose}
        />
      </div>

      {composeOpen && <KudoComposeModal isOpen onClose={() => setComposeOpen(false)} />}
    </>
  )
}
