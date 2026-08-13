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
 *
 * AwardsShowcase, AwardCard, and KudosPromo are async server components. React DOM
 * (client renderer used in jsdom tests) cannot render async function components at
 * all — even when awaited externally. Strategy: await each async component at call
 * site to resolve its JSX, then render the resolved JSX. Inner async components
 * (AwardCard, KudosPromo) are mocked to synchronous stubs so they don't recurse.
 *
 * next-intl/server is mocked globally in vitest.setup.ts.
 */
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

// Stub inner async server components before importing AwardsShowcase
vi.mock('./award-card', () => ({
  AwardCard: ({ award }: { award: { title: string } }) => (
    <div data-testid="award-card">
      <h2>{award.title}</h2>
    </div>
  ),
}))

vi.mock('./kudos-promo', () => ({
  KudosPromo: () => <div data-testid="kudos-promo" />,
}))

import { AwardsShowcase } from './awards-showcase'
import type { Award } from '../types'

const mockAward = (slug: string, i18nKey: string): Award => ({
  slug,
  i18nKey,
  title: `Award ${slug}`,
  icon: '/awards/icon-target.svg',
  image: `/awards/${slug}.png`,
  quantity: 1,
  prize: '10.000.000 VNĐ',
  hashtagAnchor: slug,
  imageLeft: true,
})

const MOCK_AWARDS: Award[] = [
  mockAward('top-talent', 'topTalent'),
  mockAward('top-project', 'topProject'),
]

/**
 * Render an async server component in jsdom by awaiting it to its resolved JSX
 * before handing it to React DOM's synchronous renderer.
 */
async function renderServerComponent(
  Component: (props: { awards: Award[] }) => Promise<React.ReactNode>,
  props: { awards: Award[] },
) {
  const jsx = await Component(props)
  return render(jsx as React.ReactElement)
}

describe('AwardsShowcase', () => {
  describe('Hero artwork', () => {
    it('renders hero artwork image', async () => {
      await renderServerComponent(AwardsShowcase, { awards: MOCK_AWARDS })
      const heroImg = screen.getByAltText(/awards.*artwork|artwork.*awards|hero|saa 2025/i)
      expect(heroImg).toBeInTheDocument()
    })
  })

  describe('Responsive layout', () => {
    it('content wrapper does not have hardcoded 144px inline padding', async () => {
      const { container } = await renderServerComponent(AwardsShowcase, { awards: MOCK_AWARDS })
      const allDivs = container.querySelectorAll('div')
      for (const div of allDivs) {
        const style = div.getAttribute('style') ?? ''
        expect(style).not.toMatch(/padding:\s*['"]?96px 144px/i)
      }
    })

    it('content wrapper has max-width cap for 1440px centering', async () => {
      const { container } = await renderServerComponent(AwardsShowcase, { awards: MOCK_AWARDS })
      const allDivs = Array.from(container.querySelectorAll('div'))
      const hasCap = allDivs.some((div) => {
        const style = div.getAttribute('style') ?? ''
        return style.includes('1440px')
      })
      expect(hasCap, 'expected a 1440px max-width container').toBe(true)
    })
  })

  describe('Content rendering', () => {
    it('renders the "Further" logo image', async () => {
      await renderServerComponent(AwardsShowcase, { awards: MOCK_AWARDS })
      // Target the Further logo specifically — the shared HomepageFooter also
      // renders a "Sun* Annual Awards 2025" logo, so match on "Further" only.
      const logo = screen.getByAltText(/further/i)
      expect(logo).toBeInTheDocument()
    })

    it('renders a card for each award', async () => {
      await renderServerComponent(AwardsShowcase, { awards: MOCK_AWARDS })
      for (const award of MOCK_AWARDS) {
        expect(screen.getByRole('heading', { name: award.title })).toBeInTheDocument()
      }
    })

    it('renders the page heading', async () => {
      await renderServerComponent(AwardsShowcase, { awards: MOCK_AWARDS })
      expect(
        screen.getByRole('heading', { name: /hệ thống giải thưởng/i }),
      ).toBeInTheDocument()
    })

    it('renders the sidebar nav', async () => {
      await renderServerComponent(AwardsShowcase, { awards: MOCK_AWARDS })
      expect(screen.getByRole('navigation', { name: /danh mục giải thưởng/i })).toBeInTheDocument()
    })

    it('renders the footer with copyright text', async () => {
      await renderServerComponent(AwardsShowcase, { awards: MOCK_AWARDS })
      expect(screen.getByText(/bản quyền thuộc về sun\*/i)).toBeInTheDocument()
    })
  })
})
