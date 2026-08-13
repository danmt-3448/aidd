'use client'

/**
 * BoardFeedCard — one kudo card in feed and Highlight carousel.
 *
 * Rework pass 3 (user Figma feedback — layout corrections):
 *   Person block layout changed HORIZONTAL → VERTICAL (avatar top / name / dept·badge).
 *   Two person blocks side-by-side with PaperPlaneIcon between them at top-alignment.
 *   Kudo title: center-aligned + PencilIcon on the right (visual only, no edit wiring).
 *   Content body: wrapped in a box with darker cream bg (#FFF4D6) + bold font-weight.
 *   Timestamp: "HH:MM - DD/MM/YYYY" format, gray, left-aligned.
 *   Footer: ❤ count (left) + Copy Link (right).
 *
 * Highlight variant additions (pass 4):
 *   - Cards hug content (no fixed height / space-between stretch).
 *   - "Xem chi tiết ↗" action appended after Copy Link (highlight only).
 *
 * Existing Figma-sourced tokens (MoMorph MCP D1/D2, unchanged):
 *   Card bg #FFF8E1 · highlight border 4px solid #FFEA9E · radius 16/24px
 *   Name colors #1A1208 / #92400E · avatar 40px · Montserrat font
 *
 * ⚠️ NEEDS FIGMA VERIFY (values inferred, not from node 3127:21871 directly):
 *   - Body box bg: rgba(255,234,158,0.22) on cream — "darker cream" per user feedback
 *   - Body box radius: 12px — inferred, needs node 3127:21871 verify
 *   - PaperPlaneIcon SVG path: see board-card-atoms.tsx
 *   - PencilIcon SVG path: see board-card-atoms.tsx
 *
 * variant="highlight" → 16px radius + gold border (used in carousel).
 * variant="feed"      → 24px radius, no extra border (used in All Kudos).
 *
 * H-3: likedByMe/heartCount from props only — no local state mirror.
 * H-1: sender click disabled when senderId null (anonymous kudo).
 */

import { useTranslations } from 'next-intl'
import { montserrat } from '@/features/auth/fonts'
import { HeartIcon, LinkIcon, HashtagRow, formatCardDate } from './board-card-atoms'
import { PaperPlaneIcon, PencilIcon } from './board-card-send-icons'
import { PersonBlock } from './board-card-person-block'
import { FeedCardImageGallery } from './feed-card-image-gallery'
import type { FeedCardProps } from './board-types'


