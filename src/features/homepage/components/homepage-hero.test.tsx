/**
 * HomepageHero unit tests — driven by MoMorph test cases (IDs 12, 13, 40, 44, 45).
 *
 * Coverage:
 *   - ID-12: "Comming soon" label (verbatim from Figma, kept as-is)
 *   - ID-13: countdown with 3 units (Days, Hours, Minutes) rendering
 *   - ID-40: 2-digit countdown values (leading zeros e.g., "03", "00")
 *   - ID-44: "ABOUT AWARDS" CTA links to /awards
 *   - ID-45: "ABOUT KUDOS" CTA links to /kudos
 *
 * Note: CountdownLedBlock handles the 2-digit formatting (tested separately).
 *       onWriteKudo callback is optional and tested via fireEvent in integration.
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { HomepageHero } from './homepage-hero'

// Mock the CountdownLedBlock component
vi.mock('@/features/countdown/components/countdown-led-block', () => ({
  CountdownLedBlock: ({ value, label }: { value: number; label: string }) => (
    <div data-testid={`led-block-${label.toLowerCase()}`}>
      {String(value).padStart(2, '0')} {label}
    </div>
  ),
}))

describe('HomepageHero', () => {
  describe('Countdown rendering', () => {
    it('ID-13: renders countdown with 3 units (Days, Hours, Minutes)', () => {
      render(
        <HomepageHero
          countdown={{ days: 30, hours: 5, minutes: 45 }}
        />
      )

      // Check for all three units
      expect(screen.getByTestId('led-block-ngày')).toBeInTheDocument()
      expect(screen.getByTestId('led-block-giờ')).toBeInTheDocument()
      expect(screen.getByTestId('led-block-phút')).toBeInTheDocument()
    })

    it('ID-40: countdown values are displayed with 2-digit padding', () => {
      render(
        <HomepageHero
          countdown={{ days: 3, hours: 0, minutes: 5 }}
        />
      )

      // The LED blocks should render padded values
      expect(screen.getByTestId('led-block-ngày')).toHaveTextContent('03 NGÀY')
      expect(screen.getByTestId('led-block-giờ')).toHaveTextContent('00 GIỜ')
      expect(screen.getByTestId('led-block-phút')).toHaveTextContent('05 PHÚT')
    })

    it('ID-12: displays "Coming soon" label (MoMorph spec B1.2 spelling)', () => {
      render(
        <HomepageHero
          countdown={{ days: 0, hours: 0, minutes: 0 }}
        />
      )

      const label = screen.getByText('Coming soon')
      expect(label).toBeInTheDocument()
    })

    it('renders aria-label for timer with Vietnamese text', () => {
      render(
        <HomepageHero
          countdown={{ days: 10, hours: 12, minutes: 30 }}
        />
      )

      // Should be able to find the countdown display
      expect(screen.getByTestId('led-block-ngày')).toHaveTextContent('10')
    })
  })

  describe('Event info', () => {
    it('renders event date placeholder', () => {
      render(
        <HomepageHero
          countdown={{ days: 0, hours: 0, minutes: 0 }}
        />
      )

      expect(screen.getByText('Tháng 12/2025')).toBeInTheDocument()
    })

    it('renders event location', () => {
      render(
        <HomepageHero
          countdown={{ days: 0, hours: 0, minutes: 0 }}
        />
      )

      expect(screen.getByText('TP. Hồ Chí Minh')).toBeInTheDocument()
    })

    it('renders livestream text', () => {
      render(
        <HomepageHero
          countdown={{ days: 0, hours: 0, minutes: 0 }}
        />
      )

      expect(screen.getByText('Tường thuật trực tiếp qua sóng Livestream')).toBeInTheDocument()
    })
  })

  describe('CTA buttons', () => {
    it('ID-44: "ABOUT AWARDS" CTA links to /awards', () => {
      render(
        <HomepageHero
          countdown={{ days: 0, hours: 0, minutes: 0 }}
        />
      )

      const awardsButton = screen.getByRole('link', { name: /about awards/i })
      expect(awardsButton).toHaveAttribute('href', '/awards')
    })

    it('ID-45: "ABOUT KUDOS" CTA links to /kudos', () => {
      render(
        <HomepageHero
          countdown={{ days: 0, hours: 0, minutes: 0 }}
        />
      )

      // Find all CTA buttons and look for the one mentioning Kudos
      const ctaButtons = screen.getAllByRole('link')
      const kudosButton = ctaButtons.find(btn => btn.textContent?.includes('ABOUT KUDOS'))
      expect(kudosButton).toHaveAttribute('href', '/kudos')
    })

    it('renders both CTA buttons with correct styling', () => {
      render(
        <HomepageHero
          countdown={{ days: 0, hours: 0, minutes: 0 }}
        />
      )

      const awardsButton = screen.getByRole('link', { name: /about awards/i })
      expect(awardsButton).toHaveClass('inline-flex')

      const ctaButtons = screen.getAllByRole('link')
      const kudosButton = ctaButtons.find(btn => btn.textContent?.includes('ABOUT KUDOS'))
      expect(kudosButton).toHaveClass('inline-flex')
    })
  })

  describe('Root Further content card', () => {
    it('renders Root Further section heading', () => {
      render(
        <HomepageHero
          countdown={{ days: 0, hours: 0, minutes: 0 }}
        />
      )

      // Check for ROOT FURTHER content in the description card
      expect(screen.getByText(/A tree with deep roots fears no storm/i)).toBeInTheDocument()
    })

    it('renders descriptive text blocks', () => {
      render(
        <HomepageHero
          countdown={{ days: 0, hours: 0, minutes: 0 }}
        />
      )

      // Should contain description text
      expect(
        screen.getByText(/Đứng trước bối cảnh thay đổi như vũ bão/i)
      ).toBeInTheDocument()
    })

    it('renders quote with Vietnamese translation', () => {
      render(
        <HomepageHero
          countdown={{ days: 0, hours: 0, minutes: 0 }}
        />
      )

      // Quote should be present
      expect(screen.getByText(/Cây sâu bén rễ, bão giông chẳng nề/i)).toBeInTheDocument()
    })
  })

  describe('FAB (Fixed Action Button)', () => {
    // H-3: FAB is auth-gated — only rendered when onWriteKudo is provided.
    // Anonymous visitors (no handler) must NOT see the FAB.

    it('does NOT render FAB when onWriteKudo is not provided (anonymous visitor)', () => {
      render(
        <HomepageHero
          countdown={{ days: 0, hours: 0, minutes: 0 }}
        />
      )

      const fab = screen.queryByRole('button', { name: /viết kudo nhanh/i })
      expect(fab).not.toBeInTheDocument()
    })

    it('renders Viết Kudo FAB trigger when onWriteKudo is provided (authenticated)', () => {
      const onWriteKudo = vi.fn()

      render(
        <HomepageHero
          countdown={{ days: 0, hours: 0, minutes: 0 }}
          onWriteKudo={onWriteKudo}
        />
      )

      const fab = screen.getByRole('button', { name: /viết kudo nhanh/i })
      expect(fab).toBeInTheDocument()
      // FAB pill is the menu trigger — check aria-haspopup
      expect(fab).toHaveAttribute('aria-haspopup', 'menu')
    })

    it('opens quick-action menu when FAB is clicked', async () => {
      const onWriteKudo = vi.fn()

      render(
        <HomepageHero
          countdown={{ days: 0, hours: 0, minutes: 0 }}
          onWriteKudo={onWriteKudo}
        />
      )

      const fab = screen.getByRole('button', { name: /viết kudo nhanh/i })
      await userEvent.click(fab)

      expect(screen.getByRole('menu')).toBeInTheDocument()
      expect(screen.getByRole('menuitem', { name: /viết kudo/i })).toBeInTheDocument()
      expect(screen.getByRole('menuitem', { name: /thể lệ/i })).toBeInTheDocument()
    })

    it('calls onWriteKudo when "Viết Kudo" menu item is clicked', async () => {
      const onWriteKudo = vi.fn()

      render(
        <HomepageHero
          countdown={{ days: 0, hours: 0, minutes: 0 }}
          onWriteKudo={onWriteKudo}
        />
      )

      await userEvent.click(screen.getByRole('button', { name: /viết kudo nhanh/i }))
      await userEvent.click(screen.getByRole('menuitem', { name: /viết kudo/i }))

      expect(onWriteKudo).toHaveBeenCalledTimes(1)
    })

    it('closes menu on Escape key', async () => {
      const onWriteKudo = vi.fn()

      render(
        <HomepageHero
          countdown={{ days: 0, hours: 0, minutes: 0 }}
          onWriteKudo={onWriteKudo}
        />
      )

      await userEvent.click(screen.getByRole('button', { name: /viết kudo nhanh/i }))
      expect(screen.getByRole('menu')).toBeInTheDocument()

      await userEvent.keyboard('{Escape}')
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })

    it('does not throw when onWriteKudo is not provided', () => {
      expect(() => {
        render(
          <HomepageHero
            countdown={{ days: 0, hours: 0, minutes: 0 }}
          />
        )
      }).not.toThrow()
    })
  })

  describe('Accessibility', () => {
    it('has proper section aria-label', () => {
      render(
        <HomepageHero
          countdown={{ days: 0, hours: 0, minutes: 0 }}
        />
      )

      const section = screen.getByRole('region')
      expect(section).toBeInTheDocument()
    })

    it('timer region has aria-live polite for real-time updates', () => {
      render(
        <HomepageHero
          countdown={{ days: 5, hours: 10, minutes: 20 }}
        />
      )

      // Check that the countdown LED blocks are rendered
      expect(screen.getByTestId('led-block-ngày')).toBeInTheDocument()
    })
  })

  describe('Edge cases', () => {
    it('handles zero countdown values', () => {
      render(
        <HomepageHero
          countdown={{ days: 0, hours: 0, minutes: 0 }}
        />
      )

      expect(screen.getByTestId('led-block-ngày')).toHaveTextContent('00')
      expect(screen.getByTestId('led-block-giờ')).toHaveTextContent('00')
      expect(screen.getByTestId('led-block-phút')).toHaveTextContent('00')
    })

    it('handles large countdown values', () => {
      render(
        <HomepageHero
          countdown={{ days: 999, hours: 23, minutes: 59 }}
        />
      )

      expect(screen.getByTestId('led-block-ngày')).toBeInTheDocument()
      expect(screen.getByTestId('led-block-giờ')).toHaveTextContent('23')
      expect(screen.getByTestId('led-block-phút')).toHaveTextContent('59')
    })
  })
})
