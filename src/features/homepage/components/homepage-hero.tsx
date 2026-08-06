/**
 * HomepageHero — full-height hero section with keyvisual, countdown, and CTAs.
 *
 * Figma sections (node 2167:9030 "Bìa"):
 *   Frame 487 (left column):
 *     - Frame 482: Root Further logo image (451×200px)
 *     - Frame 523: countdown + event info
 *     - mms_B3_Call-To-Action: 2 CTA buttons
 *   Frame 486 (center card) → HomepageRootFurtherCard (extracted, M-4)
 *   mms_6_Widget Button (fixed FAB) → HomepageWidgetFab (extracted, M-4)
 *
 * Design values (from Figma):
 *   - Outer frame: padding 96px 144px, gap 120px, bg transparent
 *   - "Comming soon": Montserrat 700 24px white
 *   - Countdown row gap: 40px, 3 LED blocks
 *   - Event info: Montserrat 700 16px white, gap 60px
 *   - CTA1 (About Awards): bg #FFEA9E, color #00101A, radius 8px
 *   - CTA2 (About Kudos): border 1px solid #998C5F, bg rgba(255,234,158,0.10)
 *
 * Integration contract:
 *   days/hours/minutes replaced by useCountdown() output at integration.
 *   onQuickAction opens kudo compose modal (H-3: auth-gated, anon sees no FAB).
 */

import Image from "next/image";
import Link from "next/link";
import { montserrat } from "@/features/auth/fonts";
import { CountdownLedBlock } from "@/features/countdown/components/countdown-led-block";
import { HomepageWidgetFab } from "./homepage-widget-fab";
import { HomepageRootFurtherCard } from "./homepage-root-further-card";

export interface HomepageCountdownProps {
  days: number;
  hours: number;
  minutes: number;
}

interface HomepageHeroProps {
  countdown: HomepageCountdownProps;
  /** Opens KudoComposeModal. Omit for anonymous visitors (no FAB rendered). */
  onWriteKudo?: () => void;
  /** Opens the RulesModal ("Thể lệ") in-place. */
  onOpenRules?: () => void;
}

