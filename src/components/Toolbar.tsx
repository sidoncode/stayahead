import { useRef, useState } from 'react'
import type { Editor } from '@tiptap/react'
import { useEditorState } from '@tiptap/react'
import { Icon } from './Icon'
import type { IconName } from './icons.generated'

const MAX_IMAGE_BYTES = 1.5 * 1024 * 1024

interface Props {
  editor: Editor
  notify: (text: string, tone?: 'ok' | 'error') => void
}

type Panel = 'link' | 'image' | null

export function Toolbar({ editor, notify }: Props) {
  const [panel, setPanel] = useState<Panel>(null)
  const [url, setUrl] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      heading: e.isActive('heading'),
      bullet: e.isActive('bulletList'),
      ordered: e.isActive('orderedList'),
      code: e.isActive('code') || e.isActive('codeBlock'),
      link: e.isActive('link'),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  })

  function openPanel(next: Exclude<Panel, null>) {
    if (panel === next) return setPanel(null)
    setUrl(next === 'link' ? ((editor.getAttributes('link').href as string | undefined) ?? '') : '')
    setPanel(next)
  }

  function applyUrl() {
    const value = url.trim()
    if (panel === 'link') {
      if (!value) editor.chain().focus().extendMarkRange('link').unsetLink().run()
      else {
        const href = /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`
        editor.chain().focus().extendMarkRange('link').setLink({ href }).run()
      }
    } else if (value) {
      editor.chain().focus().setImage({ src: value }).run()
    }
    setPanel(null)
  }

  function pickFile(file: File) {
    if (file.size > MAX_IMAGE_BYTES) {
      notify('Images over 1.5 MB would fill local storage. Use a smaller one.', 'error')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      editor.chain().focus().setImage({ src: reader.result as string, alt: file.name }).run()
      setPanel(null)
    }
    reader.readAsDataURL(file)
  }

  const run = editor.chain().focus()
  const btn = (name: IconName, label: string, active: boolean, onClick: () => void, disabled = false) => (
    <button
      type="button"
      className={`tool${active ? ' active' : ''}`}
      aria-label={label}
      aria-pressed={active}
      title={label}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      <Icon name={name} />
    </button>
  )

  return (
    <div className="toolbar-wrap">
      <div className="toolbar" role="toolbar" aria-label="Formatting">
        {btn('bold', 'Bold', s.bold, () => run.toggleBold().run())}
        {btn('italic', 'Italic', s.italic, () => run.toggleItalic().run())}
        {btn('heading', 'Heading', s.heading, () => run.toggleHeading({ level: 2 }).run())}
        {btn('bullet-list', 'Bulleted list', s.bullet, () => run.toggleBulletList().run())}
        {btn('numbered-list', 'Numbered list', s.ordered, () => run.toggleOrderedList().run())}
        {btn('code', 'Code', s.code, () => run.toggleCode().run())}
        {btn('link', 'Link', s.link || panel === 'link', () => openPanel('link'))}
        {btn('image', 'Image', panel === 'image', () => openPanel('image'))}
        <span className="tool-sep" />
        {btn('undo', 'Undo', false, () => run.undo().run(), !s.canUndo)}
        {btn('redo', 'Redo', false, () => run.redo().run(), !s.canRedo)}
      </div>

      {panel && (
        <div className="panel-row">
          <input
            autoFocus
            className="field field-sm"
            placeholder={panel === 'link' ? 'Paste a link, leave empty to remove' : 'Paste an image address'}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') applyUrl()
              if (e.key === 'Escape') setPanel(null)
            }}
          />
          <button className="btn btn-primary btn-sm" onClick={applyUrl}>
            {panel === 'link' ? 'Apply' : 'Insert'}
          </button>
          {panel === 'image' && (
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => fileRef.current?.click()}>
                Choose file
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) pickFile(f)
                  e.target.value = ''
                }}
              />
            </>
          )}
          <button className="icon-btn icon-btn-sm" onClick={() => setPanel(null)} aria-label="Close">
            <Icon name="close" size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
