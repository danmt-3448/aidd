import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ActivityLog } from './board-spotlight-activity'
import type { SpotlightActivityEntry } from './board-types'

// entries arrive newest-first from the hook (order by created_at desc).
const NEWEST_FIRST: SpotlightActivityEntry[] = [
  { receiverId: 'r1', name: 'Newest Person', time: '01:44PM' },
  { receiverId: 'r2', name: 'Middle Person', time: '10:00AM' },
  { receiverId: 'r3', name: 'Oldest Person', time: '07:31AM' },
]

describe('ActivityLog ordering', () => {
  it('renders newest at the BOTTOM (last row), oldest at the top', () => {
    const { container } = render(<ActivityLog entries={NEWEST_FIRST} />)
    const rows = Array.from(container.querySelectorAll('p'))
    const texts = rows.map((p) => p.textContent ?? '')
    expect(texts[0]).toContain('Oldest Person')
    expect(texts[texts.length - 1]).toContain('Newest Person')
  })

  it('gives the newest (bottom) row the prepend animation class', () => {
    const { container } = render(<ActivityLog entries={NEWEST_FIRST} />)
    const rows = Array.from(container.querySelectorAll('p'))
    const bottom = rows[rows.length - 1]
    expect(bottom.className).toContain('spotlight-activity-prepend')
    expect(bottom.textContent).toContain('Newest Person')
  })

  it('renders nothing when there are no entries', () => {
    const { container } = render(<ActivityLog entries={[]} />)
    expect(container.querySelectorAll('p')).toHaveLength(0)
  })
})
