'use client'

/**
 * SiteHeader — shared FIXED header for all authenticated screens (Homepage,
 * Board, Profile, Awards). Generalised from HomepageHeader.
 *
 * Figma: mms_A1_Header (node 2167:9091, screen i87tDx10uM)
 * The Figma header is `position: absolute` at y=0 with a translucent frosted
 * background — it OVERLAYS the page content (content bleeds to the very top and
 * shows through behind the bar). We use `fixed` so it also stays pinned while
 * the page scrolls. Design values preserved — do NOT restyle here.
 *   - bg: rgba(16,20,23,0.8), backdrop-blur 12px  (frosted, see-through)
 *   - position: fixed top-0, z-50 — overlays content, out of layout flow
 *   - height: 80px, padding: 12px 144px (→ xl:px-36)
 *   - logo: 52×48px
 *   - nav gap: 24px, font 14px Montserrat 700
 *   - active link: #FFEA9E + bottom border 1px solid #FFEA9E + text-shadow glow
 *   - right cluster gap: 16px
 *
 * NOTE: because the header is out of flow, pages WITHOUT a full-bleed hero at
 * the top (e.g. Profile, Notifications) must add ~80px top padding so their
 * content clears the bar. Hero pages (Homepage/Board/Awards) intentionally let
 * their banner bleed up under the header.
 *
 * Props:
 *   user        — null = public header (no bell/account). Authenticated = bell + menu.
 *   unreadCount — badge on bell (0 = no badge).
 *   uid         — auth user id; required to fetch notifications in the panel.
 *   isAdmin     — true adds Admin Dashboard in account dropdown.
 *   activeNav   — drives aria-current="page" on the matching nav link.
 *                 null = no link is marked active.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { montserrat } from '@/features/auth/fonts'
import { useLanguageSwitcher } from './language-switcher'
import { NotificationPanel } from '@/features/notifications/notification-panel'
import { SiteAccountMenu } from './site-account-menu'
import type { Locale } from '@/i18n/config'

export type ActiveNav = 'about' | 'awards' | 'kudos' | null

export interface SiteHeaderProps {
  /** Null = public (unauthenticated) header — no bell, no account menu. */
  user: { name: string; avatarUrl?: string } | null
  /** Number of unread notifications. 0 = no badge. */
  unreadCount: number
  /** Auth user id — passed to NotificationPanel so it can fetch notifications. */
  uid?: string | null
  /** Show "Admin Dashboard" in account dropdown when true. */
  isAdmin: boolean
  /**
   * Which nav item is currently active — drives aria-current="page".
   * null = no item is active (neutral state, e.g. detail pages).
   */
  activeNav: ActiveNav
}

interface NavItemDef {
  id: ActiveNav
  label: string
  href: string
}

const NAV_ITEMS: NavItemDef[] = [
  { id: 'about',  label: 'About SAA 2025',    href: '/#about' },
  { id: 'awards', label: 'Award Information', href: '/awards' },
  { id: 'kudos',  label: 'Sun* Kudos',        href: '/board'  },
]

