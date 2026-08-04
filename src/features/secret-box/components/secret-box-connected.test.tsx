/**
 * Unit tests for SecretBoxConnected — wires useSecretBox() to SecretBoxModal.
 *
 * useSecretBox is mocked via vi.mock so no Supabase/TanStack Query setup needed.
 *
 * Happy paths:
 *  - isLoading=true → spinner rendered (role="status")
 *  - loaded state → SecretBoxModal renders with correct unopened count
 *
 * Failure / edge paths:
 *  - openError non-null → role="alert" with error text rendered
 *  - clicking the error alert calls clearError
 */
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SecretBoxConnected } from './secret-box-connected'

// ── Mock useSecretBox ────────────────────────────────────────────────────────

const mockUseSecretBox = vi.fn()

vi.mock('../use-secret-box', () => ({
  useSecretBox: () => mockUseSecretBox(),
}))

// ── Default stub that represents a loaded, idle state ────────────────────────

function makeStub(overrides: Partial<ReturnType<typeof mockUseSecretBox>> = {}) {
  return {
    unopened: 3,
    currentBadge: null,
    isOpening: false,
    isLoading: false,
    openError: null,
    open: vi.fn(),
    clearError: vi.fn(),
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('SecretBoxConnected', () => {
  // ── Loading state ────────────────────────────────────────────────────────────

  it('renders a spinner while isLoading is true', () => {
    mockUseSecretBox.mockReturnValue(makeStub({ isLoading: true }))

    render(<SecretBoxConnected />)

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('does not render the modal while isLoading is true', () => {
    mockUseSecretBox.mockReturnValue(makeStub({ isLoading: true }))

    render(<SecretBoxConnected />)

    // The modal title is absent during loading
    expect(
      screen.queryByText('KHÁM PHÁ SECRET BOX CỦA BẠN'),
    ).not.toBeInTheDocument()
  })

  // ── Loaded state ─────────────────────────────────────────────────────────────

  it('renders SecretBoxModal with the unopened count when loaded', () => {
    mockUseSecretBox.mockReturnValue(makeStub({ unopened: 5 }))

    render(<SecretBoxConnected />)

    // zero-padded counter rendered by SecretBoxModal
    expect(screen.getByText('05')).toBeInTheDocument()
  })

  it('does not render a spinner when isLoading is false', () => {
    mockUseSecretBox.mockReturnValue(makeStub({ isLoading: false }))

    render(<SecretBoxConnected />)

    // SecretBoxSpinner exposes role="status"; SecretBoxModal spinner only
    // appears when isOpening=true — with both false, no status role present.
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  // ── Error state ───────────────────────────────────────────────────────────────

  it('renders role="alert" with the error message when openError is non-null', () => {
    const errorMsg = 'Bạn không có Secret Box nào để mở'
    mockUseSecretBox.mockReturnValue(makeStub({ openError: errorMsg }))

    render(<SecretBoxConnected />)

    const alert = screen.getByRole('alert')
    expect(alert).toBeInTheDocument()
    expect(alert).toHaveTextContent(errorMsg)
  })

  it('calls clearError when the error alert is clicked', () => {
    const clearError = vi.fn()
    mockUseSecretBox.mockReturnValue(
      makeStub({ openError: 'Đã xảy ra lỗi. Vui lòng thử lại.', clearError }),
    )

    render(<SecretBoxConnected />)

    fireEvent.click(screen.getByRole('alert'))

    expect(clearError).toHaveBeenCalledTimes(1)
  })

  it('does not render role="alert" when openError is null', () => {
    mockUseSecretBox.mockReturnValue(makeStub({ openError: null }))

    render(<SecretBoxConnected />)

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
