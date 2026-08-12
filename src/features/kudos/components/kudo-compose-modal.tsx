'use client'

import { useCallback, useEffect, useId, useState } from 'react'
import dynamic from 'next/dynamic'
import { toast } from 'sonner'
import { montserrat } from '../fonts'
import { RecipientSelect, type RecipientItem } from './recipient-select'
import { HashtagPicker, type HashtagItem } from './hashtag-picker'

// Lazy-load TiptapEditor: ProseMirror + 7 @tiptap/* packages are heavy (~300 KB+).
// Dynamic import with ssr:false splits them out of the initial /kudos bundle.
const TiptapEditor = dynamic(
  () => import('./tiptap-editor').then((m) => ({ default: m.TiptapEditor })),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex items-center justify-center"
        style={{ border: '1px solid #998C5F', borderRadius: '0 0 8px 8px', minHeight: '200px', background: '#FFF' }}
      >
        <span className="font-montserrat text-sm" style={{ color: '#999' }}>Đang tải trình soạn thảo…</span>
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
import { useUpdateKudo } from '../hooks/use-update-kudo'
import { useCurrentUserId } from '../hooks/use-current-user-id'
import { useKudoImageCleanup } from '../hooks/use-kudo-image-cleanup'
import { KudoEditInitialData } from './kudo-edit-initial-data'

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Prefill shape passed from board-connected when opening in edit mode. */
export interface KudoInitialData {
  contentHtml: string
  danhHieu: string
  hashtagIds: string[]
  imagePaths: string[]
  receiverId: string
  receiverName: string
}

interface KudoComposeModalProps {
  onClose: () => void
  isOpen?: boolean
  /**
   * Pre-fills the recipient field when the modal is opened from another user's
   * profile page (spec TC_WEB_PROFILE_FUN_007). The dropdown is NOT auto-opened;
   * the field remains editable. Defaults to null (no pre-fill).
   */
  initialRecipient?: RecipientItem | null
  /**
   * Optional resolved userId to pass directly instead of resolving via
   * useCurrentUserId(). Avoids the async resolution gap that keeps the image
   * uploader disabled until the hook settles.
   */
  resolvedUserId?: string
  /**
   * When set, the modal opens in EDIT mode:
   * - Title changes to "Sửa Kudo"
   * - Recipient is locked (read-only)
   * - Fields are pre-filled from initialData
   * - Submit calls useUpdateKudo instead of useCreateKudo
   */
  editKudoId?: string
  /**
   * Prefill data for edit mode. Required when editKudoId is set.
   * Ignored when editKudoId is absent (create mode).
   */
  editInitialData?: KudoInitialData
}

export function KudoComposeModal({
  onClose,
  isOpen = true,
  initialRecipient,
  resolvedUserId,
  editKudoId,
  editInitialData,
}: KudoComposeModalProps) {
  const isEditMode = Boolean(editKudoId)
  const [kudoId] = useState(() => isEditMode ? (editKudoId as string) : crypto.randomUUID())
  const formKey = useId()

  const hookUserId = useCurrentUserId()
  const userId = resolvedUserId ?? hookUserId

  // ── form state ──────────────────────────────────────────────────────────
  const [recipient, setRecipient] = useState<RecipientItem | null>(() => {
    if (isEditMode && editInitialData) {
      return { id: editInitialData.receiverId, name: editInitialData.receiverName }
    }
    return initialRecipient ?? null
  })
  const [recipientOpen, setRecipientOpen] = useState(false)
  const [recipientSearch, setRecipientSearch] = useState('')

  const [contentHtml, setContentHtml] = useState(editInitialData?.contentHtml ?? '')
  const [contentCharCount, setContentCharCount] = useState(0)

  const [selectedHashtags, setSelectedHashtags] = useState<HashtagItem[]>([])
  const [hashtagLimitError, setHashtagLimitError] = useState<string | null>(null)

  const [images, setImages] = useState<UploadedImage[]>(() => {
    if (isEditMode && editInitialData?.imagePaths.length) {
      return editInitialData.imagePaths.map((p) => ({
        id: p,
        storagePath: p,
        previewUrl: '', // edit mode: no local preview URL needed; ImageUploader uses storagePath
      }))
    }
    return []
  })

  const [danhHieu, setDanhHieu] = useState(editInitialData?.danhHieu ?? '')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [anonymousAlias, setAnonymousAlias] = useState('')

  // ── Track B hooks ────────────────────────────────────────────────────────
  const { data: recipientResults = [], isLoading: recipientsLoading } = useRecipientSearch(recipientSearch)
  const { data: hashtagCatalog = [] } = useHashtags()
  const createHook = useCreateKudo()
  const updateHook = useUpdateKudo()
  const { submit, isPending, isSuccess, fieldErrors, rootError, reset } = isEditMode ? updateHook : createHook

  // Orphan-safe Storage cleanup (deferred original delete + unmount safety net).
  const { handleImageRemoved, finalizeOnSuccess, finalizeOnCancel } = useKudoImageCleanup(images)

  // ── Seed selectedHashtags from edit initial data once catalog loads ──────
  useEffect(() => {
    if (!isEditMode || !editInitialData || hashtagCatalog.length === 0) return
    const preselected = hashtagCatalog
      .filter((h) => editInitialData.hashtagIds.includes(h.id))
      .map((h) => ({ id: h.id, label: h.name }))
    setSelectedHashtags(preselected)
    // Run once when catalog arrives — editInitialData is stable (object from parent render).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hashtagCatalog])

  // ── Map results → component types ───────────────────────────────────────
  const recipientOptions: RecipientItem[] = recipientResults.map((r) => ({
    id: r.id, name: r.full_name, avatarUrl: r.avatar_url ?? undefined,
  }))
  const hashtagCatalogItems: HashtagItem[] = hashtagCatalog.map((h) => ({ id: h.id, label: h.name }))
  const mentionItems: MentionItem[] = recipientResults.map((r) => ({ id: r.id, name: r.full_name }))

  // ── Submit gating ────────────────────────────────────────────────────────
  const hasContent = contentCharCount > 0
  const isSubmitDisabled =
    !recipient || !hasContent || selectedHashtags.length === 0 || danhHieu.trim().length === 0

  // ── Success effect ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isSuccess) return
    // RPC committed → flush deferred deletion of removed original images.
    finalizeOnSuccess()
    toast.success(isEditMode ? 'Đã cập nhật Kudo' : 'Đã gửi Kudo thành công')
    reset()
    onClose()
  }, [isSuccess, isEditMode, reset, onClose, finalizeOnSuccess])

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleContentChange = useCallback((html: string, count: number) => {
    setContentHtml(html)
    setContentCharCount(count)
  }, [])

  const handleAddHashtag = useCallback((item: HashtagItem) => {
    if (selectedHashtags.length >= 5) { setHashtagLimitError('Tối đa 5 hashtag'); return }
    setHashtagLimitError(null)
    setSelectedHashtags((prev) => [...prev, item])
  }, [selectedHashtags.length])

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
    // Blob (uncommitted) → deleted now; original (committed) → deferred until save.
    if (img) await handleImageRemoved(img)
  }, [images, handleImageRemoved])

  const handleCancel = useCallback(async () => {
    // Remove uncommitted blob uploads from this session; original images stay in
    // Storage (DB still references them until an actual update replaces them).
    await finalizeOnCancel()
    reset()
    onClose()
  }, [finalizeOnCancel, reset, onClose])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') handleCancel() }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleCancel])

  const handleSubmit = useCallback(() => {
    if (!recipient || isSubmitDisabled) return
    if (isEditMode) {
      updateHook.submit({
        kudoId,
        contentHtml,
        hashtagIds: selectedHashtags.map((h) => h.id),
        imagePaths: images.map((i) => i.storagePath),
        danhHieu: danhHieu.trim(),
      })
    } else {
      createHook.submit({
        kudoId,
        receiverId: recipient.id,
        contentHtml,
        hashtagIds: selectedHashtags.map((h) => h.id),
        imagePaths: images.map((i) => i.storagePath),
        isAnonymous,
        anonymousName: isAnonymous && anonymousAlias.trim() ? anonymousAlias.trim() : undefined,
        danhHieu: danhHieu.trim(),
      })
    }
  }, [kudoId, recipient, isSubmitDisabled, isEditMode, updateHook, createHook,
      contentHtml, selectedHashtags, images, isAnonymous, anonymousAlias, danhHieu])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto pt-[10px]"
      style={{ background: 'rgba(0,16,26,0.8)' }}
      data-fig="520:11646"
      onClick={(e) => { if (e.target === e.currentTarget) handleCancel() }}
      role="dialog"
      aria-modal="true"
      aria-label={isEditMode ? 'Sửa Kudo' : 'Viết Kudo'}
    >
      <div
        key={formKey}
        data-fig="520:11647"
        className={`${montserrat.className} flex w-full max-w-[752px] flex-col gap-8 overflow-y-auto`}
        style={{ background: 'rgba(255,248,225,1)', borderRadius: '24px', padding: '40px', maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <h2
          data-fig="I520:11647;520:9870"
          className="w-full text-center font-montserrat text-[32px] font-bold leading-10 tracking-[0px]"
          style={{ color: '#00101A' }}
        >
          {isEditMode ? 'Sửa Kudo' : 'Gửi lời cám ơn và ghi nhận đến đồng đội'}
        </h2>

        {/* Recipient — locked in edit mode, editable in create mode */}
        {isEditMode ? (
          <KudoEditInitialData recipientName={recipient?.name ?? ''} />
        ) : (
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
        )}

        {/* Danh hiệu */}
        <DanhHieuInput value={danhHieu} onChange={setDanhHieu} error={fieldErrors['danhHieu']?.[0]} />

        {/* Rich-text editor — prefill with initial content in edit mode */}
        <TiptapEditor
          onChange={handleContentChange}
          maxLength={2000}
          mentionItems={mentionItems}
          initialContent={editInitialData?.contentHtml}
        />
        {fieldErrors['contentHtml'] && (
          <span className="font-montserrat text-xs font-bold" style={{ color: '#CF1322' }}>
            {fieldErrors['contentHtml'][0]}
          </span>
        )}

        {/* Hashtag picker */}
        <HashtagPicker
          selected={selectedHashtags}
          catalog={hashtagCatalogItems}
          onAdd={handleAddHashtag}
          onRemove={handleRemoveHashtag}
          maxCount={5}
          required
          limitError={hashtagLimitError ?? fieldErrors['hashtagIds']?.[0]}
        />

        {/* Image uploader */}
        <ImageUploader
          images={images}
          kudoId={kudoId}
          userId={userId}
          onAdd={handleAddImage}
          onRemove={handleRemoveImage}
          maxCount={5}
          disabled={!userId}
        />

        {/* Anonymous toggle — hidden in edit mode (anonymity cannot change) */}
        {!isEditMode && (
          <AnonymousToggle
            checked={isAnonymous}
            onCheckedChange={setIsAnonymous}
            aliasValue={anonymousAlias}
            onAliasChange={setAnonymousAlias}
          />
        )}

        {/* Root error */}
        {rootError && (
          <p className="font-montserrat text-sm font-bold" style={{ color: '#CF1322' }}>{rootError}</p>
        )}

        {/* Submit bar */}
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