export interface BoardFeedCardProps extends FeedCardProps {
  onToggleHeart: (kudoId: string) => void
  onCopyLink: (kudoId: string) => void
  onOpenProfile: (userId: string) => void
  /**
   * "highlight" → carousel context (gold border, 16px radius, 24px padding)
   * "feed"      → All Kudos context (no extra border, 24px radius, 40px padding)
   */
  variant?: 'highlight' | 'feed'
  /**
   * The authenticated user's id. Used to compute isOwn so the pencil edit
   * icon renders ONLY on the current user's own kudos. Pass undefined when uid
   * is unavailable (anonymous / unauthenticated) — pencil is hidden.
   */
  currentUserId?: string
  /**
   * Called when the pencil icon is clicked on an own kudo.
   * The parent (board-screen / board-connected) owns the edit-modal flow.
   * Placeholder no-op is acceptable until the edit-kudo feature lands.
   */
  onEdit?: (kudoId: string) => void
  /**
   * Highlight variant only — called when "Xem chi tiết ↗" is clicked.
   * No-op / undefined is acceptable until a detail route lands; the button
   * still renders so the Figma footer is complete.
   */
  onViewDetail?: (kudoId: string) => void
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
  currentUserId,
  onEdit,
  onViewDetail,
}: BoardFeedCardProps) {
  const isHighlight = variant === 'highlight'
  const t = useTranslations('board')
  // Pencil is only shown when the viewer is the kudo sender (spec §2)
  const isOwn = !!currentUserId && !!senderId && senderId === currentUserId

  return (
    <article
      data-fig="3127:21871"
      className="flex flex-col gap-4"
      style={{
        background: '#FFF8E1',
        border: isHighlight ? '4px solid #FFEA9E' : 'none',
        borderRadius: isHighlight ? 16 : 24,
        padding: isHighlight ? '24px 24px 16px 24px' : '40px 40px 16px 40px',
        /* Cards hug content in both variants — Figma highlight cards are compact,
           not stretched. The 525px fixed height was the tallest (gallery) card and
           caused empty gaps on sparse cards. Feed variant was always hug-content. */
      }}
      aria-label={t('kudoFromTo', { sender: senderName, receiver: receiverName })}
    >
      {/* Header: sender block + paper-plane icon + receiver block — all top-aligned */}
      <div className="flex items-start justify-between gap-4">
        {/* Sender (left) */}
        <PersonBlock
          avatarUrl={senderAvatarUrl}
          name={senderName}
          nameColor="#1A1208"
          department={senderDepartment}
          tier={senderTier}
          interactive={senderId !== null}
          label={t('viewProfile', { name: senderName })}
          onClick={senderId !== null ? () => onOpenProfile(senderId) : undefined}
          lightMode
          profileId={senderId}
        />

        {/* Paper-plane send icon — centered between 2 blocks, top-aligned */}
        <div className="mt-1 flex-shrink-0">
          <PaperPlaneIcon />
        </div>

        {/* Receiver (right) */}
        <PersonBlock
          avatarUrl={receiverAvatarUrl}
          name={receiverName}
          nameColor="#92400E"
          department={receiverDepartment}
          tier={receiverTier}
          interactive
          label={t('viewProfile', { name: receiverName })}
          onClick={() => onOpenProfile(receiverId)}
          lightMode
          profileId={receiverId}
        />
      </div>

      {/* Timestamp — left-aligned, gray, "HH:MM - DD/MM/YYYY" per Figma feedback */}
      <span
        className="text-xs"
        style={{ fontFamily: montserrat.style.fontFamily, color: 'rgba(26,18,8,0.45)' }}
      >
        {formatCardDate(createdAt)}
      </span>

      {/* Kudo title — centered + pencil icon on the right (own kudo only) */}
      {kudoTitle && (
        <div className="flex items-center">
          {/* Spacer to keep title visually centered when pencil is shown */}
          <span className="w-4 flex-shrink-0" aria-hidden />
          <p
            className="flex-1 text-center font-bold"
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
          {/* Pencil renders ONLY when this kudo belongs to the current user (spec §2) */}
          <span className="flex w-4 flex-shrink-0 items-center justify-end">
            {isOwn && (
              <button
                type="button"
                aria-label={t('editKudo')}
                className="transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
                onClick={() => onEdit?.(id)}
              >
                <PencilIcon />
              </button>
            )}
          </span>
        </div>
      )}

      {/* Content body — inside a box per Figma node I3127:21871;662:11382.
          bg: rgba(255,234,158,0.40), padding: 16px 24px, border: 1px solid #FFEA9E, radius: 12px. */}
      <div
        data-fig="I3127:21871;662:11382"
        className={`text-sm font-bold leading-6 ${isHighlight ? 'line-clamp-3' : 'line-clamp-5'}`}
        style={{
          fontFamily: montserrat.style.fontFamily,
          fontWeight: 700,
          color: 'rgba(26,18,8,0.8)',
          background: 'rgba(255,234,158,0.40)',
          borderRadius: 12,
          border: '1px solid #FFEA9E',
          padding: '16px 24px',
        }}
        // contentHtml is sanitised before storage (server-side sanitize-html)
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />

      {/* Attached images */}
      {imageUrls && imageUrls.length > 0 && (
        <FeedCardImageGallery imageUrls={imageUrls} lightMode />
      )}

      {/* Hashtag chips — max 5, overflow badge */}
      <HashtagRow tags={hashtags} />

      {/* Action row — heart (left) + copy link + optional "Xem chi tiết" (right) */}
      <div className="flex items-center gap-4 pt-1">
        {/* Heart + count — number bold black, heart red per Figma feedback */}
        <button
          type="button"
          onClick={() => onToggleHeart(id)}
          aria-pressed={likedByMe}
          aria-label={likedByMe ? t('unlike') : t('like')}
          className="flex items-center gap-1.5 transition-opacity hover:opacity-70"
        >
          <HeartIcon filled={likedByMe} />
          <span
            className="text-xs font-bold"
            style={{
              fontFamily: montserrat.style.fontFamily,
              color: likedByMe ? '#EF4444' : '#1A1208',
              minWidth: 16,
            }}
          >
            {heartCount.toLocaleString('vi-VN')}
          </span>
        </button>

        {/* Copy Link — pushed to the right */}
        <button
          type="button"
          onClick={() => onCopyLink(id)}
          aria-label={t('copyLink')}
          className="ml-auto flex items-center gap-1.5 transition-opacity hover:opacity-70"
          style={{
            color: 'rgba(26,18,8,0.5)',
            fontFamily: montserrat.style.fontFamily,
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          <LinkIcon />
          <span>{t('copyLink')}</span>
        </button>

        {/* "Xem chi tiết ↗" — Figma highlight footer action (highlight variant only).
            No detail route yet; onViewDetail is a no-op placeholder until route lands. */}
        {isHighlight && (
          <button
            type="button"
            onClick={() => onViewDetail?.(id)}
            aria-label={t('viewDetailKudo')}
            className="flex items-center gap-1 transition-opacity hover:opacity-70"
            style={{
              color: '#92400E',
              fontFamily: montserrat.style.fontFamily,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <span>{t('viewDetail')}</span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M7 17L17 7M17 7H7M17 7v10" />
            </svg>
          </button>
        )}
      </div>
    </article>
  )
}
