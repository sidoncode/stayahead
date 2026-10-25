import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { STORAGE_LIMIT_BYTES, isNameTaken, loadData, newId, saveData, storageBytes } from '../lib/storage'
import type { AppData, Folder, Note, Settings } from '../types'
import type { ImportResult } from '../lib/backup'

export function useStore() {
  const [data, setData] = useState<AppData>(() => loadData())
  const [persistFailed, setPersistFailed] = useState(false)
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    setPersistFailed(!saveData(data))
  }, [data])

  const addNote = useCallback((init: Partial<Note> = {}): string => {
    const now = Date.now()
    const note: Note = {
      title: '',
      body: '',
      folderId: null,
      tags: [],
      pinned: false,
      createdAt: now,
      updatedAt: now,
      ...init,
      id: newId(),
    }
    setData((d) => ({ ...d, notes: [note, ...d.notes] }))
    return note.id
  }, [])

  const updateNote = useCallback((id: string, patch: Partial<Omit<Note, 'id'>>) => {
    setData((d) => ({
      ...d,
      notes: d.notes.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n)),
    }))
  }, [])

  const deleteNote = useCallback((id: string) => {
    setData((d) => ({ ...d, notes: d.notes.filter((n) => n.id !== id) }))
  }, [])

  const duplicateNote = useCallback(
    (id: string): string | null => {
      const src = data.notes.find((n) => n.id === id)
      if (!src) return null
      const now = Date.now()
      return addNote({ ...src, title: `${src.title || 'Untitled'} copy`, pinned: false, createdAt: now, updatedAt: now })
    },
    [data.notes, addNote],
  )

  /** Returns an error message, or null on success. */
  const addFolder = useCallback(
    (name: string): string | null => {
      const trimmed = name.trim()
      if (!trimmed) return 'Give the folder a name.'
      if (isNameTaken(data.folders, trimmed)) return 'A folder with this name already exists.'
      const folder: Folder = { id: newId(), name: trimmed }
      setData((d) => ({ ...d, folders: [...d.folders, folder] }))
      return null
    },
    [data.folders],
  )

  const renameFolder = useCallback(
    (id: string, name: string): string | null => {
      const trimmed = name.trim()
      if (!trimmed) return 'Give the folder a name.'
      if (isNameTaken(data.folders, trimmed, id)) return 'A folder with this name already exists.'
      setData((d) => ({ ...d, folders: d.folders.map((f) => (f.id === id ? { ...f, name: trimmed } : f)) }))
      return null
    },
    [data.folders],
  )

  const deleteFolder = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      folders: d.folders.filter((f) => f.id !== id),
      notes: d.notes.map((n) => (n.folderId === id ? { ...n, folderId: null } : n)),
    }))
  }, [])

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setData((d) => ({ ...d, settings: { ...d.settings, ...patch } }))
  }, [])

  /** Merges imported notes and folders. Existing ids are overwritten by the import. Returns the count added. */
  const importData = useCallback((incoming: ImportResult): number => {
    setData((d) => {
      const folders = [...d.folders]
      const idMap = new Map<string, string>()
      for (const f of incoming.folders) {
        const existing = folders.find((x) => x.id === f.id || x.name.toLowerCase() === f.name.toLowerCase())
        if (existing) idMap.set(f.id, existing.id)
        else folders.push(f)
      }
      const byId = new Map(d.notes.map((n) => [n.id, n]))
      for (const n of incoming.notes) {
        byId.set(n.id, { ...n, folderId: n.folderId ? (idMap.get(n.folderId) ?? n.folderId) : null })
      }
      return { ...d, folders, notes: [...byId.values()] }
    })
    return incoming.notes.length
  }, [])

  const usedBytes = useMemo(() => storageBytes(data), [data])
  const usedRatio = Math.min(1, usedBytes / STORAGE_LIMIT_BYTES)

  return {
    data,
    persistFailed,
    usedBytes,
    usedRatio,
    addNote,
    updateNote,
    deleteNote,
    duplicateNote,
    addFolder,
    renameFolder,
    deleteFolder,
    updateSettings,
    importData,
  }
}

export type Store = ReturnType<typeof useStore>
