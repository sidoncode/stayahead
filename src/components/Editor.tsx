import { useState } from 'react'
import type { Note } from '../types'

interface Props {
  note: Note
  onChange: (patch: Partial<Omit<Note, 'id'>>) => void
  onDelete: () => void
}

export function Editor({ note, onChange, onDelete }: Props) {
  const [tagInput, setTagInput] = useState('')

  function addTag() {
    const tag = tagInput.trim().replace(/^#/, '').toLowerCase()
    if (tag && !note.tags.includes(tag)) {
      onChange({ tags: [...note.tags, tag] })
    }
    setTagInput('')
  }

  return (
    <div className="editor">
      <div className="editor-toolbar">
        <button onClick={() => onChange({ pinned: !note.pinned })}>
          {note.pinned ? 'Unpin' : 'Pin'}
        </button>
        <button
          className="danger"
          onClick={() => {
            if (confirm('Delete this note?')) onDelete()
          }}
        >
          Delete
        </button>
      </div>

      <input
        className="editor-title"
        placeholder="Title"
        value={note.title}
        onChange={(e) => onChange({ title: e.target.value })}
      />

      <div className="tag-row">
        {note.tags.map((t) => (
          <button
            key={t}
            className="tag removable"
            title="Remove tag"
            onClick={() => onChange({ tags: note.tags.filter((x) => x !== t) })}
          >
            #{t} ×
          </button>
        ))}
        <input
          className="tag-input"
          placeholder="Add tag…"
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

      <textarea
        className="editor-body"
        placeholder="Start writing…"
        value={note.body}
        onChange={(e) => onChange({ body: e.target.value })}
      />

      <div className="editor-footer">
        {note.body.trim() ? note.body.trim().split(/\s+/).length : 0} words · Edited{' '}
        {new Date(note.updatedAt).toLocaleString()}
      </div>
    </div>
  )
}
