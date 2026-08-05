'use client'

/**
 * SiteAccountMenu — avatar button + dropdown for authenticated SiteHeader.
 *
 * Extracted from HomepageAccountMenu and relocated to src/components/ so
 * every screen that renders SiteHeader can share it without cross-feature
 * imports.
 *
 * Behaviorally identical to HomepageAccountMenu:
 *   - Click avatar → toggle dropdown
 *   - Dropdown: Profile / [Admin Dashboard if isAdmin] / Sign out
 *   - Sign out: supabase.auth.signOut() → redirect /login
 */

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { montserrat } from '@/features/auth/fonts'

export interface SiteAccountMenuProps {
  user: { name: string; avatarUrl?: string }
  isAdmin: boolean
}

export function SiteAccountMenu({ user, isAdmin }: SiteAccountMenuProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const initial = user.name.charAt(0).toUpperCase()

  async function handleSignOut() {
    setOpen(false)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`Account menu for ${user.name}`}
        className="flex h-10 w-10 items-center justify-center rounded-full font-bold transition-opacity hover:opacity-80"
        style={{
          background: 'rgba(255,234,158,0.15)',
          border: '1px solid rgba(255,234,158,0.4)',
          color: '#FFEA9E',
          fontFamily: montserrat.style.fontFamily,
          fontSize: 16,
        }}
      >
        {user.avatarUrl ? (
          <Image
            src={user.avatarUrl}
            alt={user.name}
            width={40}
            height={40}
            className="rounded-full object-cover"
          />
        ) : (
          <span>{initial}</span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-12 z-50 min-w-[180px] rounded-lg py-2 shadow-lg"
          style={{
            background: 'rgba(16,20,23,0.96)',
            border: '1px solid rgba(153,140,95,0.35)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <Link
            href="/profile"
            role="menuitem"
            className="block px-4 py-2.5 text-sm font-bold transition-colors hover:bg-white/10"
            style={{ color: '#FFFFFF', fontFamily: montserrat.style.fontFamily }}
            onClick={() => setOpen(false)}
          >
            Profile
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              role="menuitem"
              className="block px-4 py-2.5 text-sm font-bold transition-colors hover:bg-white/10"
              style={{ color: '#FFEA9E', fontFamily: montserrat.style.fontFamily }}
              onClick={() => setOpen(false)}
            >
              Admin Dashboard
            </Link>
          )}
          <button
            role="menuitem"
            className="block w-full px-4 py-2.5 text-left text-sm font-bold transition-colors hover:bg-white/10"
            style={{ color: 'rgba(255,255,255,0.7)', fontFamily: montserrat.style.fontFamily }}
            onClick={handleSignOut}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
