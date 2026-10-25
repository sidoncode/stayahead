import type { Note } from '../types'

interface Props {
  notes: Note[]
  selectedId: string | null
  onSelect: (id: string) => void
}

function preview(body: string): string {
  const line = body.split('\n').find((l) => l.trim())
  return line ? line.trim().slice(0, 80) : 'No additional text'
}

export function NoteList({ notes, selectedId, onSelect }: Props) {
  if (notes.length === 0) {
    return <p className="empty">No notes found.</p>
  }

  return (
    <ul className="note-list">
      {notes.map((n) => (
        <li key={n.id}>
          <button
            className={`note-item${n.id === selectedId ? ' selected' : ''}`}
            onClick={() => onSelect(n.id)}
          >
            <span className="note-title">
              {n.pinned && <span aria-label="Pinned">📌 </span>}
              {n.title.trim() || 'Untitled'}
            </span>
            <span className="note-preview">{preview(n.body)}</span>
            <span className="note-meta">
              {new Date(n.updatedAt).toLocaleDateString()}
              {n.tags.map((t) => (
                <span key={t} className="tag">
                  #{t}
                </span>
              ))}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}
