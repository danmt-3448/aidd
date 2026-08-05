/**
 * ErrorPageLayout unit tests.
 *
 * Brand defaults (MoMorph MCP unavailable — brand-default fallback):
 *   - Dark navy bg #00101A
 *   - Gold accent #FFEA9E
 *   - Montserrat font
 *   - Sun* logo /homepage/logo.png
 *   - "Về trang chủ" CTA → /
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ErrorPageLayout } from './error-page-layout'

describe('ErrorPageLayout', () => {
  describe('Core rendering', () => {
    it('renders the error code (404)', () => {
      render(
        <ErrorPageLayout
          code="404"
          title="Trang không tìm thấy"
          description="Trang bạn đang tìm kiếm không tồn tại."
        />
      )
      expect(screen.getByText('404')).toBeInTheDocument()
    })

    it('renders the error code (403)', () => {
      render(
        <ErrorPageLayout
          code="403"
          title="Không có quyền truy cập"
          description="Bạn không có quyền xem trang này."
        />
      )
      expect(screen.getByText('403')).toBeInTheDocument()
    })

    it('renders title text', () => {
      render(
        <ErrorPageLayout
          code="404"
          title="Trang không tìm thấy"
          description="Trang bạn đang tìm kiếm không tồn tại."
        />
      )
      expect(screen.getByText('Trang không tìm thấy')).toBeInTheDocument()
    })

    it('renders description text', () => {
      render(
        <ErrorPageLayout
          code="404"
          title="Trang không tìm thấy"
          description="Trang bạn đang tìm kiếm không tồn tại."
        />
      )
      expect(screen.getByText('Trang bạn đang tìm kiếm không tồn tại.')).toBeInTheDocument()
    })
  })

  describe('"Về trang chủ" CTA', () => {
    it('renders "Về trang chủ" link to /', () => {
      render(
        <ErrorPageLayout
          code="404"
          title="Trang không tìm thấy"
          description="Trang bạn đang tìm kiếm không tồn tại."
        />
      )
      const homeLink = screen.getByRole('link', { name: /về trang chủ/i })
      expect(homeLink).toHaveAttribute('href', '/')
    })
  })

  describe('Optional reset button', () => {
    it('renders reset button when onReset provided', () => {
      const onReset = () => {}
      render(
        <ErrorPageLayout
          code="500"
          title="Lỗi máy chủ"
          description="Có lỗi xảy ra."
          onReset={onReset}
        />
      )
      expect(screen.getByRole('button', { name: /thử lại/i })).toBeInTheDocument()
    })

    it('does not render reset button when onReset omitted', () => {
      render(
        <ErrorPageLayout
          code="404"
          title="Trang không tìm thấy"
          description="Trang bạn đang tìm kiếm không tồn tại."
        />
      )
      expect(screen.queryByRole('button', { name: /thử lại/i })).not.toBeInTheDocument()
    })
  })

  describe('Brand styling', () => {
    it('root element has dark navy background', () => {
      render(
        <ErrorPageLayout
          code="404"
          title="Trang không tìm thấy"
          description="Trang bạn đang tìm kiếm không tồn tại."
        />
      )
      // The root div should contain the bg color in its style or class
      const root = screen.getByRole('main').parentElement
      expect(root?.getAttribute('style') ?? root?.getAttribute('class') ?? '').toMatch(
        /00101A|bg-\[#00101A\]/
      )
    })

    it('error code has gold color', () => {
      render(
        <ErrorPageLayout
          code="404"
          title="Trang không tìm thấy"
          description="Trang bạn đang tìm kiếm không tồn tại."
        />
      )
      const codeEl = screen.getByText('404')
      const style = codeEl.getAttribute('style') ?? ''
      const cls = codeEl.getAttribute('class') ?? ''
      expect(style + cls).toMatch(/FFEA9E|gold/)
    })
  })

  describe('Accessibility', () => {
    it('renders a <main> landmark', () => {
      render(
        <ErrorPageLayout
          code="404"
          title="Trang không tìm thấy"
          description="Trang bạn đang tìm kiếm không tồn tại."
        />
      )
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('Sun* logo has non-empty alt text', () => {
      render(
        <ErrorPageLayout
          code="404"
          title="Trang không tìm thấy"
          description="Trang bạn đang tìm kiếm không tồn tại."
        />
      )
      const logo = screen.getByAltText(/sun\*/i)
      expect(logo).toBeInTheDocument()
    })
  })
})
