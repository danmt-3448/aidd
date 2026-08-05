/**
 * feed-card-tier-badge.test.tsx
 *
 * Rework pass 2 (D2): badge is now a colored text pill, NOT stars.
 * Tests verify label text, pill text, and Tier 4 (Super Hero) from Figma.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FeedCardTierBadge } from './feed-card-tier-badge'

describe('FeedCardTierBadge', () => {
  it('tier 1 renders pill text "New Hero"', () => {
    render(<FeedCardTierBadge tier={1} />)
    expect(screen.getByText('New Hero')).toBeInTheDocument()
  })

  it('tier 2 renders pill text "Rising Hero"', () => {
    render(<FeedCardTierBadge tier={2} />)
    expect(screen.getByText('Rising Hero')).toBeInTheDocument()
  })

  it('tier 3 renders pill text "Legend Hero"', () => {
    render(<FeedCardTierBadge tier={3} />)
    expect(screen.getByText('Legend Hero')).toBeInTheDocument()
  })

  it('tier 4 renders pill text "Super Hero"', () => {
    render(<FeedCardTierBadge tier={4} />)
    expect(screen.getByText('Super Hero')).toBeInTheDocument()
  })

  it('tier 1 has accessible aria-label containing tier name', () => {
    render(<FeedCardTierBadge tier={1} />)
    expect(screen.getByLabelText(/Tier: New Hero/i)).toBeInTheDocument()
  })

  it('tier 3 has accessible aria-label containing tier name', () => {
    render(<FeedCardTierBadge tier={3} />)
    expect(screen.getByLabelText(/Tier: Legend Hero/i)).toBeInTheDocument()
  })

  it('renders no SVG stars — pill is text only', () => {
    const { container } = render(<FeedCardTierBadge tier={2} />)
    expect(container.querySelectorAll('svg')).toHaveLength(0)
  })
})
