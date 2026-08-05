import { type ReactNode } from 'react'

export interface PageContainerProps {
  children: ReactNode
  /** Tailwind max-width class override. Default: `max-w-[1280px]` (artboard width). */
  maxWidthClass?: string
  /** Extra Tailwind classes merged onto the wrapper div. */
  className?: string
}

/**
 * PageContainer — max-width-centered content wrapper.
 *
 * Caps content at 1280px (the MoMorph/Figma artboard width) and centers it
 * with `mx-auto`. Provides responsive horizontal padding so content never
 * bleeds to the viewport edge on mobile.
 *
 * Usage:
 *   <PageContainer>
 *     <MyScreenContent />
 *   </PageContainer>
 *
 * At ≤1280px it is full-width (no visible effect vs. today).
 * At >1280px (e.g., 1440) content is capped and centered — dead whitespace removed.
 *
 * Phase: phase-05-ui-shared-layout-wrapper (adopted by Login + Countdown in phase-09).
 */
export function PageContainer({
  children,
  maxWidthClass = 'max-w-[1280px]',
  className = '',
}: PageContainerProps) {
  return (
    <div
      className={[
        'mx-auto w-full',
        maxWidthClass,
        'px-4 sm:px-6 md:px-8',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  )
}
