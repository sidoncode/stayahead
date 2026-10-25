import { useCallback, useEffect, useRef, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { Placeholder } from '@tiptap/extensions'
import { Markdown } from '@tiptap/markdown'
import { exportNoteMarkdown, noteToMarkdown } from '../lib/backup'
import { editedLabel, wordCount } from '../lib/text'
import type { Folder, Note } from '../types'
import { Icon } from './Icon'
import { Menu, MenuItem, MenuLabel } from './Menu'
import { Toolbar } from './Toolbar'

interface Props {
  note: Note
  folders: Folder[]
  persistFailed: boolean
  onChange: (patch: Partial<Omit<Note, 'id'>>) => void
  onDelete: () => void
  onDuplicate: () => void
  /** Mobile: back to list. */
  onBack?: () => void
  notify: (text: string, tone?: 'ok' | 'error') => void
}

const SAVE_DELAY_MS = 400

export function Editor({ note, folders, persistFailed, onChange, onDelete, onDuplicate, onBack, notify }: Props) {
  const [title, setTitle] = useState(note.title)
  const [tagInput, setTagInput] = useState('')
  const [dirty, setDirty] = useState(false)
  const titleRef = useRef<HTMLTextAreaElement>(null)
  const [words, setWords] = useState(() => wordCount(note.body))
  const pending = useRef<Partial<Omit<Note, 'id'>>>({})
  /** Markdown as last seen by the editor, so loading/normalising a note never counts as an edit. */
  const baseline = useRef<string | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  })

  const flush = useCallback(() => {
    window.clearTimeout(timer.current)
    if (Object.keys(pending.current).length === 0) return
    onChangeRef.current(pending.current)
    pending.current = {}
    setDirty(false)
  }, [])

  const schedule = useCallback(
    (patch: Partial<Omit<Note, 'id'>>) => {
      pending.current = { ...pending.current, ...patch }
      setDirty(true)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(flush, SAVE_DELAY_MS)
    },
    [flush],
  )

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] }, link: { openOnClick: false, autolink: true } }),
      Image.configure({ allowBase64: true }),
      Placeholder.configure({ placeholder: 'Start writing…' }),
      Markdown,
    ],
    content: note.body,
    contentType: 'markdown',
    editorProps: { attributes: { class: 'prose', 'aria-label': 'Note body' } },
    onCreate: ({ editor: e }) => {
      baseline.current = e.getMarkdown()
    },
    onUpdate: ({ editor: e }) => {
      const body = e.getMarkdown()
      if (baseline.current === null || body === baseline.current) {
        baseline.current = body
        return
      }
      baseline.current = body
      setWords(wordCount(body))
      schedule({ body })
    },
  })

  // Save anything pending when the note is closed, the tab is hidden or the page unloads.
  useEffect(() => {
    const onHide = () => document.visibilityState === 'hidden' && flush()
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', flush)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', flush)
      flush()
    }
  }, [flush])

  // A brand-new note starts with the cursor in the title.
  useEffect(() => {
    if (!note.title && !note.body) titleRef.current?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on mount; the editor is keyed per note
  }, [])

  // Grow the title field to fit wrapped text.
  useEffect(() => {
    const el = titleRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [title])

  function addTag() {
    const tag = tagInput.trim().replace(/^#/, '').toLowerCase()
    if (tag && !note.tags.includes(tag)) onChange({ tags: [...note.tags, tag] })
    setTagInput('')
  }

  const folder = folders.find((f) => f.id === note.folderId)
  const draft = () => ({ ...note, title, body: editor?.getMarkdown() ?? note.body })

  async function copyNote() {
    try {
      await navigator.clipboard.writeText(noteToMarkdown(draft(), folders))
      notify('Copied as Markdown')
    } catch {
      notify('Could not access the clipboard', 'error')
    }
  }

  async function shareNote() {
    const n = draft()
    if (navigator.share) {
      try {
        await navigator.share({ title: n.title || 'Untitled', text: n.body })
      } catch {
        // dismissed by the user
      }
    } else {
      await copyNote()
    }
  }

  const status = persistFailed ? 'failed' : dirty ? 'unsaved' : 'saved'

  return (
    <article className="editor">
      <div className="editor-top">
        {onBack && (
          <button className="icon-btn mobile-only" onClick={onBack} aria-label="Back to notes">
            <Icon name="close" />
          </button>
        )}
        {editor && <Toolbar editor={editor} notify={notify} />}
        <div className="editor-actions">
          <button
            className={`icon-btn${note.pinned ? ' on' : ''}`}
            onClick={() => onChange({ pinned: !note.pinned })}
            aria-label={note.pinned ? 'Unpin note' : 'Pin note'}
            aria-pressed={note.pinned}
            title={note.pinned ? 'Unpin' : 'Pin'}
          >
            <Icon name="pin" />
          </button>
          <button className="icon-btn" onClick={shareNote} aria-label="Share note" title="Share">
            <Icon name="share" />
          </button>
          <button className="icon-btn" onClick={copyNote} aria-label="Copy as Markdown" title="Copy as Markdown">
            <Icon name="copy" />
          </button>
          <Menu
            trigger={(t) => (
              <button className="icon-btn" aria-label="More actions" {...t}>
                <Icon name="more" />
              </button>
            )}
          >
            {(close) => (
              <>
                <MenuItem
                  icon="new-note"
                  label="Duplicate"
                  onClick={() => {
                    close()
                    flush()
                    onDuplicate()
                  }}
                />
                <MenuItem
                  icon="export"
                  label="Export as Markdown"
                  onClick={() => {
                    close()
                    exportNoteMarkdown(draft(), folders)
                  }}
                />
                <MenuItem
                  icon="delete"
                  label="Delete note"
                  danger
                  onClick={() => {
                    close()
                    onDelete()
                  }}
                />
              </>
            )}
          </Menu>
        </div>
      </div>

      <div className="editor-scroll">
        <div className="editor-inner">
          <div className="meta-row">
            <Menu
              align="left"
              trigger={(t) => (
                <button className="meta-folder" {...t}>
                  <Icon name={folder ? 'folder' : 'folders'} size={16} />
                  {folder?.name ?? 'No folder'}
                </button>
              )}
            >
              {(close) => (
                <>
                  <MenuLabel>Move to folder</MenuLabel>
                  <MenuItem
                    icon="empty-state"
                    label="No folder"
                    selected={!note.folderId}
                    onClick={() => {
                      onChange({ folderId: null })
                      close()
                    }}
                  />
                  {folders.map((f) => (
                    <MenuItem
                      key={f.id}
                      icon={f.id === note.folderId ? 'folder-selected' : 'folder'}
                      label={f.name}
                      selected={f.id === note.folderId}
                      onClick={() => {
                        onChange({ folderId: f.id })
                        close()
                      }}
                    />
                  ))}
                </>
              )}
            </Menu>
            <span>· {editedLabel(note.updatedAt)}</span>
          </div>

          <textarea
            ref={titleRef}
            rows={1}
            className="editor-title"
            placeholder="Untitled"
            aria-label="Title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value.replace(/\n/g, ' '))
              schedule({ title: e.target.value.replace(/\n/g, ' ') })
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                editor?.commands.focus('start')
              }
            }}
          />

          <div className="tag-row">
            <Icon name="tags" size={16} className="faint" />
            {note.tags.map((t) => (
              <span key={t} className="tag">
                {t}
                <button onClick={() => onChange({ tags: note.tags.filter((x) => x !== t) })} aria-label={`Remove tag ${t}`}>
                  <Icon name="close" size={12} />
                </button>
              </span>
            ))}
            <input
              className="tag-input"
              placeholder="Add tag"
              aria-label="Add tag"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault()
                  addTag()
                }
              }}
              onBlur={addTag}
            />
          </div>

          <EditorContent editor={editor} />
        </div>
      </div>

      <footer className="editor-foot">
        <span className={`status ${status}`}>
          <Icon name={status === 'saved' ? 'saved' : status === 'failed' ? 'error' : 'unsaved'} size={16} />
          {status === 'saved' ? 'Saved locally' : status === 'failed' ? 'Not saved. Storage is full' : 'Saving…'}
        </span>
        {status === 'unsaved' && (
          <button className="link-btn" onClick={flush}>
            <Icon name="save" size={16} />
            Save now
          </button>
        )}
        <span className="foot-words">{words} {words === 1 ? 'word' : 'words'}</span>
      </footer>
    </article>
  )
}
