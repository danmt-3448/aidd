'use client'

import { useTranslations } from 'next-intl'
import { montserrat } from '@/features/auth/fonts'
import { CountdownLedBlock } from './countdown-led-block'

/**
 * The shape of countdown values expected by the display component.
 *
 * Integration contract (matches `use-countdown` return shape, phase 02):
 *   days    — whole days remaining
 *   hours   — remaining hours within the current day (0–23)
 *   minutes — remaining minutes within the current hour (0–59)
 *   seconds — remaining seconds within the current minute (0–59)
 *   done    — true when target datetime has passed
 *   invalid — true when event_config target is missing or malformed
 */
export interface CountdownValue {
  days: number
  hours: number
  minutes: number
  seconds: number
  done: boolean
  invalid: boolean
}

interface CountdownDisplayProps {
  countdown: CountdownValue
}

/**
 * Title + 3-column LED block row: Days · Hours · Minutes.
 *
 * Figma spec (screen 8PJQswPZmU):
 *   - Title: Montserrat 700 36px white, gap 24px above LED row.
 *   - LED row: horizontal flex, gap 60px between 3 units, no separator colons.
 *   - Seconds are tracked but NOT displayed per spec.
 *   - Done/invalid states: white/gold palette, NO orange.
 */
export function CountdownDisplay({ countdown }: CountdownDisplayProps) {
  const t = useTranslations('countdown')

  if (countdown.invalid) {
    return (
      // mm:countdown-invalid
      <div
        className="flex items-center justify-center rounded-xl px-8 py-6 text-center"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,234,158,0.20)',
        }}
      >
        <p
          style={{
            color: 'rgba(255,255,255,0.55)',
            fontSize: '0.875rem',
            fontWeight: 400,
          }}
        >
          {t('invalidConfig')}
        </p>
      </div>
    )
  }

  if (countdown.done) {
    return (
      // mm:countdown-done
      <div
        className="flex items-center justify-center rounded-xl px-8 py-6 text-center"
        style={{
          background: 'rgba(255,234,158,0.08)',
          border: '1px solid rgba(255,234,158,0.35)',
        }}
      >
        <p
          className={montserrat.className}
          style={{
            color: '#FFEA9E',
            fontSize: 'clamp(1rem, 2.5vw, 1.5rem)',
            fontWeight: 700,
          }}
        >
          {t('done')}
        </p>
      </div>
    )
  }

  return (
    // mm:countdown-led-section — title + LED row stacked, gap 24px
    <div className="flex flex-col items-center" style={{ gap: 24 }}>
      {/* mm:countdown-title */}
      <h1
        className={montserrat.className}
        style={{
          fontWeight: 700,
          fontSize: 'clamp(1.125rem, 2.37vw, 2.25rem)',
          lineHeight: '3rem',
          color: '#FFFFFF',
          textAlign: 'center',
        }}
      >
        {t('title')}
      </h1>

      {/* mm:countdown-led-row — 3 units, gap 60px, no separators.
          flex-wrap: at 375px the 3 blocks wrap to prevent the 3rd block
          (minutes) clipping off the right edge. */}
      <div
        className="flex flex-row flex-wrap items-start justify-center"
        style={{ gap: 'clamp(16px, 3.97vw, 60px)' }}
        role="timer"
        aria-live="polite"
        aria-label={t('timerAriaLabel', {
          days: countdown.days,
          hours: countdown.hours,
          minutes: countdown.minutes,
        })}
      >
        {/* mm:led-block-days */}
        <CountdownLedBlock value={countdown.days} label={t('days')} />

        {/* mm:led-block-hours */}
        <CountdownLedBlock value={countdown.hours} label={t('hours')} />

        {/* mm:led-block-minutes */}
        <CountdownLedBlock value={countdown.minutes} label={t('minutes')} />
      </div>
    </div>
  )
}
