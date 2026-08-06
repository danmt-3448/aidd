'use client'

/**
 * NotificationPanelPreview — dev-only standalone wrapper for the notification
 * dropdown panel, used by /notifications/panel for the UI-First Gate.
 *
 * MoMorph frame: gWBVcaSVIf (View thông báo), Figma node 589:9152.
 * Design (from Figma, HELD — MoMorph has no node metadata for gWBVcaSVIf):
 *   - Panel bg: #0A1929 (dark navy) · border: rgba(255,255,255,0.12)
 *   - Width: 360px · max-height: 480px · border-radius: 12px
 *   - boxShadow: 0 8px 32px rgba(0,0,0,0.5)
 *   - Header: "Thông báo" Montserrat 700 14px #FFFFFF
 *     + "Đánh dấu tất cả đã đọc" gold action button
 *   - Rows: type-colored icon + title + body + timestamp + unread dot
 *   - Footer: "Xem tất cả" text button
 *
 * Mock data: reads ?ui_state=full|empty|error|loading and renders the
 * matching fixture from notifications.mock.ts (no Supabase calls).
 *
 * PROPERTY-DIFF NOTE: data-fig tags use the frame-level Figma node IDs
 * (589:9152 for the panel root). Sub-element node IDs are HELD because
 * MoMorph has not processed node metadata for this frame. Visual values
 * were inferred from the design spec items — not guessed.
 *
 * HELD items:
 *   - Exact bg color (#0A1929 — from spec description, not get_node)
 *   - Border radius value (12px — from computed style, not get_node)
 *   - Individual row node IDs (no get_node available)
 */

import { useRef } from 'react'
import { montserrat } from '@/features/auth/fonts'
import { NotificationItem } from './notification-item'
import { mockFull, mockEmpty, mockLoading } from './mocks/notifications.mock'
import type { Notification } from './notification-actions'

export interface NotificationPanelPreviewProps {
  uiState: string
}

export function NotificationPanelPreview({ uiState }: NotificationPanelPreviewProps) {
  const triggerRef = useRef<HTMLButtonElement | null>(null)

  // Resolve fixture from uiState
  const fixture =
    uiState === 'empty'
      ? mockEmpty
      : uiState === 'loading'
        ? mockLoading
        : uiState === 'error'
          ? mockEmpty  // error shows empty list + toast (toast irrelevant for gate)
          : mockFull

  const notifications: Notification[] = fixture.notifications
  const isLoading = fixture.isLoading

  // no-op handlers for gate (read-only mock mode)
  const handleClick = (_n: Notification) => {}
  const handleMarkAll = () => {}
  const handleViewAll = () => {}

  return (
    // Outer: dark page bg so panel sits on a realistic background
    <div
      className="flex min-h-screen items-start justify-end p-0"
      style={{ backgroundColor: '#00101A' }}
    >
      {/* Simulated header bar so panel positions correctly relative to bell area */}
      <div
        className="fixed inset-x-0 top-0 z-50 flex h-20 items-center justify-end px-4 md:px-16 xl:px-36"
        style={{ background: 'rgba(16,20,23,0.8)' }}
      >
        {/* Mock bell trigger — reference point only, not interactive in gate */}
        <button
          ref={triggerRef}
          className="relative flex h-10 w-10 items-center justify-center rounded-full"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
          aria-label="Thông báo (mock trigger)"
          aria-hidden="true"
          tabIndex={-1}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6V11c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"
              fill="rgba(255,255,255,0.8)"
            />
          </svg>
        </button>

        {/* Panel — absolutely positioned below the bell */}
        <div className="relative">
          {/* Spacer to align panel below bell */}
          <div style={{ width: 40, height: 40 }} />

          {/* The actual panel — data-fig tag = known Figma frame node ID */}
          <div
            data-fig="589:9152"
            role="dialog"
            aria-label="Thông báo"
            aria-modal="true"
            className="absolute right-0 flex flex-col overflow-hidden rounded-xl"
            style={{
              top: 'calc(100% + 8px)',
              width: 360,
              maxHeight: 480,
              background: '#0A1929',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}
            >
              {/* Title — HELD: node ID not available from MoMorph */}
              <h2
                data-fig="589:9152-title"
                className={`${montserrat.className} text-sm font-bold`}
                style={{ color: '#FFFFFF' }}
              >
                Thông báo
              </h2>
              {/* Mark-all-read — HELD: node ID not available from MoMorph */}
              <button
                data-fig="589:9152-mark-all"
                onClick={handleMarkAll}
                className={`${montserrat.className} text-xs transition-opacity hover:opacity-70`}
                style={{ color: '#FFEA9E', background: 'transparent' }}
                aria-label="Đánh dấu tất cả đã đọc"
              >
                Đánh dấu tất cả đã đọc
              </button>
            </div>

            {/* List */}
            <div
              className="flex-1 overflow-y-auto"
              style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.15) transparent' }}
              role="list"
              aria-label="Danh sách thông báo"
            >
              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <div
                    className="h-5 w-5 animate-spin rounded-full border-2 border-transparent"
                    style={{ borderTopColor: 'rgba(255,255,255,0.4)' }}
                    aria-label="Đang tải…"
                  />
                </div>
              )}

              {!isLoading && notifications.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-2 py-12" aria-live="polite">
                  <span style={{ fontSize: 32 }} aria-hidden="true">🔔</span>
                  <p className={`${montserrat.className} text-sm`} style={{ color: 'rgba(255,255,255,0.5)' }}>
                    Chưa có thông báo nào
                  </p>
                </div>
              )}

              {!isLoading && notifications.map((n) => (
                <div key={n.id} role="listitem">
                  <NotificationItem notification={n} onClick={handleClick} />
                </div>
              ))}
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-center px-4 py-3"
              style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}
            >
              <button
                data-fig="589:9152-view-all"
                onClick={handleViewAll}
                className={`${montserrat.className} w-full rounded py-2 text-sm font-semibold transition-opacity hover:opacity-80`}
                style={{ color: '#FFEA9E', background: 'transparent' }}
                aria-label="Xem tất cả thông báo"
              >
                Xem tất cả
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
