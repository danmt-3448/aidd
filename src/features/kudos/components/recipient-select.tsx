'use client'

import Image from 'next/image'

export interface RecipientItem {
  id: string
  name: string
  avatarUrl?: string
  jobTitle?: string
}

interface RecipientSelectProps {
  value: RecipientItem | null
  options: RecipientItem[]
  onSelect: (recipient: RecipientItem | null) => void
  searchQuery: string
  onSearchChange: (q: string) => void
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  required?: boolean
  isLoading?: boolean
  error?: string
}

export function RecipientSelect({
  value,
  options,
  onSelect,
  searchQuery,
  onSearchChange,
  isOpen,
  onOpenChange,
  required,
  isLoading,
  error,
}: RecipientSelectProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-row items-center gap-4">
        {/* Section label */}
        <div className="flex shrink-0 flex-row items-center gap-0.5">
          <span
            className="font-montserrat text-[22px] font-bold leading-7 tracking-[0px]"
            style={{ color: '#00101A' }}
          >
            Người nhận
          </span>
          {required && (
            <span
              className="font-['Noto_Sans_JP'] text-base font-bold leading-5"
              style={{ color: '#CF1322' }}
            >
              *
            </span>
          )}
        </div>

        {/* Dropdown trigger */}
        <div className="relative flex-1">
          {/* Figma mms_B.2_Search node I520:11647;520:9873 */}
          <button
            type="button"
            data-fig="I520:11647;520:9873"
            onClick={() => onOpenChange(!isOpen)}
            className="flex w-full flex-row items-center justify-between rounded-lg px-6 py-4"
            style={{
              border: error ? '1px solid #CF1322' : '1px solid #998C5F',
              background: '#FFF',
            }}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
          >
            <div className="flex flex-row items-center gap-1">
              {value ? (
                <span
                  className="font-montserrat text-base font-bold leading-6 tracking-[0.15px]"
                  style={{ color: '#00101A' }}
                >
                  {value.name}
                </span>
              ) : (
                <span
                  className="font-montserrat text-base font-bold leading-6 tracking-[0.15px]"
                  style={{ color: '#999999' }}
                >
                  Tìm kiếm
                </span>
              )}
            </div>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
              className={`shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            >
              <path
                d="M6 9L12 15L18 9"
                stroke="#998C5F"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {isOpen && (
            <div
              className="absolute left-0 top-full z-50 mt-1 w-full overflow-hidden rounded-lg shadow-lg"
              style={{ border: '1px solid #998C5F', background: '#FFF' }}
            >
              {/* Search input */}
              <div className="border-b px-4 py-2" style={{ borderColor: '#998C5F' }}>
                <input
                  autoFocus
                  type="text"
                  placeholder="Tìm kiếm..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full bg-transparent font-montserrat text-sm font-bold leading-5 text-[#00101A] outline-none placeholder:font-normal placeholder:text-[#999]"
                />
              </div>

              <ul role="listbox" className="max-h-48 overflow-y-auto">
                {isLoading ? (
                  <li className="px-4 py-3 font-montserrat text-sm text-[#999]">
                    Đang tìm kiếm…
                  </li>
                ) : options.length === 0 && searchQuery.trim().length > 0 ? (
                  <li className="px-4 py-3 font-montserrat text-sm text-[#999]">
                    Không tìm thấy
                  </li>
                ) : options.length === 0 ? (
                  <li className="px-4 py-3 font-montserrat text-sm text-[#999]">
                    Nhập tên để tìm kiếm
                  </li>
                ) : (
                  options.map((opt) => (
                    <li
                      key={opt.id}
                      role="option"
                      aria-selected={value?.id === opt.id}
                      onClick={() => {
                        onSelect(opt)
                        onOpenChange(false)
                        onSearchChange('')
                      }}
                      className="flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors duration-150 hover:bg-[#FFF8E1]"
                    >
                      {opt.avatarUrl ? (
                        <Image
                          src={opt.avatarUrl}
                          alt={opt.name}
                          width={32}
                          height={32}
                          className="rounded-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FFEA9E] font-montserrat text-sm font-bold text-[#00101A]">
                          {opt.name.charAt(0)}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="font-montserrat text-sm font-bold leading-5 text-[#00101A]">
                          {opt.name}
                        </span>
                        {opt.jobTitle && (
                          <span className="font-montserrat text-xs leading-4 text-[#999]">
                            {opt.jobTitle}
                          </span>
                        )}
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Field error */}
      {error && (
        <span className="font-montserrat text-xs font-bold" style={{ color: '#CF1322' }}>
          {error}
        </span>
      )}
    </div>
  )
}
