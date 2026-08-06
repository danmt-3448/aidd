/**
 * HomepageFooter — site footer matching Figma mms_7_Footer (node 5001:14800).
 *
 * Design values:
 *   - padding: 40px 90px
 *   - border-top: 1px solid #2E3940
 *   - layout: logo + nav links (gap 48px) on left, copyright on right
 *   - Logo: 69×64px
 *   - Nav links: Montserrat 700 14px white, gap 48px
 *   - Copyright: "Bản quyền thuộc về Sun* © 2025", same font
 *
 * Footer nav links from Figma text nodes (Frame 476, 4 children):
 *   About SAA 2025 (anchor), Award Information (/awards),
 *   Sun* Kudos (/board), Thể lệ (/rules)
 */

import Image from 'next/image'
import Link from 'next/link'
import { montserratAlternates, montserrat } from '@/features/auth/fonts'

const NAV_LINKS = [
  { label: 'About SAA 2025', href: '#about' },
  { label: 'Award Information', href: '/awards' },
  { label: 'Sun* Kudos', href: '/board' },
  { label: 'Tiêu chuẩn chung', href: '/rules' },
] as const

export function HomepageFooter() {
  return (
    <footer
      data-fig="5001:14800"
      className="flex w-full flex-col items-center justify-between gap-6 px-4 py-8 md:flex-row md:px-16 xl:px-[90px]"
      style={{
        borderTop: '1px solid #2E3940',
        backgroundColor: 'rgba(0,16,26,1)',
      }}
      aria-label="Site footer"
    >
      {/* Left: logo + nav */}
      <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:gap-16 xl:gap-20">
        {/* Logo */}
        <Link href="/" aria-label="Sun* Homepage">
          <div data-fig-asset="footer-logo" className="relative" style={{ width: 69, height: 64 }}>
            <Image
              src="/homepage/logo.png"
              alt="Sun* Annual Awards 2025"
              fill
              className="object-contain object-left"
            />
          </div>
        </Link>

        {/* Nav links */}
        <nav
          data-fig="I5001:14800;342:1409"
          className="flex flex-wrap items-center gap-4 md:flex-nowrap xl:gap-12"
          style={{ gap: 48 }}
          aria-label="Footer navigation"
        >
          {NAV_LINKS.map(({ label, href }) => (
            href.startsWith('#') ? (
              <a
                key={label}
                href={href}
                data-fig="I5001:14800;342:1410;186:1439"
                className={`${montserrat.className} font-bold text-white transition-opacity hover:opacity-70`}
                style={{ fontSize: 16, lineHeight: '24px', letterSpacing: '0.15px' }}
              >
                {label}
              </a>
            ) : (
              <Link
                key={label}
                href={href}
                data-fig="I5001:14800;342:1410;186:1439"
                className={`${montserrat.className} font-bold text-white transition-opacity hover:opacity-70`}
                style={{ fontSize: 16, lineHeight: '24px', letterSpacing: '0.15px' }}
              >
                {label}
              </Link>
            )
          ))}
        </nav>
      </div>

      {/* Copyright */}
      <p
        data-fig="I5001:14800;342:1413"
        className={`${montserratAlternates.className} text-center text-base font-bold leading-6`}
        style={{ color: 'rgba(255,255,255,0.8)' }}
      >
        Bản quyền thuộc về Sun* © 2025
      </p>
    </footer>
  )
}
