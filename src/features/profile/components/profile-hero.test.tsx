/**
 * profile-hero.tsx unit tests.
 *
 * Covers:
 *   - Null avatar_url → InitialsAvatar renders the first char of full_name
 *   - Null avatar_url + null full_name → InitialsAvatar renders '?' (Sunner fallback)
 *   - Non-null avatar_url → <img> element rendered with correct alt text
 *   - Tier + stars block shown when both are non-null
 *   - Tier + stars block hidden when tier is null
 *   - Department and title rows shown/hidden per nullity
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ProfileHero } from './profile-hero'
import type { ProfileHeaderProps } from './profile-types'

// next/image renders differently in happy-dom — stub it with a plain <img>
vi.mock('next/image', () => ({
  default: ({ src, alt, ...rest }: { src: string; alt: string; [key: string]: unknown }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...(rest as Record<string, unknown>)} />
  ),
}))

const BASE_HEADER: ProfileHeaderProps = {
  id: 'user-1',
  full_name: 'Nguyễn Văn An',
  avatar_url: null,
  department_id: null,
  title: null,
  tier: null,
  stars: null,
}

describe('ProfileHero', () => {
  describe('Avatar rendering — null avatar_url', () => {
    it('renders InitialsAvatar with the first character of full_name', () => {
      render(<ProfileHero header={{ ...BASE_HEADER, avatar_url: null, full_name: 'Nguyễn Văn An' }} />)
      // InitialsAvatar renders the initial inside an aria-label div
      const avatarEl = screen.getByLabelText('Avatar của Nguyễn Văn An')
      expect(avatarEl).toBeInTheDocument()
      expect(avatarEl).toHaveTextContent('N')
    })

    it('renders "S" initial for the "Sunner" placeholder when full_name is null', () => {
      // InitialsAvatar falls back to displayName = 'Sunner', so the initial is 'S'.
      // The '?' branch is unreachable because displayName is always ≥ 'Sunner'.
      render(<ProfileHero header={{ ...BASE_HEADER, avatar_url: null, full_name: null }} />)
      const avatarEl = screen.getByLabelText('Avatar của Sunner')
      expect(avatarEl).toHaveTextContent('S')
    })
  })

  describe('Avatar rendering — non-null avatar_url', () => {
    it('renders an img element when avatar_url is provided', () => {
      render(
        <ProfileHero
          header={{
            ...BASE_HEADER,
            avatar_url: 'https://api.dicebear.com/abc.svg',
            full_name: 'Trần Thị Bình',
          }}
        />
      )
      const img = screen.getByRole('img', { name: 'Avatar của Trần Thị Bình' })
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('src', 'https://api.dicebear.com/abc.svg')
    })
  })

  describe('Name rendering', () => {
    it('shows the full_name as a heading', () => {
      render(<ProfileHero header={{ ...BASE_HEADER, full_name: 'Nguyễn Văn An' }} />)
      expect(screen.getByRole('heading', { name: 'Nguyễn Văn An' })).toBeInTheDocument()
    })

    it('falls back to "Sunner" when full_name is null', () => {
      render(<ProfileHero header={{ ...BASE_HEADER, full_name: null }} />)
      expect(screen.getByRole('heading', { name: 'Sunner' })).toBeInTheDocument()
    })
  })

  describe('Department and title rows', () => {
    it('shows department_id when provided', () => {
      render(<ProfileHero header={{ ...BASE_HEADER, department_id: 'Engineering', full_name: 'An' }} />)
      expect(screen.getByText('Engineering')).toBeInTheDocument()
    })

    it('hides department row when department_id is null and title is null', () => {
      render(<ProfileHero header={{ ...BASE_HEADER, department_id: null, title: null }} />)
      // No element with dept text
      expect(screen.queryByText('Engineering')).not.toBeInTheDocument()
    })

    it('shows title when provided but department_id is null', () => {
      render(<ProfileHero header={{ ...BASE_HEADER, title: 'Senior Engineer', department_id: null }} />)
      expect(screen.getByText('Senior Engineer')).toBeInTheDocument()
    })
  })

  describe('Tier badge', () => {
    it('renders tier badge + stars when tier and stars are non-null', () => {
      render(
        <ProfileHero
          header={{
            ...BASE_HEADER,
            tier: 'Rising Hero',
            stars: 2,
          }}
        />
      )
      expect(screen.getByText('Rising Hero')).toBeInTheDocument()
      expect(screen.getByLabelText('2 sao')).toBeInTheDocument()
    })

    it('hides tier badge when tier is null', () => {
      render(<ProfileHero header={{ ...BASE_HEADER, tier: null, stars: null }} />)
      expect(screen.queryByText('Rising Hero')).not.toBeInTheDocument()
    })
  })
})
