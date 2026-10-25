import { useMemo, useState } from 'react'
import { Editor } from './components/Editor'
import { NoteList } from './components/NoteList'
import { useNotes } from './hooks/useNotes'

export default function App() {
  const { notes, addNote, updateNote, deleteNote } = useNotes()
  const [selectedId, setSelectedId] = useState<string | null>(notes[0]?.id ?? null)
  const [query, setQuery] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)

  const allTags = useMemo(
    () => [...new Set(notes.flatMap((n) => n.tags))].sort(),
    [notes],
  )

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return notes
      .filter((n) => !activeTag || n.tags.includes(activeTag))
      .filter(
        (n) =>
          !q ||
          n.title.toLowerCase().includes(q) ||
          n.body.toLowerCase().includes(q) ||
          n.tags.some((t) => t.includes(q)),
      )
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt)
  }, [notes, query, activeTag])

  const selected = notes.find((n) => n.id === selectedId) ?? null

  return (
    <div className="app">
      <aside className="sidebar">
        <header className="sidebar-header">
          <h1>StayAhead</h1>
          <button className="primary" onClick={() => setSelectedId(addNote())}>
            + New
          </button>
        </header>

        <input
          className="search"
          type="search"
          placeholder="Search notes…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        {allTags.length > 0 && (
          <div className="tag-filter">
            {allTags.map((t) => (
              <button
                key={t}
                className={`tag${t === activeTag ? ' active' : ''}`}
                onClick={() => setActiveTag(t === activeTag ? null : t)}
              >
                #{t}
              </button>
            ))}
          </div>
        )}

        <NoteList notes={visible} selectedId={selectedId} onSelect={setSelectedId} />
      </aside>

      <main className="main">
        {selected ? (
          <Editor
            key={selected.id}
            note={selected}
            onChange={(patch) => updateNote(selected.id, patch)}
            onDelete={() => {
              deleteNote(selected.id)
              setSelectedId(null)
            }}
          />
        ) : (
          <div className="placeholder">
            <p>Select a note or create a new one.</p>
          </div>
        )}
      </main>
    </div>
  )
}
