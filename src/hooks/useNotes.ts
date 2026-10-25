import { useCallback, useEffect, useState } from 'react'
import type { Note } from '../types'

const STORAGE_KEY = 'stayahead.notes.v1'

function load(): Note[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Note[]) : []
  } catch {
    return []
  }
}

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>(load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
    } catch {
      // storage full or unavailable; keep working in memory
    }
  }, [notes])

  const addNote = useCallback((): string => {
    const now = Date.now()
    const note: Note = {
      id: crypto.randomUUID(),
      title: '',
      body: '',
      tags: [],
      pinned: false,
      createdAt: now,
      updatedAt: now,
    }
    setNotes((prev) => [note, ...prev])
    return note.id
  }, [])

  const updateNote = useCallback((id: string, patch: Partial<Omit<Note, 'id'>>) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n)),
    )
  }, [])

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id))
  }, [])

  return { notes, addNote, updateNote, deleteNote }
}
