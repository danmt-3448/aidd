/**
 * homepage.mock.ts — static mock data for the Homepage (MoMorph i87tDx10uM).
 *
 * All values sourced from Figma design frame i87tDx10uM.
 * The homepage is largely static (awards grid from award-config.ts, footer text
 * hardcoded in components) — the only runtime-driven pieces are:
 *   - header identity (user name / avatar / unreadCount)
 *   - countdown (days / hours / minutes)
 *
 * mockFull   — authenticated user, active countdown, no unread.
 * mockEmpty  — public (unauthenticated) visitor, no header identity.
 * mockError  — authenticated but countdown shows zeroes (invalid date fallback).
 * mockLoading — countdown ticking, matches the "loading" semantic.
 */

import type { HomepageHeaderProps } from '../components/homepage-header'
import type { HomepageCountdownProps } from '../components/homepage-hero'

// ── Shared ────────────────────────────────────────────────────────────────────

const MOCK_AVATAR = '/images/board/sample-avatar.png'

// ── Header shapes ─────────────────────────────────────────────────────────────

const headerAuth: HomepageHeaderProps = {
  unreadCount: 3,
  user: { name: 'Nguyễn Thị Lan Anh', avatarUrl: MOCK_AVATAR },
  uid: 'mock-uid-homepage',
  isAdmin: false,
}

const headerPublic: HomepageHeaderProps = {
  unreadCount: 0,
  user: null,
  uid: null,
  isAdmin: false,
}

// ── Countdown values ──────────────────────────────────────────────────────────

// Figma shows "12 ngày 08 giờ 30 phút" in the countdown blocks (frame i87tDx10uM).
const countdownActive: HomepageCountdownProps = {
  days: 12,
  hours: 8,
  minutes: 30,
}

const countdownZero: HomepageCountdownProps = {
  days: 0,
  hours: 0,
  minutes: 0,
}

// ── Composite exports: the four ?ui_state= states ────────────────────────────

export const mockFull = {
  header: headerAuth,
  countdown: countdownActive,
}

export const mockEmpty = {
  header: headerPublic,
  countdown: countdownActive,
}

export const mockError = {
  header: headerAuth,
  countdown: countdownZero,
}

export const mockLoading = {
  header: headerAuth,
  countdown: countdownActive,
}
