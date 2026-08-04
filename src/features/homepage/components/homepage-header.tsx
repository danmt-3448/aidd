'use client'

/**
 * HomepageHeader — sticky site header for Homepage SAA.
 *
 * Figma: mms_A1_Header (node 2167:9091)
 * Design values:
 *   - bg: rgba(16,20,23,0.8), backdrop-blur
 *   - height: 80px, padding: 12px 144px
 *   - logo: 52×48px
 *   - nav gap: 24px, font 14px Montserrat 700
 *   - active link: #FFEA9E + bottom border 1px solid #FFEA9E + text-shadow glow
 *   - right cluster gap: 16px
 *   - lang switch: "VN" label + flag icon (20×15) + chevron
 *   - notif bell: 40×40 round button
 *   - user avatar: 40×40 round button
 *
 * Integration contract (swapped in by integration phase):
 *   user: null → public header (no bell/account menu)
 *   user: { name, avatarUrl? } → show bell + account menu
 *   isAdmin: true → show Admin Dashboard link in account dropdown
 *   onQuickAction: propagated from HomepageScreen → opens kudo compose modal
 *
 * AccountDropdown is extracted to homepage-account-menu.tsx (M-3).
 */

import Image from 'next/image'
import Link from 'next/link'
import { montserrat } from '@/features/auth/fonts'
import { HomepageAccountMenu } from './homepage-account-menu'

export interface HomepageHeaderProps {
  /** Number of unread notifications. 0 = no badge. */
  unreadCount: number
  /** Null = public (unauthenticated) header. */
  user: { name: string; avatarUrl?: string } | null
  /** Show "Admin Dashboard" in account dropdown when true. */
  isAdmin: boolean
}

export function HomepageHeader({ unreadCount, user, isAdmin }: HomepageHeaderProps) {
  return (
    <header
      className="sticky top-0 z-50 flex w-full items-center justify-between px-4 py-3 md:px-16 xl:px-36"
      style={{
        minHeight: 80,
        background: 'rgba(16,20,23,0.8)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
      aria-label="Site header"
    >
      {/* Left: Logo + nav */}
      <div className="flex items-center gap-6 md:gap-16">
        {/* Logo */}
        <Link href="/" aria-label="Sun* Homepage">
          <div style={{ width: 52, height: 48, position: 'relative' }}>
            <Image
              src="/homepage/logo.png"
              alt="Sun* Annual Awards 2025"
              fill
              className="object-contain"
              priority
            />
          </div>
        </Link>

        {/* Nav links */}
        <nav
          className="hidden items-center md:flex"
          style={{ gap: 24 }}
          aria-label="Main navigation"
        >
          {/* About SAA 2025 — same-page anchor (clarification: no /about route) */}
          <a
            href="#about"
            className={`${montserrat.className} flex items-center px-4 py-4 text-sm font-bold transition-colors`}
            style={{
              color: '#FFEA9E',
              borderBottom: '1px solid #FFEA9E',
              textShadow: '0 4px 4px rgba(0,0,0,0.25), 0 0 6px #FAE287',
              lineHeight: '20px',
              letterSpacing: '0.1px',
            }}
            aria-current="page"
          >
            About SAA 2025
          </a>

          {/* Awards Information → /awards */}
          <Link
            href="/awards"
            className={`${montserrat.className} flex items-center rounded px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10`}
            style={{ lineHeight: '20px', letterSpacing: '0.1px' }}
          >
            Award Information
          </Link>

          {/* Sun* Kudos → /kudos */}
          <Link
            href="/kudos"
            className={`${montserrat.className} flex items-center rounded px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10`}
            style={{ lineHeight: '20px', letterSpacing: '0.1px' }}
          >
            Sun* Kudos
          </Link>
        </nav>
      </div>

      {/* Right: Language + optional bell + optional account */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Language selector — "VN" with flag + chevron */}
        <button
          className="flex items-center rounded px-3 py-2 transition-opacity hover:opacity-80"
          style={{ gap: 6, background: 'transparent' }}
          aria-label="Select language: Vietnamese"
        >
          <div className="relative" style={{ width: 20, height: 15 }}>
            <Image
              src="/homepage/flag-vn.svg"
              alt="VN"
              fill
              className="object-contain"
            />
          </div>
          <span
            className={montserrat.className}
            style={{ fontSize: 16, fontWeight: 700, lineHeight: '24px', color: '#FFFFFF', letterSpacing: '0.15px' }}
          >
            VN
          </span>
          <div className="relative" style={{ width: 24, height: 24 }}>
            <Image
              src="/homepage/icon-chevron-down.svg"
              alt=""
              fill
              className="object-contain"
            />
          </div>
        </button>

        {/* Notification bell — only when authenticated */}
        {user !== null && (
          <button
            className="relative flex h-10 w-10 items-center justify-center rounded-full transition-opacity hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
            aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
          >
            <div className="relative" style={{ width: 24, height: 24 }}>
              <Image
                src="/homepage/icon-notification.svg"
                alt=""
                fill
                className="object-contain"
              />
            </div>
            {unreadCount > 0 && (
              <span
                className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-xs font-bold"
                style={{ background: '#EF4444', color: '#FFFFFF', fontSize: 10, lineHeight: '16px' }}
                aria-hidden="true"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        )}

        {/* Account menu — only when authenticated */}
        {user !== null ? (
          <HomepageAccountMenu user={user} isAdmin={isAdmin} />
        ) : (
          /* Public: show user icon as login hint */
          <Link
            href="/login"
            className="flex h-10 w-10 items-center justify-center rounded-full transition-opacity hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
            aria-label="Sign in"
          >
            <div className="relative" style={{ width: 24, height: 24 }}>
              <Image
                src="/homepage/icon-user-profile.svg"
                alt=""
                fill
                className="object-contain"
              />
            </div>
          </Link>
        )}
      </div>
    </header>
  )
}
