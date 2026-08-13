'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { AwardNavItem } from './award-nav-item'
import type { Award } from '../types'

interface AwardsNavProps {
  awards: Award[]
}

/**
 * Left-side navigation listing the award categories (scrollspy).
 *
 * Figma Frame 525 NOTE: "Scroll thì phần này sẽ đi theo" → the nav is STICKY
 * (see AwardsShowcase wrapper) and the active item follows the card currently in
 * view. An IntersectionObserver watches each award anchor (AwardCard renders
 * `id={hashtagAnchor}`) and marks the topmost visible one active.
 */
export function AwardsNav({ awards }: AwardsNavProps) {
  const t = useTranslations('awards')
  const [activeSlug, setActiveSlug] = useState(awards[0]?.slug ?? '')

  useEffect(() => {
    const anchorToSlug = new Map(awards.map((a) => [a.hashtagAnchor, a.slug]))
    const els = awards
      .map((a) => document.getElementById(a.hashtagAnchor))
      .filter((el): el is HTMLElement => el !== null)
    if (els.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        const top = visible[0]
        if (top) {
          const slug = anchorToSlug.get(top.target.id)
          if (slug) setActiveSlug(slug)
        }
      },
      // Active zone = upper-middle band of the viewport so the highlight tracks
      // the card the reader is actually looking at.
      { rootMargin: '-25% 0px -65% 0px' },
    )
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [awards])

  return (
    <nav
      className="flex flex-col"
      style={{ width: '178px', minWidth: '178px', gap: '16px' }}
      aria-label={t('nav.ariaLabel')}
    >
      {awards.map((award) => (
        <AwardNavItem
          key={award.slug}
          label={t(`categories.${award.i18nKey ?? ''}.navLabel` as Parameters<typeof t>[0])}
          isActive={activeSlug === award.slug}
          href={`#${award.hashtagAnchor}`}
        />
      ))}
    </nav>
  )
}