export function SiteHeader({ user, unreadCount, uid, isAdmin, activeNav }: SiteHeaderProps) {
  const bellRef = useRef<HTMLButtonElement | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)

  const togglePanel = useCallback(() => setPanelOpen((v) => !v), [])
  const closePanel = useCallback(() => setPanelOpen(false), [])

  // Language switcher — click opens a VN/EN dropdown (chevron affordance).
  const { locale, switchLocale, isPending, locales } = useLanguageSwitcher()
  const langRef = useRef<HTMLDivElement | null>(null)
  const [langOpen, setLangOpen] = useState(false)

  useEffect(() => {
    if (!langOpen) return
    function onDown(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [langOpen])

  return (
    <header
      data-fig="313:8440"
      className="fixed inset-x-0 top-0 z-50 flex w-full items-center justify-between px-4 py-3 md:px-16 xl:px-36"
      style={{
        minHeight: 80,
        background: 'rgba(16,20,23,0.8)',
      }}
      aria-label="Site header"
    >
      {/* Left: Logo + nav */}
      <div className="flex items-center gap-6 md:gap-16">
        {/* Logo */}
        <Link href="/" aria-label="Sun* Homepage">
          <div data-fig-asset="logo" style={{ width: 52, height: 48, position: 'relative' }}>
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
          data-fig="I313:8440;178:653"
          className="hidden items-center md:flex"
          style={{ gap: 24 }}
          aria-label="Main navigation"
        >
          {NAV_ITEMS.map(({ id, label, href }) => {
            const isActive = id === activeNav
            return isActive ? (
              <a
                key={id}
                href={href}
                data-fig="I313:8440;186:1587;186:1502"
                className={`${montserrat.className} flex items-center px-4 py-4 font-bold transition-colors`}
                style={{
                  fontSize: 16,
                  color: '#FFEA9E',
                  borderBottom: '1px solid #FFEA9E',
                  textShadow: '0 4px 4px rgba(0,0,0,0.25), 0 0 6px #FAE287',
                  lineHeight: '24px',
                  letterSpacing: '0.15px',
                }}
                aria-current="page"
              >
                {label}
              </a>
            ) : (
              <Link
                key={id}
                href={href}
                data-fig="I313:8440;186:1579;186:1439"
                className={`${montserrat.className} flex items-center rounded px-4 py-3 font-bold text-white transition-colors hover:bg-white/10`}
                style={{ fontSize: 16, lineHeight: '24px', letterSpacing: '0.15px' }}
              >
                {label}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Right: Language + optional bell + optional account */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Language selector — click opens VN/EN dropdown (design: chevron affordance). */}
        <div ref={langRef} className="relative">
          <button
            className="flex items-center rounded px-3 py-2 transition-opacity hover:opacity-80"
            style={{ gap: 6, background: 'transparent' }}
            aria-label="Chọn ngôn ngữ"
            aria-haspopup="listbox"
            aria-expanded={langOpen}
            disabled={isPending}
            onClick={() => setLangOpen((o) => !o)}
          >
            {locale === 'vi' ? (
              <div className="relative" style={{ width: 20, height: 15 }}>
                <Image
                  src="/homepage/flag-vn.svg"
                  alt="VN"
                  fill
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="relative" style={{ width: 20, height: 15 }}>
                <Image
                  src="/homepage/flag-en.svg"
                  alt="EN"
                  fill
                  className="object-contain"
                />
              </div>
            )}
            <span
              className={montserrat.className}
              style={{ fontSize: 16, fontWeight: 700, lineHeight: '24px', color: '#FFFFFF', letterSpacing: '0.15px' }}
            >
              {locale.toUpperCase()}
            </span>
            <div
              className={`relative transition-transform ${langOpen ? 'rotate-180' : ''}`}
              style={{ width: 24, height: 24 }}
            >
              <Image
                src="/homepage/icon-chevron-down.svg"
                alt=""
                fill
                className="object-contain"
              />
            </div>
          </button>

          {langOpen && (
            <ul
              role="listbox"
              aria-label="Ngôn ngữ"
              className="absolute right-0 z-30 mt-1 min-w-[120px] overflow-hidden rounded py-1 shadow-lg ring-1 ring-white/10"
              style={{ background: 'rgba(16,20,23,0.95)' }}
            >
              {locales.map((l) => (
                <li key={l}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={l === locale}
                    disabled={isPending}
                    onClick={() => {
                      setLangOpen(false)
                      switchLocale(l as Locale)
                    }}
                    className={`${montserrat.className} flex w-full items-center gap-2 px-4 py-2 text-left transition-colors hover:bg-white/10 disabled:opacity-60`}
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      lineHeight: '24px',
                      letterSpacing: '0.15px',
                      color: l === locale ? '#FFEA9E' : '#FFFFFF',
                    }}
                  >
                    <span className="relative" style={{ width: 20, height: 15 }}>
                      <Image
                        src={l === 'vi' ? '/homepage/flag-vn.svg' : '/homepage/flag-en.svg'}
                        alt=""
                        fill
                        className="object-contain"
                      />
                    </span>
                    {l.toUpperCase()}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Notification bell — only when authenticated; wraps panel */}
        {user !== null && (
          <div className="relative">
            <button
              ref={bellRef}
              className="relative flex h-10 w-10 items-center justify-center rounded-full transition-opacity hover:opacity-80"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
              aria-label={unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Thông báo'}
              aria-expanded={panelOpen}
              aria-haspopup="dialog"
              onClick={togglePanel}
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

            {/* Panel — conditionally rendered; positions relative to bell */}
            {panelOpen && uid && (
              <NotificationPanel
                uid={uid}
                isOpen={panelOpen}
                onClose={closePanel}
                triggerRef={bellRef}
              />
            )}
          </div>
        )}

        {/* Account menu — only when authenticated */}
        {user !== null ? (
          <SiteAccountMenu user={user} isAdmin={isAdmin} />
        ) : (
          /* Public: sign-in hint */
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
