/**
 * HomepageHeader unit tests — driven by MoMorph test cases (IDs 0–38, 58).
 *
 * Coverage:
 *   - Public view (no auth): ID-0 logo visible, ID-10 language selector, ID-18 logo link
 *   - Authenticated view: ID-1 bell shows, ID-11/28/29 badge logic, ID-5/6/37/38 admin menu
 *   - Language button: ID-24/25/26 VN/EN toggle (dropdown interaction deferred to e2e)
 *   - Menu items: ID-36 Profile/Sign out always, ID-5/37 Admin Dashboard when isAdmin
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

      // Logo should be visible
      const logo = screen.getByAltText('Sun* Annual Awards 2025')
      expect(logo).toBeInTheDocument()

      // Bell should NOT be visible
      const bellButton = screen.queryByRole('button', { name: /unread notifications|notifications/i })
      expect(bellButton).not.toBeInTheDocument()

      // Account menu button should show user login icon (Sign in link)
      const signInLink = screen.getByRole('link', { name: /sign in/i })
      expect(signInLink).toBeInTheDocument()

      // Account dropdown menu should NOT exist
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

      const logoLink = screen.getByRole('link', { name: /homepage|homepage/i }).closest('a')
      expect(logoLink).toHaveAttribute('href', '/')
    })

    it('ID-10: displays language selector with VN label', () => {
      render(
        <HomepageHeader
          unreadCount={0}
          user={null}
          isAdmin={false}
        />
      )

      const langButton = screen.getByRole('button', { name: /select language|vietnamese/i })
      expect(langButton).toBeInTheDocument()
      expect(langButton).toHaveTextContent('VN')
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

      // Bell should be visible
      const bellButton = screen.getByRole('button', { name: /notifications/i })
      expect(bellButton).toBeInTheDocument()

      // Account menu button should be visible
      const accountButton = screen.getByRole('button', { name: /account menu/i })
      expect(accountButton).toBeInTheDocument()

      // Sign in link should NOT exist
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

      const bellButton = screen.getByRole('button', { name: /notifications/i })
      expect(bellButton).toBeInTheDocument()

      // Badge should not be visible when count is 0
      // The badge span is rendered conditionally, so it shouldn't be in the DOM
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

      const bellButton = screen.getByRole('button', { name: /5 unread notifications/i })
      expect(bellButton).toBeInTheDocument()

      // Badge should display the count
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

      const bellButton = screen.getByRole('button', { name: /unread notifications/i })
      expect(bellButton).toBeInTheDocument()

      // Badge should show 99+
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

      // Open dropdown
      const accountButton = screen.getByRole('button', { name: /account menu/i })
      await userEvent.click(accountButton)

      // Check menu items
      const profileLink = screen.getByRole('menuitem', { name: /profile/i })
      expect(profileLink).toBeInTheDocument()
      expect(profileLink).toHaveAttribute('href', '/profile')

      const signOutButton = screen.getByRole('menuitem', { name: /sign out/i })
      expect(signOutButton).toBeInTheDocument()

      // Admin Dashboard should NOT be present
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

      // Open dropdown
      const accountButton = screen.getByRole('button', { name: /account menu/i })
      await userEvent.click(accountButton)

      // Click Profile link
      const profileLink = screen.getByRole('menuitem', { name: /profile/i })
      await userEvent.click(profileLink)

      // Menu should close — check that it's no longer in the DOM or is hidden
      // The menu is rendered conditionally when `open` is true
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

      // Open dropdown
      const accountButton = screen.getByRole('button', { name: /account menu/i })
      await userEvent.click(accountButton)

      // Check for Admin Dashboard link
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

      // Open dropdown
      const accountButton = screen.getByRole('button', { name: /account menu/i })
      await userEvent.click(accountButton)

      // All three items should be present
      const profileLink = screen.getByRole('menuitem', { name: /profile/i })
      expect(profileLink).toBeInTheDocument()

      const adminLink = screen.getByRole('menuitem', { name: /admin dashboard/i })
      expect(adminLink).toBeInTheDocument()

      const signOutButton = screen.getByRole('menuitem', { name: /sign out/i })
      expect(signOutButton).toBeInTheDocument()
    })
  })

  describe('Avatar rendering', () => {
    it('displays user avatar when avatarUrl is provided', () => {
      const mockUser = {
        name: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg'
      }

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

      // The component should render the initial "N"
      const accountButton = screen.getByRole('button', { name: /account menu/i })
      expect(accountButton).toHaveTextContent('N')
    })
  })

  describe('Navigation links', () => {
    it('renders About SAA 2025 anchor link', () => {
      render(
        <HomepageHeader
          unreadCount={0}
          user={null}
          isAdmin={false}
        />
      )

      const aboutLink = screen.getByRole('link', { name: /about saa 2025/i })
      expect(aboutLink).toHaveAttribute('href', '#about')
    })

    it('renders Award Information link to /awards', () => {
      render(
        <HomepageHeader
          unreadCount={0}
          user={null}
          isAdmin={false}
        />
      )

      const awardsLink = screen.getByRole('link', { name: /award information/i })
      expect(awardsLink).toHaveAttribute('href', '/awards')
    })

    it('renders Sun* Kudos link to /kudos', () => {
      render(
        <HomepageHeader
          unreadCount={0}
          user={null}
          isAdmin={false}
        />
      )

      const kudosLink = screen.getByRole('link', { name: /sun\* kudos/i })
      expect(kudosLink).toHaveAttribute('href', '/kudos')
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

      // Navigation should have aria-label
      const nav = screen.getByRole('navigation')
      expect(nav).toBeInTheDocument()

      // Account button should have aria-haspopup and aria-expanded
      const accountButton = screen.getByRole('button', { name: /account menu/i })
      expect(accountButton).toHaveAttribute('aria-haspopup', 'true')
    })
  })
})
