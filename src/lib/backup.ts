import type { AppData, Folder, Note } from '../types'
import { newId } from './storage'
import { slug } from './text'

function download(filename: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const stamp = () => new Date().toISOString().slice(0, 10)

export function noteToMarkdown(note: Note, folders: Folder[]): string {
  const folder = folders.find((f) => f.id === note.folderId)?.name
  const meta = [
    '---',
    `title: ${JSON.stringify(note.title || 'Untitled')}`,
    folder && `folder: ${JSON.stringify(folder)}`,
    note.tags.length > 0 && `tags: [${note.tags.join(', ')}]`,
    note.pinned && 'pinned: true',
    `created: ${new Date(note.createdAt).toISOString()}`,
    `updated: ${new Date(note.updatedAt).toISOString()}`,
    '---',
  ].filter(Boolean)
  return `${meta.join('\n')}\n\n# ${note.title || 'Untitled'}\n\n${note.body}\n`
}

export function exportJson(data: AppData) {
  const backup = { app: 'stayahead', version: 2, exportedAt: new Date().toISOString(), ...data }
  download(`stayahead-backup-${stamp()}.json`, JSON.stringify(backup, null, 2), 'application/json')
}

export function exportMarkdown(data: AppData) {
  const text = data.notes.map((n) => noteToMarkdown(n, data.folders)).join('\n\n')
  download(`stayahead-notes-${stamp()}.md`, text, 'text/markdown')
}

export function exportNoteMarkdown(note: Note, folders: Folder[]) {
  download(`${slug(note.title)}.md`, noteToMarkdown(note, folders), 'text/markdown')
}

function markdownToNote(source: string, filename: string, folders: Folder[]): Note {
  const now = Date.now()
  let text = source
  const front: Record<string, string> = {}
  const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (fm) {
    text = text.slice(fm[0].length)
    for (const line of fm[1].split(/\r?\n/)) {
      const m = line.match(/^(\w+):\s*(.*)$/)
      if (m) front[m[1]] = m[2]
    }
  }
  const heading = text.match(/^\s*#\s+(.+)$/m)
  const body = heading ? text.replace(heading[0], '').trim() : text.trim()
  const unquote = (v?: string) => (v?.startsWith('"') ? (JSON.parse(v) as string) : v)

  let folderId: string | null = null
  const folderName = unquote(front.folder)
  if (folderName) {
    let folder = folders.find((f) => f.name === folderName)
    if (!folder) {
      folder = { id: newId(), name: folderName }
      folders.push(folder)
    }
    folderId = folder.id
  }
  const tags = front.tags
    ? front.tags.replace(/^\[|\]$/g, '').split(',').map((t) => t.trim()).filter(Boolean)
    : []

  return {
    id: newId(),
    title: unquote(front.title) ?? heading?.[1].trim() ?? filename.replace(/\.(md|markdown|txt)$/i, ''),
    body,
    folderId,
    tags,
    pinned: front.pinned === 'true',
    createdAt: now,
    updatedAt: now,
  }
}

export interface ImportResult {
  notes: Note[]
  folders: Folder[]
}

/** Parses a StayAhead JSON backup or plain Markdown files into notes to merge. */
export async function importFiles(files: File[]): Promise<ImportResult> {
  const notes: Note[] = []
  const folders: Folder[] = []
  for (const file of files) {
    const text = await file.text()
    if (file.name.endsWith('.json')) {
      const parsed = JSON.parse(text) as Partial<AppData> & { app?: string }
      if (parsed.app !== 'stayahead' || !Array.isArray(parsed.notes)) {
        throw new Error(`${file.name} is not a StayAhead backup.`)
      }
      folders.push(...(parsed.folders ?? []))
      notes.push(...parsed.notes)
    } else {
      // An all-notes export holds many notes, each starting with its own front matter.
      const chunks = text.split(/^(?=---\r?\ntitle:)/m).filter((c) => c.trim())
      for (const chunk of chunks) notes.push(markdownToNote(chunk, file.name, folders))
    }
  }
  return { notes, folders }
}
