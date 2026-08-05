import { describe, it, expect } from 'vitest'
import { isPublic, sanitizeNext, PUBLIC_PATHS } from './guard-rules'

describe('guard-rules', () => {
  describe('PUBLIC_PATHS', () => {
    it('should contain /, /login, /auth, /dev-login', () => {
      expect(PUBLIC_PATHS).toContain('/')
      expect(PUBLIC_PATHS).toContain('/login')
      expect(PUBLIC_PATHS).toContain('/auth')
      expect(PUBLIC_PATHS).toContain('/dev-login')
    })

    it('/awards and /rules are auth-guarded (NOT in PUBLIC_PATHS)', () => {
      // phase-15 decision: /awards and /rules require authentication
      expect(PUBLIC_PATHS).not.toContain('/awards')
      expect(PUBLIC_PATHS).not.toContain('/rules')
    })
  })

  describe('isPublic', () => {
    it('should return true for exact public paths', () => {
      expect(isPublic('/')).toBe(true)
      expect(isPublic('/login')).toBe(true)
      expect(isPublic('/auth')).toBe(true)
      expect(isPublic('/dev-login')).toBe(true)
    })

    it('/awards and /rules are NOT public (auth-guarded per phase-15)', () => {
      expect(isPublic('/awards')).toBe(false)
      expect(isPublic('/rules')).toBe(false)
      expect(isPublic('/awards/some-subpage')).toBe(false)
      expect(isPublic('/rules/detail')).toBe(false)
    })

    it('should return true for subpaths of public routes', () => {
      expect(isPublic('/login/x')).toBe(true)
      expect(isPublic('/login/nested/path')).toBe(true)
      expect(isPublic('/auth/callback')).toBe(true)
      expect(isPublic('/auth/something')).toBe(true)
      expect(isPublic('/dev-login/page')).toBe(true)
    })

    it('should return false for protected paths', () => {
      expect(isPublic('/todo')).toBe(false)
      expect(isPublic('/foo')).toBe(false)
      expect(isPublic('/profile')).toBe(false)
      expect(isPublic('/admin')).toBe(false)
      expect(isPublic('/kudos')).toBe(false)
      expect(isPublic('/secret-box')).toBe(false)
      expect(isPublic('/awards')).toBe(false)
      expect(isPublic('/rules')).toBe(false)
    })

    it('should return false for partial matches that do not start with public path', () => {
      expect(isPublic('/login-page')).toBe(false) // doesn't start with /login
      expect(isPublic('/auth-info')).toBe(false) // doesn't start with /auth
      expect(isPublic('/dev-login-backup')).toBe(false) // doesn't start with /dev-login
    })
  })

  describe('sanitizeNext', () => {
    it('should return the path if it starts with / and not //', () => {
      expect(sanitizeNext('/todo')).toBe('/todo')
      expect(sanitizeNext('/dashboard')).toBe('/dashboard')
      expect(sanitizeNext('/user/profile')).toBe('/user/profile')
      expect(sanitizeNext('/x')).toBe('/x')
    })

    it('should return / if next is null or undefined', () => {
      expect(sanitizeNext(null)).toBe('/')
      expect(sanitizeNext(undefined)).toBe('/')
    })

    it('should return / if next is empty string', () => {
      expect(sanitizeNext('')).toBe('/')
    })

    it('should return / if next starts with //', () => {
      expect(sanitizeNext('//evil.com')).toBe('/')
      expect(sanitizeNext('//foo.bar/path')).toBe('/')
    })

    it('should return / if next is an absolute URL', () => {
      expect(sanitizeNext('https://evil.com')).toBe('/')
      expect(sanitizeNext('http://example.com')).toBe('/')
      expect(sanitizeNext('https://evil.com/path')).toBe('/')
    })

    it('should return / if next does not start with /', () => {
      expect(sanitizeNext('todo')).toBe('/')
      expect(sanitizeNext('dashboard')).toBe('/')
      expect(sanitizeNext('relative/path')).toBe('/')
    })

    it('should handle edge cases', () => {
      expect(sanitizeNext('/ ')).toBe('/ ')
      expect(sanitizeNext('//')).toBe('/')
      expect(sanitizeNext('///')).toBe('/')
    })
  })
})
