import Image from 'next/image'

/**
 * AwardMedallion — renders an award's medallion artwork (/awards/{slug}.png).
 *
 * The exported PNG already bakes in the gold frame + glow, so this wrapper adds
 * NO border/shadow/background of its own — it only sizes the image (object-contain
 * keeps the baked frame uncropped). Shared (DRY) by the /awards detail cards and
 * the Homepage 6-card grid; the only difference is sizing.
 */
interface AwardMedallionProps {
  src: string
  alt: string
  /** Fixed pixel size (awards detail). Omit for a responsive 100%-width square (homepage grid). */
  size?: number
  /** next/image `sizes` hint for the responsive variant. */
  sizes?: string
}

export function AwardMedallion({ src, alt, size, sizes }: AwardMedallionProps) {
  return (
    <div
      className="relative shrink-0"
      style={{
        width: size ?? '100%',
        height: size,
        aspectRatio: size ? undefined : '1 / 1',
      }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-contain"
        sizes={sizes ?? (size ? `${size}px` : '100vw')}
      />
    </div>
  )
}
