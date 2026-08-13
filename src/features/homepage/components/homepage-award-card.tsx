/**
 * HomepageAwardCard — compact card used in the 6-card grid on the Homepage.
 *
 * Figma: mms_C2.1_Top Talent Award (node 2167:9075), 336×504px per card.
 * Layout:
 *   - Square image area (336×336px, border-radius 24px, border 1px #FFEA9E,
 *     box-shadow glow #FAE287, mix-blend-mode screen on the inner layer)
 *   - Award title: Montserrat 400 24px #FFEA9E, line-height 32px
 *   - Description: Montserrat 400 16px white, line-height 24px, 2-line clamp
 *   - "Chi tiết" link: text link with Up arrow icon
 *
 * Card onClick → /awards#{slug} (deep-link to the award anchor on the /awards page).
 * Data source: AWARDS from @/features/awards/award-config (DRY — no re-definition).
 */

import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { montserrat } from '@/features/auth/fonts'
import { AwardMedallion } from '@/features/awards/components/award-medallion'
import type { Award } from '@/features/awards/types'

interface HomepageAwardCardProps {
  award: Award
}

export function HomepageAwardCard({ award }: HomepageAwardCardProps) {
  const t = useTranslations('home');
  const tAwards = useTranslations('awards');
  const href = `/awards#${award.hashtagAnchor}`

  return (
    <article
      className="flex flex-col"
      style={{ gap: 24, width: '100%' }}
      aria-label={`Award: ${award.title}`}
    >
      {/* Image square — shared AwardMedallion (DRY with /awards detail cards) */}
      <Link href={href} tabIndex={-1} aria-hidden="true">
        <AwardMedallion
          src={award.image}
          alt={award.title}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 336px"
        />
      </Link>

      {/* Text block */}
      <div className="flex flex-col" style={{ gap: 4 }}>
        {/* Title */}
        <Link
          href={href}
          className="transition-opacity hover:opacity-80"
          aria-label={t('awardCard.titleAriaLabel', { title: award.title })}
        >
          <h3
            className={montserrat.className}
            style={{
              fontSize: 24,
              fontWeight: 400,
              lineHeight: '32px',
              color: '#FFEA9E',
              margin: 0,
            }}
          >
            {award.title}
          </h3>
        </Link>

        {/* Description — 2-line clamp (loaded from awards i18n catalog) */}
        <p
          className={montserrat.className}
          style={{
            fontSize: 16,
            fontWeight: 400,
            lineHeight: '24px',
            color: '#FFFFFF',
            letterSpacing: '0.5px',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {tAwards(`categories.${award.i18nKey}.description` as Parameters<typeof tAwards>[0])}
        </p>

        {/* "Chi tiết" link with arrow */}
        <Link
          href={href}
          className={`${montserrat.className} inline-flex items-center gap-1 font-bold transition-opacity hover:opacity-80`}
          style={{
            fontSize: 16,
            fontWeight: 700,
            lineHeight: '24px',
            color: '#FFEA9E',
            padding: '16px 0',
          }}
          aria-label={t('awardCard.detailAriaLabel', { title: award.title })}
        >
          {t('awardCard.detailLink')}
          <div className="relative" style={{ width: 24, height: 24, flexShrink: 0 }}>
            <Image
              src="/homepage/icon-arrow-up.svg"
              alt=""
              fill
              className="object-contain"
            />
          </div>
        </Link>
      </div>
    </article>
  )
}
