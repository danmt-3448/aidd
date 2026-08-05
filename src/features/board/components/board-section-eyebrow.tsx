/**
 * board-section-eyebrow.tsx — "Sun* Annual Awards 2025" gold eyebrow line
 * rendered above each major section title on the Live Board.
 *
 * Design tokens from MoMorph MCP node 2940:13454:
 *   Text: "Sun* Annual Awards 2025"
 *   Font: Montserrat 700 24px, fill rgba(255,255,255,1)
 *   Position: directly above the section h2 title, mb-4 gap.
 *
 * D5 — eyebrow appears before: Highlight, Spotlight, All Kudos sections.
 */

import { montserrat } from '@/features/auth/fonts'

export function SectionEyebrow() {
  return (
    <p
      style={{
        fontFamily: montserrat.style.fontFamily,
        fontWeight: 700,
        fontSize: 24,
        color: '#FFFFFF',
        lineHeight: '32px',
        marginBottom: 8,
      }}
      aria-hidden
    >
      Sun* Annual Awards 2025
    </p>
  )
}
