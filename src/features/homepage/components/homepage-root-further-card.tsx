/**
 * HomepageRootFurtherCard — the "Root Further" description card in the hero section.
 *
 * Figma: Frame 486 (node within 2167:9030).
 * Design values:
 *   - max-width: 1152px, border-radius: 8px
 *   - bg: rgba(0,16,26,0.65), border: 1px solid rgba(153,140,95,0.25)
 *   - backdrop-filter: blur(16px)
 *   - padding: 120px 104px at desktop
 *   - Body text: Montserrat 700 24px white, text-justify, line-height 32px
 *
 * Extracted from homepage-hero.tsx (M-4 size limit compliance).
 */

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { montserrat } from '@/features/auth/fonts'

export function HomepageRootFurtherCard() {
  const t = useTranslations('home');
  return (
    <div
      className="relative w-full overflow-hidden rounded-lg"
      style={{
        maxWidth: 1152,
      }}
    >
      <div
        className="flex flex-col items-center gap-6 px-4 pb-20 md:px-16 xl:gap-8 xl:px-[104px]"
      >
        {/* "Root Further" stacked text logo — fluid on mobile */}
        <div className="flex w-full max-w-[290px] flex-col items-center">
          {/* "ROOT" top line */}
          <div
            className="relative w-full"
            style={{ maxWidth: 189, height: 'clamp(40px, 4.43vw, 67px)' }}
          >
            <Image
              src="/homepage/root-text.png"
              alt="ROOT"
              fill
              className="object-contain object-center"
            />
          </div>
          {/* "FURTHER" bottom line */}
          <div
            className="relative w-full"
            style={{ height: 'clamp(40px, 4.43vw, 67px)' }}
          >
            <Image
              src="/homepage/further-text.png"
              alt="FURTHER"
              fill
              className="object-contain object-center"
            />
          </div>
        </div>

        {/* Body text block 1 */}
        <p
          className={montserrat.className}
          style={{
            fontSize: 'clamp(14px, 1.59vw, 24px)',
            fontWeight: 700,
            lineHeight: '1.4',
            color: '#FFFFFF',
            textAlign: 'justify',
            letterSpacing: 0,
            width: '100%',
          }}
        >
          {t('card.body1')}
        </p>

        <p
          className={montserrat.className}
          style={{
            fontSize: 'clamp(14px, 1.59vw, 24px)',
            fontWeight: 700,
            lineHeight: '1.4',
            color: '#FFFFFF',
            textAlign: 'justify',
            width: '100%',
          }}
        >
          {t('card.body2')}
        </p>

        {/* Quote block */}
        <p
          className={montserrat.className}
          style={{
            fontSize: 'clamp(13px, 1.32vw, 20px)',
            fontWeight: 700,
            lineHeight: '1.6',
            color: '#FFFFFF',
            textAlign: 'center',
            width: '100%',
          }}
        >
          {t('card.quoteEn')}
          <br />
          <span style={{ fontStyle: 'italic', opacity: 0.8 }}>
            {t('card.quoteVi')}
          </span>
        </p>

        {/* Body text block 2 */}
        <p
          className={montserrat.className}
          style={{
            fontSize: 'clamp(14px, 1.59vw, 24px)',
            fontWeight: 700,
            lineHeight: '1.4',
            color: '#FFFFFF',
            textAlign: 'justify',
            width: '100%',
          }}
        >
          {t('card.body3')}
        </p>
      </div>
    </div>
  )
}
