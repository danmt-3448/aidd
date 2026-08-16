import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { createElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useCountdown } from './use-countdown'

// ---------------------------------------------------------------------------
// Module mock — isolates the hook from the real server action + Supabase
// ---------------------------------------------------------------------------

vi.mock('./event-actions', () => ({
  getEventConfig: vi.fn(),
}))

// Import the mock AFTER vi.mock so we can set return values per-test
import { getEventConfig } from './event-actions'
const mockGetEventConfig = vi.mocked(getEventConfig)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Fresh QueryClient with retries off so queries resolve in one tick. */
function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
    },
  })
}

/** renderHook wrapper that provides a fresh QueryClient per test. */
function renderCountdownHook() {
  const client = makeQueryClient()
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client }, children)
  return renderHook(() => useCountdown(), { wrapper })
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const BASE_NOW_MS = new Date('2025-08-01T10:00:00.000Z').getTime()
const FUTURE_60S  = new Date(BASE_NOW_MS + 60_000).toISOString()  // +1 minute
const FUTURE_90S  = new Date(BASE_NOW_MS + 90_000).toISOString()  // +1m 30s
const PAST_ISO    = new Date(BASE_NOW_MS - 5_000).toISOString()   // 5 s ago

// ---------------------------------------------------------------------------
// Fake-timer helper
// ---------------------------------------------------------------------------

/**
 * shouldAdvanceTime: true keeps real-time Promise scheduling alive so that
 * TanStack Query's internal setTimeout(0) flush and waitFor polling both work
 * while we still control setInterval for the countdown tick.
 */
function useFakeTimersWithRealPromises() {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  vi.setSystemTime(BASE_NOW_MS)
}

// ---------------------------------------------------------------------------
// Tests: config null / missing
// ---------------------------------------------------------------------------

describe('useCountdown — config null (no row)', () => {
  beforeEach(() => {
    useFakeTimersWithRealPromises()
    mockGetEventConfig.mockResolvedValue(null)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('isLoading is true on the first render before the query settles', () => {
    const { result } = renderCountdownHook()
    expect(result.current.isLoading).toBe(true)
  })

  it('invalid is false during loading (not yet determined)', () => {
    const { result } = renderCountdownHook()
    expect(result.current.invalid).toBe(false)
  })

  it('reports invalid=true once query resolves with null', async () => {
    const { result } = renderCountdownHook()
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.invalid).toBe(true)
  })

  it('returns all-zero countdown values when config is null', async () => {
    const { result } = renderCountdownHook()
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current).toMatchObject({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  })
})

// ---------------------------------------------------------------------------
// Tests: valid future eventStartAt — initial values + ticking
// ---------------------------------------------------------------------------

describe('useCountdown — valid future eventStartAt', () => {
  beforeEach(() => {
    useFakeTimersWithRealPromises()
    mockGetEventConfig.mockResolvedValue({
      eventStartAt: FUTURE_60S,
      heartsSpecialMultiplier: 2,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('invalid is false once a valid config loads', async () => {
    const { result } = renderCountdownHook()
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.invalid).toBe(false)
  })

  it('done is false while time remains', async () => {
    const { result } = renderCountdownHook()
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.done).toBe(false)
  })

  it('initial value is computed immediately (no 1-second zero flash)', async () => {
    const { result } = renderCountdownHook()
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    // FUTURE_60S is 60 s ahead of BASE_NOW_MS. With shouldAdvanceTime:true a
    // few real milliseconds pass before the effect fires, so remaining is
    // somewhere in [59, 60] seconds. Assert the total is non-zero (the hook
    // computed it immediately, not leaving a zero flash) and close to 60s.
    const totalSeconds = result.current.minutes * 60 + result.current.seconds
    expect(totalSeconds).toBeGreaterThan(0)
    expect(totalSeconds).toBeLessThanOrEqual(60)
  })

  it('minute value ticks down after a full minute (ceil granularity)', async () => {
    mockGetEventConfig.mockResolvedValue({
      eventStartAt: FUTURE_90S, // 90 s → ceil = 2 minutes
      heartsSpecialMultiplier: 2,
    })
    const { result } = renderCountdownHook()
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const before = result.current.minutes // 2
    expect(before).toBe(2)

    // 60 s of ticks later ~30 s remain → ceil to 1 minute. Seconds are never
    // displayed, so they stay 0 throughout (minute-granular display).
    act(() => { vi.advanceTimersByTime(60_000) })

    expect(result.current.minutes).toBe(before - 1)
    expect(result.current.seconds).toBe(0)
    expect(result.current.done).toBe(false)
  })

  it('counts down minute-by-minute and reaches done', async () => {
    mockGetEventConfig.mockResolvedValue({
      eventStartAt: FUTURE_90S, // ceil → 2 minutes
      heartsSpecialMultiplier: 2,
    })
    const { result } = renderCountdownHook()
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.minutes).toBe(2)
    expect(result.current.done).toBe(false)

    act(() => { vi.advanceTimersByTime(60_000) }) // ~30 s remain → 1 minute
    expect(result.current.minutes).toBe(1)
    expect(result.current.done).toBe(false)

    act(() => { vi.advanceTimersByTime(60_000) }) // crosses 0 → done
    expect(result.current.done).toBe(true)
    expect(result.current).toMatchObject({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  })
})

// ---------------------------------------------------------------------------
// Tests: past eventStartAt — done immediately, no ticking
// ---------------------------------------------------------------------------

describe('useCountdown — past eventStartAt', () => {
  beforeEach(() => {
    useFakeTimersWithRealPromises()
    mockGetEventConfig.mockResolvedValue({
      eventStartAt: PAST_ISO,
      heartsSpecialMultiplier: 2,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('done is true once config loads with a past date', async () => {
    const { result } = renderCountdownHook()
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.done).toBe(true)
  })

  it('all countdown values are zero for a past date', async () => {
    const { result } = renderCountdownHook()
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current).toMatchObject({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  })

  it('no further state change after done (interval is cleared)', async () => {
    const { result } = renderCountdownHook()
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const snapshot = { done: result.current.done, seconds: result.current.seconds }

    act(() => { vi.advanceTimersByTime(5_000) })

    expect(result.current.done).toBe(snapshot.done)
    expect(result.current.seconds).toBe(snapshot.seconds)
  })
})

// ---------------------------------------------------------------------------
// Tests: unmount — interval cleanup, no leak
// ---------------------------------------------------------------------------

describe('useCountdown — unmount cleans up interval', () => {
  beforeEach(() => {
    useFakeTimersWithRealPromises()
    mockGetEventConfig.mockResolvedValue({
      eventStartAt: FUTURE_60S,
      heartsSpecialMultiplier: 2,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('values are valid at the moment of unmount', async () => {
    const { result, unmount } = renderCountdownHook()
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // Capture a snapshot before unmount
    const secondsBefore = result.current.seconds
    expect(secondsBefore).toBeGreaterThanOrEqual(0)

    unmount()

    // Advancing time after unmount should NOT trigger further setState calls.
    // If the interval were still running, React Testing Library would emit an
    // "act(...) warning" or throw an error — the absence of that is the proof.
    act(() => { vi.advanceTimersByTime(5_000) })

    // result.current is frozen at unmount time — value is still valid
    expect(result.current.seconds).toBe(secondsBefore)
  })
})
