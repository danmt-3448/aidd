/**
 * HomepageHeader unit tests — driven by MoMorph test cases (IDs 0–38, 58).
 *
 * HomepageHeader is now a thin wrapper over SiteHeader with activeNav='about'.
 * These tests exercise the full rendering path through SiteHeader so the
 * homepage integration contract is covered end-to-end.
 *
 * Coverage:
 *   - Public view (no auth): ID-0 logo visible, ID-10 language selector, ID-18 logo link
 *   - Authenticated view: ID-1 bell shows, ID-11/28/29 badge logic, ID-5/6/37/38 admin menu
 *   - Language button: ID-24/25/26 VN/EN toggle (dropdown interaction deferred to e2e)
 *   - Menu items: ID-36 Profile/Sign out always, ID-5/37 Admin Dashboard when isAdmin
 *   - Nav: About marked aria-current="page"; Awards → /awards; Sun* Kudos → /board
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { HomepageHeader } from './homepage-header'

describe('HomepageHeader', () => {
  describe('Public view (unauthenticated)', () => {
    it('ID-0: renders public header without bell or account menu', () => {
      render(
        <HomepageHeader
          unreadCount={0}
          user={null}
          isAdmin={false}
        />
      )

      const logo = screen.getByAltText('Sun* Annual Awards 2025')
      expect(logo).toBeInTheDocument()

      const bellButton = screen.queryByRole('button', { name: /unread notifications|notifications/i })
      expect(bellButton).not.toBeInTheDocument()

      const signInLink = screen.getByRole('link', { name: /sign in/i })
      expect(signInLink).toBeInTheDocument()

      const profileLink = screen.queryByRole('menuitem', { name: /profile/i })
      expect(profileLink).not.toBeInTheDocument()
    })

    it('ID-18: logo links to home (/)', () => {
      render(
        <HomepageHeader
          unreadCount={0}
          user={null}
          isAdmin={false}
        />
      )

      const logoLink = screen.getByRole('link', { name: /sun\* homepage/i })
      expect(logoLink).toHaveAttribute('href', '/')
    })

    it('ID-10: displays language selector that opens a VN/EN dropdown', async () => {
      const user = userEvent.setup()
      render(
        <HomepageHeader
          unreadCount={0}
          user={null}
          isAdmin={false}
        />
      )

      // Trigger button — labelled "Chọn ngôn ngữ", shows the current locale (VI default).
      const langButton = screen.getByRole('button', { name: /chọn ngôn ngữ/i })
      expect(langButton).toHaveTextContent('VI')
      expect(langButton).toHaveAttribute('aria-expanded', 'false')

      // Click opens the VN/EN dropdown listbox.
      await user.click(langButton)
      expect(langButton).toHaveAttribute('aria-expanded', 'true')
      const options = screen.getAllByRole('option').map((o) => o.textContent)
      expect(options).toEqual(expect.arrayContaining(['VI', 'EN']))
    })
  })

  describe('Authenticated view — no admin', () => {
    const mockUser = { name: 'Nguyễn Văn An', avatarUrl: 'https://example.com/avatar.jpg' }

    it('ID-1: renders notification bell and account menu when authenticated', () => {
      render(
        <HomepageHeader
          unreadCount={0}
          user={mockUser}
          isAdmin={false}
        />
      )

      // aria-label is "Thông báo" (Vietnamese) when no unread items.
      const bellButton = screen.getByRole('button', { name: /thông báo/i })
      expect(bellButton).toBeInTheDocument()

      const accountButton = screen.getByRole('button', { name: /account menu/i })
      expect(accountButton).toBeInTheDocument()

      const signInLink = screen.queryByRole('link', { name: /sign in/i })
      expect(signInLink).not.toBeInTheDocument()
    })

    it('ID-11: bell has NO badge when unreadCount is 0', () => {
      render(
        <HomepageHeader
          unreadCount={0}
          user={mockUser}
          isAdmin={false}
        />
      )

      const bellButton = screen.getByRole('button', { name: /thông báo/i })
      expect(bellButton).toBeInTheDocument()

      const badge = bellButton.querySelector('span')
      expect(badge).not.toBeInTheDocument()
    })

    it('ID-28: bell shows badge with count when unreadCount > 0', () => {
      render(
        <HomepageHeader
          unreadCount={5}
          user={mockUser}
          isAdmin={false}
        />
      )

      // aria-label: "5 thông báo chưa đọc"
      const bellButton = screen.getByRole('button', { name: /5 thông báo chưa đọc/i })
      expect(bellButton).toBeInTheDocument()
      expect(bellButton).toHaveTextContent('5')
    })

    it('ID-29: bell badge shows 99+ when unreadCount > 99', () => {
      render(
        <HomepageHeader
          unreadCount={150}
          user={mockUser}
          isAdmin={false}
        />
      )

      const bellButton = screen.getByRole('button', { name: /thông báo chưa đọc/i })
      expect(bellButton).toBeInTheDocument()
      expect(bellButton).toHaveTextContent('99+')
    })

    it('ID-36: account menu shows Profile and Sign out when not admin', async () => {
      render(
        <HomepageHeader
          unreadCount={0}
          user={mockUser}
          isAdmin={false}
        />
      )

      const accountButton = screen.getByRole('button', { name: /account menu/i })
      await userEvent.click(accountButton)

      const profileLink = screen.getByRole('menuitem', { name: /profile/i })
      expect(profileLink).toBeInTheDocument()
      expect(profileLink).toHaveAttribute('href', '/profile')

      const signOutButton = screen.getByRole('menuitem', { name: /sign out/i })
      expect(signOutButton).toBeInTheDocument()

      const adminLink = screen.queryByRole('menuitem', { name: /admin dashboard/i })
      expect(adminLink).not.toBeInTheDocument()
    })

    it('ID-38: account menu closes when a menu item is clicked', async () => {
      render(
        <HomepageHeader
          unreadCount={0}
          user={mockUser}
          isAdmin={false}
        />
      )

      const accountButton = screen.getByRole('button', { name: /account menu/i })
      await userEvent.click(accountButton)

      const profileLink = screen.getByRole('menuitem', { name: /profile/i })
      await userEvent.click(profileLink)

      const menu = screen.queryByRole('menu')
      expect(menu).not.toBeInTheDocument()
    })
  })

  describe('Authenticated view — admin', () => {
    const mockUser = { name: 'Admin User' }

    it('ID-5: admin user sees Admin Dashboard in account menu', async () => {
      render(
        <HomepageHeader
          unreadCount={0}
          user={mockUser}
          isAdmin={true}
        />
      )

      const accountButton = screen.getByRole('button', { name: /account menu/i })
      await userEvent.click(accountButton)

      const adminLink = screen.getByRole('menuitem', { name: /admin dashboard/i })
      expect(adminLink).toBeInTheDocument()
      expect(adminLink).toHaveAttribute('href', '/admin')
    })

    it('ID-37: admin user account menu still has Profile and Sign out', async () => {
      render(
        <HomepageHeader
          unreadCount={0}
          user={mockUser}
          isAdmin={true}
        />
      )

      const accountButton = screen.getByRole('button', { name: /account menu/i })
      await userEvent.click(accountButton)

      expect(screen.getByRole('menuitem', { name: /profile/i })).toBeInTheDocument()
      expect(screen.getByRole('menuitem', { name: /admin dashboard/i })).toBeInTheDocument()
      expect(screen.getByRole('menuitem', { name: /sign out/i })).toBeInTheDocument()
    })
  })

  describe('Avatar rendering', () => {
    it('displays user avatar when avatarUrl is provided', () => {
      const mockUser = { name: 'Test User', avatarUrl: 'https://example.com/avatar.jpg' }

      render(
        <HomepageHeader
          unreadCount={0}
          user={mockUser}
          isAdmin={false}
        />
      )

      const avatar = screen.getByAltText('Test User')
      expect(avatar).toBeInTheDocument()
      expect(avatar).toHaveAttribute('src', expect.stringContaining('avatar.jpg'))
    })

    it('displays initial letter when avatarUrl is not provided', () => {
      const mockUser = { name: 'Nguyễn Văn An' }

      render(
        <HomepageHeader
          unreadCount={0}
          user={mockUser}
          isAdmin={false}
        />
      )

      const accountButton = screen.getByRole('button', { name: /account menu/i })
      expect(accountButton).toHaveTextContent('N')
    })
  })

  describe('Navigation links', () => {
    it('renders About SAA 2025 as aria-current="page" (activeNav=about)', () => {
      render(
        <HomepageHeader
          unreadCount={0}
          user={null}
          isAdmin={false}
        />
      )

      const aboutLink = screen.getByRole('link', { name: /about saa 2025/i })
      expect(aboutLink).toHaveAttribute('aria-current', 'page')
      // Anchor navigates to /#about (works from any page)
      expect(aboutLink).toHaveAttribute('href', '/#about')
    })

    it('renders Award Information link to /awards without aria-current', () => {
      render(
        <HomepageHeader
          unreadCount={0}
          user={null}
          isAdmin={false}
        />
      )

      const awardsLink = screen.getByRole('link', { name: /award information/i })
      expect(awardsLink).toHaveAttribute('href', '/awards')
      expect(awardsLink).not.toHaveAttribute('aria-current')
    })

    it('renders Sun* Kudos link to /board (not /kudos)', () => {
      render(
        <HomepageHeader
          unreadCount={0}
          user={null}
          isAdmin={false}
        />
      )

      const kudosLink = screen.getByRole('link', { name: /sun\* kudos/i })
      expect(kudosLink).toHaveAttribute('href', '/board')
      expect(kudosLink).not.toHaveAttribute('aria-current')
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      const mockUser = { name: 'Test User' }

      render(
        <HomepageHeader
          unreadCount={3}
          user={mockUser}
          isAdmin={false}
        />
      )

      const nav = screen.getByRole('navigation')
      expect(nav).toBeInTheDocument()

      const accountButton = screen.getByRole('button', { name: /account menu/i })
      expect(accountButton).toHaveAttribute('aria-haspopup', 'true')

      // Bell should have aria-expanded and aria-haspopup="dialog"
      const bellButton = screen.getByRole('button', { name: /thông báo/i })
      expect(bellButton).toHaveAttribute('aria-haspopup', 'dialog')
    })
  })
})
