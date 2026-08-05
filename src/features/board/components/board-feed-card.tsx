'use client'

/**
 * BoardFeedCard — one kudo card in feed and Highlight carousel.
 *
 * Rework pass 2 (D1 + D2) — exact Figma tokens from MoMorph MCP:
 *   D1 — card bg #FFF8E1 (rgba(255,248,225,1)) on both Highlight and All-Kudos cards.
 *        Highlight card: 4px solid #FFEA9E border, radius 16px, padding 24px 24px 16px.
 *        All-Kudos card:  no extra border, radius 24px, padding 40px 40px 16px.
 *   D2 — "Send" circle icon between sender and receiver (MM_MEDIA_Send, 32×32).
 *        Tier badge is pill text ("New Hero" / "Rising Hero" / "Legend Hero").
 *
 * variant="highlight" → 16px radius + gold border (used in carousel).
 * variant="feed"      → 24px radius, no extra border (used in All Kudos).
 *
 * H-3: likedByMe/heartCount from props only — no local state mirror.
 * H-1: sender click disabled when senderId null (anonymous kudo).
 */

import { montserrat } from '@/features/auth/fonts'
import { HeartIcon, LinkIcon, formatCardDate } from './board-card-atoms'
import { PersonBlock } from './board-card-person-block'
import { FeedCardImageGallery } from './feed-card-image-gallery'
import type { FeedCardProps } from './board-types'

/** Send/arrow circle icon between sender and receiver per Figma MM_MEDIA_Send */
function SendIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      className="flex-shrink-0"
    >
      <circle cx="16" cy="16" r="16" fill="rgba(255,234,158,0.2)" />
      <path
        d="M10 16H22M17 11L22 16L17 21"
        stroke="#92400E"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Hashtag chip row — max 5 visible, "+N" overflow badge. */
function HashtagRow({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null
  const visible = tags.slice(0, 5)
  const overflow = tags.length - 5
  return (
    <div className="flex flex-wrap gap-2" role="list" aria-label="Hashtags">
      {visible.map((tag) => (
        <span
          key={tag}
          role="listitem"
          className="rounded-full px-3 py-1 text-xs font-bold"
          style={{
            background: 'rgba(231,57,40,0.1)',
            border: '1px solid rgba(231,57,40,0.25)',
            color: '#B91C1C',
            fontFamily: montserrat.style.fontFamily,
          }}
        >
          {tag}
        </span>
      ))}
      {overflow > 0 && (
        <span
          className="rounded-full px-3 py-1 text-xs font-bold"
          style={{
            background: 'rgba(26,18,8,0.06)',
            border: '1px solid rgba(26,18,8,0.15)',
            color: 'rgba(26,18,8,0.5)',
            fontFamily: montserrat.style.fontFamily,
          }}
          aria-label={`${overflow} hashtag nữa`}
        >
          +{overflow}
        </span>
      )}
    </div>
  )
}

export interface BoardFeedCardProps extends FeedCardProps {
  onToggleHeart: (kudoId: string) => void
  onCopyLink: (kudoId: string) => void
  onOpenProfile: (userId: string) => void
  /**
   * "highlight" → carousel context (gold border, 16px radius, 24px padding)
   * "feed"      → All Kudos context (no extra border, 24px radius, 40px padding)
   */
  variant?: 'highlight' | 'feed'
}

export function BoardFeedCard({
  id,
  senderId,
  senderName,
  senderAvatarUrl,
  senderDepartment,
  senderTier,
  receiverId,
  receiverName,
  receiverAvatarUrl,
  receiverDepartment,
  receiverTier,
  contentHtml,
  heartCount,
  likedByMe,
  createdAt,
  hashtags = [],
  kudoTitle,
  imageUrls,
  onToggleHeart,
  onCopyLink,
  onOpenProfile,
  variant = 'feed',
}: BoardFeedCardProps) {
  const isHighlight = variant === 'highlight'

  return (
    <article
      className="flex flex-col gap-4"
      style={{
        background: '#FFF8E1',
        border: isHighlight ? '4px solid #FFEA9E' : 'none',
        borderRadius: isHighlight ? 16 : 24,
        padding: isHighlight ? '24px 24px 16px 24px' : '40px 40px 16px 40px',
      }}
      aria-label={`Kudo từ ${senderName} đến ${receiverName}`}
    >
      {/* Header row: sender → Send icon → receiver + timestamp */}
      <div className="flex items-center gap-3">
        <PersonBlock
          avatarUrl={senderAvatarUrl}
          name={senderName}
          nameColor="#1A1208"
          department={senderDepartment}
          tier={senderTier}
          interactive={senderId !== null}
          label={`Xem profile ${senderName}`}
          onClick={senderId !== null ? () => onOpenProfile(senderId) : undefined}
          lightMode
        />

        <SendIcon />

        <PersonBlock
          avatarUrl={receiverAvatarUrl}
          name={receiverName}
          nameColor="#92400E"
          department={receiverDepartment}
          tier={receiverTier}
          interactive
          label={`Xem profile ${receiverName}`}
          onClick={() => onOpenProfile(receiverId)}
          lightMode
        />

        <span
          className="ml-auto flex-shrink-0 text-xs"
          style={{ fontFamily: montserrat.style.fontFamily, color: 'rgba(26,18,8,0.45)' }}
        >
          {formatCardDate(createdAt)}
        </span>
      </div>

      {/* Kudo title */}
      {kudoTitle && (
        <p
          className="font-bold"
          style={{
            fontFamily: montserrat.style.fontFamily,
            fontWeight: 700,
            fontSize: 16,
            color: '#92400E',
            lineHeight: '24px',
          }}
        >
          {kudoTitle}
        </p>
      )}

      {/* Content body — 3 lines in highlight, 5 in feed */}
      <div
        className={`text-sm leading-6 ${isHighlight ? 'line-clamp-3' : 'line-clamp-5'}`}
        style={{ fontFamily: montserrat.style.fontFamily, color: 'rgba(26,18,8,0.8)' }}
        // contentHtml is sanitised before storage (server-side sanitize-html)
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />

      {/* Attached images */}
      {imageUrls && imageUrls.length > 0 && (
        <FeedCardImageGallery imageUrls={imageUrls} lightMode />
      )}

      {/* Hashtag chips — max 5, overflow badge */}
      <HashtagRow tags={hashtags} />

      {/* Action row */}
      <div className="flex items-center gap-4 pt-1">
        <button
          type="button"
          onClick={() => onToggleHeart(id)}
          aria-pressed={likedByMe}
          aria-label={likedByMe ? 'Bỏ thích' : 'Thích'}
          className="flex items-center gap-1.5 transition-opacity hover:opacity-70"
        >
          <HeartIcon filled={likedByMe} />
          <span
            className="text-sm font-bold"
            style={{
              fontFamily: montserrat.style.fontFamily,
              color: likedByMe ? '#EF4444' : 'rgba(26,18,8,0.5)',
              minWidth: 16,
            }}
          >
            {heartCount.toLocaleString('vi-VN')}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onCopyLink(id)}
          aria-label="Sao chép liên kết"
          className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
          style={{ color: 'rgba(26,18,8,0.5)', fontFamily: montserrat.style.fontFamily }}
        >
          <LinkIcon />
          <span>Copy Link</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenProfile(receiverId)}
          className="ml-auto text-sm font-bold transition-opacity hover:opacity-70"
          style={{ color: '#92400E', fontFamily: montserrat.style.fontFamily }}
        >
          Xem chi tiết
        </button>
      </div>
    </article>
  )
}
