'use client'

import { useCallback, useEffect, useId, useState } from 'react'
import dynamic from 'next/dynamic'
import { toast } from 'sonner'
import { montserrat } from '../fonts'
import { RecipientSelect, type RecipientItem } from './recipient-select'
import { HashtagPicker, type HashtagItem } from './hashtag-picker'

// Lazy-load TiptapEditor: ProseMirror + 7 @tiptap/* packages are heavy (~300 KB+).
// Dynamic import with ssr:false splits them out of the initial /kudos bundle.
// The modal is conditionally mounted ({modalOpen && <KudoComposeModal>}), so
// TiptapEditor only loads when the compose modal actually opens.
const TiptapEditor = dynamic(
  () => import('./tiptap-editor').then((m) => ({ default: m.TiptapEditor })),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex items-center justify-center"
        style={{
          border: '1px solid #998C5F',
          borderRadius: '0 0 8px 8px',
          minHeight: '200px',
          background: '#FFF',
        }}
      >
        <span className="font-montserrat text-sm" style={{ color: '#999' }}>
          Đang tải trình soạn thảo…
        </span>
      </div>
    ),
  },
)
import { DanhHieuInput } from './danh-hieu-input'
import { ImageUploader, type UploadedImage } from './image-uploader'
import { AnonymousToggle } from './anonymous-toggle'
import { SubmitBar } from './submit-bar'
import { type MentionItem } from './tiptap-mention-list'
import { useRecipientSearch } from '../hooks/use-recipient-search'
import { useHashtags } from '../hooks/use-hashtags'
import { useCreateKudo } from '../hooks/use-create-kudo'
import { useCurrentUserId } from '../hooks/use-current-user-id'
import { createClient } from '@/lib/supabase/client'

interface KudoComposeModalProps {
  onClose: () => void
  isOpen?: boolean
}

const BUCKET = 'kudo-images'

