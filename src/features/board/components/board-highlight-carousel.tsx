"use client";

/**
 * BoardHighlightCarousel — HIGHLIGHT KUDOS Swiper carousel.
 * MoMorph MCP (mms_B.2, 2940:13461): 528px cards, centeredSlides, loop.
 * Active card: full opacity. Adjacent: opacity 0.5.
 * Dot active: gold #FFEA9E pill 24×10px. Arrows: 80×80 circle.
 *
 * Card height 525px — Figma node 2940:13465 (B.3_KUDO - Highlight): 528×525.
 * Side fade — Figma Frame 527 node 2940:13467: CSS gradient 400×525px,
 *   linear-gradient(270deg, #00101A 50%, rgba(255,255,255,0) 100%). NOT a PNG.
 * Section minHeight 743px = 525 card + ~218 overhead (eyebrow+title+filters+pagination).
 */

import "swiper/css";
import { useState, useRef, useCallback, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperClass } from "swiper/types";
import { montserrat } from "@/features/auth/fonts";
import { BoardFeedCard } from "./board-feed-card";
import { BoardFilterDropdown } from "./board-filter-dropdown";
import { SectionEyebrow } from "./board-section-eyebrow";
import {
  HighlightArrowPrev,
  HighlightArrowNext,
} from "./board-highlight-arrow-button";
import type { FeedCardProps } from "./board-types";

export interface BoardHighlightCarouselProps {
  cards: FeedCardProps[];
  hashtags: string[];
  activeHashtag: string | null;
  onHashtagChange: (tag: string | null) => void;
  departments?: string[];
  activeDepartment?: string | null;
  onDepartmentChange?: (dept: string | null) => void;
  onToggleHeart: (kudoId: string) => void;
  onCopyLink: (kudoId: string) => void;
  onOpenProfile: (id: string) => void;
  /** Authenticated user's id — passed to each card so pencil shows only on own kudos */
  currentUserId?: string;
  /** Called when the pencil edit icon is clicked on an own kudo */
  onEdit?: (kudoId: string) => void;
}

