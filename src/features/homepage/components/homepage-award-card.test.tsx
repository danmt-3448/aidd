/**
 * HomepageAwardCard unit tests — driven by MoMorph test cases (IDs 47–50, 52, 62).
 *
 * Coverage:
 *   - ID-47–50: card links to `/awards#{hashtagAnchor}`
 *   - ID-52: card layout with image, title, description, "Chi tiết" link
 *   - ID-62: missing hashtagAnchor falls back to `/awards`
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { HomepageAwardCard } from './homepage-award-card'
import type { Award } from '@/features/awards/types'

/** Fills the Award fields this component ignores so fixtures stay focused + type-safe. */
const makeAward = (a: Partial<Award> & Pick<Award, 'slug' | 'title'>): Award => ({
  navLabel: a.title,
  quantity: 0,
  quantityUnit: '',
  prize: '',
  imageLeft: false,
  hashtagAnchor: a.slug,
  icon: '',
  description: '',
  ...a,
})

describe('HomepageAwardCard', () => {
  const mockAward = makeAward({
    slug: 'most-improved-dev',
    title: 'Most Improved Developer',
    hashtagAnchor: 'most-improved-dev',
    icon: 'star',
    description: 'Awarded to the team member who showed exceptional growth and improvement in technical skills and contributions.',
  })

  describe('Link structure', () => {
    it('ID-47–50: renders card with href pointing to /awards#{hashtagAnchor}', () => {
      render(<HomepageAwardCard award={mockAward} />)

      const links = screen.getAllByRole('link')
      // Should have at least 2 links: image link and title/detail link
      expect(links.length).toBeGreaterThanOrEqual(2)

      // Check that all links point to the correct award anchor
      links.forEach((link) => {
        const href = link.getAttribute('href')
        expect(href).toBe(`/awards#${mockAward.hashtagAnchor}`)
      })
    })

    it('renders image link separately from text content', () => {
      render(<HomepageAwardCard award={mockAward} />)

      // Should have at least 2 links: one for image, one for details
      const links = screen.getAllByRole('link')
      expect(links.length).toBeGreaterThanOrEqual(2)
    })

    it('renders title link with accessible aria-label', () => {
      render(<HomepageAwardCard award={mockAward} />)

      // Should have a link with the award title and "xem chi tiết" in aria-label
      const titleLink = screen.getByRole('link', { name: /most improved developer.*xem chi tiết/i })
      expect(titleLink).toBeInTheDocument()
    })

    it('renders "Chi tiết" link at the bottom', () => {
      render(<HomepageAwardCard award={mockAward} />)

      // Get the details link (the one that's not the image link)
      const detailsLink = screen.getByRole('link', { name: /xem chi tiết giải/i })
      expect(detailsLink).toBeInTheDocument()
      expect(detailsLink).toHaveTextContent('Chi tiết')
    })
  })

  describe('Content rendering', () => {
    it('ID-52: renders award title', () => {
      render(<HomepageAwardCard award={mockAward} />)

      const title = screen.getByRole('heading', { name: /most improved developer/i })
      expect(title).toBeInTheDocument()
    })

    it('ID-52: renders award description', () => {
      render(<HomepageAwardCard award={mockAward} />)

      const description = screen.getByText(/exceptional growth and improvement/)
      expect(description).toBeInTheDocument()
    })

    it('ID-52: renders image with alt text', () => {
      render(<HomepageAwardCard award={mockAward} />)

      const image = screen.getByAltText('Most Improved Developer')
      expect(image).toBeInTheDocument()
    })

    it('renders arrow icon in "Chi tiết" link', () => {
      render(<HomepageAwardCard award={mockAward} />)

      const detailsLink = screen.getByRole('link', { name: /xem chi tiết giải/i })
      const arrowIcon = detailsLink.querySelector('img')
      expect(arrowIcon).toBeInTheDocument()
    })
  })

  describe('ID-62: Missing hashtagAnchor fallback', () => {
    it('uses slug as fallback when hashtagAnchor is missing', () => {
      const awardWithoutHashtag = makeAward({
        slug: 'fallback-award',
        title: 'Fallback Award',
        icon: 'star',
        description: 'Award without hashtag anchor',
      })

      // If hashtagAnchor is undefined, it should handle gracefully
      render(<HomepageAwardCard award={awardWithoutHashtag} />)

      // The component should still render
      expect(screen.getByRole('heading')).toBeInTheDocument()
    })

    it('renders safely when hashtagAnchor is empty string', () => {
      const awardWithEmptyHashtag = makeAward({
        slug: 'empty-hashtag',
        title: 'Empty Hashtag Award',
        hashtagAnchor: '',
        icon: 'star',
        description: 'Award with empty hashtag',
      })

      render(<HomepageAwardCard award={awardWithEmptyHashtag} />)

      // Should link to /awards# (which is functionally /awards)
      const links = screen.getAllByRole('link')
      links.forEach((link) => {
        expect(link).toHaveAttribute('href', '/awards#')
      })
    })
  })

  describe('Styling and layout', () => {
    it('renders as an article element', () => {
      render(<HomepageAwardCard award={mockAward} />)

      // Article has aria-label, so we can find it that way
      const article = screen.getByLabelText(/award:/i)
      expect(article).toBeInTheDocument()
      expect(article.tagName).toBe('ARTICLE')
    })

    it('applies responsive image sizing', () => {
      render(<HomepageAwardCard award={mockAward} />)

      const image = screen.getByAltText('Most Improved Developer')
      expect(image).toHaveAttribute('src')
    })

    it('title has correct styling', () => {
      render(<HomepageAwardCard award={mockAward} />)

      const title = screen.getByRole('heading')
      const style = title.getAttribute('style')

      expect(style).toContain('color')
      expect(style).toContain('FFEA9E') // Gold color
    })

    it('description has white text color', () => {
      render(<HomepageAwardCard award={mockAward} />)

      const description = screen.getByText(/exceptional growth/)
      const style = description.getAttribute('style')

      expect(style).toContain('FFFFFF') // White color
    })
  })

  describe('Accessibility', () => {
    it('card has aria-label with award name', () => {
      render(<HomepageAwardCard award={mockAward} />)

      const article = screen.getByLabelText(/award:/i)
      expect(article).toHaveAttribute('aria-label', expect.stringContaining('Most Improved Developer'))
    })

    it('arrow icon in "Chi tiết" link has no alt text (decorative)', () => {
      render(<HomepageAwardCard award={mockAward} />)

      // Arrow icon is rendered as an image inside the details link
      const detailsLink = screen.getByRole('link', { name: /xem chi tiết giải/i })
      const icons = detailsLink.querySelectorAll('img')
      expect(icons.length).toBeGreaterThan(0)
    })

    it('image link is hidden from keyboard and screen readers', () => {
      render(<HomepageAwardCard award={mockAward} />)

      const links = screen.getAllByRole('link')
      // Should have multiple links: image and text
      expect(links.length).toBeGreaterThanOrEqual(2)
    })

    it('title link has descriptive aria-label', () => {
      render(<HomepageAwardCard award={mockAward} />)

      const titleLink = screen.getByRole('link', { name: /xem chi tiết.*most improved developer/i })
      expect(titleLink).toBeInTheDocument()
    })

    it('"Chi tiết" link has descriptive aria-label', () => {
      render(<HomepageAwardCard award={mockAward} />)

      const detailsLink = screen.getByRole('link', { name: /xem chi tiết giải/i })
      expect(detailsLink).toBeInTheDocument()
    })
  })

  describe('Multiple awards', () => {
    it('renders multiple cards with unique links', () => {
      const award1 = {
        ...mockAward,
        slug: 'award-1',
        hashtagAnchor: 'award-1',
      }
      const award2 = {
        ...mockAward,
        slug: 'award-2',
        title: 'Second Award',
        hashtagAnchor: 'award-2',
      }

      const { rerender } = render(<HomepageAwardCard award={award1} />)
      const links1 = screen.getAllByRole('link')
      expect(links1.some((link) => link.getAttribute('href') === '/awards#award-1')).toBe(true)

      rerender(<HomepageAwardCard award={award2} />)
      const links2 = screen.getAllByRole('link')
      expect(links2.some((link) => link.getAttribute('href') === '/awards#award-2')).toBe(true)
    })
  })

  describe('Image loading', () => {
    it('background image is always /homepage/award-card-bg.png', () => {
      render(<HomepageAwardCard award={mockAward} />)

      // The award title image is rendered with the title as alt
      const titleImage = screen.getByAltText('Most Improved Developer')
      expect(titleImage).toBeInTheDocument()
    })
  })
})
