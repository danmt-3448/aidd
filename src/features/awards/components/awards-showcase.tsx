import Image from 'next/image'
import { AwardsNav } from './awards-nav'
import { AwardCard } from './award-card'
import { KudosPromo } from './kudos-promo'
import type { AwardsShowcaseProps } from '../types'

/**
 * Root awards showcase component.
 * Composes: "Further" hero logo + title section + left-nav + award cards + kudos promo + footer text.
 * Background: rgba(0,16,26,1) — from Figma root frame #313:8436.
 *
 * Responsive: mobile-first Tailwind breakpoints (sm 640 · md 768 · lg 1024 · xl 1280).
 * Content capped at 1440px — single source of truth for this page (do NOT also wrap in PageContainer).
 * Horizontal padding: px-4 sm:px-8 md:px-16 xl:px-36 — prevents the 144px hardcoded overflow at ≤768px.
 */
export function AwardsShowcase({ awards }: AwardsShowcaseProps) {
  return (
    <div
      className="min-h-screen w-full"
      style={{ backgroundColor: 'rgba(0,16,26,1)' }}
    >
      {/* Content block — responsive padding, 1440px max-width centered */}
      <div
        className="mx-auto w-full px-4 pb-24 pt-16 sm:px-8 md:px-16 xl:px-36"
        style={{ maxWidth: '1440px' }}
      >
        {/* Top section: Further logo (left) + hero artwork (right) */}
        <div className="relative mb-20 flex items-start justify-between">
          {/* KV: "Further" event logo — max 338px, scales down on small screens */}
          <div
            className="relative shrink-0"
            style={{ width: 'min(338px, 60vw)', height: 'auto', aspectRatio: '338/150' }}
          >
            <Image
              src="/awards/further-logo.png"
              alt="Further — Sun* Annual Awards 2025"
              fill
              priority
              className="object-contain object-left"
            />
          </div>

          {/* Hero artwork — top-right abstract art (Figma: colorful abstract corner art) */}
          <div
            className="pointer-events-none absolute right-0 top-0 hidden md:block"
            aria-hidden="true"
            style={{ width: 'clamp(200px, 30vw, 480px)', height: 'auto', aspectRatio: '1/1' }}
          >
            <Image
              src="/homepage/keyvisual-bg.png"
              alt="SAA 2025 hero artwork"
              fill
              priority
              className="object-contain object-right-top"
              style={{ opacity: 0.85 }}
              sizes="(max-width: 1280px) 30vw, 480px"
            />
          </div>
        </div>

        {/* Title section: "Sun* Annual Awards 2025" + divider + headline */}
        <div className="mb-16 flex flex-col gap-4 md:mb-28">
          <p
            className="w-full text-center font-montserrat text-2xl font-bold leading-8"
            style={{ color: '#FFFFFF' }}
          >
            Sun* Annual Awards 2025
          </p>
          {/* Thin horizontal rule */}
          <div style={{ height: '1px', backgroundColor: 'rgba(46,57,64,1)', width: '100%' }} />
          {/* Main page heading */}
          <div className="flex items-center justify-center gap-8">
            <h1
              className="text-center font-montserrat font-bold"
              style={{
                fontSize: 'clamp(28px, 4vw, 57px)',
                lineHeight: '1.2',
                letterSpacing: '-0.25px',
                color: '#FFEA9E',
              }}
            >
              Hệ thống giải thưởng SAA 2025
            </h1>
          </div>
        </div>

        {/* Main layout: left sticky nav + right award cards (80px gap per Figma) */}
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-20">
          {/* Left navigation — hidden below lg, sticky on desktop */}
          <div className="hidden lg:block">
            <AwardsNav awards={awards} />
          </div>

          {/* Award cards list — 80px gap between cards per Figma */}
          <div className="flex flex-1 flex-col gap-10 lg:gap-20">
            {awards.map((award) => (
              <AwardCard key={award.slug} award={award} />
            ))}
          </div>
        </div>

        {/* SunKudos promo section */}
        <div className="mt-20 md:mt-28">
          <KudosPromo />
        </div>
      </div>

      {/* Footer — matches Figma Footer INSTANCE */}
      <footer
        className="flex flex-col items-center justify-between gap-4 border-t px-4 py-8 sm:px-8 md:flex-row md:px-16 xl:px-36"
        style={{
          borderColor: 'rgba(46,57,64,1)',
          backgroundColor: 'rgba(0,16,26,1)',
        }}
      >
        <div className="relative h-10 w-36">
          <Image
            src="/awards/logo-footer.png"
            alt="Sun* logo"
            fill
            className="object-contain object-left"
          />
        </div>
        <p
          className="font-montserrat-alternates text-center text-base font-bold leading-6"
          style={{ color: 'rgba(255,255,255,0.8)' }}
        >
          Bản quyền thuộc về Sun* © 2025
        </p>
      </footer>
    </div>
  )
}
