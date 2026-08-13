/**
 * Award entity — integration contract with Track B phase-07 award-config.ts.
 * Integration engineer wires Award[] from award-config.ts into <AwardsShowcase awards={...} />.
 *
 * Display strings (description, quantityUnit, navLabel) live in
 * messages/{locale}/awards.json under `awards.categories.{i18nKey}`.
 * Components look them up via `t(`awards.categories.${award.i18nKey}.description`)` etc.
 */
export interface Award {
  /** URL-safe slug used for hashtag anchor targets (wired by integration phase) */
  slug: string
  /**
   * camelCase key into `awards.categories` i18n namespace (e.g. "topTalent").
   * All production entries in award-config.ts MUST provide it.
   * Optional only so legacy test fixtures outside the awards feature can omit it
   * during the i18n migration period.
   */
  i18nKey?: string
  /** Display title, e.g. "Top Talent" — kept as prop for headings/alt text */
  title: string
  /** Path to award icon used in the content card header (from /awards/*.svg) */
  icon: string
  /** Path to the award medallion artwork (crystal-ball + name composite, from /awards/*.png) */
  image: string
  /** Number of awards given in this category */
  quantity: number
  /** Prize value text, e.g. "7.000.000 VNĐ" */
  prize: string
  /** Anchor id for smooth-scroll (wired by integration phase) */
  hashtagAnchor: string
  /** Whether the award trophy image is left-aligned (true) or right-aligned (false) */
  imageLeft: boolean

  /**
   * @deprecated Moved to i18n — awards.categories.{i18nKey}.description
   * Kept optional for backward compatibility with test fixtures during migration.
   */
  description?: string
  /**
   * @deprecated Moved to i18n — awards.categories.{i18nKey}.navLabel
   * Kept optional for backward compatibility with test fixtures during migration.
   */
  navLabel?: string
  /**
   * @deprecated Moved to i18n — awards.categories.{i18nKey}.quantityUnit
   * Kept optional for backward compatibility with test fixtures during migration.
   */
  quantityUnit?: string
  /** @deprecated Use navLabel (from i18n) — kept for test fixture compatibility */
  navLabelMultiline?: string
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
