export interface Note {
  id: string
  title: string
  /** Markdown source. */
  body: string
  folderId: string | null
  tags: string[]
  pinned: boolean
  createdAt: number
  updatedAt: number
}

export interface Folder {
  id: string
  name: string
}

export type SortKey = 'updated' | 'created' | 'title'

export interface Settings {
  sort: SortKey
  welcomed: boolean
}

export interface AppData {
  notes: Note[]
  folders: Folder[]
  settings: Settings
}

export type View = { kind: 'all' } | { kind: 'pinned' } | { kind: 'folder'; id: string }
