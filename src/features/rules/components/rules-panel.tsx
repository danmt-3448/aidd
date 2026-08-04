'use client'

import { montserrat } from '@/features/kudos/fonts'
import type { RulesPanelProps } from '../types'
import { RulesPanelHeader } from './rules-panel-header'
import { HeroBadgeRow } from './hero-badge-row'
import { SecretBadgeGrid } from './secret-badge-grid'
import { RulesActionBar } from './rules-action-bar'

/**
 * Rules modal panel — scrollable rules text + hero badge list + 6 secret badges + action bar.
 *
 * Figma: width 553px, height 1410px (full-height side panel), bg rgba(0,7,12,1),
 * padding 24px 40px 40px 40px, flex-col, justify-between.
 *
 * Responsive: at narrower viewports the panel expands to full width.
 * The scrollable content area uses overflow-y-auto so the action bar stays fixed at bottom.
 */
export function RulesPanel({
  recipientSection,
  senderSection,
  heroBadges,
  secretBadges,
  senderFooterText,
  kudosQuocDanHeading,
  kudosQuocDanBody,
  onWriteKudos,
  onClose,
}: RulesPanelProps) {
  return (
    <div
      className="flex w-full flex-col justify-between md:w-[553px]"
      style={{
        minHeight: '100svh',
        background: 'rgba(0, 7, 12, 1)',
        padding: '24px 40px 40px 40px',
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Thể lệ SAA 2025"
    >
      {/* Scrollable content */}
      <div className="flex flex-col gap-6 overflow-y-auto pb-6" style={{ flex: 1 }}>
        {/* Title */}
        <RulesPanelHeader title="Thể lệ" />

        {/* ── SECTION: Người nhận ── */}
        <div className="flex flex-col gap-4">
          {/* Section heading */}
          <h2
            className={`${montserrat.className} text-[22px] font-bold leading-[28px] tracking-[0px]`}
            style={{ color: '#FFEA9E' }}
          >
            {recipientSection.heading}
          </h2>

          {/* Section body */}
          <p
            className={`${montserrat.className} text-[16px] font-bold leading-[24px] tracking-[0.5px]`}
            style={{ color: 'rgba(255,255,255,1)', textAlign: 'justify' }}
          >
            {recipientSection.body}
          </p>

          {/* Hero badge rows */}
          <div className="flex flex-col gap-4">
            {heroBadges.map((badge) => (
              <HeroBadgeRow key={badge.id} badge={badge} />
            ))}
          </div>
        </div>

        {/* ── SECTION: Người gửi ── */}
        <div className="flex flex-col gap-4">
          {/* Section heading */}
          <h2
            className={`${montserrat.className} text-[22px] font-bold leading-[28px] tracking-[0px]`}
            style={{ color: '#FFEA9E' }}
          >
            {senderSection.heading}
          </h2>

          {/* Section body */}
          <p
            className={`${montserrat.className} text-[16px] font-bold leading-[24px] tracking-[0.5px]`}
            style={{ color: 'rgba(255,255,255,1)', textAlign: 'justify' }}
          >
            {senderSection.body}
          </p>

          {/* 6 Secret badges grid */}
          <SecretBadgeGrid badges={secretBadges} />

          {/* Footer teaser text */}
          <p
            className={`${montserrat.className} text-[16px] font-bold leading-[24px] tracking-[0.5px]`}
            style={{ color: 'rgba(255,255,255,1)', textAlign: 'justify' }}
          >
            {senderFooterText}
          </p>

          {/* ── KUDOS QUỐC DÂN sub-section ── */}
          <h3
            className={`${montserrat.className} text-[24px] font-bold leading-[32px] tracking-[0px]`}
            style={{ color: '#FFEA9E' }}
          >
            {kudosQuocDanHeading}
          </h3>

          <p
            className={`${montserrat.className} text-[16px] font-bold leading-[24px] tracking-[0.5px]`}
            style={{ color: 'rgba(255,255,255,1)', textAlign: 'justify' }}
          >
            {kudosQuocDanBody}
          </p>
        </div>
      </div>

      {/* Fixed action bar at bottom */}
      <RulesActionBar onClose={onClose} onWriteKudos={onWriteKudos} />
    </div>
  )
}
