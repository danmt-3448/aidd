import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { AwardsNav } from "./awards-nav";
import { AwardCard } from "./award-card";
import { KudosPromo } from "./kudos-promo";
import type { AwardsShowcaseProps } from "../types";
import { HomepageFooter } from "@/features/homepage/components/homepage-footer";

/**
 * Root awards showcase component.
 * Composes: "Further" hero logo + title section + left-nav + award cards + kudos promo + footer text.
 * Background: rgba(0,16,26,1) — from Figma root frame #313:8436.
 *
 * Responsive: mobile-first Tailwind breakpoints (sm 640 · md 768 · lg 1024 · xl 1280).
 * Content capped at 1440px — single source of truth for this page (do NOT also wrap in PageContainer).
 * Horizontal padding: px-4 sm:px-8 md:px-16 xl:px-36 — prevents the 144px hardcoded overflow at ≤768px.
 */
export async function AwardsShowcase({ awards }: AwardsShowcaseProps) {
  const t = await getTranslations("awards");

  return (
    <div
      className="min-h-screen w-full"
      style={{ backgroundColor: "rgba(0,16,26,1)" }}
      data-fig="313:8436"
    >
      {/* Hero artwork — top-right abstract art (Figma: colorful abstract corner art) */}
      <div
        className="pointer-events-none absolute right-0 top-0 hidden md:block -z-0"
        aria-hidden="true"
        style={{ width: "100vw", height: 584 }}
      >
        <Image
          src="/homepage/keyvisual-bg.png"
          alt={t("heroAlt")}
          fill
          priority
          style={{ objectFit: "inherit", objectPosition: "top right" }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(0,16,26,.9) 0px, rgba(0,16,26,0) 250px)",
          }}
        />
      </div>

      {/* Content block — responsive padding, 1440px max-width centered.
          pt-24 (96px) clears the fixed 80px header so the "Further" wordmark
          isn't clipped (matches the Homepage hero clearance). */}
      <div
        className="mx-auto w-full px-4 pb-24 pt-24 xl:pt-45 sm:px-8 md:px-16 xl:px-36 z-10 relative"
        style={{ maxWidth: "1440px" }}
      >
        {/* Top section: Further logo (left) + hero artwork (right) */}
        <div className="relative mb-20 flex items-start justify-between">
          {/* KV: "Further" event logo — max 338px, scales down on small screens
              Figma node 2789:12915 (MM_MEDIA_Root Further Logo, 338×150 RECTANGLE/image) */}
          <div
            className="relative shrink-0"
            style={{
              width: "min(338px, 60vw)",
              height: "auto",
              aspectRatio: "338/150",
            }}
            data-fig-asset="MM_MEDIA_Root Further Logo"
          >
            <Image
              src="/awards/further-logo.png"
              alt="Further — Sun* Annual Awards 2025"
              fill
              priority
              className="object-contain object-left"
            />
          </div>
        </div>

        {/* Title section: event name + divider + page heading */}
        <div className="mb-16 flex flex-col gap-4 md:mb-28">
          <p
            className="w-full text-center font-montserrat text-2xl font-bold leading-8"
            style={{ color: "#FFFFFF" }}
          >
            {t("pageSubtitle")}
          </p>
          {/* Thin horizontal rule */}
          <div
            style={{
              height: "1px",
              backgroundColor: "rgba(46,57,64,1)",
              width: "100%",
            }}
          />
          {/* Main page heading */}
          <div className="flex items-center justify-center gap-8">
            {/*
             * Figma node 313:8457 — TEXT "Hệ thống giải thưởng SAA 2025"
             * fontSize:57px, lineHeight:64px (NOT 1.2 which gives 68.4px), fontWeight:700,
             * color:rgba(255,234,158,1), letterSpacing:-0.25px
             */}
            <h1
              className="text-center font-montserrat font-bold"
              style={{
                fontSize: "clamp(28px, 4vw, 57px)",
                lineHeight: "64px",
                letterSpacing: "-0.25px",
                color: "#FFEA9E",
              }}
              data-fig="313:8457"
            >
              {t("pageHeading")}
            </h1>
          </div>
        </div>

        {/* Main layout: left sticky nav + right award cards (80px gap per Figma) */}
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-20">
          {/* Left navigation — hidden below lg, STICKY on desktop (Figma NOTE:
              "Scroll thì phần này sẽ đi theo"). top-24 clears the 80px fixed header.
              Figma node 313:8459 (mms_C_Menu list) width:178px, gap:16px, height:448px. */}
          <div className="hidden self-start lg:sticky lg:top-24 lg:block" data-fig="313:8459">
            <AwardsNav awards={awards} />
          </div>

          {/* Award cards list — 80px gap between cards per Figma.
              Figma node 313:8466 (D.Danh sách giải thưởng) gap:80px, height:4833px. */}
          <div className="flex flex-1 flex-col gap-10 lg:gap-20" data-fig="313:8466">
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

      {/* Footer */}
      <HomepageFooter />
    </div>
  );
}
