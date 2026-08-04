import Image from 'next/image'
import type { AwardNavItemProps } from '../types'

/**
 * Single navigation item in the left awards category menu.
 * Active state uses yellow (#FFEA9E) text + bottom border per Figma design.
 * Inactive state uses white text.
 */
export function AwardNavItem({ label, isActive, href }: AwardNavItemProps) {
  const lines = label.split('\n')

  return (
    <a
      href={href}
      className="flex items-center gap-1 rounded px-4 py-4 transition-colors duration-200 hover:opacity-80"
      style={
        isActive
          ? {
              borderBottom: '1px solid #FFEA9E',
            }
          : undefined
      }
    >
      <span className="flex items-center gap-1">
        <span className="relative h-6 w-6 shrink-0">
          <Image
            src="/awards/icon-target.svg"
            alt=""
            fill
            className="object-contain"
            style={{ filter: isActive ? 'none' : 'brightness(0) invert(1)' }}
          />
        </span>
        <span
          className="font-montserrat text-sm font-bold leading-5 tracking-[0.25px]"
          style={{
            color: isActive ? '#FFEA9E' : '#FFFFFF',
            textShadow: isActive
              ? '0 4px 4px rgba(0,0,0,0.25), 0 0 6px #FAE287'
              : 'none',
            whiteSpace: 'pre-line',
          }}
        >
          {lines.join('\n')}
        </span>
      </span>
    </a>
  )
}
