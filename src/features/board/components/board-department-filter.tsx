'use client'

/**
 * board-department-filter.tsx — "Phòng ban" filter for the All Kudos feed.
 *
 * Design tokens match the hashtag chip row from MoMorph screen MaZUn5xHXZ:
 *   Label: Montserrat 700 12px tracking-[1.5px] rgba(255,255,255,0.5) uppercase
 *   Chip (inactive): bg rgba(255,255,255,0.06) border rgba(255,255,255,0.12)
 *   Chip (active): bg rgba(255,234,158,0.15) border rgba(255,234,158,0.4) color #FFEA9E
 *
 * Renders a horizontal scroll row of department chips. "Tất cả" clears the filter.
 * State is owned by URL param (?department=<uuid>) via BoardConnected — this
 * component is purely presentational.
 */

import { useTranslations } from 'next-intl'
import { montserrat } from '@/features/auth/fonts'

export interface BoardDepartmentFilterProps {
  /** Department display names (e.g. ["Marketing", "CEVC10", ...]). */
  departments: string[]
  /** Currently active department display name, or null for "all". */
  activeDepartment: string | null
  /** Called when a chip is clicked — null means "clear filter". */
  onDepartmentChange: (name: string | null) => void
}

export function BoardDepartmentFilter({
  departments,
  activeDepartment,
  onDepartmentChange,
}: BoardDepartmentFilterProps) {
  const t = useTranslations('boardFilters')

  return (
    <section aria-label={t('sectionAriaLabel')}>
      {/* Section label */}
      <p
        className="mb-3 tracking-[1.5px]"
        style={{
          fontFamily: montserrat.style.fontFamily,
          fontWeight: 700,
          fontSize: 12,
          color: 'rgba(255,255,255,0.5)',
          textTransform: 'uppercase',
        }}
      >
        {t('sectionTitle')}
      </p>

      {/* Chip row — horizontal scroll on mobile */}
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label={t('groupAriaLabel')}
      >
        {/* "All" chip */}
        <button
          type="button"
          onClick={() => onDepartmentChange(null)}
          aria-pressed={activeDepartment === null}
          className="rounded-full px-3 py-1 text-xs font-bold transition-colors"
          style={{
            fontFamily: montserrat.style.fontFamily,
            background:
              activeDepartment === null
                ? 'rgba(255,234,158,0.15)'
                : 'rgba(255,255,255,0.06)',
            border:
              activeDepartment === null
                ? '1px solid rgba(255,234,158,0.4)'
                : '1px solid rgba(255,255,255,0.12)',
            color:
              activeDepartment === null ? '#FFEA9E' : 'rgba(255,255,255,0.7)',
          }}
        >
          {t('all')}
        </button>

        {departments.map((dept) => {
          const isActive = activeDepartment === dept
          return (
            <button
              key={dept}
              type="button"
              onClick={() => onDepartmentChange(isActive ? null : dept)}
              aria-pressed={isActive}
              className="rounded-full px-3 py-1 text-xs font-bold transition-colors"
              style={{
                fontFamily: montserrat.style.fontFamily,
                background: isActive
                  ? 'rgba(255,234,158,0.15)'
                  : 'rgba(255,255,255,0.06)',
                border: isActive
                  ? '1px solid rgba(255,234,158,0.4)'
                  : '1px solid rgba(255,255,255,0.12)',
                color: isActive ? '#FFEA9E' : 'rgba(255,255,255,0.7)',
              }}
            >
              {dept}
            </button>
          )
        })}
      </div>
    </section>
  )
}
