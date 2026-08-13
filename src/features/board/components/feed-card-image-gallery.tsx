'use client'

/**
 * feed-card-image-gallery.tsx — thumbnail grid for kudo attached images.
 *
 * Design tokens from Figma spec MaZUn5xHXZ V2g:
 *   Thumbnails: 80×80px, radius 4px, gap 8px, max 5 per row
 *   On click: open image full-screen (native browser lightbox via <a> target="_blank")
 *   Empty imageUrls → renders nothing (null)
 *
 * Renders at most 5 images. If more exist, a "+N" overflow badge replaces the 5th slot.
 * lightMode: overflow overlay uses warm-dark scrim instead of navy.
 *
 * Uses a plain <img> (not next/image): the srcs are time-limited Supabase signed
 * URLs on a private bucket — the next/image optimizer would need every storage
 * host in remotePatterns and would cache an expiring signed URL. A plain <img>
 * fetches the signed URL directly and re-fetches on each load.
 */

import { useTranslations } from 'next-intl'

const THUMB_SIZE = 80
const MAX_VISIBLE = 5

interface FeedCardImageGalleryProps {
  imageUrls: string[]
  /** Alt prefix used with index, e.g. "Ảnh đính kèm 1". Defaults to the i18n translation. */
  altPrefix?: string
  /** When true, card bg is cream — overflow scrim uses warm-dark color */
  lightMode?: boolean
}

export function FeedCardImageGallery({
  imageUrls,
  altPrefix,
  lightMode = false,
}: FeedCardImageGalleryProps) {
  const t = useTranslations('board')
  const prefix = altPrefix ?? t('imageAltPrefix')

  if (imageUrls.length === 0) return null

  const visible = imageUrls.slice(0, MAX_VISIBLE)
  const overflow = imageUrls.length - MAX_VISIBLE
  const scrimBg = lightMode ? 'rgba(26,18,8,0.6)' : 'rgba(0,16,26,0.65)'

  return (
    <div className="flex flex-wrap gap-2" role="list" aria-label={t('imageGalleryLabel')}>
      {visible.map((url, idx) => {
        const isLast = idx === MAX_VISIBLE - 1 && overflow > 0
        return (
          <div key={`img-${idx}`} role="listitem" className="relative flex-shrink-0">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${prefix} ${idx + 1}${isLast && overflow > 0 ? ` ${t('imageMoreLabel', { overflow })}` : ''}`}
              className="block overflow-hidden rounded transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFEA9E]"
              style={{ width: THUMB_SIZE, height: THUMB_SIZE }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`${prefix} ${idx + 1}`}
                width={THUMB_SIZE}
                height={THUMB_SIZE}
                loading="lazy"
                className="rounded object-cover"
                style={{ width: THUMB_SIZE, height: THUMB_SIZE }}
              />
              {isLast && overflow > 0 && (
                <div
                  className="absolute inset-0 flex items-center justify-center rounded"
                  style={{
                    background: scrimBg,
                    color: '#FFFFFF',
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                  aria-hidden
                >
                  +{overflow + 1}
                </div>
              )}
            </a>
          </div>
        )
      })}
    </div>
  )
}
