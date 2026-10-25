import { forwardRef } from 'react'
import { previewText, relativeTime } from '../lib/text'
import type { Folder, Note, SortKey } from '../types'
import { Icon } from './Icon'
import { Menu, MenuItem, MenuLabel } from './Menu'

interface Props {
  title: string
  notes: Note[]
  folders: Folder[]
  tags: string[]
  selectedId: string | null
  query: string
  sort: SortKey
  tagFilter: string | null
  totalNotes: number
  onQuery: (q: string) => void
  onSelect: (id: string) => void
  onSort: (s: SortKey) => void
  onTag: (t: string | null) => void
  onNewNote: () => void
  onMenu: () => void
  /** Mobile folder chips. */
  chips: { id: string | null; label: string; active: boolean; onClick: () => void }[]
}

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'updated', label: 'Recently edited' },
  { key: 'created', label: 'Date created' },
  { key: 'title', label: 'Title A–Z' },
]

export const NoteList = forwardRef<HTMLInputElement, Props>(function NoteList(p, searchRef) {
  const folderName = (id: string | null) => p.folders.find((f) => f.id === id)?.name
  const filtering = !!p.query.trim() || !!p.tagFilter

  return (
    <section className="list-pane">
      <div className="list-head">
        <button className="icon-btn mobile-only" onClick={p.onMenu} aria-label="Open menu">
          <Icon name="menu" />
        </button>
        <h2>{p.title}</h2>
        <div className="list-actions">
          <Menu
            trigger={(t) => (
              <button className={`icon-btn${p.tagFilter ? ' on' : ''}`} aria-label="Filter by tag" {...t}>
                <Icon name="filter" size={20} />
              </button>
            )}
          >
            {(close) => (
              <>
                <MenuLabel>Filter by tag</MenuLabel>
                {p.tags.length === 0 && <div className="menu-empty">No tags yet</div>}
                {p.tags.map((t) => (
                  <MenuItem
                    key={t}
                    icon={p.tagFilter === t ? 'tag-selected' : 'tag'}
                    label={t}
                    selected={p.tagFilter === t}
                    onClick={() => {
                      p.onTag(p.tagFilter === t ? null : t)
                      close()
                    }}
                  />
                ))}
                {p.tagFilter && (
                  <MenuItem
                    icon="close"
                    label="Clear filter"
                    onClick={() => {
                      p.onTag(null)
                      close()
                    }}
                  />
                )}
              </>
            )}
          </Menu>
          <Menu
            trigger={(t) => (
              <button className="icon-btn" aria-label="Sort notes" {...t}>
                <Icon name="sort" size={20} />
              </button>
            )}
          >
            {(close) => (
              <>
                <MenuLabel>Sort by</MenuLabel>
                {SORTS.map((s) => (
                  <MenuItem
                    key={s.key}
                    label={s.label}
                    selected={p.sort === s.key}
                    onClick={() => {
                      p.onSort(s.key)
                      close()
                    }}
                  />
                ))}
              </>
            )}
          </Menu>
          <button className="icon-btn mobile-only" onClick={p.onNewNote} aria-label="New note">
            <Icon name="new-note" size={20} />
          </button>
        </div>
      </div>

      <label className="search">
        <Icon name="search" size={18} />
        <input
          ref={searchRef}
          type="search"
          placeholder="Search notes"
          value={p.query}
          onChange={(e) => p.onQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && p.onQuery('')}
        />
        {p.query && (
          <button className="icon-btn icon-btn-sm" onClick={() => p.onQuery('')} aria-label="Clear search">
            <Icon name="close" size={16} />
          </button>
        )}
      </label>

      <div className="chips mobile-only">
        {p.chips.map((c) => (
          <button key={c.label} className={`chip${c.active ? ' active' : ''}`} onClick={c.onClick}>
            {c.label}
          </button>
        ))}
      </div>

      {p.tagFilter && (
        <button className="active-filter" onClick={() => p.onTag(null)}>
          <Icon name="tag-selected" size={16} />
          {p.tagFilter}
          <Icon name="close" size={14} />
        </button>
      )}

      <ul className="cards">
        {p.notes.map((n) => {
          const meta = [folderName(n.folderId), relativeTime(n.updatedAt)].filter(Boolean).join(' · ')
          return (
            <li key={n.id}>
              <button className={`card${n.id === p.selectedId ? ' selected' : ''}`} onClick={() => p.onSelect(n.id)}>
                <span className="card-title">
                  {n.title.trim() || 'Untitled'}
                  {n.pinned && <Icon name="pin" size={14} className="card-pin" />}
                </span>
                <span className="card-preview">{previewText(n.body) || 'No additional text'}</span>
                <span className="card-meta">{meta}</span>
              </button>
            </li>
          )
        })}
      </ul>

      {p.notes.length === 0 && (
        <div className="empty">
          <Icon name="empty-state" size={40} />
          {filtering ? (
            <>
              <strong>No matching notes</strong>
              <span>Try a different search or clear the filter.</span>
            </>
          ) : p.totalNotes === 0 ? (
            <>
              <strong>No notes yet</strong>
              <span>Capture your first thought.</span>
              <button className="btn btn-secondary" onClick={p.onNewNote}>
                <Icon name="new-note" size={18} />
                New note
              </button>
            </>
          ) : (
            <>
              <strong>Nothing here</strong>
              <span>Notes you add to this view will show up here.</span>
            </>
          )}
        </div>
      )}
    </section>
  )
})
