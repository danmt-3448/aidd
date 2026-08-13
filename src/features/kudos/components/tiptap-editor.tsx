'use client'

import { useEditor, EditorContent, ReactRenderer } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import Mention from '@tiptap/extension-mention'
import { type SuggestionOptions } from '@tiptap/suggestion'
import { useCallback, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { RichTextToolbar, type ToolbarAction } from './rich-text-toolbar'
import { MentionList, type MentionListRef, type MentionItem } from './tiptap-mention-list'

interface TiptapEditorProps {
  onChange: (html: string, charCount: number) => void
  maxLength?: number
  /** Profiles available for @mention suggestion */
  mentionItems?: MentionItem[]
  /**
   * Pre-populate the editor with HTML content (edit mode).
   * Consumed once on mount — changing it after mount has no effect.
   * Keep stable (useMemo or a literal) to avoid thrashing the editor.
   */
  initialContent?: string
}

export function TiptapEditor({
  onChange,
  maxLength = 2000,
  mentionItems = [],
  initialContent = '',
}: TiptapEditorProps) {
  const t = useTranslations('kudos')

  // Ref holds the latest mention list, read ONLY inside TipTap's deferred
  // suggestion callbacks (items/render/onKeyDown fire on user input, never
  // during React render). The react-hooks/refs report on Mention.configure
  // below is therefore a false positive — suppressed there with justification.
  const mentionItemsRef = useRef<MentionItem[]>(mentionItems)
  useEffect(() => {
    mentionItemsRef.current = mentionItems
  }, [mentionItems])

  const buildSuggestion = useCallback((): Partial<SuggestionOptions> => ({
    items: ({ query }: { query: string }) => {
      const q = query.toLowerCase()
      return mentionItemsRef.current
        .filter((item) => item.name.toLowerCase().includes(q))
        .slice(0, 8)
    },

    render: () => {
      // Use a plain floating div rendered via ReactRenderer into a portal container
      let component: ReactRenderer<MentionListRef>
      let container: HTMLDivElement

      return {
        onStart: (props) => {
          container = document.createElement('div')
          container.style.position = 'fixed'
          container.style.zIndex = '9999'
          document.body.appendChild(container)

          component = new ReactRenderer(MentionList, {
            props,
            editor: props.editor,
          })
          container.appendChild(component.element)

          // Position below caret
          const rect = props.clientRect?.()
          if (rect) {
            container.style.top = `${rect.bottom + 4}px`
            container.style.left = `${rect.left}px`
          }
        },

        onUpdate: (props) => {
          component.updateProps(props)
          const rect = props.clientRect?.()
          if (rect) {
            container.style.top = `${rect.bottom + 4}px`
            container.style.left = `${rect.left}px`
          }
        },

        onKeyDown: (props) => {
          if (props.event.key === 'Escape') {
            container.style.display = 'none'
            return true
          }
          return component.ref?.onKeyDown(props) ?? false
        },

        onExit: () => {
          component.destroy()
          container.remove()
        },
      }
    },
  }), [])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      Placeholder.configure({ placeholder: t('contentPlaceholder') }),
      CharacterCount.configure({ limit: maxLength }),
      // eslint-disable-next-line react-hooks/refs -- suggestion callbacks read mentionItemsRef only on user input (deferred), not during render
      Mention.configure({
        HTMLAttributes: { class: 'mention', 'data-type': 'mention' },
        suggestion: buildSuggestion(),
        renderHTML: ({ options, node }) => [
          'span',
          {
            ...options.HTMLAttributes,
            'data-id': node.attrs.id as string,
          },
          `@${(node.attrs.label as string | null) ?? (node.attrs.id as string)}`,
        ],
      }),
    ],
    content: initialContent,
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML()
      const count = ed.storage.characterCount.characters() as number
      onChange(html, count)
    },
    editorProps: {
      attributes: {
        class: 'tiptap-content',
        'aria-label': t('contentAriaLabel'),
        'aria-multiline': 'true',
        role: 'textbox',
      },
    },
  })

  // In edit mode the editor mounts with pre-filled content but `onUpdate` does
  // not fire on mount — so the parent's charCount stays 0 and the submit button
  // stays disabled.  Fire once after the editor is ready to sync initial state.
  useEffect(() => {
    if (!editor || !initialContent) return
    const count = editor.storage.characterCount.characters() as number
    onChange(editor.getHTML(), count)
    // Run only once after the editor instance is created (editor ref is stable).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor])

  const handleToolbarAction = useCallback(
    (action: ToolbarAction) => {
      if (!editor) return
      const chain = editor.chain().focus()
      switch (action) {
        case 'bold':
          chain.toggleBold().run()
          break
        case 'italic':
          chain.toggleItalic().run()
          break
        case 'strikethrough':
          chain.toggleStrike().run()
          break
        case 'orderedList':
          chain.toggleOrderedList().run()
          break
        case 'link': {
          const prev = editor.getAttributes('link').href as string | undefined
          const url = window.prompt('URL:', prev ?? 'https://')
          if (url === null) return
          if (url === '') {
            editor.chain().focus().unsetLink().run()
            return
          }
          // Reject non-http(s)/mailto schemes to prevent javascript:/data: in editor state
          try {
            const parsed = new URL(url)
            if (!['https:', 'http:', 'mailto:'].includes(parsed.protocol)) return
          } catch {
            // Unparseable URL — silently discard
            return
          }
          editor.chain().focus().setLink({ href: url }).run()
          break
        }
        case 'quote':
          chain.toggleBlockquote().run()
          break
      }
    },
    [editor],
  )

  const activeFormats: Partial<Record<ToolbarAction, boolean>> = editor
    ? {
        bold: editor.isActive('bold'),
        italic: editor.isActive('italic'),
        strikethrough: editor.isActive('strike'),
        orderedList: editor.isActive('orderedList'),
        link: editor.isActive('link'),
        quote: editor.isActive('blockquote'),
      }
    : {}

  const charCount = (editor?.storage.characterCount.characters() as number) ?? 0

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-col" style={{ width: '100%' }}>
        <RichTextToolbar activeFormats={activeFormats} onAction={handleToolbarAction} />
        <div
          className="relative flex flex-col"
          style={{
            border: '1px solid #998C5F',
            borderTop: 'none',
            background: '#FFF',
            borderRadius: '0 0 8px 8px',
            minHeight: '200px',
          }}
        >
          <EditorContent
            editor={editor}
            className="tiptap-wrapper flex-1 px-6 py-4"
          />
        </div>
      </div>

      {/* Hint + char counter */}
      <div className="flex flex-row items-center justify-between">
        <span
          className="font-montserrat text-base font-bold leading-6 tracking-[0.5px]"
          style={{ color: '#00101A' }}
        >
          {t('contentHint')}
        </span>
        <span
          className="shrink-0 font-montserrat text-xs leading-4"
          style={{ color: charCount > maxLength * 0.9 ? '#CF1322' : '#999' }}
        >
          {charCount}/{maxLength}
        </span>
      </div>
    </div>
  )
}
