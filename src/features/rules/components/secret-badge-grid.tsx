import Image from 'next/image'
import type { SecretBadge } from '../types'

interface SecretBadgeGridProps {
  badges: SecretBadge[]
}

/**
 * 6 secret box badges in 2 rows of 3 (Frame 511 + Frame 513).
 * Figma: badges displayed side-by-side with gap-4, parent px-6.
 * Row 1: REVIVAL(80x88), TOUCH OF LIGHT(80x104), STAY GOLD(80x88)
 * Row 2: FLOW TO HORIZON(80x104), BEYOND THE BOUNDARY(80x120), ROOT FURTHER(80x104)
 */
export function SecretBadgeGrid({ badges }: SecretBadgeGridProps) {
  const row1 = badges.slice(0, 3)
  const row2 = badges.slice(3, 6)

  return (
    <div className="flex flex-col gap-4 px-6">
      <BadgeRow badges={row1} />
      <BadgeRow badges={row2} />
    </div>
  )
}

function BadgeRow({ badges }: { badges: SecretBadge[] }) {
  return (
    <div className="flex w-full flex-row items-end justify-between" style={{ maxWidth: 377 }}>
      {badges.map((badge) => (
        <div key={badge.id} className="flex flex-col items-center gap-1">
          <Image
            src={badge.imageSrc}
            alt={badge.alt}
            width={badge.width}
            height={badge.height}
            className="object-contain"
            style={{ width: badge.width, height: badge.height }}
          />
        </div>
      ))}
    </div>
  )
}
