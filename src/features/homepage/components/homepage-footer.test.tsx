/**
 * HomepageFooter unit tests — driven by MoMorph test case ID-17.
 *
 * Coverage:
 *   - ID-17: renders footer with copyright text "Bản quyền thuộc về Sun* © 2025"
 *   - Footer nav links: About SAA 2025 (#about), Award Information (/awards),
 *     Sun* Kudos (/kudos), Rules (/rules)
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { HomepageFooter } from './homepage-footer'

describe('HomepageFooter', () => {
  describe('Copyright text', () => {
    it('ID-17: renders copyright text "Bản quyền thuộc về Sun* © 2025"', () => {
      render(<HomepageFooter />)

      const copyright = screen.getByText('Bản quyền thuộc về Sun* © 2025')
      expect(copyright).toBeInTheDocument()
    })

    it('copyright text has proper styling', () => {
      render(<HomepageFooter />)

      const copyright = screen.getByText('Bản quyền thuộc về Sun* © 2025')
      expect(copyright).toHaveClass('text-center', 'text-base', 'font-bold')
    })
  })

  describe('Navigation links', () => {
    it('renders "About SAA 2025" anchor link', () => {
      render(<HomepageFooter />)

      const aboutLink = screen.getByRole('link', { name: /about saa 2025/i })
      expect(aboutLink).toHaveAttribute('href', '#about')
    })

    it('renders "Award Information" link to /awards', () => {
      render(<HomepageFooter />)

      const awardsLink = screen.getByRole('link', { name: /award information/i })
      expect(awardsLink).toHaveAttribute('href', '/awards')
    })

    it('renders "Sun* Kudos" link to /kudos', () => {
      render(<HomepageFooter />)

      const kudosLink = screen.getByRole('link', { name: /sun\* kudos/i })
      expect(kudosLink).toHaveAttribute('href', '/kudos')
    })

    it('renders "Rules" link to /rules', () => {
      render(<HomepageFooter />)

      const rulesLink = screen.getByRole('link', { name: /rules/i })
      expect(rulesLink).toHaveAttribute('href', '/rules')
    })

    it('renders exactly 4 nav links', () => {
      render(<HomepageFooter />)

      // Get navigation element
      const nav = screen.getByRole('navigation', { name: /footer navigation/i })
      const links = nav.querySelectorAll('a')

      expect(links).toHaveLength(4)
    })
  })

  describe('Logo', () => {
    it('renders Sun* logo linked to home', () => {
      render(<HomepageFooter />)

      const logoLinks = screen.getAllByRole('link', { name: /sun\* homepage/i })
      expect(logoLinks.length).toBeGreaterThan(0)

      const homeLink = logoLinks.find((link) => {
        const img = link.querySelector('img')
        return img && img.getAttribute('alt')?.includes('Annual Awards')
      })

      expect(homeLink).toHaveAttribute('href', '/')
    })

    it('logo image has alt text', () => {
      render(<HomepageFooter />)

      const logoImage = screen.getByAltText('Sun* Annual Awards 2025')
      expect(logoImage).toBeInTheDocument()
    })
  })

  describe('Layout structure', () => {
    it('renders as footer element', () => {
      render(<HomepageFooter />)

      const footer = screen.getByRole('contentinfo')
      expect(footer).toBeInTheDocument()
    })

    it('footer has border-top styling', () => {
      render(<HomepageFooter />)

      const footer = screen.getByRole('contentinfo')
      const style = footer.getAttribute('style')

      expect(style).toContain('border')
    })

    it('footer has dark background color', () => {
      render(<HomepageFooter />)

      const footer = screen.getByRole('contentinfo')
      const style = footer.getAttribute('style')

      // Check for any color definition (RGB or RGBA)
      expect(style).toMatch(/color|background|rgba|rgb/)
    })
  })

  describe('Responsive layout', () => {
    it('applies responsive flex classes', () => {
      render(<HomepageFooter />)

      const footer = screen.getByRole('contentinfo')
      const classes = footer.getAttribute('class')

      expect(classes).toContain('flex-col')
      expect(classes).toContain('md:flex-row')
    })
  })

  describe('Accessibility', () => {
    it('footer has proper aria-label', () => {
      render(<HomepageFooter />)

      const footer = screen.getByRole('contentinfo')
      expect(footer).toHaveAttribute('aria-label', 'Site footer')
    })

    it('navigation has proper aria-label', () => {
      render(<HomepageFooter />)

      const nav = screen.getByRole('navigation', { name: /footer navigation/i })
      expect(nav).toBeInTheDocument()
    })

    it('all nav links have proper text content', () => {
      render(<HomepageFooter />)

      const expectedLinks = [
        /about saa 2025/i,
        /award information/i,
        /sun\* kudos/i,
        /rules/i,
      ]

      expectedLinks.forEach((label) => {
        const link = screen.getByRole('link', { name: label })
        expect(link).toBeInTheDocument()
      })
    })
  })

  describe('Styling consistency', () => {
    it('all nav links have consistent styling classes', () => {
      render(<HomepageFooter />)

      const nav = screen.getByRole('navigation', { name: /footer navigation/i })
      const links = nav.querySelectorAll('a')

      links.forEach((link) => {
        expect(link).toHaveClass('font-bold', 'text-white')
      })
    })
  })
})
