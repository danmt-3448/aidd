'use client'

/**
 * kudo-edit-initial-data.tsx
 *
 * Read-only recipient display shown in the KudoComposeModal edit mode.
 * The receiver cannot change on edit (enforced by update_kudo RPC and here
 * in the UI). Styled to match the RecipientSelect visual language.
 */

import { useTranslations } from 'next-intl'
import { montserrat } from '../fonts'

interface KudoEditInitialDataProps {
  recipientName: string
}

export function KudoEditInitialData({ recipientName }: KudoEditInitialDataProps) {
  const t = useTranslations('kudos')
  return (
    <div className="flex flex-col gap-1">
      <label
        className={`${montserrat.className} text-sm font-bold leading-5`}
        style={{ color: '#00101A' }}
      >
        {t('recipientLabel')}
      </label>
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{
          border: '1px solid #998C5F',
          borderRadius: '8px',
          background: 'rgba(255,248,225,0.5)',
          cursor: 'not-allowed',
          opacity: 0.8,
        }}
        aria-label={t('recipientReadonlyAriaLabel', { name: recipientName })}
        aria-disabled="true"
      >
        <span
          className={`${montserrat.className} flex-1 text-sm font-semibold leading-5`}
          style={{ color: '#00101A' }}
        >
          {recipientName}
        </span>
        <span
          className={`${montserrat.className} shrink-0 text-xs`}
          style={{ color: '#998C5F' }}
        >
          {t('recipientReadonlyHint')}
        </span>
      </div>
    </div>
  )
}
