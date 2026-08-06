import Image from 'next/image'
import { AwardMedallion } from './award-medallion'
import type { AwardCardProps } from '../types'

/**
 * Award category card — award medallion + content panel.
 * Medallion (336×336, mix-blend-mode:screen, gold glow) alternates left/right per design.
 * Layout from Figma node mms_D.1_Top talent (213:2554):
 *   row gap 40px | image 336×336 | content flex-col gap-32px
 */
export function AwardCard({ award }: AwardCardProps) {
  const { title, description, quantity, quantityUnit, prize, imageLeft, hashtagAnchor, icon, image } = award

  const trophyMedallion = (
    <AwardMedallion src={image} alt={`${title} — huy hiệu giải thưởng`} size={336} />
  )

  const contentPanel = (
    <div
      id={hashtagAnchor}
      className="flex flex-col"
      style={{ gap: '32px', backdropFilter: 'blur(32px)', borderRadius: '16px', flex: 1, scrollMarginTop: '96px' }}
    >
      {/* Top: category title + description */}
      <div className="flex flex-col" style={{ gap: '24px' }}>
        {/* Title row: icon + text */}
        <div className="flex items-center" style={{ gap: '16px' }}>
          <div className="relative shrink-0" style={{ width: '24px', height: '24px' }}>
            <Image src={icon} alt="" fill className="object-contain" />
          </div>
          {/* Figma node I313:8467;214:2530 (Top Talent card H2 text)
              fontSize:24px, lineHeight:32px, fontWeight:700, color:rgba(255,234,158,1) */}
          <h2
            className="font-montserrat font-bold"
            style={{ fontSize: '24px', lineHeight: '32px', color: '#FFEA9E' }}
            {...(hashtagAnchor === 'top-talent' ? { 'data-fig': 'I313:8467;214:2530' } : {})}
          >
            {title}
          </h2>
        </div>

        {/* Description paragraph */}
        <p
          className="font-montserrat font-bold"
          style={{
            fontSize: '16px',
            lineHeight: '24px',
            letterSpacing: '0.5px',
            color: '#FFFFFF',
            textAlign: 'justify',
          }}
        >
          {description}
        </p>
      </div>

      {/* Horizontal divider */}
      <div style={{ height: '1px', backgroundColor: 'rgba(46,57,64,1)' }} />

      {/* Quantity row: diamond icon + "Số lượng giải thưởng:" + number + unit */}
      <div className="flex flex-wrap items-center" style={{ gap: '16px' }}>
        <div className="relative shrink-0" style={{ width: '24px', height: '24px' }}>
          <Image src="/awards/icon-diamond.svg" alt="" fill className="object-contain" />
        </div>
        <span
          className="font-montserrat font-bold"
          style={{ fontSize: '24px', lineHeight: '32px', color: '#FFEA9E' }}
        >
          Số lượng giải thưởng:
        </span>
        <div className="flex items-center" style={{ gap: '8px' }}>
          <span
            className="font-montserrat font-bold"
            style={{ fontSize: '36px', lineHeight: '44px', color: '#FFFFFF' }}
          >
            {quantity}
          </span>
          <span
            className="font-montserrat font-bold"
            style={{ fontSize: '14px', lineHeight: '20px', letterSpacing: '0.1px', color: '#FFFFFF' }}
          >
            {quantityUnit}
          </span>
        </div>
      </div>

      {/* Prize section: license icon + "Giá trị giải thưởng:" + amount + per-award note */}
      <div className="flex flex-col" style={{ gap: '16px' }}>
        <div className="flex items-center" style={{ gap: '16px' }}>
          <div className="relative shrink-0" style={{ width: '24px', height: '24px' }}>
            <Image src="/awards/icon-gift.svg" alt="" fill className="object-contain" />
          </div>
          <span
            className="font-montserrat font-bold"
            style={{ fontSize: '24px', lineHeight: '32px', color: '#FFEA9E' }}
          >
            Giá trị giải thưởng:
          </span>
        </div>
        <div>
          <p
            className="font-montserrat font-bold"
            style={{ fontSize: '36px', lineHeight: '44px', color: '#FFFFFF' }}
          >
            {prize}
          </p>
          <p
            className="font-montserrat font-bold"
            style={{ fontSize: '14px', lineHeight: '20px', letterSpacing: '0.1px', color: '#FFFFFF' }}
          >
            cho mỗi giải thưởng
          </p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col" style={{ gap: '80px' }}>
      {/* Row: trophy + content — alternates left/right via imageLeft prop */}
      <div
        className="flex flex-col items-start md:flex-row md:items-start"
        style={{ gap: '40px' }}
      >
        {imageLeft ? (
          <>
            <div className="hidden md:block">{trophyMedallion}</div>
            {contentPanel}
          </>
        ) : (
          <>
            {contentPanel}
            <div className="hidden md:block">{trophyMedallion}</div>
          </>
        )}
        {/* Mobile: medallion below content, centered */}
        <div className="flex w-full justify-center md:hidden">
          <AwardMedallion src={image} alt={`${title} — huy hiệu giải thưởng`} size={240} />
        </div>
      </div>

      {/* Section separator */}
      <div style={{ height: '1px', backgroundColor: 'rgba(46,57,64,1)' }} />
    </div>
  )
}
