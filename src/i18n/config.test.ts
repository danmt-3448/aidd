import { describe, it, expect } from 'vitest'
import { isLocale, defaultLocale, LOCALE_COOKIE, locales } from './config'

describe('i18n/config', () => {
  describe('locales', () => {
    it('should contain vi and en', () => {
      expect(locales).toContain('vi')
      expect(locales).toContain('en')
      expect(locales.length).toBe(2)
    })
  })

  describe('defaultLocale', () => {
    it('should be vi', () => {
      expect(defaultLocale).toBe('vi')
    })
  })

  describe('LOCALE_COOKIE', () => {
    it('should be NEXT_LOCALE', () => {
      expect(LOCALE_COOKIE).toBe('NEXT_LOCALE')
    })
  })

  describe('isLocale', () => {
    it('should return true for valid locales', () => {
      expect(isLocale('vi')).toBe(true)
      expect(isLocale('en')).toBe(true)
    })

    it('should return false for invalid locales', () => {
      expect(isLocale('fr')).toBe(false)
      expect(isLocale('de')).toBe(false)
      expect(isLocale('es')).toBe(false)
    })

    it('should return false for undefined and null', () => {
      expect(isLocale(undefined)).toBe(false)
      expect(isLocale(null)).toBe(false)
    })

    it('should return false for empty string', () => {
      expect(isLocale('')).toBe(false)
    })

    it('should return false for non-string values', () => {
      expect(isLocale('VN' as any)).toBe(false)
      expect(isLocale('VI' as any)).toBe(false)
    })
  })
})
