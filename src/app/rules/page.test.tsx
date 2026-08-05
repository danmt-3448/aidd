/**
 * Unit tests for RulesPage — /rules renders as a modal over a dim backdrop.
 *
 * Happy paths:
 *  - renders dim backdrop element
 *  - renders RulesPanel with role="dialog"
 *  - × close button calls router.back()
 *  - Esc keydown calls router.back()
 *  - backdrop click (on the backdrop itself) calls router.back()
 *  - clicking inside the panel does NOT trigger close
 *
 * Failure / edge paths:
 *  - onWriteKudos opens KudoComposeModal
 */
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import RulesPage from './page'

// ── Mock next/navigation ─────────────────────────────────────────────────────
const mockBack = vi.fn()
const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: mockBack, push: mockPush }),
}))

// ── Mock RulesPanel to expose dialog role + onClose / onWriteKudos ──────────
vi.mock('@/features/rules/components', () => ({
  RulesPanel: ({
    onClose,
    onWriteKudos,
  }: {
    onClose: () => void
    onWriteKudos: () => void
    [key: string]: unknown
  }) => (
    <div role="dialog" aria-modal="true" aria-label="Thể lệ SAA 2025" data-testid="rules-panel">
      <button onClick={onClose} aria-label="Đóng thể lệ">
        Đóng
      </button>
      <button onClick={onWriteKudos}>Viết KUDOS</button>
    </div>
  ),
}))

// ── Mock KudoComposeModal ────────────────────────────────────────────────────
vi.mock('@/features/kudos/components/kudo-compose-modal', () => ({
  KudoComposeModal: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? (
      <div role="dialog" aria-label="Viết KUDOS" data-testid="compose-modal">
        <button onClick={onClose}>Đóng modal</button>
      </div>
    ) : null,
}))

// ── Mock rules-content (static data, not under test) ────────────────────────
vi.mock('@/features/rules/rules-content', () => ({
  RECIPIENT_SECTION: { heading: 'Người nhận', body: '' },
  SENDER_SECTION: { heading: 'Người gửi', body: '' },
  HERO_BADGES: [],
  SECRET_BADGES: [],
  SENDER_FOOTER_TEXT: '',
  KUDOS_QUOC_DAN_HEADING: '',
  KUDOS_QUOC_DAN_BODY: '',
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('RulesPage', () => {
  // ── Happy path ────────────────────────────────────────────────────────────

  it('renders a dim backdrop element', () => {
    render(<RulesPage />)
    expect(screen.getByTestId('rules-backdrop')).toBeInTheDocument()
  })

  it('renders the rules panel with role="dialog"', () => {
    render(<RulesPage />)
    const dialog = screen.getByRole('dialog', { name: /thể lệ saa 2025/i })
    expect(dialog).toBeInTheDocument()
  })

  it('close button calls router.back()', () => {
    render(<RulesPage />)
    fireEvent.click(screen.getByRole('button', { name: /đóng thể lệ/i }))
    expect(mockBack).toHaveBeenCalledTimes(1)
  })

  it('Esc keydown calls router.back()', () => {
    render(<RulesPage />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(mockBack).toHaveBeenCalledTimes(1)
  })

  it('clicking the backdrop itself calls router.back()', () => {
    render(<RulesPage />)
    const backdrop = screen.getByTestId('rules-backdrop')
    // Simulate a pointerdown directly on the backdrop (not a child)
    fireEvent.pointerDown(backdrop, { target: backdrop })
    expect(mockBack).toHaveBeenCalledTimes(1)
  })

  it('clicking inside the panel does not close', () => {
    render(<RulesPage />)
    const panel = screen.getByTestId('rules-panel')
    fireEvent.pointerDown(panel)
    expect(mockBack).not.toHaveBeenCalled()
    expect(mockPush).not.toHaveBeenCalled()
  })

  // ── KudoComposeModal ──────────────────────────────────────────────────────

  it('onWriteKudos opens KudoComposeModal', () => {
    render(<RulesPage />)
    expect(screen.queryByTestId('compose-modal')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /viết kudos/i }))
    expect(screen.getByTestId('compose-modal')).toBeInTheDocument()
  })

  it('Esc does NOT close rules when compose modal is open', () => {
    render(<RulesPage />)
    // Open compose modal
    fireEvent.click(screen.getByRole('button', { name: /viết kudos/i }))
    mockBack.mockClear()
    // Esc should not close the rules page while compose is open
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(mockBack).not.toHaveBeenCalled()
  })
})
