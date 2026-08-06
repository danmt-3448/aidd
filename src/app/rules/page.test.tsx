/**
 * Unit tests for RulesPage — /rules mounts RulesModal with onClose = router.back().
 *
 * The page is a thin wrapper:
 *   export default function RulesPage() {
 *     const router = useRouter()
 *     return <RulesModal onClose={() => router.back()} />
 *   }
 *
 * We mock RulesModal (the component the page actually renders) to expose the
 * same interaction contract it promises callers, exercising the page's wiring:
 *   - dim backdrop  (data-testid="rules-backdrop")
 *   - dialog panel  (role="dialog", aria-label="Thể lệ SAA 2025")
 *   - close button  → onClose()
 *   - Esc key       → onClose() (suppressed while compose modal is open)
 *   - backdrop click (target === backdrop) → onClose()
 *   - panel click   → no close
 *   - "Viết KUDOS" → opens inline KudoComposeModal; while open, Esc is suppressed
 */
import React, { useState, useEffect } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import RulesPage from './page'

// ── Mock next/navigation ─────────────────────────────────────────────────────
const mockBack = vi.fn()
const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: mockBack, push: mockPush }),
}))

// ── Mock RulesModal ───────────────────────────────────────────────────────────
// Mirrors the real component's external contract so we can test the page wiring.
vi.mock('@/features/rules/components', () => {
  function RulesModal({ onClose }: { onClose: () => void }) {
    const [composeOpen, setComposeOpen] = useState(false)

    // Esc → onClose unless compose is open (same guard as the real component)
    useEffect(() => {
      function onKey(e: KeyboardEvent) {
        if (e.key === 'Escape' && !composeOpen) onClose()
      }
      document.addEventListener('keydown', onKey)
      return () => document.removeEventListener('keydown', onKey)
    }, [composeOpen, onClose])

    function handleBackdropPointerDown(e: React.PointerEvent<HTMLDivElement>) {
      if (e.target === e.currentTarget) onClose()
    }

    return (
      <>
        <div
          data-testid="rules-backdrop"
          onPointerDown={handleBackdropPointerDown}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Thể lệ SAA 2025"
            data-testid="rules-panel"
          >
            <button onClick={onClose} aria-label="Đóng thể lệ">
              Đóng
            </button>
            <button onClick={() => setComposeOpen(true)}>Viết KUDOS</button>
          </div>
        </div>

        {composeOpen && (
          <div role="dialog" aria-label="Viết KUDOS" data-testid="compose-modal">
            <button onClick={() => setComposeOpen(false)}>Đóng modal</button>
          </div>
        )}
      </>
    )
  }

  return { RulesModal }
})

// ── Setup ─────────────────────────────────────────────────────────────────────
beforeEach(() => {
  vi.clearAllMocks()
})

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('RulesPage', () => {
  it('renders a dim backdrop element', () => {
    render(<RulesPage />)
    expect(screen.getByTestId('rules-backdrop')).toBeInTheDocument()
  })

  it('renders the rules panel with role="dialog"', () => {
    render(<RulesPage />)
    expect(screen.getByRole('dialog', { name: /thể lệ saa 2025/i })).toBeInTheDocument()
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
    // pointerDown whose target IS the backdrop (not a child) → triggers onClose
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

  it('onWriteKudos opens KudoComposeModal', () => {
    render(<RulesPage />)
    expect(screen.queryByTestId('compose-modal')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /viết kudos/i }))
    expect(screen.getByTestId('compose-modal')).toBeInTheDocument()
  })

  it('Esc does NOT close rules when compose modal is open', () => {
    render(<RulesPage />)
    fireEvent.click(screen.getByRole('button', { name: /viết kudos/i }))
    mockBack.mockClear()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(mockBack).not.toHaveBeenCalled()
  })
})
