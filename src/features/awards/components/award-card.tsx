import Image from 'next/image'
import type { AwardCardProps } from '../types'

/**
 * Award category card — circular trophy medallion + content panel.
 * Trophy image (336×336, mix-blend-mode:screen, gold glow) alternates left/right per design.
 * Layout from Figma node mms_D.1_Top talent (213:2554):
 *   row gap 40px | image 336×336 | content flex-col gap-32px
 */
export function AwardCard({ award }: AwardCardProps) {
  const { title, description, quantity, quantityUnit, prize, imageLeft, hashtagAnchor } = award

  const trophyMedallion = (
    <div
      className="shrink-0"
      style={{
        width: '336px',
        height: '336px',
        position: 'relative',
        mixBlendMode: 'screen',
        boxShadow: '0 4px 4px 0 rgba(0,0,0,0.25), 0 0 6px 0 #FAE287',
        borderRadius: '24px',
        flexShrink: 0,
      }}
    >
      {/* Gold trophy plate background */}
      <Image
        src="/awards/award-trophy.png"
        alt={`${title} — huy hiệu giải thưởng`}
        fill
        className="object-cover"
        style={{ borderRadius: '24px', border: '0.955px solid #FFEA9E' }}
        sizes="336px"
      />
      {/* Award badge overlay (214:666) */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ borderRadius: '24px' }}
      >
        <div className="relative" style={{ width: '120px', height: '120px' }}>
          <Image
            src="/awards/trophy-badge.png"
            alt=""
            fill
            className="object-contain"
            sizes="120px"
          />
        </div>
      </div>
    </div>
  )

  const contentPanel = (
    <div
      id={hashtagAnchor}
      className="flex flex-col"
      style={{ gap: '32px', backdropFilter: 'blur(32px)', borderRadius: '16px', flex: 1 }}
    >
      {/* Top: category title + description */}
      <div className="flex flex-col" style={{ gap: '24px' }}>
        {/* Title row: icon + text */}
        <div className="flex items-center" style={{ gap: '16px' }}>
          <div className="relative shrink-0" style={{ width: '24px', height: '24px' }}>
            <Image src="/awards/icon-target.svg" alt="" fill className="object-contain" />
          </div>
          <h2
            className="font-montserrat font-bold"
            style={{ fontSize: '24px', lineHeight: '32px', color: '#FFEA9E' }}
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
        {/* Mobile: trophy below content, centered */}
        <div className="flex w-full justify-center md:hidden">
          <div style={{ width: '240px', height: '240px', position: 'relative', borderRadius: '16px', overflow: 'hidden' }}>
            <Image
              src="/awards/award-trophy.png"
              alt={`${title} trophy`}
              fill
              className="object-cover"
              sizes="240px"
            />
          </div>
        </div>
      </div>

      {/* Section separator */}
      <div style={{ height: '1px', backgroundColor: 'rgba(46,57,64,1)' }} />
    </div>
  )
}
