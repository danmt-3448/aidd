'use client'

import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { useTranslations } from 'next-intl'

export interface MentionItem {
  id: string
  name: string
}

/** Shape passed to Tiptap's command callback — maps to node.attrs */
interface MentionCommandItem {
  id: string
  label: string
}

interface MentionListProps {
  items: MentionItem[]
  command: (item: MentionCommandItem) => void
}

export interface MentionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

export const MentionList = forwardRef<MentionListRef, MentionListProps>(
  ({ items, command }, ref) => {
    const t = useTranslations('kudos')
    const [selectedIndex, setSelectedIndex] = useState(0)

    const selectItem = (index: number) => {
      const item = items[index]
      if (item) command({ id: item.id, label: item.name })
    }

    const upHandler = () => {
      setSelectedIndex((prev) => (prev + items.length - 1) % items.length)
    }

    const downHandler = () => {
      setSelectedIndex((prev) => (prev + 1) % items.length)
    }

    const enterHandler = () => {
      selectItem(selectedIndex)
    }

    useEffect(() => setSelectedIndex(0), [items])

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: { event: KeyboardEvent }) => {
        if (event.key === 'ArrowUp') { upHandler(); return true }
        if (event.key === 'ArrowDown') { downHandler(); return true }
        if (event.key === 'Enter') { enterHandler(); return true }
        return false
      },
    }))

    return (
      <div
        data-testid="mention-list"
        className="z-50 overflow-hidden rounded-lg shadow-lg"
        style={{ border: '1px solid #998C5F', background: '#FFF', minWidth: '160px' }}
      >
        {items.length === 0 ? (
          <div className="px-4 py-2 text-sm text-[#999]">{t('recipientNotFound')}</div>
        ) : (
          items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => selectItem(index)}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm font-bold text-[#00101A] transition-colors hover:bg-[#FFF8E1]"
              style={{
                background: index === selectedIndex ? '#FFF8E1' : undefined,
              }}
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FFEA9E] text-xs font-bold text-[#00101A]">
                {item.name.charAt(0)}
              </div>
              {item.name}
            </button>
          ))
        )}
      </div>
    )
  },
)
MentionList.displayName = 'MentionList'
