/** Integration contract — consumed by rules-panel and its page shell. */

export interface RuleSection {
  /** Unique key for React lists */
  id: string
  /** Section heading displayed in gold (#FFEA9E) */
  heading: string
  /** Body paragraphs rendered as white text */
  body: string
}

export interface HeroBadge {
  /** Unique key */
  id: string
  /** Badge name (e.g. "New Hero") */
  name: string
  /** Condition text shown below the badge label image */
  condition: string
  /** Descriptive text under condition */
  description: string
  /** Path to badge label image relative to public/ — null if not yet uploaded */
  labelSrc: string | null
  /** Alt text for the label image */
  labelAlt: string
}

export interface SecretBadge {
  /** Unique key */
  id: string
  /** Badge name (e.g. "TOUCH OF LIGHT") */
  name: string
  /** Path to badge image relative to public/ */
  imageSrc: string
  /** Alt text */
  alt: string
  /** Image width from Figma (px) */
  width: number
  /** Image height from Figma (px) */
  height: number
}

export interface RulesPanelProps {
  /** Panel accessible label (translated) */
  panelAriaLabel: string
  /** Panel title shown in header (translated) */
  title: string
  /** Section list: Người nhận heading + body */
  recipientSection: RuleSection
  /** Section list: Người gửi heading + body */
  senderSection: RuleSection
  /** 4 hero badge rows (Người nhận section) */
  heroBadges: HeroBadge[]
  /** 6 secret box badges (Người gửi section, 2 rows of 3) */
  secretBadges: SecretBadge[]
  /** Teaser text below badge grid */
  senderFooterText: string
  /** "KUDOS QUỐC DÂN" section heading */
  kudosQuocDanHeading: string
  /** "KUDOS QUỐC DÂN" body text */
  kudosQuocDanBody: string
  /** Called when user clicks "Viết KUDOS" */
  onWriteKudos: () => void
  /** Called when user clicks "Đóng" */
  onClose: () => void
}
