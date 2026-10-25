import type { AppData, Folder, Note } from '../types'

const KEY = 'stayahead.v2'
const LEGACY_KEY = 'stayahead.notes.v1'

/** Browsers cap localStorage at roughly 5 MB per origin. */
export const STORAGE_LIMIT_BYTES = 5 * 1024 * 1024

export const DEFAULT_DATA: AppData = {
  notes: [],
  folders: [],
  settings: { sort: 'updated', welcomed: false },
}

export function newId(): string {
  return crypto.randomUUID()
}

interface LegacyNote {
  id: string
  title: string
  body: string
  tags: string[]
  pinned: boolean
  createdAt: number
  updatedAt: number
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppData>
      return {
        notes: parsed.notes ?? [],
        folders: parsed.folders ?? [],
        settings: { ...DEFAULT_DATA.settings, ...parsed.settings },
      }
    }
    const legacy = localStorage.getItem(LEGACY_KEY)
    if (legacy) {
      const notes = (JSON.parse(legacy) as LegacyNote[]).map<Note>((n) => ({ ...n, folderId: null }))
      // Anyone with v1 notes has already used the app, so skip the welcome screen.
      return { ...DEFAULT_DATA, notes, settings: { ...DEFAULT_DATA.settings, welcomed: true } }
    }
  } catch {
    // corrupted storage: fall through to an empty workspace
  }
  return DEFAULT_DATA
}

/** Returns false when the browser refused the write (quota or blocked storage). */
export function saveData(data: AppData): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
    return true
  } catch {
    return false
  }
}

export function storageBytes(data: AppData): number {
  // localStorage stores UTF-16, so each character costs two bytes.
  return JSON.stringify(data).length * 2
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function isNameTaken(folders: Folder[], name: string, ignoreId?: string): boolean {
  const n = name.trim().toLowerCase()
  return folders.some((f) => f.id !== ignoreId && f.name.trim().toLowerCase() === n)
}
