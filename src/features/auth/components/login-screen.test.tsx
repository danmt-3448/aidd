import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LoginScreen } from './login-screen'

// Mock the subcomponents
vi.mock('./login-header', () => ({
  LoginHeader: ({ logoAlt }: { logoAlt: string }) => <header data-testid="login-header">{logoAlt}</header>,
}))

vi.mock('./google-login-button', () => ({
  GoogleLoginButton: ({ label }: { label: string }) => (
    <button data-testid="google-login-button">{label}</button>
  ),
}))

describe('LoginScreen', () => {
  it('should render header with correct logo alt text', () => {
    render(<LoginScreen />)
    const header = screen.getByTestId('login-header')
    expect(header).toBeInTheDocument()
    expect(header).toHaveTextContent('Sun* Annual Awards 2025')
  })

  it('should render intro text', () => {
    render(<LoginScreen />)
    // Text is split across newline, use regex to match flexible whitespace
    expect(screen.getByText(/Bắt đầu hành trình của bạn cùng SAA 2025/)).toBeInTheDocument()
    expect(screen.getByText(/Đăng nhập để khám phá/)).toBeInTheDocument()
  })

  it('should render Google login button with correct label', () => {
    render(<LoginScreen />)
    const button = screen.getByTestId('google-login-button')
    expect(button).toBeInTheDocument()
    expect(button).toHaveTextContent('LOGIN With Google')
  })

  it('should render footer with copyright text', () => {
    render(<LoginScreen />)
    expect(screen.getByText('Bản quyền thuộc về Sun* © 2025')).toBeInTheDocument()
  })

  it('should not render error message when error is false', () => {
    render(<LoginScreen error={false} />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('should render error message when error is true', () => {
    render(<LoginScreen error={true} />)
    const alert = screen.getByRole('alert')
    expect(alert).toBeInTheDocument()
    expect(alert).toHaveTextContent('Đăng nhập không thành công. Vui lòng thử lại.')
  })

  it('should not render error message by default', () => {
    render(<LoginScreen />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('should have correct background styling', () => {
    const { container } = render(<LoginScreen />)
    const mainDiv = container.firstChild
    expect(mainDiv).toHaveClass('bg-[#00101A]')
    expect(mainDiv).toHaveClass('text-white')
    expect(mainDiv).toHaveClass('min-h-screen')
  })

  it('should render ROOT FURTHER wordmark as an image asset (not h1 text)', () => {
    // The wordmark is a pixel-perfect PNG/SVG asset (CẤM dựng lại bằng text/font).
    // It renders as <img> via next/image with the headingAlt translation key.
    render(<LoginScreen />)
    // LoginHeader mock receives logoAlt; the wordmark img receives headingAlt.
    // Both are rendered via next/image which our mock turns into <img>.
    // The headingAlt translation in the default locale is "Root Further — Sun* Annual Awards 2025".
    const wordmark = screen.getByAltText(/root further/i)
    expect(wordmark).toBeInTheDocument()
    expect(wordmark.tagName).toBe('IMG')
  })
})
