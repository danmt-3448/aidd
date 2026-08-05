/**
 * Unit tests for SecretBoxPage — /secret-box renders as a centered modal overlay.
 *
 * Happy paths:
 *  - renders dim backdrop element
 *  - SecretBoxConnected (and thus SecretBoxModal with role="dialog") renders inside
 *  - Esc keydown calls router.back()
 *  - backdrop click (on the backdrop itself) calls router.back()
 *  - clicking inside the card does NOT trigger close
 *
 * Failure / edge paths:
 *  - stateError path renders alert inside the modal area (delegated to SecretBoxConnected)
 */
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import SecretBoxPage from './page'

// ── Mock next/navigation ─────────────────────────────────────────────────────
const mockBack = vi.fn()
const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: mockBack, push: mockPush }),
}))

// ── Mock SecretBoxConnected to expose dialog role ────────────────────────────
vi.mock('@/features/secret-box/components/secret-box-connected', () => ({
  SecretBoxConnected: () => (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="KHÁM PHÁ SECRET BOX CỦA BẠN"
      data-testid="secret-box-card"
    >
      Secret Box Content
    </div>
  ),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('SecretBoxPage', () => {
  // ── Happy path ────────────────────────────────────────────────────────────

  it('renders a dim backdrop element', () => {
    render(<SecretBoxPage />)
    expect(screen.getByTestId('secret-box-backdrop')).toBeInTheDocument()
  })

  it('renders the secret box card with role="dialog" inside the backdrop', () => {
    render(<SecretBoxPage />)
    const dialog = screen.getByRole('dialog', { name: /khám phá secret box/i })
    expect(dialog).toBeInTheDocument()
    const backdrop = screen.getByTestId('secret-box-backdrop')
    expect(backdrop).toContainElement(dialog)
  })

  it('Esc keydown calls router.back()', () => {
    render(<SecretBoxPage />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(mockBack).toHaveBeenCalledTimes(1)
  })

  it('clicking the backdrop itself calls router.back()', () => {
    render(<SecretBoxPage />)
    const backdrop = screen.getByTestId('secret-box-backdrop')
    fireEvent.pointerDown(backdrop, { target: backdrop })
    expect(mockBack).toHaveBeenCalledTimes(1)
  })

  it('clicking inside the card does not close the overlay', () => {
    render(<SecretBoxPage />)
    const card = screen.getByTestId('secret-box-card')
    fireEvent.pointerDown(card)
    expect(mockBack).not.toHaveBeenCalled()
    expect(mockPush).not.toHaveBeenCalled()
  })
})
