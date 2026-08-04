/**
 * Integration contract for the Open Secret Box modal.
 * Consumed by:
 *  - SecretBoxModal (Track A UI — this file)
 *  - Phase 06 openSecretBox RPC (Track B — wires onOpen + currentBadge)
 *  - Phase 07 i18n (replaces inline text with translation keys)
 */
export interface BadgeInfo {
  /** Stable identifier used as an i18n key and for equality checks. */
  key: string
  /** Absolute path or URL to the badge image. */
  imageSrc: string
}

export interface SecretBoxModalProps {
  /** Count of boxes still available to open. Drives conditional guidance + disabled state. */
  unopened: number
  /**
   * Badge revealed after the most recent open.
   * null = no box has been opened yet in this session (show placeholder).
   */
  currentBadge: BadgeInfo | null
  /** True while the openSecretBox RPC is in flight. Disables the box and shows a spinner. */
  isOpening: boolean
  /** Fired when the user clicks the box. Caller owns the RPC; this component only notifies. */
  onOpen: () => void
  /**
   * Optional dismiss handler (e.g. closes a parent modal/overlay).
   * If omitted the close button is not rendered.
   */
  onClose?: () => void
}