export function HomepageHero({
  countdown,
  onWriteKudo,
  onOpenRules,
}: HomepageHeroProps) {
  return (
    <section
      id="about"
      className="relative w-full"
      aria-label="Root Further — SAA 2025 Hero"
      style={{ minHeight: "100vh" }}
    >
      {/* Keyvisual background */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <Image
          src="/homepage/keyvisual-bg.png"
          alt=""
          fill
          priority
          className="object-cover"
          style={{ objectPosition: "center top" }}
          sizes="100vw"
        />
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{
            height: "75%",
            background:
              "linear-gradient(to top, rgba(0,16,26,0.9) 0%, rgba(0,16,26,0) 100%)",
          }}
        />
      </div>

      {/* Content
          pb-28 on mobile gives the fixed FAB (bottom: calc(50vh - 32px)) enough
          clearance so it does not overlap the countdown clock row at 375px. */}
      <div className="relative z-10 mx-auto flex w-full max-w-[1512px] flex-col items-center gap-16 px-4 pb-28 pt-16 md:px-16 md:pb-24 md:pt-24 xl:gap-[120px] xl:px-36 xl:pt-45">
        {/* Top block: left-aligned info column */}
        <div
          className="flex w-full flex-col items-start"
          style={{ gap: 40, maxWidth: 1224 }}
        >
          {/* Root Further logo */}
          <div
            className="relative w-full"
            style={{ maxWidth: 451, height: "clamp(100px, 13.23vw, 200px)" }}
          >
            <Image
              src="/homepage/root-further-logo.png"
              alt="Root Further — Sun* Annual Awards 2025"
              fill
              priority
              className="object-contain object-left"
            />
          </div>

          {/* Countdown + event info */}
          <div className="flex flex-col" style={{ gap: 16 }}>
            {/* "Coming soon" label (MoMorph spec B1.2 — correct spelling) */}
            <p
              className={montserrat.className}
              style={{
                fontSize: 24,
                fontWeight: 700,
                lineHeight: "32px",
                color: "#FFFFFF",
              }}
            >
              Coming soon
            </p>

            {/* 3-unit LED countdown row
                flex-wrap: at 375px the 3 blocks wrap to 2 rows so nothing
                clips off the right edge. gap scales with clamp so blocks
                stay tight on small viewports. */}
            <div
              className="flex flex-row flex-wrap items-start"
              style={{ gap: "clamp(12px, 2.6vw, 40px)" }}
              role="timer"
              aria-live="polite"
              aria-label={`${countdown.days} ngày ${countdown.hours} giờ ${countdown.minutes} phút`}
            >
              <CountdownLedBlock value={countdown.days} label="NGÀY" />
              <CountdownLedBlock value={countdown.hours} label="GIỜ" />
              <CountdownLedBlock value={countdown.minutes} label="PHÚT" />
            </div>

            {/* Event info */}
            <div className="flex flex-col" style={{ gap: 8 }}>
              <div className="flex flex-row items-center" style={{ gap: 60 }}>
                <span
                  className={montserrat.className}
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    lineHeight: "24px",
                    letterSpacing: "0.5px",
                  }}
                >
                  <span>Thời gian:</span>
                  <span
                    className="ms-1"
                    style={{ color: "#FFEA9E", fontSize: 24 }}
                  >
                    26/12/2025
                  </span>
                </span>
                <span
                  className={montserrat.className}
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    lineHeight: "24px",
                    letterSpacing: "0.5px",
                  }}
                >
                  <span>Địa điểm:</span>
                  <span
                    className="ms-1"
                    style={{ color: "#FFEA9E", fontSize: 24 }}
                  >
                    Âu Cơ Art Center
                  </span>
                </span>
              </div>
              <p
                className={montserrat.className}
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  lineHeight: "24px",
                  color: "#FFFFFF",
                  letterSpacing: "0.5px",
                }}
              >
                Tường thuật trực tiếp qua sóng Livestream
              </p>
            </div>
          </div>

          {/* CTA buttons */}
          <div
            className="flex flex-row flex-wrap items-center"
            style={{ gap: 40 }}
          >
            <Link
              href="/awards"
              className={`${montserrat.className} inline-flex items-center rounded-lg font-bold transition-opacity hover:opacity-90`}
              style={{
                gap: 8,
                padding: "12px 16px",
                background: "#FFEA9E",
                color: "#00101A",
                fontSize: "clamp(14px, 1.46vw, 22px)",
                lineHeight: "1.3",
                fontWeight: 700,
                borderRadius: 8,
              }}
              aria-label="About Awards Information"
            >
              ABOUT AWARDS
              <div
                className="relative"
                style={{ width: 24, height: 24, flexShrink: 0 }}
              >
                <Image
                  src="/homepage/icon-arrow-up-black.svg"
                  alt=""
                  fill
                  className="object-contain"
                />
              </div>
            </Link>

            <Link
              href="/board"
              className={`${montserrat.className} inline-flex items-center rounded-lg font-bold transition-opacity hover:opacity-90`}
              style={{
                gap: 8,
                padding: "12px 16px",
                background: "rgba(255,234,158,0.10)",
                border: "1px solid #998C5F",
                color: "#FFFFFF",
                fontSize: "clamp(14px, 1.46vw, 22px)",
                lineHeight: "1.3",
                fontWeight: 700,
                borderRadius: 8,
              }}
              aria-label="About Sun* Kudos"
            >
              ABOUT KUDOS
              <div
                className="relative"
                style={{ width: 24, height: 24, flexShrink: 0 }}
              >
                <Image
                  src="/homepage/icon-arrow-up.svg"
                  alt=""
                  fill
                  className="object-contain"
                />
              </div>
            </Link>
          </div>
        </div>

        {/* Center card — "Root Further" description (extracted to keep this file < 200 lines) */}
        <HomepageRootFurtherCard />
      </div>

      {/* Fixed Widget FAB — auth-gated (H-3): only rendered when onWriteKudo provided. */}
      {onWriteKudo !== undefined && onOpenRules !== undefined && (
        <HomepageWidgetFab
          onWriteKudo={onWriteKudo}
          onOpenRules={onOpenRules}
        />
      )}
    </section>
  );
}