export function KudoComposeModal({ onClose, isOpen = true }: KudoComposeModalProps) {
  // ── stable kudoId for this compose session (state → safe to read in render) ──
  const [kudoId] = useState(() => crypto.randomUUID())
  const formKey = useId()

  // ── current user (for storage path + self-exclusion) ────────────────────
  const userId = useCurrentUserId()

  // ── form state ──────────────────────────────────────────────────────────
  const [recipient, setRecipient] = useState<RecipientItem | null>(null)
  const [recipientOpen, setRecipientOpen] = useState(false)
  const [recipientSearch, setRecipientSearch] = useState('')

  const [contentHtml, setContentHtml] = useState('')
  const [contentCharCount, setContentCharCount] = useState(0)

  const [selectedHashtags, setSelectedHashtags] = useState<HashtagItem[]>([])
  const [hashtagLimitError, setHashtagLimitError] = useState<string | null>(null)

  const [images, setImages] = useState<UploadedImage[]>([])

  const [danhHieu, setDanhHieu] = useState('')

  const [isAnonymous, setIsAnonymous] = useState(false)
  const [anonymousAlias, setAnonymousAlias] = useState('')

  // ── Track B hooks ────────────────────────────────────────────────────────
  const { data: recipientResults = [], isLoading: recipientsLoading } =
    useRecipientSearch(recipientSearch)

  const { data: hashtagCatalog = [] } = useHashtags()

  const { submit, isPending, isSuccess, fieldErrors, rootError, reset } = useCreateKudo()

  // ── Map Track B recipient results → Track A RecipientItem ────────────────
  const recipientOptions: RecipientItem[] = recipientResults.map((r) => ({
    id: r.id,
    name: r.full_name,
    avatarUrl: r.avatar_url ?? undefined,
  }))

  // ── Map Track B hashtag catalog → Track A HashtagItem ────────────────────
  const hashtagCatalogItems: HashtagItem[] = hashtagCatalog.map((h) => ({
    id: h.id,
    label: h.name,
  }))

  // ── Mention items from recipient search results ───────────────────────────
  const mentionItems: MentionItem[] = recipientResults.map((r) => ({
    id: r.id,
    name: r.full_name,
  }))

  // ── Submit disabled until required fields valid ───────────────────────────
  const hasContent = contentCharCount > 0
  const isSubmitDisabled =
    !recipient || !hasContent || selectedHashtags.length === 0 || danhHieu.trim().length === 0

  // ── Success effect: toast + close + reset ────────────────────────────────
  useEffect(() => {
    if (!isSuccess) return
    toast.success('Đã gửi Kudo thành công')
    reset()
    onClose()
  }, [isSuccess, reset, onClose])

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleContentChange = useCallback((html: string, count: number) => {
    setContentHtml(html)
    setContentCharCount(count)
  }, [])

  const handleAddHashtag = useCallback(
    (item: HashtagItem) => {
      if (selectedHashtags.length >= 5) {
        setHashtagLimitError('Tối đa 5 hashtag')
        return
      }
      setHashtagLimitError(null)
      setSelectedHashtags((prev) => [...prev, item])
    },
    [selectedHashtags.length],
  )

  const handleRemoveHashtag = useCallback((id: string) => {
    setHashtagLimitError(null)
    setSelectedHashtags((prev) => prev.filter((h) => h.id !== id))
  }, [])

  const handleAddImage = useCallback((image: UploadedImage) => {
    setImages((prev) => [...prev, image])
  }, [])

  const handleRemoveImage = useCallback(async (id: string) => {
    const img = images.find((i) => i.id === id)
    setImages((prev) => prev.filter((i) => i.id !== id))
    // Revoke object URL to free memory
    if (img?.previewUrl.startsWith('blob:')) URL.revokeObjectURL(img.previewUrl)
    // Delete from Storage so orphaned uploads don't accumulate
    if (img?.storagePath) {
      const supabase = createClient()
      await supabase.storage.from(BUCKET).remove([img.storagePath])
    }
  }, [images])

  const handleCancel = useCallback(async () => {
    // Remove any already-uploaded temp images before discarding
    if (images.length > 0) {
      const paths = images.map((i) => i.storagePath)
      const supabase = createClient()
      await supabase.storage.from(BUCKET).remove(paths)
      images.forEach((img) => {
        if (img.previewUrl.startsWith('blob:')) URL.revokeObjectURL(img.previewUrl)
      })
    }
    reset()
    onClose()
  }, [images, reset, onClose])

  // ── Escape key closes modal ───────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCancel()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleCancel])

  const handleSubmit = useCallback(() => {
    if (!recipient || isSubmitDisabled) return
    submit({
      kudoId: kudoId,
      receiverId: recipient.id,
      contentHtml,
      hashtagIds: selectedHashtags.map((h) => h.id),
      imagePaths: images.map((i) => i.storagePath),
      isAnonymous,
      anonymousName: isAnonymous && anonymousAlias.trim() ? anonymousAlias.trim() : undefined,
      danhHieu: danhHieu.trim(),
    })
  }, [
    kudoId,
    recipient,
    isSubmitDisabled,
    submit,
    contentHtml,
    selectedHashtags,
    images,
    isAnonymous,
    anonymousAlias,
    danhHieu,
  ])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto pt-[10px]"
      style={{ background: 'rgba(0,16,26,0.8)' }}
      data-fig="520:11646"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleCancel()
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Viết Kudo"
    >
      <div
        key={formKey}
        data-fig="520:11647"
        className={`${montserrat.className} flex w-full max-w-[752px] flex-col gap-8 overflow-y-auto`}
        style={{
          background: 'rgba(255,248,225,1)',
          borderRadius: '24px',
          padding: '40px',
          maxHeight: '90vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* A — Title: Figma mms_A: 32px/700/lh40/center, node I520:11647;520:9870 */}
        <h2
          data-fig="I520:11647;520:9870"
          className="w-full text-center font-montserrat text-[32px] font-bold leading-10 tracking-[0px]"
          style={{ color: '#00101A' }}
        >
          Gửi lời cám ơn và ghi nhận đến đồng đội
        </h2>

        {/* B — Recipient selector */}
        <RecipientSelect
          value={recipient}
          options={recipientOptions}
          isLoading={recipientsLoading}
          onSelect={setRecipient}
          searchQuery={recipientSearch}
          onSearchChange={setRecipientSearch}
          isOpen={recipientOpen}
          onOpenChange={setRecipientOpen}
          required
          error={fieldErrors['receiverId']?.[0]}
        />

        {/* C — Danh hiệu (required honour-title, Figma ihQ26W78P2) */}
        <DanhHieuInput
          value={danhHieu}
          onChange={setDanhHieu}
          error={fieldErrors['danhHieu']?.[0]}
        />

        {/* D+E — Tiptap rich-text editor */}
        <TiptapEditor
          onChange={handleContentChange}
          maxLength={2000}
          mentionItems={mentionItems}
        />
        {fieldErrors['contentHtml'] && (
          <span className="font-montserrat text-xs font-bold" style={{ color: '#CF1322' }}>
            {fieldErrors['contentHtml'][0]}
          </span>
        )}

        {/* F — Hashtag picker */}
        <HashtagPicker
          selected={selectedHashtags}
          catalog={hashtagCatalogItems}
          onAdd={handleAddHashtag}
          onRemove={handleRemoveHashtag}
          maxCount={5}
          required
          limitError={hashtagLimitError ?? fieldErrors['hashtagIds']?.[0]}
        />

        {/* G — Image uploader; disabled until auth resolves to prevent empty-uid storage paths */}
        <ImageUploader
          images={images}
          kudoId={kudoId}
          userId={userId}
          onAdd={handleAddImage}
          onRemove={handleRemoveImage}
          maxCount={5}
          disabled={!userId}
        />

        {/* G — Anonymous toggle */}
        <AnonymousToggle
          checked={isAnonymous}
          onCheckedChange={setIsAnonymous}
          aliasValue={anonymousAlias}
          onAliasChange={setAnonymousAlias}
        />

        {/* Root error */}
        {rootError && (
          <p className="font-montserrat text-sm font-bold" style={{ color: '#CF1322' }}>
            {rootError}
          </p>
        )}

        {/* H — Submit bar */}
        <SubmitBar
          onCancel={handleCancel}
          onSubmit={handleSubmit}
          isSubmitting={isPending}
          disabled={isSubmitDisabled}
        />
      </div>
    </div>
  )
}
