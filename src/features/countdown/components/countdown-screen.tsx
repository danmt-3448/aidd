'use client'

import { useCountdown } from '@/features/event/use-countdown'
import { CountdownDisplay } from './countdown-display'

/**
 * Full-screen prelaunch Countdown page — SAA 2025 dark brand.
 *
 * Layout (Figma artboard 1512×1077, screen 8PJQswPZmU):
 *   - Page background: #00101A.
 *   - Background art: /images/countdown/prelaunch-bg.png as full-bleed cover,
 *     object-position right-center so the organic illustration shows on the right.
 *   - Overlay: linear-gradient(18deg, ...) darkens the left where content sits.
 *   - Content block: vertically centered, positioned left-of-center (~55% from left).
 *     Title + LED row are rendered by CountdownDisplay.
 *
 * States:
 *   - isLoading: renders the background shell without the counter (avoids
 *     flashing zeros before config resolves).
 *   - invalid: delegated to CountdownDisplay (config missing or malformed).
 *   - done: delegated to CountdownDisplay (event has started).
 *   - counting: delegated to CountdownDisplay (normal path).
 *
 * Note: no header or footer in this screen per Figma artboard.
 *
 * Follow-up (out of scope here): app-wide nav-lock until event starts.
 * The `done` flag from useCountdown() is available here for that future
 * redirect/unlock logic — tracked in: TODO-NAV-LOCK.
 */
export function CountdownScreen() {
  const countdown = useCountdown()

  return (
    // mm:countdown-root
    <div
      className="relative flex min-h-screen w-full overflow-hidden"
      style={{ background: '#00101A' }}
    >
      {/* mm:bg-art — full-bleed background illustration, art anchored right */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/countdown/prelaunch-bg.png"
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full select-none"
        style={{
          objectFit: 'cover',
          objectPosition: 'right center',
          zIndex: 0,
        }}
      />

      {/* mm:bg-overlay — 18deg gradient, darkens left side where content sits */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(18deg, #00101A 15.48%, rgba(0,18,29,0.46) 52.13%, rgba(0,19,32,0.00) 63.41%)',
          zIndex: 1,
        }}
      />

      {/* mm:countdown-content — vertically centered, left-of-center.
          mx-auto max-w-[1280px] caps content at the artboard width so
          it centers at @1440 instead of drifting left. */}
      <main
        className="relative flex w-full items-center"
        style={{
          zIndex: 10,
          minHeight: '100vh',
          padding: 'clamp(24px, 5vw, 80px)',
        }}
        aria-busy={countdown.isLoading}
      >
        <div className="mx-auto w-full max-w-[1280px]">
          {/*
            Content block sits at ~55% from left (matching the artboard where LED row
            spans x≈434–1077 of 1512). On mobile it centers.
          */}
          <div
            className="flex w-full flex-col items-center md:items-start md:max-w-[60%] lg:max-w-[55%]"
          >
            {!countdown.isLoading && (
              <CountdownDisplay countdown={countdown} />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
