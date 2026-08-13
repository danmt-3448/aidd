'use client'

/**
 * board-spotlight-bg.tsx — nebula/constellation background artwork for Spotlight frame.
 * Extracted from board-spotlight.tsx (Phase 03) to keep that file ≤200 lines.
 *
 * Figma artwork — Figma node 2940:14174 children:
 *   2940:14178 — feather/nebula layer 1 · exported PNG 1157×548 RGBA
 *                → /public/images/board/bg-spot-highlight-2.png
 *                   (verified: PNG image data, 1157×548, 8-bit/color RGBA, non-interlaced)
 *   2940:14181 — feather/nebula layer 2 · exported PNG 1065×548 RGBA
 *                → /public/images/board/bg-spot-highlight.png
 *                   (verified: PNG image data, 1065×548, 8-bit/color RGBA, non-interlaced)
 *
 * Both exported via figma MCP get_screenshot in the Phase 04 pass.
 * Gradient overlay fades artwork into the dark frame bg (rgb(4,8,20)) on the right,
 * preserving text-on-dark contrast for the word cloud.
 *
 * data-fig tags: 2940:14178 + 2940:14181 — measured by style-assert.mjs.
 */

import Image from 'next/image'

export function BoardSpotlightBg() {
  return (
    <div
      className="pointer-events-none absolute inset-y-0 left-0 z-0"
      style={{ width: '100%' }}
      aria-hidden
    >
      {/* Figma node 2940:14178 — nebula/feather layer 1 (1157×548) */}
      <div data-fig="2940:14178" className="absolute inset-0">
        <Image
          src="/images/board/bg-spot-highlight-2.png"
          alt=""
          fill
          priority
          sizes="(max-width: 1280px) 100vw, 1157px"
          style={{ objectFit: 'cover', objectPosition: 'left center' }}
        />
      </div>

      {/* Figma node 2940:14181 — nebula/feather layer 2 (1065×548) */}
      <div data-fig="2940:14181" className="absolute inset-0">
        <Image
          src="/images/board/bg-spot-highlight.png"
          alt=""
          fill
          priority
          sizes="(max-width: 1280px) 100vw, 1157px"
          style={{ objectFit: 'cover', objectPosition: 'left center' }}
        />
      </div>

      {/* Gradient fade: art bleeds from left, fades to dark base on the right
          so word-cloud names remain readable. Direction derived from Figma
          layer composition (artwork anchored left, dark base = rgb(4,8,20)). */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, rgba(4,8,20,0.30) 0%, rgba(4,8,20,0.12) 40%, rgba(4,8,20,0.80) 82%, rgb(4,8,20) 100%)',
        }}
      />
    </div>
  )
}
