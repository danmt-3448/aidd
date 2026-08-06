/**
 * Award entity — integration contract with Track B phase-07 award-config.ts.
 * Integration engineer wires Award[] from award-config.ts into <AwardsShowcase awards={...} />.
 */
export interface Award {
  /** URL-safe slug used for hashtag anchor targets (wired by integration phase) */
  slug: string
  /** Display title, e.g. "Top Talent" */
  title: string
  /** Category label shown in the left navigation */
  navLabel: string
  /** Multiline nav label (e.g. "Top Project\nLeader") — optional */
  navLabelMultiline?: string
  /** Path to award icon used in the content card header (from /awards/*.svg) */
  icon: string
  /** Path to the award medallion artwork (crystal-ball + name composite, from /awards/*.png) */
  image: string
  /** Number of awards given in this category */
  quantity: number
  /** Unit label for quantity, e.g. "Cá nhân" or "Dự án" */
  quantityUnit: string
  /** Prize value text, e.g. "7.000.000 VNĐ" */
  prize: string
  /** Award description paragraph */
  description: string
  /** Anchor id for smooth-scroll (wired by integration phase) */
  hashtagAnchor: string
  /** Whether the award trophy image is left-aligned (true) or right-aligned (false) */
  imageLeft: boolean
}

export interface AwardsShowcaseProps {
  awards: Award[]
}

export interface AwardNavItemProps {
  label: string
  isActive: boolean
  href: string
}

export interface AwardCardProps {
  award: Award
}
