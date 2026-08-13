'use client'

/**
 * board-connected-gates.tsx — Loading / error skeleton gates for BoardConnected.
 *
 * Extracted from board-connected.tsx to keep it under 200 lines.
 * These gates render the page shell (bg + header) with a centered status/error.
 */

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'

interface GateShellProps {
  header: ReactNode
  children: ReactNode
}

function GateShell({ header, children }: GateShellProps) {
  return (
    <div className="relative min-h-screen w-full" style={{ backgroundColor: 'rgba(0,16,26,1)' }}>
      {header}
      {children}
    </div>
  )
}

export function BoardLoadingGate({ header }: { header: ReactNode }) {
  const t = useTranslations('board')
  return (
    <GateShell header={header}>
      <div
        className="flex flex-1 flex-col items-center justify-center gap-4"
        style={{ minHeight: 'calc(100vh - 80px)' }}
        role="status"
        aria-busy="true"
        aria-label={t('loadingBoard')}
      >
        <div
          className="h-10 w-10 animate-spin rounded-full"
          style={{ border: '3px solid rgba(255,234,158,0.25)', borderTopColor: '#FFEA9E' }}
        />
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{t('loadingBoard')}</p>
      </div>
    </GateShell>
  )
}

export function BoardErrorGate({ header }: { header: ReactNode }) {
  const t = useTranslations('board')
  return (
    <GateShell header={header}>
      <div
        className="flex flex-1 items-center justify-center"
        style={{ minHeight: 'calc(100vh - 80px)' }}
        role="alert"
        aria-label={t('errorBoardLabel')}
      >
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {t('errorMessage')}
        </p>
      </div>
    </GateShell>
  )
}
