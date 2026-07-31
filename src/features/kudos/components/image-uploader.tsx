'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface UploadedImage {
  /** Unique id for the image slot (used as key + for removal) */
  id: string
  /** Object URL (local preview) or remote URL */
  previewUrl: string
  /** Storage path returned after upload: {uid}/{kudoId}/{filename} */
  storagePath: string
  name?: string
}

interface ImageUploaderProps {
  images: UploadedImage[]
  kudoId: string
  userId: string
  onAdd: (image: UploadedImage) => void
  onRemove: (id: string) => void
  maxCount?: number
  /** Block add until auth resolves (userId becomes non-empty) */
  disabled?: boolean
}

const MAX_IMAGES = 5
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png']
const BUCKET = 'kudo-images'

export function ImageUploader({
  images,
  kudoId,
  userId,
  onAdd,
  onRemove,
  maxCount = MAX_IMAGES,
  disabled = false,
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const canAdd = images.length < maxCount

  function handleAddClick() {
    if (!canAdd || disabled) return
    setUploadError(null)
    fileInputRef.current?.click()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    // Reset input so the same file can be re-selected after removal
    e.target.value = ''

    if (files.length === 0) return

    const remaining = maxCount - images.length
    const toProcess = files.slice(0, remaining)

    for (const file of toProcess) {
      // Client-side validation
      if (!ALLOWED_TYPES.includes(file.type)) {
        setUploadError(`"${file.name}" không hợp lệ — chỉ chấp nhận JPG hoặc PNG.`)
        continue
      }
      if (file.size > MAX_SIZE_BYTES) {
        setUploadError(`"${file.name}" vượt quá 5 MB.`)
        continue
      }

      setUploading(true)
      setUploadError(null)
      try {
        const supabase = createClient()
        const ext = file.name.split('.').pop() ?? 'jpg'
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const storagePath = `${userId}/${kudoId}/${filename}`

        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(storagePath, file, { upsert: false })

        if (error) {
          setUploadError(`Tải ảnh thất bại: ${error.message}`)
          continue
        }

        const previewUrl = URL.createObjectURL(file)
        onAdd({
          id: crypto.randomUUID(),
          previewUrl,
          storagePath,
          name: file.name,
        })
      } catch (err) {
        setUploadError('Đã xảy ra lỗi khi tải ảnh lên.')
        console.error('[ImageUploader] upload error', err)
      } finally {
        setUploading(false)
      }
    }
  }

  return (
    <div className="flex flex-row items-start gap-4">
      {/* Section label */}
      <span
        className="shrink-0 pt-1 font-montserrat text-[22px] font-bold leading-7 tracking-[0px]"
        style={{ color: '#00101A' }}
      >
        Image
      </span>

      <div className="flex flex-1 flex-col gap-2">
        {/* Thumbnails + add button row */}
        <div className="flex flex-row flex-wrap items-center gap-4">
          {images.map((img) => (
            <div
              key={img.id}
              className="relative shrink-0"
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '18px',
                border: '1px solid #998C5F',
                background: '#FFF',
                overflow: 'hidden',
              }}
            >
              <Image
                src={img.previewUrl}
                alt={img.name ?? 'Ảnh đã chọn'}
                fill
                className="object-cover"
                style={{ borderRadius: '4px' }}
                unoptimized
              />

              {/* Remove button */}
              <button
                type="button"
                aria-label={`Xóa ảnh ${img.name ?? ''}`}
                onClick={() => onRemove(img.id)}
                className="absolute -right-2 -top-2 flex items-center justify-center transition-opacity duration-150 hover:opacity-80"
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '71px',
                  background: 'rgba(212,39,29,1)',
                  padding: '1.43px',
                }}
              >
                <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M2 2L15 15M15 2L2 15" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ))}

          {/* "+ Image" button — hidden when at limit; disabled until userId resolves */}
          {canAdd && (
            <button
              type="button"
              onClick={handleAddClick}
              disabled={uploading || disabled}
              className="flex items-center gap-2 rounded-lg px-2 py-1 transition-colors duration-150 hover:bg-[#FFF8E1] disabled:opacity-50"
              style={{ border: '1px solid #998C5F', background: '#FFF', height: '48px' }}
              aria-label={`Thêm ảnh (tối đa ${maxCount})`}
            >
              {uploading ? (
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#999" strokeWidth="2" />
                  <path className="opacity-75" fill="#999" d="M4 12a8 8 0 018-8v4l3-3-3-3V0a12 12 0 00-12 12h4z" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden className="shrink-0">
                  <path d="M12 5V19M5 12H19" stroke="#999" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
              <div className="flex flex-col items-start">
                <span className="font-montserrat text-[11px] font-bold leading-4 tracking-[0.5px]" style={{ color: '#999' }}>
                  + Image
                </span>
                <span className="font-montserrat text-[11px] font-bold leading-4 tracking-[0.5px]" style={{ color: '#999' }}>
                  Tối đa {maxCount}
                </span>
              </div>
            </button>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            multiple
            className="sr-only"
            onChange={handleFileChange}
            aria-hidden
          />
        </div>

        {/* Upload error */}
        {uploadError && (
          <span className="font-montserrat text-xs font-bold" style={{ color: '#CF1322' }}>
            {uploadError}
          </span>
        )}
      </div>
    </div>
  )
}
