/**
 * board-card-send-icons.tsx — paper-plane send icon and pencil edit icon for feed cards.
 * Extracted from board-card-atoms.tsx to keep that file under 200 lines.
 *
 * Per user Figma feedback (rework pass 3):
 *   PaperPlaneIcon → between sender and receiver vertical person blocks.
 *   PencilIcon     → visual-only decoration to the right of the kudo title.
 *
 * ⚠️ NEEDS FIGMA VERIFY — SVG paths are standard icons; exact paths from
 * node 3127:21871 (mms_C.3 KUDO Post) still need MCP confirmation.
 */

// ── Paper-plane send icon ─────────────────────────────────────────────────────

/**
 * PaperPlaneIcon — paper-plane outline send icon.
 * Placed between sender and receiver vertical person blocks at top alignment.
 * ⚠️ path NEEDS FIGMA VERIFY: mms_C.3 (3127:21871) send icon element.
 * Stroke color #92400E (warm amber) from existing Figma palette — confirmed.
 * Circle backdrop rgba(255,234,158,0.18) — consistent with design system.
 */
export function PaperPlaneIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      className="flex-shrink-0"
    >
      <circle cx="16" cy="16" r="15" fill="rgba(255,234,158,0.18)" stroke="rgba(255,234,158,0.35)" strokeWidth="1" />
      {/* Paper-plane outline — ⚠️ NEEDS FIGMA VERIFY: exact path from 3127:21871 */}
      <path
        d="M22 10L14.5 17.5M22 10L17.5 22L14.5 17.5M22 10L10 14.5L14.5 17.5"
        stroke="#92400E"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ── Pencil / edit icon ────────────────────────────────────────────────────────

/**
 * PencilIcon — edit/pencil icon to the right of the kudo title.
 * Visual decoration only — no edit behavior wired (out of scope for this task).
 * ⚠️ path NEEDS FIGMA VERIFY: exact path from node 3127:21871 title area.
 * Stroke color #92400E with opacity-60 — matches title color family.
 */
export function PencilIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#92400E"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="flex-shrink-0 opacity-60"
    >
      {/* Standard pencil/edit outline — ⚠️ NEEDS FIGMA VERIFY */}
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}
