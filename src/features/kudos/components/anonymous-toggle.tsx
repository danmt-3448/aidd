'use client'

interface AnonymousToggleProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  aliasValue?: string
  onAliasChange?: (alias: string) => void
}

export function AnonymousToggle({
  checked,
  onCheckedChange,
  aliasValue = '',
  onAliasChange,
}: AnonymousToggleProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Checkbox row — mms_G */}
      <div className="flex flex-row items-center gap-4">
        {/* Custom checkbox matching Figma: 24×24, border #999, bg white, radius 4px */}
        <button
          type="button"
          role="checkbox"
          aria-checked={checked}
          aria-label="Gửi ẩn danh"
          onClick={() => onCheckedChange(!checked)}
          className="flex shrink-0 items-center justify-center transition-colors duration-150"
          style={{
            width: '24px',
            height: '24px',
            border: '1px solid #999',
            background: checked ? '#FFEA9E' : '#FFF',
            borderRadius: '4px',
            aspectRatio: '1/1',
          }}
        >
          {checked && (
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <path
                d="M2 7L5.5 10.5L12 3.5"
                stroke="#00101A"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>

        {/* Label text from Figma — muted color (#999) = not checked style */}
        <span
          className="font-montserrat text-[22px] font-bold leading-7 tracking-[0px]"
          style={{ color: checked ? '#00101A' : '#999999' }}
        >
          Gửi lời cám ơn và ghi nhận ẩn danh
        </span>
      </div>

      {/* Alias field — visible only when anonymous checked */}
      {checked && (
        <div className="ml-10">
          <input
            type="text"
            placeholder="Tên hiển thị ẩn danh (để trống nếu không cần)"
            value={aliasValue}
            onChange={(e) => onAliasChange?.(e.target.value)}
            maxLength={100}
            className="w-full rounded-lg px-4 py-3 font-montserrat text-base font-bold leading-6 text-[#00101A] outline-none placeholder:font-normal placeholder:text-[#999]"
            style={{ border: '1px solid #998C5F', background: '#FFF' }}
            aria-label="Tên ẩn danh"
          />
        </div>
      )}
    </div>
  )
}
