import Image from 'next/image'
import { montserrat } from '@/features/kudos/fonts'
import type { HeroBadge } from '../types'

interface HeroBadgeRowProps {
  badge: HeroBadge
}

/**
 * One hero badge row — label image (126x22) + condition text + description.
 * Figma: content frame 400x72, label img at left, text stacked at right.
 * labelSrc may be null when Figma asset not yet uploaded — shows badge name as text fallback.
 */
export function HeroBadgeRow({ badge }: HeroBadgeRowProps) {
  return (
    <div className="flex w-full flex-col gap-1">
      {/* Row: badge label image + condition */}
      <div className="flex items-center gap-3">
        <div className="shrink-0" style={{ width: 126, height: 22 }}>
          {badge.labelSrc !== null ? (
            <Image
              src={badge.labelSrc}
              alt={badge.labelAlt}
              width={126}
              height={22}
              className="h-[22px] w-auto object-contain"
            />
          ) : (
            /* Fallback when asset not yet uploaded to Figma storage */
            <span
              className={`${montserrat.className} text-[12px] font-bold uppercase tracking-wide`}
              style={{ color: '#FFEA9E' }}
            >
              {badge.name}
            </span>
          )}
        </div>
        <p
          className={`${montserrat.className} text-[16px] font-bold leading-[24px] tracking-[0.5px]`}
          style={{ color: 'rgba(255,255,255,1)' }}
        >
          {badge.condition}
        </p>
      </div>
      {/* Description */}
      <p
        className={`${montserrat.className} text-[14px] font-bold leading-[20px] tracking-[0.1px]`}
        style={{ color: 'rgba(255,255,255,1)' }}
      >
        {badge.description}
      </p>
    </div>
  )
}
