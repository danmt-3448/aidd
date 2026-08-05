/**
 * ErrorPageLayout — shared layout for 404 and 5xx error pages.
 *
 * Brand-default fallback (MoMorph MCP unavailable in subagent session).
 * Values sourced from existing codebase:
 *   - bg: #00101A (rgba(0,16,26,1)) — same as homepage/login/awards
 *   - gold: #FFEA9E — CTA and accent colour from homepage hero
 *   - font: Montserrat — @/features/auth/fonts
 *   - logo: /homepage/logo.png (69×64 per footer)
 *   - border: #2E3940 — same divider colour as footer
 *
 * Accepts an optional `onReset` prop to render a "Thử lại" retry button,
 * which wires to Next.js error.tsx's `reset()` callback.
 */

import Image from 'next/image'
import Link from 'next/link'
import { montserrat, montserratAlternates } from '@/features/auth/fonts'

export interface ErrorPageLayoutProps {
  /** The HTTP-style code to display large (e.g. "404", "403", "500"). */
  code: string
  /** Short Vietnamese title (1 line). */
  title: string
  /** Longer Vietnamese explanation (1–2 sentences). */
  description: string
  /** When provided a "Thử lại" button is rendered that calls this function. */
  onReset?: () => void
}

export function ErrorPageLayout({ code, title, description, onReset }: ErrorPageLayoutProps) {
  return (
    <div
      className="relative flex min-h-screen w-full flex-col"
      style={{ backgroundColor: '#00101A' }}
    >
      {/* Subtle radial glow centred on the error code — brand atmosphere */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 40%, rgba(255,234,158,0.08) 0%, rgba(0,16,26,0) 70%)',
        }}
      />

      {/* Header — logo only, same height as login header */}
      <header
        className="relative z-10 flex h-20 w-full items-center px-6 md:px-16"
        style={{ borderBottom: '1px solid #2E3940' }}
      >
        <Link href="/" aria-label="Sun* Annual Awards 2025 — trang chủ">
          {/* mm:logo — /homepage/logo.png, 69×64 from footer spec */}
          <div className="relative" style={{ width: 52, height: 48 }}>
            <Image
              src="/homepage/logo.png"
              alt="Sun* Annual Awards 2025"
              fill
              priority
              className="object-contain object-left"
            />
          </div>
        </Link>
      </header>

      {/* Main content — vertically centred */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-16">
        <div className="flex w-full max-w-lg flex-col items-center gap-8 text-center">

          {/* Large error code — gold, display-scale */}
          <p
            className={montserrat.className}
            style={{
              fontSize: 'clamp(5rem, 20vw, 9rem)',
              fontWeight: 700,
              lineHeight: 1,
              color: '#FFEA9E',
              letterSpacing: '-0.02em',
            }}
          >
            {code}
          </p>

          {/* Title + description block */}
          <div className="flex flex-col gap-3">
            <h1
              className={montserrat.className}
              style={{
                fontSize: 'clamp(1.25rem, 3.5vw, 1.75rem)',
                fontWeight: 700,
                lineHeight: '1.3',
                color: '#FFFFFF',
              }}
            >
              {title}
            </h1>
            <p
              className={montserrat.className}
              style={{
                fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                fontWeight: 400,
                lineHeight: '1.6',
                color: 'rgba(255,255,255,0.65)',
              }}
            >
              {description}
            </p>
          </div>

          {/* CTA row */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            {/* Primary: Về trang chủ */}
            <Link
              href="/"
              className={`${montserrat.className} inline-flex items-center rounded-lg font-bold transition-opacity hover:opacity-90`}
              style={{
                padding: '12px 24px',
                background: '#FFEA9E',
                color: '#00101A',
                fontSize: 15,
                fontWeight: 700,
                borderRadius: 8,
              }}
            >
              Về trang chủ
            </Link>

            {/* Secondary: Thử lại — only when reset callback provided (error.tsx) */}
            {onReset !== undefined && (
              <button
                type="button"
                onClick={onReset}
                className={`${montserrat.className} inline-flex items-center rounded-lg font-bold transition-opacity hover:opacity-90`}
                style={{
                  padding: '12px 24px',
                  background: 'rgba(255,234,158,0.10)',
                  border: '1px solid #998C5F',
                  color: '#FFFFFF',
                  fontSize: 15,
                  fontWeight: 700,
                  borderRadius: 8,
                }}
              >
                Thử lại
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Footer — copyright only, matching homepage footer pattern */}
      <footer
        className="relative z-10 flex w-full items-center justify-center px-4 py-6"
        style={{ borderTop: '1px solid #2E3940' }}
      >
        <p
          className={`${montserratAlternates.className} text-sm font-bold`}
          style={{ color: 'rgba(255,255,255,0.5)' }}
        >
          Bản quyền thuộc về Sun* © 2025
        </p>
      </footer>
    </div>
  )
}
