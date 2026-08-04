/**
 * Unit tests for SecretBoxModal — TDD Red phase (written before implementation).
 *
 * Happy paths:
 *  - renders Figma title text
 *  - conditional guidance text visible only when unopened > 0
 *  - counter displays zero-padded number
 *  - counter label text
 *  - box image rendered
 *
 * Failure/edge paths:
 *  - box button disabled when unopened === 0, onOpen not called
 *  - box button disabled while isOpening, spinner shown
 *  - close button rendered/fired when onClose provided
 *  - close button absent when onClose omitted
 */
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SecretBoxModal } from './secret-box-modal'

const mockBadge = {
  key: 'badge-star',
  imageSrc: '/secret-box/box-qua-chua-mo.svg',
}

describe('SecretBoxModal', () => {
  // ── Happy path ────────────────────────────────────────────────────────────

  it('renders the Vietnamese title text from Figma', () => {
    render(
      <SecretBoxModal
        unopened={3}
        currentBadge={mockBadge}
        isOpening={false}
        onOpen={vi.fn()}
      />,
    )
    expect(
      screen.getByText('KHÁM PHÁ SECRET BOX CỦA BẠN'),
    ).toBeInTheDocument()
  })

  it('shows guidance text when unopened > 0', () => {
    render(
      <SecretBoxModal
        unopened={2}
        currentBadge={null}
        isOpening={false}
        onOpen={vi.fn()}
      />,
    )
    expect(screen.getByText('Click vào box để mở')).toBeInTheDocument()
  })

  it('fires onOpen when box clicked and unopened > 0', () => {
    const onOpen = vi.fn()
    render(
      <SecretBoxModal
        unopened={1}
        currentBadge={mockBadge}
        isOpening={false}
        onOpen={onOpen}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /open secret box/i }))
    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it('displays zero-padded counter number', () => {
    render(
      <SecretBoxModal
        unopened={5}
        currentBadge={null}
        isOpening={false}
        onOpen={vi.fn()}
      />,
    )
    expect(screen.getByText('05')).toBeInTheDocument()
  })

  it('displays the counter label text from Figma', () => {
    render(
      <SecretBoxModal
        unopened={5}
        currentBadge={null}
        isOpening={false}
        onOpen={vi.fn()}
      />,
    )
    expect(screen.getByText('Secretbox chưa mở')).toBeInTheDocument()
  })

  it('renders close button and fires onClose when provided', () => {
    const onClose = vi.fn()
    render(
      <SecretBoxModal
        unopened={1}
        currentBadge={null}
        isOpening={false}
        onOpen={vi.fn()}
        onClose={onClose}
      />,
    )
    const closeBtn = screen.getByRole('button', { name: /close/i })
    expect(closeBtn).toBeInTheDocument()
    fireEvent.click(closeBtn)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  // ── Failure / edge paths ──────────────────────────────────────────────────

  it('hides guidance text when unopened === 0', () => {
    render(
      <SecretBoxModal
        unopened={0}
        currentBadge={null}
        isOpening={false}
        onOpen={vi.fn()}
      />,
    )
    expect(screen.queryByText('Click vào box để mở')).not.toBeInTheDocument()
  })

  it('box button is disabled and onOpen not called when unopened === 0', () => {
    const onOpen = vi.fn()
    render(
      <SecretBoxModal
        unopened={0}
        currentBadge={null}
        isOpening={false}
        onOpen={onOpen}
      />,
    )
    const btn = screen.getByRole('button', { name: /open secret box/i })
    expect(btn).toBeDisabled()
    fireEvent.click(btn)
    expect(onOpen).not.toHaveBeenCalled()
  })

  it('box button is disabled while isOpening', () => {
    render(
      <SecretBoxModal
        unopened={3}
        currentBadge={mockBadge}
        isOpening={true}
        onOpen={vi.fn()}
      />,
    )
    expect(
      screen.getByRole('button', { name: /open secret box/i }),
    ).toBeDisabled()
  })

  it('shows spinner while isOpening', () => {
    render(
      <SecretBoxModal
        unopened={2}
        currentBadge={mockBadge}
        isOpening={true}
        onOpen={vi.fn()}
      />,
    )
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('does not render close button when onClose is omitted', () => {
    render(
      <SecretBoxModal
        unopened={1}
        currentBadge={null}
        isOpening={false}
        onOpen={vi.fn()}
      />,
    )
    expect(
      screen.queryByRole('button', { name: /close/i }),
    ).not.toBeInTheDocument()
  })
})
