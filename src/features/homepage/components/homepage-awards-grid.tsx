/**
 * HomepageAwardsGrid — "Hệ thống giải thưởng" section with header + 6-card grid.
 *
 * Figma: node 2167:9068 "Hệ thống giải thưởng", width 1224px, gap 80px.
 * Header (mms_C1_Header Giải thưởng):
 *   - Label: Montserrat 700 24px white "Sun* annual awards 2025"
 *   - Divider: 1px solid rgba(46,57,64,1)
 *   - Heading: Montserrat 700 57px #FFEA9E "Hệ thống giải thưởng", line-height 64px
 *
 * Grid (mms_C2_Award list):
 *   - Desktop (≥1024): 3 columns, gap 80px, rows of 3
 *   - Tablet (768–1023): 2 columns
 *   - Mobile (<768): 1 column
 *
 * Data: Award[] from award-config (shared with /awards page — DRY).
 */

import { montserrat } from '@/features/auth/fonts'
import type { Award } from '@/features/awards/types'
import { HomepageAwardCard } from './homepage-award-card'

interface HomepageAwardsGridProps {
  awards: Award[]
}

export function HomepageAwardsGrid({ awards }: HomepageAwardsGridProps) {
  return (
    <section
      className="w-full"
      style={{ display: 'flex', flexDirection: 'column', gap: 80 }}
      aria-labelledby="awards-section-heading"
    >
      {/* Section header */}
      <div className="flex flex-col" style={{ gap: 16 }}>
        <p
          className={montserrat.className}
          style={{
            fontSize: 24,
            fontWeight: 700,
            lineHeight: '32px',
            color: '#FFFFFF',
          }}
        >
          Sun* annual awards 2025
        </p>

        {/* Divider */}
        <div style={{ height: 1, backgroundColor: 'rgba(46,57,64,1)', width: '100%' }} />

        {/* Main heading */}
        <h2
          id="awards-section-heading"
          className={montserrat.className}
          style={{
            fontSize: 'clamp(36px, 3.97vw, 57px)',
            fontWeight: 700,
            lineHeight: '64px',
            letterSpacing: '-0.25px',
            color: '#FFEA9E',
            margin: 0,
          }}
        >
          Hệ thống giải thưởng
        </h2>
      </div>

      {/* 3→2→1 column responsive grid */}
      <div
        className="grid grid-cols-1 gap-16 sm:grid-cols-2 lg:grid-cols-3"
        style={{ columnGap: 'clamp(24px, 5.29vw, 80px)', rowGap: 'clamp(40px, 5.29vw, 80px)' }}
        role="list"
        aria-label="Danh sách giải thưởng"
      >
        {awards.map((award) => (
          <div key={award.slug} role="listitem">
            <HomepageAwardCard award={award} />
          </div>
        ))}
      </div>
    </section>
  )
}
