/**
 * AwardsShowcase component unit tests.
 *
 * Coverage:
 *  - Responsive padding: no hardcoded inline padding style on the content wrapper
 *  - Hero artwork: rendered with accessible alt text
 *  - Max-width container: the 1440px cap is applied
 *  - Further logo: rendered
 *  - Award cards: rendered for each award passed
 *  - Sidebar nav: rendered
 */
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { AwardsShowcase } from './awards-showcase'
import type { Award } from '../types'

const mockAward = (slug: string): Award => ({
  slug,
  title: `Award ${slug}`,
  navLabel: slug,
  icon: '/awards/icon-target.svg',
  image: `/awards/${slug}.png`,
  quantity: 1,
  quantityUnit: 'Cá nhân',
  prize: '10.000.000 VNĐ',
  description: 'Test description',
  hashtagAnchor: slug,
  imageLeft: true,
})

const MOCK_AWARDS: Award[] = [
  mockAward('top-talent'),
  mockAward('top-project'),
]

describe('AwardsShowcase', () => {
  describe('Hero artwork', () => {
    it('renders hero artwork image', () => {
      render(<AwardsShowcase awards={MOCK_AWARDS} />)
      // Hero artwork should have a descriptive alt text
      const heroImg = screen.getByAltText(/awards.*artwork|artwork.*awards|hero|saa 2025/i)
      expect(heroImg).toBeInTheDocument()
    })
  })

  describe('Responsive layout', () => {
    it('content wrapper does not have hardcoded 144px inline padding', () => {
      const { container } = render(<AwardsShowcase awards={MOCK_AWARDS} />)
      // Find the main content container
      const allDivs = container.querySelectorAll('div')
      for (const div of allDivs) {
        const style = div.getAttribute('style') ?? ''
        // The old bug: padding: '96px 144px' as inline style — must not be present
        expect(style).not.toMatch(/padding:\s*['"]?96px 144px/i)
      }
    })

    it('content wrapper has max-width cap for 1440px centering', () => {
      const { container } = render(<AwardsShowcase awards={MOCK_AWARDS} />)
      // Check that at least one element's style references the 1440px cap
      const allDivs = Array.from(container.querySelectorAll('div'))
      const hasCap = allDivs.some((div) => {
        const style = div.getAttribute('style') ?? ''
        return style.includes('1440px')
      })
      expect(hasCap, 'expected a 1440px max-width container').toBe(true)
    })
  })

  describe('Content rendering', () => {
    it('renders the "Further" logo image', () => {
      render(<AwardsShowcase awards={MOCK_AWARDS} />)
      const logo = screen.getByAltText(/further|sun\* annual awards/i)
      expect(logo).toBeInTheDocument()
    })

    it('renders a card for each award', () => {
      render(<AwardsShowcase awards={MOCK_AWARDS} />)
      for (const award of MOCK_AWARDS) {
        expect(screen.getByRole('heading', { name: award.title })).toBeInTheDocument()
      }
    })

    it('renders the page heading', () => {
      render(<AwardsShowcase awards={MOCK_AWARDS} />)
      expect(
        screen.getByRole('heading', { name: /hệ thống giải thưởng/i }),
      ).toBeInTheDocument()
    })

    it('renders the sidebar nav', () => {
      render(<AwardsShowcase awards={MOCK_AWARDS} />)
      expect(screen.getByRole('navigation', { name: /danh mục giải thưởng/i })).toBeInTheDocument()
    })

    it('renders the footer with copyright text', () => {
      render(<AwardsShowcase awards={MOCK_AWARDS} />)
      expect(screen.getByText(/bản quyền thuộc về sun\*/i)).toBeInTheDocument()
    })
  })
})
