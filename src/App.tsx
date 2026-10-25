import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Editor } from './components/Editor'
import { BrandDefs, Icon } from './components/Icon'
import { Modal } from './components/Modal'
import { NoteList } from './components/NoteList'
import { SettingsModal } from './components/SettingsModal'
import { Sidebar } from './components/Sidebar'
import { Splash } from './components/Splash'
import { Toast, type ToastMessage } from './components/Toast'
import { Welcome } from './components/Welcome'
import { useMediaQuery } from './hooks/useMediaQuery'
import { useStore } from './hooks/useStore'
import { exportJson, importFiles } from './lib/backup'
import { shouldShowSplash } from './lib/splash'
import type { Note, View } from './types'

export default function App() {
  const store = useStore()
  const { data } = store
  const isMobile = useMediaQuery('(max-width: 899px)')

  const [splash, setSplash] = useState(shouldShowSplash)
  const [view, setView] = useState<View>({ kind: 'all' })
  const [tagFilter, setTagFilter] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [drawer, setDrawer] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [deleting, setDeleting] = useState<Note | null>(null)
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const toastTimer = useRef<number | undefined>(undefined)

  const notify = useCallback((text: string, tone: 'ok' | 'error' = 'ok') => {
    window.clearTimeout(toastTimer.current)
    setToast({ id: Date.now(), text, tone })
    toastTimer.current = window.setTimeout(() => setToast(null), 3200)
  }, [])

  // Cmd/Ctrl+K jumps to search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        focusSearch()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  function focusSearch() {
    setDrawer(false)
    setSelectedId(null)
    window.setTimeout(() => searchRef.current?.focus(), 0)
  }

  const allTags = useMemo(() => [...new Set(data.notes.flatMap((n) => n.tags))].sort(), [data.notes])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const { sort } = data.settings
    return data.notes
      .filter((n) => {
        if (view.kind === 'pinned') return n.pinned
        if (view.kind === 'folder') return n.folderId === view.id
        return true
      })
      .filter((n) => !tagFilter || n.tags.includes(tagFilter))
      .filter(
        (n) =>
          !q ||
          n.title.toLowerCase().includes(q) ||
          n.body.toLowerCase().includes(q) ||
          n.tags.some((t) => t.includes(q)),
      )
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return Number(b.pinned) - Number(a.pinned)
        if (sort === 'title') return (a.title || 'Untitled').localeCompare(b.title || 'Untitled')
        return sort === 'created' ? b.createdAt - a.createdAt : b.updatedAt - a.updatedAt
      })
  }, [data.notes, data.settings, view, tagFilter, query])

  const selected = data.notes.find((n) => n.id === selectedId) ?? null

  const viewTitle =
    view.kind === 'pinned' ? 'Pinned' : view.kind === 'folder' ? (data.folders.find((f) => f.id === view.id)?.name ?? 'Folder') : 'All notes'

  function changeView(v: View) {
    setView(v)
    setDrawer(false)
  }

  function newNote() {
    const folderId = view.kind === 'folder' ? view.id : null
    const id = store.addNote({ folderId, pinned: view.kind === 'pinned' })
    setQuery('')
    setSelectedId(id)
    setDrawer(false)
  }

  function confirmDelete() {
    if (!deleting) return
    const idx = visible.findIndex((n) => n.id === deleting.id)
    const next = visible[idx + 1] ?? visible[idx - 1]
    store.deleteNote(deleting.id)
    setSelectedId(isMobile ? null : (next?.id ?? null))
    setDeleting(null)
    notify('Note deleted')
  }

  async function runImport(files: File[]) {
    try {
      const result = await importFiles(files)
      const count = store.importData(result)
      store.updateSettings({ welcomed: true })
      setSettingsOpen(false)
      notify(`Imported ${count} ${count === 1 ? 'note' : 'notes'}`)
    } catch (e) {
      notify(e instanceof Error ? e.message : 'That file could not be imported.', 'error')
    }
  }

  const showWelcome = !data.settings.welcomed && data.notes.length === 0
  const nearFull = store.usedRatio >= 0.9
  const showBanner = store.persistFailed || nearFull

  const chips = [
    { id: null, label: 'All', active: view.kind === 'all', onClick: () => changeView({ kind: 'all' }) },
    ...data.folders.map((f) => ({
      id: f.id,
      label: f.name,
      active: view.kind === 'folder' && view.id === f.id,
      onClick: () => changeView({ kind: 'folder', id: f.id }),
    })),
  ]

  const sidebar = (
    <Sidebar
      data={data}
      view={view}
      tagFilter={tagFilter}
      usedBytes={store.usedBytes}
      usedRatio={store.usedRatio}
      onView={changeView}
      onTag={(t) => {
        setTagFilter(t)
        setDrawer(false)
      }}
      onNewNote={newNote}
      onSearch={focusSearch}
      onSettings={() => {
        setDrawer(false)
        setSettingsOpen(true)
      }}
      onExport={() => exportJson(data)}
      onAddFolder={store.addFolder}
      onRenameFolder={store.renameFolder}
      onDeleteFolder={(id) => {
        store.deleteFolder(id)
        if (view.kind === 'folder' && view.id === id) setView({ kind: 'all' })
      }}
      onClose={isMobile ? () => setDrawer(false) : undefined}
    />
  )

  const mobileEditor = isMobile && selected

  return (
    <>
      <BrandDefs />
      <div className="app">
        {!isMobile && sidebar}
        {isMobile && drawer && (
          <div className="drawer-scrim" onMouseDown={(e) => e.target === e.currentTarget && setDrawer(false)}>
            <div className="drawer">{sidebar}</div>
          </div>
        )}

        {showBanner && (
          <div className={`banner${store.persistFailed ? ' error' : ''}`} role="alert">
            <Icon name="storage-warning" size={20} />
            <span>
              {store.persistFailed
                ? 'Your latest changes could not be saved because local storage is full. Export a backup to free space.'
                : `Local storage is ${Math.round(store.usedRatio * 100)}% full. Export a backup to free space.`}
            </span>
            <button className="link-btn gold" onClick={() => exportJson(data)}>
              Export
            </button>
          </div>
        )}

        {!mobileEditor && (
          <NoteList
            ref={searchRef}
            title={viewTitle}
            notes={visible}
            folders={data.folders}
            tags={allTags}
            selectedId={selectedId}
            query={query}
            sort={data.settings.sort}
            tagFilter={tagFilter}
            totalNotes={data.notes.length}
            chips={chips}
            onQuery={setQuery}
            onSelect={setSelectedId}
            onSort={(sort) => store.updateSettings({ sort })}
            onTag={setTagFilter}
            onNewNote={newNote}
            onMenu={() => setDrawer(true)}
          />
        )}

        {(!isMobile || mobileEditor) && (
          <main className="main">
            {selected ? (
              <Editor
                key={selected.id}
                note={selected}
                folders={data.folders}
                persistFailed={store.persistFailed}
                notify={notify}
                onChange={(patch) => store.updateNote(selected.id, patch)}
                onDelete={() => setDeleting(selected)}
                onDuplicate={() => {
                  const id = store.duplicateNote(selected.id)
                  if (id) setSelectedId(id)
                }}
                onBack={isMobile ? () => setSelectedId(null) : undefined}
              />
            ) : (
              <div className="placeholder">
                <Icon name="empty-state" size={48} />
                <strong>Select a note or create a new one</strong>
                <button className="btn btn-secondary" onClick={newNote}>
                  <Icon name="new-note" size={18} />
                  New note
                </button>
              </div>
            )}
          </main>
        )}
      </div>

      {showWelcome && (
        <Welcome
          onStart={() => {
            store.updateSettings({ welcomed: true })
            setSelectedId(store.addNote())
          }}
          onImport={runImport}
        />
      )}

      {settingsOpen && (
        <SettingsModal
          data={data}
          usedBytes={store.usedBytes}
          usedRatio={store.usedRatio}
          onImport={runImport}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {deleting && (
        <Modal
          title="Delete note"
          onClose={() => setDeleting(null)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setDeleting(null)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={confirmDelete}>
                <Icon name="delete" />
                Delete note
              </button>
            </>
          }
        >
          <p className="modal-text">
            “{deleting.title.trim() || 'Untitled'}” will be removed from this device. This can’t be undone.
          </p>
        </Modal>
      )}

      <Toast toast={toast} />
      {splash && <Splash onDone={() => setSplash(false)} />}
    </>
  )
}
