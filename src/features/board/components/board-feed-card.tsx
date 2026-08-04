'use client'

/**
 * BoardFeedCard — one kudo card in the All Kudos feed and Highlight carousel.
 *
 * Design tokens from MoMorph MCP screen MaZUn5xHXZ.
 * Card bg: rgba(255,255,255,0.04), border: 1px solid rgba(255,255,255,0.08)
 * radius 12px, padding 20px. Avatar 40×40 rounded-full.
 * Content HTML rendered via dangerouslySetInnerHTML (sanitised upstream).
 * Heart: gray #6B7280 inactive, red #EF4444 active.
 * Actions row: heart + count | copy-link | "Xem chi tiết".
 *
 * Atom helpers (AvatarCircle, HeartIcon, LinkIcon, ArrowRightIcon, formatCardDate)
 * live in board-card-atoms.tsx to keep this file under 200 lines.
 *
 * H-3: likedByMe/heartCount are rendered directly from props — no local
 * useState mirror. Optimistic UX is owned entirely by use-toggle-heart
 * (TanStack Query onMutate), so rollbacks propagate correctly.
 *
 * H-1: sender avatar/name navigates to senderId; disabled when senderId is
 * null (anonymous kudo — no profile to open). Receiver and "Xem chi tiết"
 * navigate to receiverId.
 */

import { montserrat } from '@/features/auth/fonts'
import { AvatarCircle, HeartIcon, LinkIcon, ArrowRightIcon, formatCardDate } from './board-card-atoms'
import type { FeedCardProps } from './board-types'

export interface BoardFeedCardProps extends FeedCardProps {
  onToggleHeart: (kudoId: string) => void
  onCopyLink: (kudoId: string) => void
  onOpenProfile: (userId: string) => void
}

export function BoardFeedCard({
  id,
  senderId,
  senderName,
  senderAvatarUrl,
  receiverId,
  receiverName,
  receiverAvatarUrl,
  contentHtml,
  heartCount,
  likedByMe,
  createdAt,
  hashtags = [],
  onToggleHeart,
  onCopyLink,
  onOpenProfile,
}: BoardFeedCardProps) {
  function handleHeart() {
    onToggleHeart(id)
  }

  return (
    <article
      className="flex flex-col gap-4"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: 20,
      }}
      aria-label={`Kudo từ ${senderName} đến ${receiverName}`}
    >
      {/* Header row: sender → receiver */}
      <div className="flex items-center gap-3">
        {/* Sender: non-interactive when anonymous (senderId === null) */}
        {senderId !== null ? (
          <button
            type="button"
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
            aria-label={`Xem profile ${senderName}`}
            onClick={() => onOpenProfile(senderId)}
          >
            <AvatarCircle src={senderAvatarUrl} name={senderName} size={40} />
            <span
              className="font-bold"
              style={{ fontFamily: montserrat.style.fontFamily, fontSize: 14, color: '#FFFFFF', lineHeight: '20px' }}
            >
              {senderName}
            </span>
          </button>
        ) : (
          <div className="flex items-center gap-2" aria-label={senderName}>
            <AvatarCircle src={senderAvatarUrl} name={senderName} size={40} />
            <span
              className="font-bold"
              style={{ fontFamily: montserrat.style.fontFamily, fontSize: 14, color: '#FFFFFF', lineHeight: '20px' }}
            >
              {senderName}
            </span>
          </div>
        )}

        <ArrowRightIcon />

        <button
          type="button"
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
          aria-label={`Xem profile ${receiverName}`}
          onClick={() => onOpenProfile(receiverId)}
        >
          <AvatarCircle src={receiverAvatarUrl} name={receiverName} size={40} />
          <span
            className="font-bold"
            style={{ fontFamily: montserrat.style.fontFamily, fontSize: 14, color: '#FFEA9E', lineHeight: '20px' }}
          >
            {receiverName}
          </span>
        </button>

        <span
          className="ml-auto flex-shrink-0 text-xs"
          style={{ fontFamily: montserrat.style.fontFamily, color: 'rgba(255,255,255,0.4)' }}
        >
          {formatCardDate(createdAt)}
        </span>
      </div>

      {/* Content */}
      <div
        className="text-sm leading-6"
        style={{ fontFamily: montserrat.style.fontFamily, color: 'rgba(255,255,255,0.85)' }}
        // contentHtml is sanitised before storage (server-side sanitize-html)
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />

      {/* Hashtag chips */}
      {hashtags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {hashtags.map((tag) => (
            <span
              key={tag}
              className="rounded-full px-3 py-1 text-xs font-bold"
              style={{
                background: 'rgba(255,234,158,0.1)',
                border: '1px solid rgba(255,234,158,0.25)',
                color: '#FFEA9E',
                fontFamily: montserrat.style.fontFamily,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Action row */}
      <div className="flex items-center gap-4 pt-1">
        <button
          type="button"
          onClick={handleHeart}
          aria-pressed={likedByMe}
          aria-label={likedByMe ? 'Bỏ thích' : 'Thích'}
          className="flex items-center gap-1.5 transition-opacity hover:opacity-80"
        >
          <HeartIcon filled={likedByMe} />
          <span
            className="text-sm font-bold"
            style={{ fontFamily: montserrat.style.fontFamily, color: likedByMe ? '#EF4444' : '#6B7280', minWidth: 16 }}
          >
            {heartCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onCopyLink(id)}
          aria-label="Sao chép liên kết"
          className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-80"
          style={{ color: 'rgba(255,255,255,0.5)', fontFamily: montserrat.style.fontFamily }}
        >
          <LinkIcon />
          <span>Copy Link</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenProfile(receiverId)}
          className="ml-auto text-sm font-bold transition-opacity hover:opacity-80"
          style={{ color: '#FFEA9E', fontFamily: montserrat.style.fontFamily }}
        >
          Xem chi tiết
        </button>
      </div>
    </article>
  )
}
