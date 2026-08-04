import { AwardNavItem } from './award-nav-item'
import type { Award } from '../types'

interface AwardsNavProps {
  awards: Award[]
  /** Slug of the currently active category. Defaults to first award. Integration phase wires scroll-spy. */
  activeSlug?: string
}

/**
 * Left-side navigation listing 6 award categories.
 * Active state is presentational — driven by activeSlug prop.
 * Defaults first item to active. Smooth-scroll wiring deferred to integration phase.
 */
export function AwardsNav({ awards, activeSlug }: AwardsNavProps) {
  const effectiveActive = activeSlug ?? awards[0]?.slug ?? ''

  return (
    <nav
      className="flex flex-col"
      style={{ width: '178px', minWidth: '178px', gap: '16px' }}
      aria-label="Danh mục giải thưởng"
    >
      {awards.map((award) => (
        <AwardNavItem
          key={award.slug}
          label={award.navLabelMultiline ?? award.navLabel}
          isActive={effectiveActive === award.slug}
          href={`#${award.hashtagAnchor}`}
        />
      ))}
    </nav>
  )
}