export function BoardHighlightCarousel({
  cards,
  hashtags,
  activeHashtag,
  onHashtagChange,
  departments = [],
  activeDepartment = null,
  onDepartmentChange,
  onToggleHeart,
  onCopyLink,
  onOpenProfile,
  currentUserId,
  onEdit,
}: BoardHighlightCarouselProps) {
  const filtered = activeHashtag
    ? cards.filter((c) => c.hashtags?.includes(activeHashtag))
    : cards;
  const total = filtered.length;

  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef<SwiperClass | null>(null);

  // Loop mode: track the real (un-cloned) slide index for pagination.
  const handleSwiper = useCallback((swiper: SwiperClass) => {
    swiperRef.current = swiper;
    setActiveIndex(swiper.realIndex);
  }, []);

  const handleSlideChange = useCallback((swiper: SwiperClass) => {
    setActiveIndex(swiper.realIndex);
  }, []);

  // Reset to first slide on filter change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveIndex(0);
    if (swiperRef.current && !swiperRef.current.destroyed) {
      swiperRef.current.slideToLoop(0, 0);
    }
  }, [activeHashtag, activeDepartment]);

  // Infinite loop — arrows always active, no start/end.
  function handlePrev() {
    swiperRef.current?.slidePrev();
  }

  function handleNext() {
    swiperRef.current?.slideNext();
  }

  return (
    /* minHeight 743px: card height 525px (Figma 2940:13465) + overhead ~218px. */
    <section data-fig="2940:13461" aria-label="Highlight Kudos" style={{ minHeight: 743 }}>
      <SectionEyebrow />

      {/* Title LEFT + filters RIGHT */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <h2
          style={{
            fontFamily: montserrat.style.fontFamily,
            fontWeight: 700,
            fontSize: "clamp(32px, 4vw, 57px)",
            color: "#FFEA9E",
            lineHeight: 1.1,
            letterSpacing: "-0.25px",
          }}
        >
          HIGHLIGHT KUDOS
        </h2>
        {(hashtags.length > 0 || departments.length > 0) && (
          <div
            className="flex flex-wrap gap-3"
            role="group"
            aria-label="Bộ lọc Highlight"
          >
            {hashtags.length > 0 && (
              <BoardFilterDropdown
                id="highlight-hashtag-filter"
                label="Hashtag"
                value={activeHashtag ?? ""}
                options={hashtags}
                onChange={(v) => {
                  onHashtagChange(v === "" ? null : v);
                }}
              />
            )}
            {departments.length > 0 && (
              <BoardFilterDropdown
                id="highlight-department-filter"
                label="Phòng ban"
                value={activeDepartment ?? ""}
                options={departments}
                onChange={(v) => {
                  onDepartmentChange?.(v === "" ? null : v);
                }}
              />
            )}
          </div>
        )}
      </div>

      {total > 0 ? (
        <>
          {/* Arrow prev + Swiper viewport + Arrow next */}
          <div className="flex items-center gap-4">
            <HighlightArrowPrev onClick={handlePrev} disabled={false} />

            {/* Swiper — centeredSlides centers active; loop = infinite.
                Active styling via CSS (not React state) because loop clones
                slides outside React's tree. */}
            <div
              className="hl-carousel min-w-0 flex-1 overflow-hidden relative"
              aria-live="polite"
              aria-atomic
            >
              {/* Left fade — Figma Frame 527 node 2940:13467: 400×525px CSS gradient.
                  linear-gradient(270deg, #00101A 50%, rgba(255,255,255,0) 100%)
                  Rotated 180deg → left edge fades in from dark background color. */}
              <div
                aria-hidden
                className="swiper-box-shadow-left swiper-box-shadow pointer-events-none absolute left-0 top-0 z-10"
                style={{
                  width: 140,
                  height: 525,
                  background:
                    "linear-gradient(90deg, #00101A 0%, rgba(0,16,26,0) 100%)",
                }}
              />

              <Swiper
                onSwiper={handleSwiper}
                onSlideChange={handleSlideChange}
                centeredSlides
                slidesPerView="auto"
                spaceBetween={32}
                loop
                allowTouchMove
                style={{ overflow: "visible" }}
                className="swiper-custom"
              >
                {filtered.map((card) => (
                  <SwiperSlide
                    key={card.id}
                    style={{ width: 528, flexShrink: 0 }}
                  >
                    {/* height 525px — Figma node 2940:13465 (B.3_KUDO - Highlight): 528×525.
                        All slides fixed to same height; content overflow clipped so every card
                        is visually uniform regardless of text/image density. */}
                    <div
                      className="hl-slide relative overflow-hidden rounded-2xl"
                      style={{ height: 525 }}
                    >
                      <BoardFeedCard
                        {...card}
                        variant="highlight"
                        onToggleHeart={onToggleHeart}
                        onCopyLink={onCopyLink}
                        onOpenProfile={onOpenProfile}
                        currentUserId={currentUserId}
                        onEdit={onEdit}
                      />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>

              {/* Right fade — same Figma node 2940:13467, mirrored direction. */}
              <div
                aria-hidden
                className="swiper-box-shadow-right swiper-box-shadow pointer-events-none absolute right-0 top-0 z-10"
                style={{
                  width: 140,
                  height: 525,
                  background:
                    "linear-gradient(270deg, #00101A 0%, rgba(0,16,26,0) 100%)",
                }}
              />
            </div>

            <HighlightArrowNext onClick={handleNext} disabled={false} />
          </div>

          {/* Pagination: ‹ n/total › (Figma mms_B.5 — chevrons + page number) */}
          <div
            className="mt-6 flex items-center justify-center gap-4"
            aria-live="polite"
            aria-atomic
          >
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Trang trước"
              className="flex h-8 w-8 items-center justify-center rounded-full transition-opacity hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFEA9E]"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            <span
              className="tabular-nums"
              style={{ fontFamily: montserrat.style.fontFamily }}
            >
              <b style={{ fontSize: 45, fontWeight: 700, color: "#FFEA9E" }}>
                {activeIndex + 1}
              </b>
              <span
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.5)",
                }}
              >
                /{total}
              </span>
            </span>

            <button
              type="button"
              onClick={handleNext}
              aria-label="Trang tiếp theo"
              className="flex h-8 w-8 items-center justify-center rounded-full transition-opacity hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFEA9E]"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </>
      ) : (
        <p
          className="py-8 text-center text-sm"
          aria-live="polite"
          style={{
            fontFamily: montserrat.style.fontFamily,
            color: "rgba(255,255,255,0.4)",
          }}
        >
          {cards.length === 0
            ? "Hiện tại chưa có Kudos nào."
            : "Không có Kudos nào khớp với bộ lọc."}
        </p>
      )}
    </section>
  );
}
