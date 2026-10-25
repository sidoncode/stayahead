import { useState } from 'react'
import { formatBytes, STORAGE_LIMIT_BYTES } from '../lib/storage'
import type { AppData, View } from '../types'
import { Icon } from './Icon'
import { LogoLockup } from './Logo'
import { Menu, MenuItem } from './Menu'
import { NameInput } from './NameInput'

interface Props {
  data: AppData
  view: View
  tagFilter: string | null
  usedBytes: number
  usedRatio: number
  onView: (v: View) => void
  onTag: (t: string | null) => void
  onNewNote: () => void
  onSearch: () => void
  onSettings: () => void
  onExport: () => void
  onAddFolder: (name: string) => string | null
  onRenameFolder: (id: string, name: string) => string | null
  onDeleteFolder: (id: string) => void
  /** Mobile drawer close. */
  onClose?: () => void
}

export function Sidebar(p: Props) {
  const { data, view } = p
  const [adding, setAdding] = useState(false)
  const [renaming, setRenaming] = useState<string | null>(null)

  const pinned = data.notes.filter((n) => n.pinned).length
  const folderCount = (id: string) => data.notes.filter((n) => n.folderId === id).length
  const tags = [...new Set(data.notes.flatMap((n) => n.tags))].sort()
  const tagCount = (t: string) => data.notes.filter((n) => n.tags.includes(t)).length
  const nearFull = p.usedRatio >= 0.9

  return (
    <aside className="sidebar">
      <header className="sidebar-head">
        <LogoLockup symbol={28} text={17} />
        {p.onClose && (
          <button className="icon-btn" onClick={p.onClose} aria-label="Close menu">
            <Icon name="close" />
          </button>
        )}
      </header>

      <button className="btn btn-primary btn-block" onClick={p.onNewNote}>
        <Icon name="new-note" size={18} />
        New note
      </button>

      <nav className="nav">
        <button className={`nav-item${view.kind === 'all' ? ' active' : ''}`} onClick={() => p.onView({ kind: 'all' })}>
          <Icon name="empty-state" />
          <span>All notes</span>
          <em>{data.notes.length}</em>
        </button>
        <button
          className={`nav-item${view.kind === 'pinned' ? ' active' : ''}`}
          onClick={() => p.onView({ kind: 'pinned' })}
        >
          <Icon name="pin" />
          <span>Pinned</span>
          <em>{pinned}</em>
        </button>
        <button className="nav-item" onClick={p.onSearch}>
          <Icon name="search" />
          <span>Search</span>
          <kbd>⌘K</kbd>
        </button>
      </nav>

      <div className="nav-section">
        <div className="caption-row">
          <span className="caption">Folders</span>
          <button className="icon-btn icon-btn-sm" onClick={() => setAdding(true)} aria-label="New folder">
            <Icon name="folders" size={16} />
          </button>
        </div>
        {data.folders.map((f) => {
          const active = view.kind === 'folder' && view.id === f.id
          return renaming === f.id ? (
            <NameInput
              key={f.id}
              initial={f.name}
              placeholder="Folder name"
              onSubmit={(name) => {
                const err = p.onRenameFolder(f.id, name)
                if (!err) setRenaming(null)
                return err
              }}
              onCancel={() => setRenaming(null)}
            />
          ) : (
            <div key={f.id} className={`nav-item nav-folder${active ? ' active' : ''}`}>
              <button className="nav-hit" onClick={() => p.onView({ kind: 'folder', id: f.id })}>
                <Icon name={active ? 'folder-selected' : 'folder'} />
                <span>{f.name}</span>
                <em>{folderCount(f.id)}</em>
              </button>
              <Menu
                align="left"
                trigger={(t) => (
                  <button className="icon-btn icon-btn-sm row-more" aria-label={`${f.name} options`} {...t}>
                    <Icon name="more" size={16} />
                  </button>
                )}
              >
                {(close) => (
                  <>
                    <MenuItem
                      icon="new-note"
                      label="Rename"
                      onClick={() => {
                        close()
                        setRenaming(f.id)
                      }}
                    />
                    <MenuItem
                      icon="delete"
                      label="Delete folder"
                      danger
                      onClick={() => {
                        close()
                        p.onDeleteFolder(f.id)
                      }}
                    />
                  </>
                )}
              </Menu>
            </div>
          )
        })}
        {adding && (
          <NameInput
            placeholder="Folder name"
            onSubmit={(name) => {
              const err = p.onAddFolder(name)
              if (!err) setAdding(false)
              return err
            }}
            onCancel={() => setAdding(false)}
          />
        )}
        {data.folders.length === 0 && !adding && <p className="nav-hint">Group related notes in folders.</p>}
      </div>

      {tags.length > 0 && (
        <div className="nav-section">
          <div className="caption-row">
            <span className="caption">Tags</span>
            <Icon name="tags" size={16} className="faint" />
          </div>
          {tags.map((t) => {
            const active = p.tagFilter === t
            return (
              <button key={t} className={`nav-item${active ? ' active' : ''}`} onClick={() => p.onTag(active ? null : t)}>
                <Icon name={active ? 'tag-selected' : 'tag'} />
                <span>{t}</span>
                <em>{tagCount(t)}</em>
              </button>
            )
          })}
        </div>
      )}

      <div className={`storage${nearFull ? ' warn' : ''}`}>
        {nearFull ? (
          <>
            <span className="storage-warn">
              <Icon name="storage-warning" size={18} />
              {Math.round(p.usedRatio * 100)}% full
            </span>
            <button className="link-btn gold" onClick={p.onExport}>
              Export a backup
            </button>
          </>
        ) : (
          <span className="storage-label">Stored on this device</span>
        )}
        <div className="meter" role="progressbar" aria-valuenow={Math.round(p.usedRatio * 100)} aria-valuemin={0} aria-valuemax={100}>
          <div style={{ width: `${Math.max(2, p.usedRatio * 100)}%` }} />
        </div>
        <span className="storage-value">
          {formatBytes(p.usedBytes)} <span>of {formatBytes(STORAGE_LIMIT_BYTES)}</span>
        </span>
      </div>

      <button className="nav-item" onClick={p.onSettings}>
        <Icon name="settings" />
        <span>Settings</span>
      </button>
    </aside>
  )
}
